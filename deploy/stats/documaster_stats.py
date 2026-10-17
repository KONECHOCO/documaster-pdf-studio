#!/usr/bin/env python3
"""Statistiche di offlinepdfstudio.com dai log di nginx, inviate su Telegram.

Niente cookie né script di terze parti: si leggono i log del server.
- Visitatori unici = combinazioni diverse di IP + browser nel giorno (stima, come fanno Plausible/GoAccess).
- Pagine viste = richieste di pagine HTML (non immagini, script, font).
- Strumenti usati = segnale /e?t=<strumento> inviato dall'app web quando si apre uno strumento.
- I robot (Googlebot, Bing, ecc.) sono contati a parte.

Uso:
  documaster_stats.py report [ieri|oggi|settimana]   invia il report su Telegram
  documaster_stats.py poll                           risponde ai comandi /oggi /ieri /settimana
  documaster_stats.py link                           collega la chat (dopo aver scritto /start al bot)
  documaster_stats.py print [ieri|oggi|settimana]    stampa il report senza inviarlo

Configurazione in /etc/documaster-stats.env: TELEGRAM_TOKEN=… e TELEGRAM_CHAT_ID=…
"""
import gzip
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

ENV_FILE = '/etc/documaster-stats.env'
STATE_FILE = '/var/lib/documaster-stats/state.json'
LOG_GLOB = '/var/log/nginx/documaster.log'
TZ = ZoneInfo('Europe/Rome')
# Il sito e il vecchio indirizzo (che ora rimanda al nuovo): non sono provenienze esterne
SITES = ('offlinepdfstudio.com', 'pdf.ikonetsolutions.com')

LINE = re.compile(r'(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] "(?P<method>\S+) (?P<path>\S+) [^"]*" (?P<status>\d{3}) \S+ "(?P<ref>[^"]*)" "(?P<ua>[^"]*)"')
BOT = re.compile(r'bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview|curl|wget|python|go-http|headless|lighthouse|monitor|scan|httpclient|java/|okhttp|axios|node-fetch|semrush|ahrefs|petal|bytespider|gptbot|claude|perplexity', re.I)
# Indirizzi dei programmi di scansione: chi li chiede non è una persona
PROBE = re.compile(r'/\.(git|env|aws|ssh|svn|vscode|DS_Store)|wp-|\.php|/admin|/phpmyadmin|/cgi-bin|/actuator|/vendor/phpunit|/\.well-known/(?!acme)|/server-status|/config\.|/backup|\.sql|\.bak|/xmlrpc|/boaform|/HNAP1', re.I)
# Pagine vere del sito
VALID = re.compile(r'^/((it|en|es|fr|de|pt|ja)/([a-z0-9-]+/)?)?$|^/(privacy|support)\.html$')
# Reti dei motori di ricerca (Googlebot che esegue il JavaScript con un nome da browser)
CRAWLER_NETS = ('66.249.', '74.125.', '192.178.', '34.100.', '40.77.', '157.55.', '207.46.', '17.')
MAX_PAGES_PER_PERSON = 30
ASSET = re.compile(r'^/(assets|vendor|fonts)/|\.(js|mjs|css|png|jpe?g|svg|ico|webp|woff2?|ttf|wasm|json|map|txt|xml|gz|traineddata)$', re.I)
LANGS = ('it', 'en', 'es', 'fr', 'de', 'pt', 'ja')
TOOL_NAMES = {
    'reader': 'Lettore PDF', 'readAloud': 'Leggi ad alta voce', 'scanner': 'Scanner', 'ocr': 'OCR', 'merge': 'Unisci',
    'split': 'Dividi', 'compress': 'Comprimi', 'edit': 'Modifica', 'sign': 'Firma', 'fillForm': 'Compila moduli',
    'pdfToWord': 'PDF → Word', 'pdfToImg': 'PDF → JPG', 'imgToPdf': 'JPG → PDF', 'pdfToText': 'PDF → testo',
    'organize': 'Organizza', 'rotate': 'Ruota', 'watermark': 'Filigrana', 'pageNumbers': 'Numeri di pagina',
    'protect': 'Proteggi', 'unlock': 'Sblocca', 'redact': 'Oscura', 'metadata': 'Metadati', 'flatten': 'Appiattisci',
    'analytics': 'Analisi', 'pro': 'Pagina Pro',
}


def load_env():
    env = {}
    try:
        with open(ENV_FILE, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


def save_env_value(key, value):
    env = load_env()
    env[key] = value
    with open(ENV_FILE, 'w', encoding='utf-8') as f:
        for k, v in env.items():
            f.write(f'{k}={v}\n')
    os.chmod(ENV_FILE, 0o600)


def load_state():
    try:
        with open(STATE_FILE, encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f)


def log_files():
    base = LOG_GLOB
    files = [base, base + '.1'] + [f'{base}.{n}.gz' for n in range(2, 15)]
    return [p for p in files if os.path.exists(p)]


def read_lines(path):
    opener = gzip.open if path.endswith('.gz') else open
    with opener(path, 'rt', encoding='utf-8', errors='replace') as f:
        yield from f


def collect(start, end):
    """Statistiche tra start (incluso) ed end (escluso), datetime con fuso orario.

    Visitatore vero = chi scarica anche il JavaScript dell'app (/assets/*.js): i programmi che
    scandagliano i siti chiedono la pagina ma non caricano gli script, anche se si spacciano per browser.
    """
    bot_hits, tools = Counter(), Counter()
    tool_users = {}
    loaded_app = set()
    probers = set()
    hits = []  # (chi, pagina, provenienza)
    for path in log_files():
        for raw in read_lines(path):
            m = LINE.match(raw)
            if not m:
                continue
            try:
                when = datetime.strptime(m['time'], '%d/%b/%Y:%H:%M:%S %z')
            except ValueError:
                continue
            if not (start <= when < end):
                continue
            ua = m['ua']
            url = urllib.parse.urlsplit(m['path'])
            p = url.path
            status = m['status']
            if BOT.search(ua) or not ua or ua == '-':
                if status in ('200', '304') and not ASSET.search(p):
                    name = re.search(r'(googlebot|bingbot|applebot|yandex|duckduck|baidu|gptbot|petal|semrush|ahrefs)', ua, re.I)
                    bot_hits[name.group(1).lower() if name else 'altri'] += 1
                continue
            who = hashlib.sha256(f"{m['ip']}|{ua}".encode()).hexdigest()[:16]
            if m['ip'].startswith(CRAWLER_NETS):
                continue
            if PROBE.search(p):
                probers.add(who)
                continue
            if p == '/e':
                tool = urllib.parse.parse_qs(url.query).get('t', ['?'])[0][:30]
                tool_users.setdefault(tool, set()).add(who)
                tools[tool] += 1
                continue
            if p.startswith('/assets/') and p.endswith('.js') and status in ('200', '304'):
                loaded_app.add(who)
                continue
            if m['method'] != 'GET' or status not in ('200', '304') or ASSET.search(p):
                continue
            if re.match(r'^/google[0-9a-f]+\.html$', p):
                continue  # verifiche di Google Search Console
            if not VALID.match(p):
                probers.add(who)  # pagina inesistente: tipico delle scansioni
                continue
            hits.append((who, p, m['ref']))

    per_person = Counter(w for w, _, _ in hits)
    real = {w for w in loaded_app if w not in probers and per_person[w] <= MAX_PAGES_PER_PERSON}
    tool_users = {k: {w for w in v if w in real} for k, v in tool_users.items()}
    tool_users = {k: v for k, v in tool_users.items() if v}
    tools = Counter({k: tools[k] for k in tool_users})
    pages, langs, refs = Counter(), Counter(), Counter()
    views = 0
    suspects = set()
    for who, p, ref in hits:
        if who not in real:
            suspects.add(who)
            continue
        views += 1
        pages[p] += 1
        first = p.strip('/').split('/')[0]
        langs[first if first in LANGS else 'home'] += 1
        if ref and ref != '-':
            host = urllib.parse.urlsplit(ref).hostname or ''
            if host and not any(s in host for s in SITES):
                refs[re.sub(r'^(www\.|m\.)', '', host)] += 1
    visitors = {w for w, _, _ in hits if w in real} | {w for users in tool_users.values() for w in users}
    suspects |= {w for w in probers | {w for w, _, _ in hits} if w not in real}
    return {
        'visitors': len(visitors),
        'views': views,
        'pages': pages,
        'langs': langs,
        'refs': refs,
        'tools': tools,
        'tool_users': {k: len(v) for k, v in tool_users.items()},
        'bots': bot_hits,
        'suspects': len(suspects),
    }


def period(name):
    now = datetime.now(TZ)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if name == 'oggi':
        return today, now + timedelta(seconds=1), f"oggi {today:%d/%m} (fino alle {now:%H:%M})"
    if name == 'settimana':
        start = today - timedelta(days=7)
        return start, today, f"ultimi 7 giorni ({start:%d/%m}–{(today - timedelta(days=1)):%d/%m})"
    start = today - timedelta(days=1)
    return start, today, f"ieri {start:%a %d/%m}".replace('Mon', 'lun').replace('Tue', 'mar').replace('Wed', 'mer').replace('Thu', 'gio').replace('Fri', 'ven').replace('Sat', 'sab').replace('Sun', 'dom')


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def top(counter, n=5, fmt=lambda k: k):
    return '\n'.join(f'  • {esc(fmt(k))}: <b>{v}</b>' for k, v in counter.most_common(n)) or '  —'


def build_report(name):
    start, end, label = period(name)
    s = collect(start, end)
    lines = [f'📊 <b>DocuMaster web</b> — {esc(label)}', '']
    lines.append(f'👤 Visitatori unici: <b>{s["visitors"]}</b>')
    lines.append(f'📄 Pagine viste: <b>{s["views"]}</b>')
    if name == 'ieri':
        prev = collect(start - timedelta(days=1), start)
        diff = s['visitors'] - prev['visitors']
        lines.append(f'↕️ Rispetto al giorno prima: {"+" if diff >= 0 else ""}{diff} visitatori')
    if s['tools']:
        used = Counter({k: s['tool_users'].get(k, 0) for k in s['tools']})
        lines += ['', '🛠 <b>Strumenti aperti</b> (persone)', top(used, 8, lambda k: TOOL_NAMES.get(k, k))]
    lines += ['', '🔗 <b>Da dove arrivano</b>', top(s['refs'], 5)]
    lines += ['', '🌍 <b>Lingua delle pagine</b>', top(s['langs'], 7, lambda k: k.upper() if k != 'home' else 'home')]
    lines += ['', '📑 <b>Pagine più viste</b>', top(s['pages'], 5)]
    if s['suspects']:
        lines += ['', f'🕵️ Visite automatiche escluse (scansioni, non persone): {s["suspects"]}']
    if s['bots']:
        lines += ['', f'🤖 Robot dei motori di ricerca: {sum(s["bots"].values())} pagine lette']
        g = s['bots'].get('googlebot', 0)
        if g:
            lines.append(f'  • Googlebot: <b>{g}</b>')
    lines += ['', 'Comandi: /oggi · /ieri · /settimana']
    return '\n'.join(lines)


def telegram(method, params):
    env = load_env()
    token = env.get('TELEGRAM_TOKEN')
    if not token:
        sys.exit(f'Manca TELEGRAM_TOKEN in {ENV_FILE}')
    data = urllib.parse.urlencode(params).encode()
    with urllib.request.urlopen(f'https://api.telegram.org/bot{token}/{method}', data=data, timeout=30) as r:
        return json.load(r)


def send(text, chat_id=None):
    chat_id = chat_id or load_env().get('TELEGRAM_CHAT_ID')
    if not chat_id:
        sys.exit('Chat non collegata: scrivi /start al bot e poi esegui "documaster_stats.py link"')
    telegram('sendMessage', {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': 'true'})


def link():
    res = telegram('getUpdates', {'timeout': 0})
    chats = [u['message']['chat'] for u in res.get('result', []) if 'message' in u]
    if not chats:
        sys.exit('Nessun messaggio ricevuto: apri il bot su Telegram, premi Avvia (/start) e riprova.')
    chat = chats[-1]
    save_env_value('TELEGRAM_CHAT_ID', str(chat['id']))
    send('✅ Collegato. Ogni mattina alle 8 ti mando le statistiche di offlinepdfstudio.com.\nComandi: /oggi · /ieri · /settimana', chat['id'])
    print('chat collegata:', chat.get('first_name') or chat.get('title'), chat['id'])


def poll():
    env = load_env()
    if not env.get('TELEGRAM_TOKEN') or not env.get('TELEGRAM_CHAT_ID'):
        return
    state = load_state()
    offset = state.get('offset', 0)
    res = telegram('getUpdates', {'offset': offset, 'timeout': 0})
    for u in res.get('result', []):
        state['offset'] = u['update_id'] + 1
        msg = u.get('message') or {}
        # Si risponde solo alla chat collegata
        if str(msg.get('chat', {}).get('id')) != env['TELEGRAM_CHAT_ID']:
            continue
        cmd = (msg.get('text') or '').strip().lower().split('@')[0]
        if cmd in ('/oggi', '/ieri', '/settimana'):
            send(build_report(cmd[1:]))
        elif cmd in ('/start', '/help', '/aiuto'):
            send('Comandi: /oggi · /ieri · /settimana')
    save_state(state)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'report'
    arg = sys.argv[2] if len(sys.argv) > 2 else 'ieri'
    if cmd == 'report':
        send(build_report(arg))
    elif cmd == 'print':
        print(build_report(arg))
    elif cmd == 'link':
        link()
    elif cmd == 'poll':
        poll()
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Report PDF delle visite di offlinepdfstudio.com, inviato su Telegram.

Uso:
  documaster_report.py settimana [--send]   ultimi 7 giorni (ogni lunedì in automatico)
  documaster_report.py mese [--send]        ultimi 30 giorni
Senza --send scrive solo il file in /var/lib/documaster-stats/reports/.

Paesi dall'indirizzo IP con DB-IP Country Lite (CC BY 4.0). I log di nginx restano 14 giorni:
per i periodi più lunghi si usano i riepiloghi giornalieri salvati in history.json.
"""
import gettext
import io
import json
import os
import sys
import urllib.request
import uuid
from collections import Counter
from datetime import datetime, timedelta

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402
import pycountry  # noqa: E402
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.enums import TA_LEFT  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle  # noqa: E402
from reportlab.lib.units import mm  # noqa: E402
from reportlab.pdfbase import pdfmetrics  # noqa: E402
from reportlab.pdfbase.ttfonts import TTFont  # noqa: E402
from reportlab.platypus import Image, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import documaster_stats as st  # noqa: E402

HISTORY_FILE = '/var/lib/documaster-stats/history.json'
REPORTS_DIR = '/var/lib/documaster-stats/reports'
ADS_FILE = '/var/lib/documaster-stats/ads.json'
LOG_DAYS = 13  # giorni ancora presenti nei log di nginx (rotazione a 14)

FONT_DIR = '/usr/share/fonts/truetype/dejavu'
pdfmetrics.registerFont(TTFont('Sans', f'{FONT_DIR}/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('Sans-Bold', f'{FONT_DIR}/DejaVuSans-Bold.ttf'))

INDIGO, PINK, GREEN, AMBER, SLATE, CYAN = '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#64748b', '#06b6d4'
PALETTE = [INDIGO, PINK, GREEN, AMBER, CYAN, '#8b5cf6', '#ef4444', '#14b8a6', SLATE, '#a3a3a3']
INK, MUTED, LINE = colors.HexColor('#0f172a'), colors.HexColor('#64748b'), colors.HexColor('#e2e8f0')

CONTINENTS = {
    'Europa': 'AX AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG VA HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB',
    'Asia': 'AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE IO',
    'Africa': 'DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW',
    'Nord e Centro America': 'AI AG AW BS BB BZ BM BQ VG CA KY CR CU CW DM DO SV GL GD GP GT HT HN JM MQ MX MS NI PA PR BL KN LC MF PM VC SX TT TC US VI UM',
    'Sud America': 'AR BO BV BR CL CO EC FK GF GY PY PE GS SR UY VE',
    'Oceania': 'AS AU CK FJ PF GU KI MH FM NR NC NZ NU NF MP PW PG PN WS SB TK TO TV VU WF',
    'Antartide': 'AQ TF HM',
}
CONTINENT_OF = {cc: name for name, codes in CONTINENTS.items() for cc in codes.split()}

try:
    _it = gettext.translation('iso3166-1', pycountry.LOCALES_DIR, languages=['it']).gettext
except OSError:
    _it = lambda s: s  # noqa: E731


def country_name(cc):
    if cc in ('ZZ', '', None):
        return 'Sconosciuto'
    c = pycountry.countries.get(alpha_2=cc)
    return _it(getattr(c, 'common_name', None) or c.name) if c else cc


# ---------------------------------------------------------------- Dati

def to_json(s):
    return {k: (dict(v) if isinstance(v, Counter) else v) for k, v in s.items()}


def load_history():
    try:
        with open(HISTORY_FILE, encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_history(h):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(h, f)


def day_summary(day, history, today):
    """Riepilogo di un giorno (datetime a mezzanotte, ora italiana). I giorni passati restano salvati."""
    key = day.strftime('%Y-%m-%d')
    if key in history:
        return history[key]
    if (today - day).days > LOG_DAYS:
        return None
    s = to_json(st.collect(day, day + timedelta(days=1)))
    if day < today:
        history[key] = s
    return s


def merge(summaries):
    total = {'visitors': 0, 'views': 0, 'suspects': 0}
    counters = {k: Counter() for k in ('pages', 'langs', 'refs', 'tools', 'tool_users', 'bots', 'countries', 'devices')}
    for s in summaries:
        for k in total:
            total[k] += s.get(k, 0)
        for k, c in counters.items():
            c.update(s.get(k, {}))
    return {**total, **counters}


def gather(days, include_today=False):
    """include_today: il periodo finisce adesso (report chiesto con /pdf) invece che ieri a mezzanotte."""
    now = datetime.now(st.TZ)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = today - timedelta(days=days - (1 if include_today else 0))
    end = now if include_today else today
    history = load_history()
    series = []
    summaries = []
    for i in range(days):
        d = start + timedelta(days=i)
        s = to_json(st.collect(d, now)) if d == today else day_summary(d, history, today)
        series.append((d, s['visitors'] if s else None, s['views'] if s else None))
        if s:
            summaries.append(s)
    save_history(history)
    if days <= LOG_DAYS:
        # Visitatori unici veri sull'intero periodo (chi torna più giorni conta una volta)
        period = st.collect(start, end)
    else:
        period = merge(summaries)
    # Periodo precedente: somma dei visitatori giornalieri, se i dati ci sono tutti
    prev_days = [day_summary(start - timedelta(days=days - i), history, today) for i in range(days)]
    prev_total = sum(p['visitors'] for p in prev_days) if all(prev_days) else None
    if prev_total is not None and days <= LOG_DAYS:
        prev_total = st.collect(start - timedelta(days=days), start)['visitors']
    save_history(history)
    return {'start': start, 'end': end if include_today else today - timedelta(days=1), 'include_today': include_today, 'series': series, 'period': period, 'prev_visitors': prev_total}


def load_ads():
    try:
        with open(ADS_FILE, encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


# ---------------------------------------------------------------- Grafici

def fig_to_image(fig, width_mm):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=200, bbox_inches='tight', transparent=False, facecolor='white')
    plt.close(fig)
    buf.seek(0)
    w, h = fig.get_size_inches()
    width = width_mm * mm
    return Image(buf, width=width, height=width * h / w)


def style_axes(ax):
    for side in ('top', 'right'):
        ax.spines[side].set_visible(False)
    ax.spines['left'].set_color('#cbd5e1')
    ax.spines['bottom'].set_color('#cbd5e1')
    ax.tick_params(colors='#475569', labelsize=8)
    ax.grid(axis='y', color='#e2e8f0', linewidth=0.6)
    ax.set_axisbelow(True)


def chart_daily(series):
    fig, ax = plt.subplots(figsize=(7.2, 2.4))
    labels = [d.strftime('%d/%m') for d, _, _ in series]
    vis = [v or 0 for _, v, _ in series]
    views = [p or 0 for _, _, p in series]
    x = range(len(series))
    ax.bar(x, views, color='#c7d2fe', label='Pagine viste', width=0.7)
    ax.plot(x, vis, color=INDIGO, marker='o', linewidth=2, markersize=4, label='Visitatori')
    step = max(1, len(labels) // 10)
    ax.set_xticks(list(x)[::step], labels[::step])
    style_axes(ax)
    ax.legend(frameon=False, fontsize=8, loc='upper left')
    return fig


def chart_hbar(items, color, xlabel=''):
    items = items[:10][::-1]
    fig, ax = plt.subplots(figsize=(3.5, 0.32 * max(3, len(items)) + 0.5))
    ax.barh([k for k, _ in items], [v for _, v in items], color=color, height=0.65)
    for i, (_, v) in enumerate(items):
        ax.text(v, i, f' {v}', va='center', fontsize=8, color='#334155')
    style_axes(ax)
    ax.grid(axis='x', color='#e2e8f0', linewidth=0.6)
    ax.grid(axis='y', visible=False)
    ax.tick_params(axis='y', labelsize=8)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=8, color='#475569')
    return fig


def chart_donut(items):
    fig, ax = plt.subplots(figsize=(3.5, 2.4))
    vals = [v for _, v in items]
    ax.pie(vals, colors=PALETTE[: len(vals)], startangle=90, counterclock=False, wedgeprops={'width': 0.38, 'edgecolor': 'white'})
    total = sum(vals) or 1
    ax.legend([f'{k} · {round(v * 100 / total)}%' for k, v in items], loc='center left', bbox_to_anchor=(1, 0.5), frameon=False, fontsize=8)
    ax.set_aspect('equal')
    return fig


# ---------------------------------------------------------------- PDF

S = {
    'h1': ParagraphStyle('h1', fontName='Sans-Bold', fontSize=20, leading=24, textColor=INK),
    'sub': ParagraphStyle('sub', fontName='Sans', fontSize=10, leading=14, textColor=MUTED),
    'h2': ParagraphStyle('h2', fontName='Sans-Bold', fontSize=12.5, leading=16, textColor=INK, spaceBefore=10, spaceAfter=6),
    'p': ParagraphStyle('p', fontName='Sans', fontSize=9, leading=13, textColor=colors.HexColor('#334155'), alignment=TA_LEFT),
    'small': ParagraphStyle('small', fontName='Sans', fontSize=7.5, leading=10, textColor=MUTED),
    'kpi_v': ParagraphStyle('kv', fontName='Sans-Bold', fontSize=17, leading=20, textColor=INK),
    'kpi_l': ParagraphStyle('kl', fontName='Sans', fontSize=7.5, leading=10, textColor=MUTED),
}


def kpi_row(items):
    cells = [[Paragraph(str(v), S['kpi_v']), Paragraph(label, S['kpi_l'])] for label, v in items]
    t = Table([[Table([[c[0]], [c[1]]], style=[('LEFTPADDING', (0, 0), (-1, -1), 0)]) for c in cells]], colWidths=[180 * mm / len(items)] * len(items))
    t.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.6, LINE),
        ('INNERGRID', (0, 0), (-1, -1), 0.6, LINE),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return t


def table(rows, header, widths, numeric=1):
    """numeric: quante colonne finali sono numeri (allineate a destra)."""
    t = Table([header] + rows, colWidths=[w * mm for w in widths], repeatRows=1)
    t.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, 0), 'Sans-Bold', 8.5),
        ('FONT', (0, 1), (-1, -1), 'Sans', 8.5),
        ('TEXTCOLOR', (0, 0), (-1, 0), MUTED),
        ('LINEBELOW', (0, 0), (-1, 0), 0.8, LINE),
        ('LINEBELOW', (0, 1), (-1, -1), 0.3, LINE),
        ('ALIGN', (len(header) - numeric, 0), (-1, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    return t


def two_cols(left, right):
    t = Table([[left, right]], colWidths=[90 * mm, 90 * mm])
    t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0)]))
    return t


def pct(n, total):
    return f'{round(n * 100 / total)}%' if total else '—'


def build_pdf(days, path, include_today=False):
    g = gather(days, include_today)
    p = g['period']
    story = []
    label = 'Report settimanale' if days == 7 else f'Report degli ultimi {days} giorni'
    story.append(Paragraph(f'DocuMaster web · {label}', S['h1']))
    until = f'oggi alle {g["end"]:%H:%M}' if g['include_today'] else f'{g["end"]:%d/%m/%Y}'
    story.append(Paragraph(f'offlinepdfstudio.com · dal {g["start"]:%d/%m/%Y} al {until} · generato il {datetime.now(st.TZ):%d/%m/%Y %H:%M}', S['sub']))
    story.append(Spacer(1, 8 * mm))

    tools_total = sum(p['tool_users'].values())
    per_visit = f'{p["views"] / p["visitors"]:.1f}'.replace('.', ',') if p['visitors'] else '—'
    trend = ''
    if g['prev_visitors'] is not None:
        d = p['visitors'] - g['prev_visitors']
        trend = f' ({"+" if d >= 0 else ""}{d})'
    story.append(kpi_row([
        ('Visitatori' + (' unici' if days <= LOG_DAYS else ''), f'{p["visitors"]}{trend}'),
        ('Pagine viste', p['views']),
        ('Pagine per visitatore', per_visit),
        ('Strumenti aperti', tools_total),
        ('Pagine lette da Google', p['bots'].get('googlebot', 0)),
    ]))
    story.append(Paragraph(
        f'Tra parentesi: differenza rispetto al periodo precedente. Esclusi robot e scansioni automatiche ({p["suspects"]} in questo periodo).',
        S['small']))

    story.append(Paragraph('Andamento giornaliero', S['h2']))
    story.append(fig_to_image(chart_daily(g['series']), 180))

    # Paesi e continenti
    countries = Counter(p['countries'])
    conts = Counter()
    for cc, n in countries.items():
        conts[CONTINENT_OF.get(cc, 'Sconosciuto')] += n
    story.append(Paragraph('Da dove arrivano: continenti e paesi', S['h2']))
    if countries:
        top_c = [(country_name(cc), n) for cc, n in countries.most_common(10)]
        story.append(two_cols(fig_to_image(chart_donut(conts.most_common()), 88), fig_to_image(chart_hbar(top_c, INDIGO), 88)))
        rows = [[country_name(cc), CONTINENT_OF.get(cc, '—'), str(n), pct(n, p['visitors'])] for cc, n in countries.most_common(25)]
        story.append(Spacer(1, 3 * mm))
        story.append(table(rows, ['Paese', 'Continente', 'Visitatori', 'Quota'], [70, 55, 28, 27], numeric=2))
    else:
        story.append(Paragraph('Nessun visitatore nel periodo.', S['p']))

    # Strumenti
    story.append(Paragraph('Strumenti utilizzati', S['h2']))
    tool_items = [(st.TOOL_NAMES.get(k, k), v) for k, v in Counter(p['tool_users']).most_common()]
    if tool_items:
        rows = [[name, str(n), str(p['tools'].get(k, 0))] for (name, n), k in zip(tool_items, [k for k, _ in Counter(p['tool_users']).most_common()])]
        story.append(two_cols(fig_to_image(chart_hbar(tool_items, PINK), 88), table(rows[:15], ['Strumento', 'Persone', 'Aperture'], [44, 20, 22], numeric=2)))
    else:
        story.append(Paragraph('Nessuno strumento aperto nel periodo (si contano solo le aperture fatte da una persona).', S['p']))

    # Dispositivi, lingue, provenienze
    story.append(Paragraph('Dispositivi, lingue e provenienze', S['h2']))
    dev = Counter(p['devices'])
    lang_names = {'it': 'Italiano', 'en': 'Inglese', 'es': 'Spagnolo', 'fr': 'Francese', 'de': 'Tedesco', 'pt': 'Portoghese', 'ja': 'Giapponese', 'home': 'Pagina principale'}
    left = fig_to_image(chart_donut(dev.most_common()), 88) if dev else Paragraph('—', S['p'])
    lang_rows = [[lang_names.get(k, k), str(v)] for k, v in Counter(p['langs']).most_common(8)]
    right = table(lang_rows or [['—', '']], ['Lingua della pagina', 'Viste'], [55, 30])
    story.append(two_cols(left, right))
    story.append(Spacer(1, 3 * mm))
    ref_rows = [[k, str(v)] for k, v in Counter(p['refs']).most_common(8)] or [['Nessun sito esterno (visite dirette o da app)', '']]
    page_rows = [[k, str(v)] for k, v in Counter(p['pages']).most_common(10)] or [['—', '']]
    story.append(two_cols(table(ref_rows, ['Provenienza', 'Visite'], [60, 25]), table(page_rows, ['Pagina', 'Viste'], [60, 25])))

    # Pubblicità
    ads = load_ads()
    block = [Paragraph('Pubblicità', S['h2'])]
    if ads and ads.get('rows'):
        rows = [[r['source'], r['period'], str(r.get('impressions', '—')), str(r.get('clicks', '—')), r.get('earnings', '—')] for r in ads['rows']]
        block.append(table(rows, ['Origine', 'Periodo', 'Impressioni', 'Clic', 'Guadagno'], [45, 40, 30, 25, 40], numeric=3))
        if ads.get('note'):
            block.append(Paragraph(ads['note'], S['small']))
    else:
        block.append(table([
            ['AdSense (sito web)', 'In revisione da Google (richiesta del 16/10/2026)', '—'],
            ['AdMob (app iOS)', "In attesa dell'approvazione Apple", '—'],
            ['AdMob (app Android)', 'App non ancora pubblicata su Google Play', '—'],
        ], ['Origine', 'Stato', 'Guadagno'], [45, 105, 30]))
        block.append(Paragraph(
            'I guadagni compariranno qui in automatico dopo le approvazioni, quando gli account AdSense e AdMob saranno collegati al report.',
            S['small']))
    story.append(KeepTogether(block))

    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        'Come si conta: visitatore = combinazione di indirizzo IP e browser nel giorno che carica davvero l\'app; '
        'esclusi robot, scansioni automatiche e chi vede più di 30 pagine al giorno. Nessun cookie. '
        'Paese stimato dall\'indirizzo IP con il database gratuito DB-IP (db-ip.com, licenza CC BY 4.0).',
        S['small']))

    os.makedirs(os.path.dirname(path), exist_ok=True)

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Sans', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(15 * mm, 10 * mm, 'DocuMaster PDF Studio · Ikonet Solutions')
        canvas.drawRightString(195 * mm, 10 * mm, f'Pagina {doc.page}')
        canvas.setFillColor(colors.HexColor(INDIGO))
        canvas.rect(0, A4[1] - 4 * mm, A4[0], 4 * mm, stroke=0, fill=1)
        canvas.restoreState()

    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
                            title=f'DocuMaster web – {label}', author='Ikonet Solutions')
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return g


# ---------------------------------------------------------------- Telegram

def send_document(path, caption):
    env = st.load_env()
    token, chat = env.get('TELEGRAM_TOKEN'), env.get('TELEGRAM_CHAT_ID')
    if not token or not chat:
        sys.exit('Telegram non configurato')
    boundary = uuid.uuid4().hex
    with open(path, 'rb') as f:
        data = f.read()
    parts = []
    for name, value in (('chat_id', chat), ('caption', caption)):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="document"; filename="{os.path.basename(path)}"\r\nContent-Type: application/pdf\r\n\r\n'.encode() + data + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    req = urllib.request.Request(f'https://api.telegram.org/bot{token}/sendDocument', data=b''.join(parts),
                                 headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def run(kind, send, include_today=False):
    days = 30 if kind == 'mese' else 7
    stamp = datetime.now(st.TZ).strftime('%Y-%m-%d')
    path = f'{REPORTS_DIR}/documaster-web-{kind}-{stamp}.pdf'
    g = build_pdf(days, path, include_today)
    if send:
        p = g['period']
        send_document(path, f'📄 Report {"mensile" if days == 30 else "settimanale"} · {p["visitors"]} visitatori, {p["views"]} pagine viste')
    return path


def fill_history():
    """Salva i riepiloghi dei giorni ancora nei log: servono ai report più lunghi di due settimane."""
    now = datetime.now(st.TZ)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    history = load_history()
    for i in range(1, LOG_DAYS + 1):
        day_summary(today - timedelta(days=i), history, today)
    save_history(history)


if __name__ == '__main__':
    kind = sys.argv[1] if len(sys.argv) > 1 else 'settimana'
    if kind == 'history':
        fill_history()
    else:
        print(run(kind, '--send' in sys.argv, '--oggi' in sys.argv))

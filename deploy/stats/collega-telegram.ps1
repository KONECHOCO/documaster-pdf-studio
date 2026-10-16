# Collega il bot Telegram alle statistiche del sito.
# Il codice del bot si incolla qui (non viene mostrato) e va direttamente sul server, in /etc/documaster-stats.env.
$key = Join-Path $env:USERPROFILE '.ssh\ivoiro_hetzner'
$secure = Read-Host 'Incolla il codice del bot (da BotFather) e premi Invio' -AsSecureString
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
if (-not $token) { Write-Host 'Nessun codice inserito.'; exit 1 }
$token | ssh -i $key root@178.105.153.192 'umask 077; read -r T; T=$(printf %s "$T" | tr -d "\r "); echo "TELEGRAM_TOKEN=$T" > /etc/documaster-stats.env; python3 /opt/documaster-stats/documaster_stats.py link'

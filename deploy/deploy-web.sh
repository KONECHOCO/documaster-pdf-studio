#!/usr/bin/env bash
# Pubblica la build web su pdf.ikonetsolutions.com (ivoiro-server)
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build:web
tar -C dist -czf /tmp/documaster-web.tgz .
scp -i ~/.ssh/ivoiro_hetzner /tmp/documaster-web.tgz root@178.105.153.192:/tmp/
ssh -i ~/.ssh/ivoiro_hetzner root@178.105.153.192 'set -e; rm -rf /var/www/documaster.new; mkdir -p /var/www/documaster.new; tar -C /var/www/documaster.new -xzf /tmp/documaster-web.tgz; rm -rf /var/www/documaster.old; [ -d /var/www/documaster ] && mv /var/www/documaster /var/www/documaster.old; mv /var/www/documaster.new /var/www/documaster; chown -R www-data:www-data /var/www/documaster'
echo "pubblicato"

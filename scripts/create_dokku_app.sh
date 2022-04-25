#!/bin/sh

DOKKU_HOST="${DOKKU_HOST:-lettuce}"
AWS_S3_BACKUP_PATH="${AWS_S3_BACKUP_PATH:-lettuce-backups/daily}"

echo "create app"
ssh -t dokku@${DOKKU_HOST} apps:create game
ssh -t dokku@${DOKKU_HOST} domains:add game game.joseferben.com

echo "set up database"
ssh -t dokku@${DOKKU_HOST} postgres:create game-database
ssh -t dokku@${DOKKU_HOST} postgres:link game-database game

echo "set up redis"
ssh -t dokku@${DOKKU_HOST} redis:create game-redis
ssh -t dokku@${DOKKU_HOST} redis:link game-redis game

echo "configure app"
ssh -t dokku@${DOKKU_HOST} config:set --no-restart game DJANGO_DEBUG=False
ssh -t dokku@${DOKKU_HOST} config:set --no-restart game DJANGO_SETTINGS_MODULE=config.settings.production
ssh -t dokku@${DOKKU_HOST} config:set --no-restart game DJANGO_SECRET_KEY="$(openssl rand -base64 64 | tr -dc 'A-HJ-NP-Za-km-z2-9' | head -c 64)"
ssh -t dokku@${DOKKU_HOST} config:set --no-restart game DJANGO_ADMIN_URL="$(openssl rand -base64 4096 | tr -dc 'A-HJ-NP-Za-km-z2-9' | head -c 32)/"
ssh -t dokku@${DOKKU_HOST} config:set --no-restart game MAILJET_API_KEY=${MAILJET_API_KEY}
ssh -t dokku@${DOKKU_HOST} config:set --no-restart game MAILJET_SECRET_KEY=${MAILJET_SECRET_KEY}

echo "mount media files to docker volume"
ssh root@${DOKKU_HOST} -f 'mkdir -p /var/lib/dokku/data/storage/game/'
ssh root@${DOKKU_HOST} -f 'chown -R dokku:dokku /var/lib/dokku/data/storage/game/'
ssh -t dokku@${DOKKU_HOST} storage:mount game /var/lib/dokku/data/storage/game:/storage

echo "serve media files using nginx"
ssh root@${DOKKU_HOST} -f 'mkdir -p /home/dokku/game/nginx.conf.d'
ssh root@${DOKKU_HOST} -f 'echo "location /media {" > /home/dokku/game/nginx.conf.d/media.conf'
ssh root@${DOKKU_HOST} -f 'echo "    alias /var/lib/dokku/data/storage/game;" >> /home/dokku/game/nginx.conf.d/media.conf'
ssh root@${DOKKU_HOST} -f 'echo "}" >> /home/dokku/game/nginx.conf.d/media.conf'
ssh root@${DOKKU_HOST} -f 'chown -R dokku:dokku /home/dokku/game/nginx.conf.d'

echo "set up daily backups to s3"
ssh -t dokku@${DOKKU_HOST} postgres:backup-set-encryption game-database ${BACKUP_ENCRYPTION_KEY}
ssh -t dokku@${DOKKU_HOST} postgres:backup-auth game-database ${AWS_ACCESS_KEY_ID} ${AWS_SECRET_ACCESS_KEY}
ssh -t dokku@${DOKKU_HOST} postgres:backup-schedule game-database @daily ${AWS_S3_BACKUP_PATH}

echo "test backup to s3"
ssh -t dokku@${DOKKU_HOST} postgres:backup game-database ${AWS_S3_BACKUP_PATH}

echo "add dokku host as git remote"
git remote add dokku dokku@${DOKKU_HOST}:game

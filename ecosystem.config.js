// PM2 配置文件
module.exports = {
  apps: [{
    name: 'fetch-telegram-avatars',
    script: 'fetch_telegram_avatars.py',
    interpreter: './venv/bin/python3',
    cwd: '/var/www/tg_nav',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'production'
    }
  }]
};


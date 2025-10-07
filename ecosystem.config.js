module.exports = {
  apps: [{
    name: 'restaurante-ai-platform',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Configuración optimizada para producción
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
    // Configuración de logs
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configuración de reinicio
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Configuración de monitoreo
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.next', '.git'],
    
    // Configuración de cluster
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Variables de entorno específicas
    env_file: '.env.production',
    
    // Configuración de CPU
    max_cpu_restart: 80,
    
    // Configuración de red
    network_mode: 'host',
    
    // Configuración de procesos
    increment_var: 'PORT',
    
    // Configuración de salud
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true,
    
    // Configuración de merge logs
    merge_logs: true,
    
    // Configuración de source map
    source_map_support: true,
    
    // Configuración de autoreload (solo en desarrollo)
    autoreload: process.env.NODE_ENV === 'development',
    
    // Configuración de notificaciones
    notify: false,
    
    // Configuración de interceptor
    interpreter: 'node',
    interpreter_args: '--harmony',
    
    // Configuración de cron (opcional)
    // cron_restart: '0 2 * * *', // Reiniciar diariamente a las 2 AM
    
    // Configuración de instancias específicas para diferentes entornos
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    
    // Configuración de memoria específica por instancia
    max_memory_restart: process.env.NODE_ENV === 'production' ? '1G' : '512M',
    
    // Configuración de timeouts
    kill_timeout: process.env.NODE_ENV === 'production' ? 5000 : 3000,
    listen_timeout: process.env.NODE_ENV === 'production' ? 8000 : 5000,
  }],
  
  // Configuración de deploy (opcional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/restaurante-ai-platform.git',
      path: '/var/www/restaurante-ai-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run production:build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ubuntu',
      host: ['staging.your-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/restaurante-ai-platform.git',
      path: '/var/www/restaurante-ai-platform-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};

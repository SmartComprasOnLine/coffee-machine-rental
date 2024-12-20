module.exports = {
  apps: [{
    name: 'coffee-rental-service',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://mongodb:27017/coffee-rental'
    }
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:username/coffee-rental.git',
      path: '/var/www/coffee-rental',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};

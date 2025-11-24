module.exports = {
    apps: [{
      name: 'personal-kb-server',
      script: 'dist/index.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        GITHUB_USER: 'matthewabbott'
      }
    }]
  };
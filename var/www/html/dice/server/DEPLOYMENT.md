# TTRPG Dice Roller - Production Deployment Guide

## 📋 Prerequisites

- **Server with SSH access** and sudo privileges
- **NGINX** installed and configured
- **Node.js 18+** and npm installed on server
- **Domain with HTTPS** (required for WebSocket subscriptions)
- **PM2** for process management (we'll install this)

## 🚀 Step 1: Prepare Local Build

### 1.1 Build the Application
```bash
# In your dice-roller directory
npm run build:prod
```

This creates a `dist/` folder with optimized static files configured for the `/dice/` subpath.

### 1.2 Verify Build Output
```bash
ls -la dist/
# Should show: index.html, assets/ folder with JS/CSS files
```

## 📦 Step 2: Deploy Frontend Files

### 2.1 Create Directory on Server
```bash
# SSH into your server
ssh user@yourserver.com

# Create directory for dice roller
sudo mkdir -p /var/www/dice
sudo chown -R www-data:www-data /var/www/dice
sudo chmod -R 755 /var/www/dice
```

### 2.2 Upload Frontend Files
```bash
# From your local machine, upload the built files
scp -r dist/* user@yourserver.com:/tmp/dice-upload/

# On server, move files to web directory
ssh user@yourserver.com
sudo mv /tmp/dice-upload/* /var/www/dice/
sudo chown -R www-data:www-data /var/www/dice
```

## 🖥️ Step 3: Deploy Backend Server

### 3.1 Create Server Directory
```bash
# On your server
sudo mkdir -p /var/www/dice-server
sudo chown -R $USER:$USER /var/www/dice-server
```

### 3.2 Upload Server Files
```bash
# From local machine, upload server code
scp server.ts package.json user@yourserver.com:/var/www/dice-server/
scp -r src/ user@yourserver.com:/var/www/dice-server/
```

### 3.3 Install Dependencies and Setup PM2
```bash
# On server
cd /var/www/dice-server

# Install dependencies
npm install --production

# Install PM2 globally
sudo npm install -g pm2 tsx

# Start the server
pm2 start server.ts --name dice-server --interpreter tsx

# Save PM2 configuration
pm2 save
pm2 startup
# Follow the instructions PM2 gives to enable auto-start
```

### 3.4 Verify Server is Running
```bash
pm2 status
# Should show dice-server as "online"

# Check logs if needed
pm2 logs dice-server
```

## 🌐 Step 4: Configure NGINX

### 4.1 Edit Your Site Configuration
```bash
# Edit site config
sudo nano /etc/nginx/sites-available/yoursite.com
```

### 4.2 Add Dice Roller Configuration
Add this to server block:

```nginx
server {
    listen 443 ssl http2;
    server_name yoursite.com;
    
    # Your existing SSL configuration...
    
    # Existing website configuration...
    root /var/www/html;
    index index.html;
    
    # === DICE ROLLER CONFIGURATION ===
    
    # Serve the React app at /dice
    location /dice/ {
        alias /var/www/dice/;
        try_files $uri $uri/ /dice/index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy GraphQL HTTP and WebSocket requests
    location /dice/graphql {
        proxy_pass http://localhost:4000/dice/graphql;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts for long-running connections
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 4.3 Test and Reload NGINX
```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

## 🔒 Step 5: Ensure HTTPS is Working

### 5.1 Verify SSL Certificate
```bash
# Check for SSL certs
sudo certbot certificates

# If not, get SSL certificate
sudo certbot --nginx -d yoursite.com
```

### 5.2 Test HTTPS
```bash
# Test that HTTPS is working
curl -I https://yoursite.com/dice/
# Should return 200 OK
```

## ✅ Step 6: Test the Deployment

### 6.1 Test Frontend
1. Visit `https://yoursite.com/dice/`
2. Verify app loads with 3D canvas
3. Check browser console for any errors

### 6.2 Test Backend Connection
1. Open browser dev tools → Network tab
2. Look for successful WebSocket connection to `/dice/graphql`
3. Try rolling dice, should see GraphQL mutations

### 6.3 Test Real-time Features
1. Open two browser tabs to `https://yoursite.com/dice/`
2. Roll dice in one tab
3. Verify the roll appears in both tabs immediately
4. Test user registration and color changes

## 🔧 Step 7: Monitoring and Maintenance

### 7.1 Monitor the Server
```bash
# Check server status
pm2 status

# View logs
pm2 logs dice-server

# Restart if needed
pm2 restart dice-server
```

### 7.2 Update the Application
```bash
# To deploy updates:
# 1. Build locally
npm run build:prod

# 2. Upload new files
scp -r dist/* user@yourserver.com:/tmp/dice-update/
ssh user@yourserver.com
sudo rm -rf /var/www/dice/*
sudo mv /tmp/dice-update/* /var/www/dice/
sudo chown -R www-data:www-data /var/www/dice

# 3. Update server if needed
scp server.ts user@yourserver.com:/var/www/dice-server/
ssh user@yourserver.com
cd /var/www/dice-server
pm2 restart dice-server
```

## 🐛 Troubleshooting

### Frontend Issues
- **Assets not loading**: Check `base: '/dice/'` in `vite.config.ts`
- **404 on refresh**: Verify `try_files` directive in NGINX config
- **CORS errors**: Check NGINX proxy headers

### Backend Issues
- **Server not starting**: Check `pm2 logs dice-server`
- **WebSocket connection failed**: Verify NGINX WebSocket proxy config
- **GraphQL errors**: Check server logs and network tab

### Real-time Issues
- **Dice rolls not syncing**: Check WebSocket connection in dev tools
- **Users not appearing**: Verify GraphQL subscriptions are working
- **Performance issues**: Monitor server resources with `htop`

## 📊 Performance Optimization

### 7.1 NGINX Optimizations
Add to your NGINX config:
```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable HTTP/2 server push for critical resources
location /dice/ {
    # ... existing config ...
    http2_push /dice/assets/index.css;
    http2_push /dice/assets/index.js;
}
```

### 7.2 PM2 Optimizations
```bash
# Use cluster mode for better performance
pm2 delete dice-server
pm2 start server.ts --name dice-server --interpreter tsx --instances 2
pm2 save
```

## 🎉 Final Checklist

- [ ] Frontend builds successfully with `npm run build:prod`
- [ ] Static files uploaded to `/var/www/dice/`
- [ ] Backend server running with PM2
- [ ] NGINX configured with `/dice/` location and GraphQL proxy
- [ ] HTTPS working with valid SSL certificate
- [ ] WebSocket connections successful
- [ ] Real-time dice rolling works between multiple tabs
- [ ] User registration and color changes work
- [ ] 3D physics simulation working properly
- [ ] No console errors in browser
- [ ] PM2 auto-startup configured
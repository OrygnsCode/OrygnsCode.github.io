# Origins Client Portal - Deployment Guide

This guide provides comprehensive instructions for deploying the Origins Client Portal to various hosting environments.

## 📋 Prerequisites

### Required Tools
- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Modern web browser** for testing

### Optional Tools
- **Docker** for containerized deployment
- **AWS CLI** for AWS deployment
- **Vercel CLI** for Vercel deployment
- **Netlify CLI** for Netlify deployment

## 🚀 Deployment Options

### 1. Static Hosting (Recommended for Frontend)

#### Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to Netlify
netlify deploy --prod --dir=.

# For continuous deployment
netlify init
```

**Netlify Configuration:**
- **Build Command**: `npm run build` (if using build tools)
- **Publish Directory**: `./`
- **Environment Variables**: Copy from `.env.example`

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# For continuous deployment
vercel --prod --confirm
```

**Vercel Configuration:**
- **Framework**: Static
- **Root Directory**: `./`
- **Environment Variables**: Add in project settings

#### GitHub Pages
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Add and commit files
git add .
git commit -m "Initial deployment"

# Push to GitHub
git push -u origin gh-pages

# Enable GitHub Pages in repository settings
```

### 2. Cloud Hosting

#### AWS S3 + CloudFront
```bash
# Install AWS CLI
aws configure

# Create S3 bucket
aws s3 mb s3://your-portal-bucket-name

# Enable static website hosting
aws s3 website s3://your-portal-bucket-name --index-document index.html

# Upload files
aws s3 sync . s3://your-portal-bucket-name --exclude "*.md" --exclude ".git/*"

# Create CloudFront distribution for HTTPS
aws cloudfront create-distribution --origin-domain-name your-portal-bucket-name.s3.amazonaws.com
```

**AWS Configuration:**
- **Bucket Policy**: Allow public read access
- **CORS Configuration**: Enable cross-origin requests
- **CloudFront**: HTTPS and custom domain support

#### Google Cloud Storage
```bash
# Install Google Cloud SDK
gcloud init

# Create storage bucket
gsutil mb -p your-project-id gs://your-portal-bucket-name

# Set bucket to public
gsutil iam ch allUsers:objectViewer gs://your-portal-bucket-name

# Upload files
gsutil -m cp -r . gs://your-portal-bucket-name

# Configure website settings
gsutil web set -m index.html -e index.html gs://your-portal-bucket-name
```

### 3. Docker Deployment

#### Create Dockerfile
```dockerfile
FROM nginx:alpine

# Copy application files
COPY . /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Create nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Static file caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # HTML files - no cache
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### Build and Run Docker Container
```bash
# Build Docker image
docker build -t origins-portal .

# Run container
docker run -d -p 80:80 --name origins-portal origins-portal

# Check logs
docker logs origins-portal
```

### 4. Traditional Web Server

#### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/origins-portal
    
    # Security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    
    # Gzip compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # Static file caching
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
    
    # HTML files - no cache
    <FilesMatch "\.(html)$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
    
    # Handle client-side routing
    RewriteEngine On
    RewriteRule ^(admin|invoices|support|reports|login)/?$ / [L,NC]
</VirtualHost>
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/origins-portal;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML files - no cache
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and update values:

```bash
# Application settings
APP_URL=https://your-domain.com
APP_DEBUG=false

# Database (if using backend)
DB_HOST=your-database-host
DB_PASSWORD=your-database-password

# Email service
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-email-password

# Payment processing
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Third-party services
GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_ID=your-github-client-id
```

### Custom Domain Setup
1. **DNS Configuration**: Point your domain to the hosting service
2. **SSL Certificate**: Enable HTTPS (Let's Encrypt recommended)
3. **CDN Integration**: Configure CloudFlare or similar CDN
4. **Email Configuration**: Set up transactional email service

## 🔒 Security Hardening

### HTTPS Configuration
```bash
# Using Let's Encrypt with Certbot
certbot --nginx -d your-domain.com -d www.your-domain.com

# Or using CloudFlare
# Enable "Always Use HTTPS" in CloudFlare dashboard
```

### Security Headers
Add to your web server configuration:
```
# Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';

# Additional security headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting
```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=5 nodelay;
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Google Analytics**: User behavior tracking
- **Google Search Console**: SEO monitoring
- **Lighthouse**: Performance auditing
- **WebPageTest**: Detailed performance analysis

### Error Tracking
- **Sentry**: Real-time error tracking
- **LogRocket**: User session recording
- **Bugsnag**: Error monitoring and reporting

### Uptime Monitoring
- **Pingdom**: Website uptime monitoring
- **UptimeRobot**: Free uptime monitoring
- **StatusCake**: Advanced monitoring features

## 🚀 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to hosting
      run: |
        # Deploy to your hosting service
        echo "Deploying to production..."
```

### Automated Testing
```bash
# Run linting
npm run lint

# Run tests
npm test

# Run security audit
npm audit

# Check for outdated packages
npm outdated
```

## 🔄 Maintenance

### Regular Updates
1. **Security Patches**: Keep dependencies updated
2. **Performance Monitoring**: Regular Lighthouse audits
3. **Backup Strategy**: Regular backups of user data
4. **SSL Renewal**: Automatic certificate renewal

### Monitoring Dashboard
- **Uptime**: Monitor website availability
- **Performance**: Track loading times
- **Errors**: Monitor JavaScript errors
- **Security**: Watch for security threats

## 🆘 Troubleshooting

### Common Issues
1. **CORS Errors**: Check API endpoint configuration
2. **Mixed Content**: Ensure all resources use HTTPS
3. **404 Errors**: Verify client-side routing configuration
4. **Performance**: Optimize images and enable compression

### Debug Mode
Enable debug mode in development:
```javascript
// In main.js
const DEBUG = true;
if (DEBUG) {
    console.log('Debug mode enabled');
    // Add debug logging
}
```

### Performance Issues
1. **Image Optimization**: Compress and use modern formats
2. **Code Splitting**: Split JavaScript into smaller chunks
3. **Caching**: Implement proper caching strategies
4. **CDN**: Use CDN for static assets

## 📞 Support

For deployment assistance:
1. Check the troubleshooting section
2. Review hosting provider documentation
3. Create an issue in the repository
4. Contact support team

## 🎉 Success!

Once deployed, your Origins Client Portal will be accessible at your configured domain. The portal provides a professional, feature-rich interface for client management with enterprise-grade capabilities.

Remember to:
- Test all functionality after deployment
- Set up monitoring and analytics
- Configure SSL and security headers
- Set up backup and recovery procedures

---

**Happy deploying! 🚀**
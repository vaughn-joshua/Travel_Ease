# Nginx Deployment Guide for TravelEase

This document describes how to deploy TravelEase behind Nginx as a reverse proxy, including gzip compression, CDN-friendly caching, and TLS termination.

---

## 1. Baseline Layout & Ports

### Development Servers

| Service  | Port  | Description                          |
|----------|-------|--------------------------------------|
| Frontend | 5173  | Vite dev server (`npm run dev`)      |
| Backend  | 3001  | Express API (`npm run dev`)          |

### Production Artifacts

| Artifact                         | Path                                      |
|----------------------------------|-------------------------------------------|
| Frontend build (Vite output)     | `Travel_Ease_Frontend/dist/`              |
| Backend build (TypeScript output)| `Travel_Ease_Backend/dist/`               |

### Expected Deployment Paths

For a typical bare-metal or VM deployment:

```
/var/www/travelease/
├── frontend/          # Contents of Travel_Ease_Frontend/dist/
│   ├── index.html
│   └── assets/
│       ├── index-*.js
│       └── index-*.css
└── backend/           # Travel_Ease_Backend/ (run via pm2/systemd)
    ├── dist/
    │   └── server.js
    └── node_modules/
```

The backend listens on `http://127.0.0.1:3001` and is **not** exposed directly to the internet.

---

## 2. Nginx Configuration Overview

The Nginx configuration (`deploy/nginx/travelease.conf`) provides:

1. **HTTP → HTTPS redirect** on port 80
2. **HTTPS termination** on port 443 with modern TLS settings
3. **Static file serving** for the Vite build
4. **Reverse proxy** for `/api/` routes to the Node.js backend
5. **Gzip compression** for text-based assets and API responses
6. **Cache-Control headers** optimized for CDN caching

### Architecture

```
                    ┌─────────────────┐
    Internet ──────▶│  Nginx (:443)   │
                    │  TLS termination│
                    └────────┬────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
           ▼                                   ▼
    ┌──────────────┐                  ┌───────────────┐
    │ Static Files │                  │ Backend API   │
    │ /var/www/... │                  │ :3001 (HTTP)  │
    └──────────────┘                  └───────────────┘
```

---

## 3. Configuration Files

### Main Site Config

Location: `deploy/nginx/travelease.conf`

This file contains:
- HTTP server block (port 80) for HTTPS redirect
- HTTPS server block (port 443) with:
  - SSL certificate paths (placeholders)
  - Gzip compression settings
  - Static asset caching rules
  - API reverse proxy configuration

### Environment Variables

The Nginx config uses these placeholders that should be replaced:

| Placeholder              | Description                                    | Example                                      |
|--------------------------|------------------------------------------------|----------------------------------------------|
| `YOUR_DOMAIN`            | Your domain name                               | `travelease.example.com`                     |
| `/path/to/fullchain.pem` | SSL certificate (Let's Encrypt or other)       | `/etc/letsencrypt/live/example.com/fullchain.pem` |
| `/path/to/privkey.pem`   | SSL private key                                | `/etc/letsencrypt/live/example.com/privkey.pem`   |

---

## 4. Gzip Compression

Gzip is enabled for the following MIME types:

- `text/plain`
- `text/css`
- `text/xml`
- `text/javascript`
- `application/javascript`
- `application/json`
- `application/xml`
- `application/xml+rss`
- `image/svg+xml`

Settings:
- `gzip_vary on` - Adds `Vary: Accept-Encoding` header for CDN compatibility
- `gzip_proxied any` - Compresses proxied responses (API)
- `gzip_comp_level 6` - Balanced compression level
- `gzip_min_length 256` - Only compress responses > 256 bytes

---

## 5. Cache Headers Strategy

### Long-lived Cache (1 year, immutable)

Applied to Vite's hashed assets under `/assets/`:

```
Cache-Control: public, max-age=31536000, immutable
```

These files have content hashes in their names (e.g., `index-DUHZzStB.js`), so they can be cached indefinitely.

### No Cache (dynamic content)

Applied to:
- HTML files (`index.html`)
- API responses (`/api/*`)

```
Cache-Control: no-store
```

This ensures users always get fresh HTML and API data.

---

## 6. TLS Configuration

Modern TLS settings include:

- **Protocols**: TLSv1.2, TLSv1.3 only
- **Ciphers**: Strong cipher suite (ECDHE + AES-GCM)
- **HSTS**: Strict-Transport-Security header (1 year)
- **OCSP Stapling**: Enabled for faster certificate validation
- **Session Cache**: Shared cache for TLS session resumption

---

## 7. Deployment Options

See the sections below for bare-metal and Docker deployment instructions.

### Option A: Bare-Metal / VM

See [Bare-Metal Deployment](#bare-metal-deployment) section.

### Option B: Docker Compose

See [Docker Compose Deployment](#docker-compose-deployment) section.

---

## Bare-Metal Deployment

### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Nginx installed (`apt install nginx`)
- Node.js 18+ for the backend
- SSL certificates (Let's Encrypt recommended)

### Step 1: Build the Applications

```bash
# Build frontend
cd Travel_Ease_Frontend
npm ci
npm run build
# Output: dist/

# Build backend
cd ../Travel_Ease_Backend
npm ci
npm run build
# Output: dist/
```

### Step 2: Deploy Files

```bash
# Create deployment directories
sudo mkdir -p /var/www/travelease/frontend
sudo mkdir -p /var/www/travelease/backend

# Copy frontend build
sudo cp -r Travel_Ease_Frontend/dist/* /var/www/travelease/frontend/

# Copy backend (entire directory for node_modules)
sudo cp -r Travel_Ease_Backend/* /var/www/travelease/backend/
```

### Step 3: Install Nginx Config

```bash
# Copy the config
sudo cp deploy/nginx/travelease.conf /etc/nginx/sites-available/travelease

# Edit the config to replace placeholders
sudo nano /etc/nginx/sites-available/travelease
# Replace: YOUR_DOMAIN, /path/to/fullchain.pem, /path/to/privkey.pem

# Enable the site
sudo ln -sf /etc/nginx/sites-available/travelease /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Start the Backend

Using PM2 (recommended):

```bash
# Install PM2 globally
npm install -g pm2

# Start the backend
cd /var/www/travelease/backend
pm2 start dist/server.js --name travelease-api

# Save PM2 process list and set up startup script
pm2 save
pm2 startup
```

Or using systemd:

```bash
# Create systemd service file
sudo tee /etc/systemd/system/travelease-api.service > /dev/null <<EOF
[Unit]
Description=TravelEase API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/travelease/backend
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable travelease-api
sudo systemctl start travelease-api
```

### Step 5: Set Up SSL with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate (will auto-configure Nginx)
sudo certbot --nginx -d your-domain.com

# Or obtain certificate only (manual config)
sudo certbot certonly --webroot -w /var/www/travelease/frontend -d your-domain.com
```

---

## Docker Compose Deployment

A Docker Compose setup is provided in `deploy/docker-compose.nginx.yml`.

### Prerequisites

- Docker and Docker Compose installed
- SSL certificates available (or use Let's Encrypt with certbot-dns)

### Step 1: Build Images

```bash
# From project root
docker compose -f deploy/docker-compose.nginx.yml build
```

### Step 2: Configure Environment

Create `.env` file in `deploy/` directory:

```bash
# deploy/.env
DOMAIN=your-domain.com
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
DATABASE_URL=postgresql://user:pass@db:5432/travelease
```

### Step 3: Start Services

```bash
docker compose -f deploy/docker-compose.nginx.yml up -d
```

### Step 4: View Logs

```bash
docker compose -f deploy/docker-compose.nginx.yml logs -f
```

---

## Verification Checklist

After deployment, run these tests to verify everything works:

### 1. HTTPS Redirect

```bash
curl -I http://your-domain.com/
# Expected: 301 redirect to https://your-domain.com/
```

### 2. HTML Response (no cache)

```bash
curl -I https://your-domain.com/
# Expected:
# - HTTP/2 200
# - Content-Type: text/html
# - Cache-Control: no-store
```

### 3. Static Asset Caching

```bash
curl -I https://your-domain.com/assets/index-HASH.js
# Expected:
# - HTTP/2 200
# - Cache-Control: public, max-age=31536000, immutable
# - Content-Encoding: gzip (if Accept-Encoding: gzip sent)
```

### 4. Gzip Compression

```bash
curl -H "Accept-Encoding: gzip" -I https://your-domain.com/assets/index-HASH.js
# Expected: Content-Encoding: gzip
```

### 5. API Proxy

```bash
curl -I https://your-domain.com/api/health
# Expected:
# - HTTP/2 200
# - Content-Type: application/json
# - Cache-Control: no-store
```

### 6. API Response

```bash
curl https://your-domain.com/api/health
# Expected: {"status":"OK","timestamp":"...","port":"3001","database":"connected"}
```

### 7. TLS Configuration

```bash
# Check TLS version and cipher
curl -v https://your-domain.com/ 2>&1 | grep -E 'TLS|SSL|cipher'
# Expected: TLSv1.2 or TLSv1.3

# Or use SSL Labs (online)
# https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

### 8. HSTS Header

```bash
curl -I https://your-domain.com/
# Expected: Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Backend is not running
   - Check: `curl http://127.0.0.1:3001/api/health`
   - Fix: Start the backend service

2. **403 Forbidden on static files**
   - File permissions issue
   - Fix: `sudo chown -R www-data:www-data /var/www/travelease/frontend`

3. **SSL Certificate errors**
   - Certificate paths incorrect or expired
   - Fix: Check paths in Nginx config, renew with `certbot renew`

4. **Gzip not working**
   - Check `Accept-Encoding` header is sent
   - Verify file size > `gzip_min_length`

### Nginx Logs

```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

### Backend Logs

```bash
# PM2
pm2 logs travelease-api

# systemd
journalctl -u travelease-api -f
```

---

## Security Considerations

1. **Firewall**: Only expose ports 80 and 443 to the internet
2. **Backend**: Never expose port 3001 directly; always proxy through Nginx
3. **Environment Variables**: Store secrets in environment, not in code
4. **Updates**: Keep Nginx and Node.js updated for security patches
5. **Rate Limiting**: Consider adding `limit_req` for API endpoints
6. **WAF**: Consider Cloudflare or similar for additional protection

---

## Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `deploy/nginx/travelease.conf` | Main Nginx site configuration |
| `deploy/docker-compose.nginx.yml` | Docker Compose for containerized deployment |
| `Travel_Ease_Backend/Dockerfile` | Backend container build instructions |
| `docs/deployment/nginx.md` | This documentation |

### Key Ports

| Port | Service | Exposure |
|------|---------|----------|
| 80 | Nginx HTTP | Public (redirects to HTTPS) |
| 443 | Nginx HTTPS | Public |
| 3001 | Node.js Backend | Internal only |
| 5173 | Vite Dev Server | Development only |

### Environment Variables Required

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/travelease
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
PORT=3001
NODE_ENV=production
```


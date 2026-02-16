# Deployment Guide

## SkillArion Employee Tracking System - Deployment Instructions

### Prerequisites

- Node.js 18+ and pnpm
- Vercel account (for hosting) or AWS/GCP account
- Supabase project set up
- SendGrid account for email
- Domain: skillariondevelopement.in

### Environment Setup

1. **Copy environment files:**
   ```bash
   cp .env.example .env.local
   cp .env.production.example .env.production
   ```

2. **Configure environment variables:**
   - Update `.env.local` with your development credentials
   - Update `.env.production` with your production credentials
   - Never commit `.env.local` or `.env.production` files

3. **Required environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
   - `SENDGRID_API_KEY`: SendGrid API key
   - `NEXTAUTH_SECRET`: Secure random string (generate with `openssl rand -base64 32`)

### Local Development

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm run db:migrate

# Start development server
pnpm dev

# Visit http://localhost:3000
```

### Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run e2e tests
pnpm test:e2e
```

### Production Deployment

#### Option 1: Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel:**
   - Visit https://vercel.com/new
   - Import the GitHub repository
   - Add environment variables
   - Deploy

3. **Configure domain:**
   - Add custom domain in Vercel settings
   - Update DNS records with Vercel nameservers

#### Option 2: Docker Deployment (AWS/GCP)

1. **Build Docker image:**
   ```bash
   docker build -t skillarion-tracker:latest .
   ```

2. **Push to registry:**
   ```bash
   docker push your-registry/skillarion-tracker:latest
   ```

3. **Deploy to Kubernetes:**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

#### Option 3: Manual Deployment (AWS EC2)

1. **SSH into server:**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

2. **Clone repository:**
   ```bash
   git clone https://github.com/techtribe01/Employee-Tracker-Skillarion.git
   cd Employee-Tracker-Skillarion
   ```

3. **Install dependencies and build:**
   ```bash
   pnpm install
   pnpm run build
   ```

4. **Start with PM2:**
   ```bash
   pm2 start "pnpm start" --name "skillarion-tracker"
   pm2 save
   ```

5. **Configure reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name app.skillariondevelopement.in;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable HTTPS with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d app.skillariondevelopement.in
   ```

### Database Migrations

```bash
# Create migration
pnpm run db:create-migration

# Apply migrations
pnpm run db:migrate

# Rollback migration
pnpm run db:rollback

# Check migration status
pnpm run db:status
```

### Monitoring

1. **Health Check Endpoint:**
   - URL: `https://app.skillariondevelopement.in/api/health`
   - Expected response: `{ status: "healthy", ... }`

2. **Status Dashboard:**
   - URL: `https://app.skillariondevelopement.in/system-status`
   - Displays real-time system metrics

3. **Logs:**
   - Application logs available at `/var/log/skillarion/app.log`
   - Access logs at `/var/log/skillarion/access.log`

### Backup & Recovery

```bash
# Daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20260216.sql
```

### Performance Optimization

- Enable CDN for static assets (CloudFlare)
- Configure Redis caching for session management
- Enable database connection pooling
- Use Vercel Edge Functions for API routes
- Implement image optimization

### Security Checklist

- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up WAF rules
- [ ] Enable DDoS protection
- [ ] Configure firewall rules
- [ ] Regular security audits
- [ ] Monitor suspicious activity
- [ ] Set up rate limiting
- [ ] Enable API authentication
- [ ] Implement audit logging

### Rollback Procedure

1. Identify the problematic deployment
2. Revert to previous git commit: `git revert <commit-hash>`
3. Push to trigger redeploy
4. If database migration caused issues, run rollback script
5. Notify stakeholders

### Support & Issues

- Health check: `/api/health`
- Status page: `/system-status`
- Contact: support@skillariondevelopement.in
- Documentation: See README.md

---

**Last Updated:** February 16, 2026

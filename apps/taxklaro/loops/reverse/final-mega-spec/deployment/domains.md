# DNS, Domains, and Cloudflare Configuration — Philippine Freelance Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Infrastructure overview: [deployment/infrastructure.md](infrastructure.md)
- Environment variables (domain-specific vars): [deployment/environment.md](environment.md)
- CI/CD (staging deploy aliases): [deployment/ci-cd.md](ci-cd.md)
- Monitoring (health check URLs): [deployment/monitoring.md](monitoring.md)
- API base URL: [api/endpoints.md](../api/endpoints.md)
- R2 storage (exports bucket): Section 11.1 of [deployment/infrastructure.md](infrastructure.md)

---

## Table of Contents

1. [Zone Overview](#1-zone-overview)
2. [Complete DNS Record Table](#2-complete-dns-record-table)
3. [Subdomain Routing Table](#3-subdomain-routing-table)
4. [Cloudflare SSL/TLS Configuration](#4-cloudflare-ssltls-configuration)
5. [Cloudflare Cache Rules](#5-cloudflare-cache-rules)
6. [Cloudflare WAF Configuration](#6-cloudflare-waf-configuration)
7. [Cloudflare Security Settings](#7-cloudflare-security-settings)
8. [Custom Domain Registration Procedures](#8-custom-domain-registration-procedures)
9. [Certificate Management](#9-certificate-management)
10. [Email DNS Records (SPF / DKIM / DMARC)](#10-email-dns-records-spf--dkim--dmarc)
11. [Staging Environment DNS](#11-staging-environment-dns)
12. [Provisioning Runbook](#12-provisioning-runbook)
13. [Verification Commands](#13-verification-commands)
14. [Maintenance Procedures](#14-maintenance-procedures)

---

## 1. Zone Overview

### 1.1 Registered Domain

| Field | Value |
|-------|-------|
| Domain name | `taxklaro.ph` |
| TLD | `.ph` (Philippines ccTLD managed by dotPH / PH Domain Foundation) |
| Registrar | Namecheap (supports .ph TLD registration via dotPH backend; account at namecheap.com) |
| DNS provider | Cloudflare (authoritative nameservers after transfer to Cloudflare) |
| Cloudflare plan | Pro ($20/month) — required for WAF, advanced bot protection, Page Rules >3 |

### 1.2 Nameserver Delegation

After registering `taxklaro.ph` and adding the site to Cloudflare, update the domain's nameservers at the registrar to the two Cloudflare nameservers assigned to your Cloudflare account. These are displayed in Cloudflare Dashboard → taxklaro.ph → DNS → Nameservers. The format is always two nameservers from the set `*.ns.cloudflare.com`.

**Example format (your actual values differ):**
- `abby.ns.cloudflare.com`
- `hector.ns.cloudflare.com`

Update these at the registrar's nameserver configuration panel. Propagation takes up to 24 hours; full global propagation is typically under 2 hours.

### 1.3 Cloudflare Zone Settings (Account-Level)

| Setting | Value | Location |
|---------|-------|----------|
| Plan | Pro | Dashboard → Overview → Plan |
| Always Use HTTPS | On | Dashboard → SSL/TLS → Edge Certificates |
| HTTP/3 (with QUIC) | On | Dashboard → Speed → Optimization → Protocol Optimization |
| 0-RTT Connection Resumption | On | Dashboard → Speed → Optimization → Protocol Optimization |
| IPv6 Compatibility | On | Dashboard → Network |
| WebSockets | On | Dashboard → Network (required for future WS upgrade) |
| IP Geolocation | On | Dashboard → Network (adds CF-IPCountry header to API requests) |
| Pseudo IPv4 | Off | Dashboard → Network |

---

## 2. Complete DNS Record Table

All records are in the `taxklaro.ph` zone. "Proxied" means Cloudflare orange-cloud proxy is ON (traffic flows through Cloudflare edge). "DNS only" means Cloudflare is only resolving the name without proxying.

Records are listed in the exact order you should create them in the Cloudflare Dashboard → DNS → Records panel or via the Cloudflare API.

| # | Type | Name | Content | TTL | Proxy Status | Purpose |
|---|------|------|---------|-----|-------------|---------|
| 1 | A | `@` | `76.76.21.21` | Auto | Proxied | Root domain → Vercel frontend (Vercel anycast IPv4) |
| 2 | AAAA | `@` | `2606:4700:90:0:f22e:fbec:5bed:a9b9` | Auto | Proxied | Root domain → Vercel frontend (IPv6 via Vercel) |
| 3 | CNAME | `www` | `cname.vercel-dns.com` | Auto | Proxied | www subdomain → Vercel (Vercel handles www→root redirect) |
| 4 | CNAME | `api` | `taxklaro-api.fly.dev` | Auto | Proxied | API server → Fly.io production app |
| 5 | CNAME | `staging` | `cname.vercel-dns.com` | Auto | Proxied | Staging frontend → Vercel preview environment |
| 6 | CNAME | `api.staging` | `taxklaro-api-staging.fly.dev` | Auto | Proxied | Staging API server → Fly.io staging app |
| 7 | CNAME | `exports` | Set via R2 Custom Domain UI (see §8.3) | Auto | Proxied | PDF exports R2 bucket public access |
| 8 | TXT | `@` | `v=spf1 include:amazonses.com ~all` | 300 | DNS only | SPF record for outbound email via Resend |
| 9 | CNAME | `resend._domainkey.mail` | `resend._domainkey.resend.com` | 300 | DNS only | Resend DKIM key (key 1 — fixed value) |
| 10 | CNAME | `s1._domainkey.mail` | `s1._domainkey.resend.com` | 300 | DNS only | Resend DKIM key 2 — exact Name and Content values provided by Resend Dashboard → Settings → Domains → taxklaro.ph after domain verification; format: `[selector]._domainkey.mail` → `[selector]._domainkey.resend.com` |
| 11 | TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@taxklaro.ph; ruf=mailto:dmarc@taxklaro.ph; pct=100; adkim=s; aspf=s` | 300 | DNS only | DMARC email authentication policy |
| 12 | MX | `mail` | `ASPMX.L.GOOGLE.COM` (priority 1) | 300 | DNS only | Inbound MX for dmarc@taxklaro.ph address via Google Workspace |
| 13 | TXT | `_vercel` | `vc-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (32-char hex token — exact value from Vercel Dashboard → taxklaro-ph project → Settings → Domains → Add taxklaro.ph → copy the displayed TXT value) | 300 | DNS only | Vercel domain ownership verification |
| 14 | CAA | `@` | `0 issue "letsencrypt.org"` | 3600 | DNS only | Restrict TLS certificate issuance to Let's Encrypt |
| 15 | CAA | `@` | `0 issue "digicert.com"` | 3600 | DNS only | Allow DigiCert (used by Cloudflare for its own edge cert) |
| 16 | CAA | `@` | `0 issuewild "letsencrypt.org"` | 3600 | DNS only | Allow Let's Encrypt wildcard issuance (for *.taxklaro.ph) |
| 17 | TXT | `@` | `google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (exact token from Google Search Console → Add property → taxklaro.ph → DNS verification method → copy the displayed value) | 300 | DNS only | Google Search Console domain ownership verification |

**Notes on record 10 (Resend DKIM key 2):** When you add `mail.taxklaro.ph` to Resend Dashboard → Settings → Domains, Resend displays all required DNS records including the actual selector and CNAME target for the second DKIM key. Copy the exact name and content values shown by Resend. The selector format is `s1._domainkey.mail.taxklaro.ph` (Resend may assign a different selector label; use exactly what is shown in the dashboard).

**Notes on record 12 (MX for mail subdomain):** The `dmarc@taxklaro.ph` address in the DMARC `rua` tag must be a real deliverable inbox. Use the operator's existing email provider (e.g., Gmail/Google Workspace, Zoho, Fastmail). The MX record for `mail.taxklaro.ph` points to that provider's MX server. If using Google Workspace: MX `mail.taxklaro.ph → ASPMX.L.GOOGLE.COM` priority 1.

**Notes on record 13 (Vercel verification):** The `_vercel` TXT record is generated when you add `taxklaro.ph` as a custom domain in the Vercel project settings. Navigate to Vercel Dashboard → taxklaro-ph project → Settings → Domains → Add `taxklaro.ph`. Vercel shows the exact TXT value to copy.

**Notes on record 17 (Google Search Console):** After adding the property in Google Search Console (property type: Domain property), select the DNS verification method. Google displays the exact `google-site-verification=...` TXT value to copy.

---

## 3. Subdomain Routing Table

| Subdomain | Origin Service | Fly.io App / Vercel Project | Proxy | Purpose |
|-----------|---------------|----------------------------|-------|---------|
| `taxklaro.ph` | Vercel | `taxklaro-ph` (production) | Proxied | Main frontend application |
| `www.taxklaro.ph` | Vercel | `taxklaro-ph` (production) | Proxied | Redirects to `taxklaro.ph` (Vercel auto-redirect) |
| `api.taxklaro.ph` | Fly.io | `taxklaro-api` | Proxied | Production REST API, all `/v1/*` routes |
| `staging.taxklaro.ph` | Vercel | `taxklaro-ph` (staging environment) | Proxied | Staging frontend — `staging` branch deploys here |
| `api.staging.taxklaro.ph` | Fly.io | `taxklaro-api-staging` | Proxied | Staging API server — mirrors production, uses staging DB |
| `exports.taxklaro.ph` | Cloudflare R2 | `taxklaro-exports` bucket | Proxied | PDF export file downloads — pre-signed URLs use this base |
| `mail.taxklaro.ph` | N/A (DNS-only) | N/A — used only for email DNS (SPF/DKIM/DMARC) | DNS only | Email authentication subdomain — not HTTP-accessible |

**Traffic routing through Cloudflare:**

```
User request to taxklaro.ph
        │
        ▼
Cloudflare Edge (global PoP closest to user)
        │
        ├─── taxklaro.ph/* ──────────────► Vercel (sin1, Singapore)
        │                                        Next.js 15 SSR/SSG
        │
        ├─── api.taxklaro.ph/* ─────────► Fly.io (sin, Singapore)
        │                                        Node.js 22 / Express 5
        │
        ├─── staging.taxklaro.ph/* ─────► Vercel (staging env)
        │
        ├─── api.staging.taxklaro.ph/* ─► Fly.io taxklaro-api-staging
        │
        └─── exports.taxklaro.ph/* ─────► Cloudflare R2
                                                taxklaro-exports bucket
```

---

## 4. Cloudflare SSL/TLS Configuration

All SSL settings are in Cloudflare Dashboard → `taxklaro.ph` → SSL/TLS.

### 4.1 Encryption Mode

| Setting | Value | Reason |
|---------|-------|--------|
| SSL/TLS encryption mode | **Full (strict)** | Both Vercel and Fly.io origins have valid TLS certificates. Full (strict) validates the origin cert. "Flexible" or "Full" (without strict) are NOT acceptable — they allow MITM attacks on the Cloudflare→origin leg. |

### 4.2 Edge Certificates

| Setting | Value |
|---------|-------|
| Always Use HTTPS | On — all HTTP requests are redirected to HTTPS (301) at the Cloudflare edge |
| HTTP Strict Transport Security (HSTS) | Enabled — see §4.3 |
| Minimum TLS Version | TLS 1.2 — rejects TLS 1.0 and TLS 1.1 connections |
| Opportunistic Encryption | On |
| TLS 1.3 | On |
| Automatic HTTPS Rewrites | On — rewrites `http://` links in page HTML to `https://` |

### 4.3 HSTS Configuration

Navigate to: SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS) → Enable HSTS.

| HSTS Field | Value |
|------------|-------|
| Max Age | 31536000 seconds (1 year) |
| Include Subdomains | On — applies HSTS to all *.taxklaro.ph |
| Preload | Off initially — enable preload ONLY after the site has been live for >6 months with HSTS enabled, and after submitting to the HSTS Preload List (hstspreload.org). Enabling preload prematurely and then needing to disable HTTPS causes 1-year user lockout. |
| No-Sniff Header | On — adds `X-Content-Type-Options: nosniff` |

**Full HSTS response header after configuration:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 4.4 Origin Server Certificate (for Fly.io)

Fly.io automatically issues and manages Let's Encrypt certificates for custom domains registered via `flyctl certs add`. The certificate covers `api.taxklaro.ph` and `api.staging.taxklaro.ph`. No manual certificate action is required.

Cloudflare's Full (strict) mode validates that the Fly.io origin presents a cert for `api.taxklaro.ph` signed by a trusted CA (Let's Encrypt qualifies).

### 4.5 Cloudflare Origin Certificate (for Vercel)

Vercel automatically provisions and renews a TLS certificate for `taxklaro.ph` and `staging.taxklaro.ph` after domain verification. The cert is issued by Let's Encrypt. No manual certificate action is required.

---

## 5. Cloudflare Cache Rules

Cache Rules are configured in Cloudflare Dashboard → `taxklaro.ph` → Caching → Cache Rules. Rules are evaluated in order from top to bottom; the first matching rule applies.

### 5.1 Cache Rules Table

Rules listed in evaluation order (Rule 1 evaluated first):

| Rule # | Rule Name | Match Condition | Cache Action | Edge TTL | Browser TTL |
|--------|-----------|----------------|-------------|----------|-------------|
| 1 | `bypass-api` | Hostname equals `api.taxklaro.ph` | Bypass cache | N/A | N/A |
| 2 | `bypass-staging-api` | Hostname equals `api.staging.taxklaro.ph` | Bypass cache | N/A | N/A |
| 3 | `bypass-compute` | URI path equals `/compute` OR starts with `/dashboard` OR starts with `/settings` OR starts with `/history` OR starts with `/clients` | Bypass cache | N/A | N/A |
| 4 | `cache-static-next` | URI path starts with `/_next/static/` | Cache everything | 86400s (24 hours) | 31536000s (1 year) |
| 5 | `cache-next-images` | URI path starts with `/_next/image` | Cache everything | 86400s (24 hours) | 86400s (24 hours) |
| 6 | `cache-blog` | URI path starts with `/blog/` AND URI path does not end with `/edit` | Cache everything | 3600s (1 hour) | 3600s (1 hour) |
| 7 | `cache-marketing` | URI path equals `/` OR equals `/pricing` OR equals `/about` OR equals `/faq` OR starts with `/legal/` | Cache everything | 1800s (30 minutes) | 3600s (1 hour) |
| 8 | `cache-sitemap-robots` | URI path equals `/sitemap.xml` OR equals `/robots.txt` OR equals `/favicon.ico` | Cache everything | 86400s (24 hours) | 86400s (24 hours) |
| 9 | `bypass-exports` | Hostname equals `exports.taxklaro.ph` | Bypass cache | N/A | N/A |

### 5.2 Legacy Page Rules (Backup Method)

If Cache Rules interface is unavailable during initial setup, configure the following Page Rules in Cloudflare Dashboard → Rules → Page Rules. Page Rules are deprecated in favor of Cache Rules but still function.

| # | URL Pattern | Setting | Value |
|---|-------------|---------|-------|
| 1 | `www.taxklaro.ph/*` | Forwarding URL (301 Permanent Redirect) | `https://taxklaro.ph/$1` |
| 2 | `api.taxklaro.ph/*` | Cache Level | Bypass |
| 3 | `taxklaro.ph/_next/static/*` | Cache Level, Browser Cache TTL, Edge Cache TTL | Cache Everything; 31536000s; 86400s |
| 4 | `taxklaro.ph/blog/*` | Cache Level, Edge Cache TTL | Cache Everything; 3600s |
| 5 | `taxklaro.ph/compute` | Cache Level | Bypass |
| 6 | `taxklaro.ph/dashboard/*` | Cache Level | Bypass |
| 7 | `staging.taxklaro.ph/*` | Security Level | High |

**Important:** The Cloudflare Pro plan includes 20 Page Rules. If additional rules are needed, use Cache Rules (unlimited).

### 5.3 Cache Purge Procedure

After each production deployment, purge the Cloudflare cache for marketing/blog pages:

```bash
# Purge specific URLs after deployment (run from CI/CD — see ci-cd.md section 8)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://taxklaro.ph/","https://taxklaro.ph/pricing","https://taxklaro.ph/about","https://taxklaro.ph/faq","https://taxklaro.ph/sitemap.xml"]}'

# Purge everything (use only when needed — increases origin load)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

## 6. Cloudflare WAF Configuration

WAF rules are configured in Cloudflare Dashboard → `taxklaro.ph` → Security → WAF.

### 6.1 Managed Rulesets

| Ruleset | Status | Sensitivity / Mode | Notes |
|---------|--------|--------------------|-------|
| Cloudflare Managed Ruleset | Enabled | Default (Medium sensitivity) | Covers known CVEs, common web exploits. Do not set to High initially — may block legitimate API clients. |
| Cloudflare OWASP Core Ruleset | Enabled | Medium (Paranoia Level 2); Score threshold: 60 | Covers OWASP Top 10. PL2 adds detection for common attack tools without excessive false positives. |
| Cloudflare Exposed Credentials Check | Enabled | N/A | Checks submitted credentials against known breach databases on login/register routes. Challenges matched requests. |

### 6.2 Custom WAF Rules (Rate Limiting)

Navigate to: Security → WAF → Rate limiting rules → Create rule.

**Rule 1: Auth login brute-force protection**

| Field | Value |
|-------|-------|
| Rule name | `rate-limit-auth-login` |
| When incoming requests match | URI path equals `/v1/auth/login` AND Method equals `POST` |
| Rate limit requests | More than 10 requests in 300 seconds (5 minutes) |
| Counting expression | Same IP address |
| Action | Challenge (Managed Challenge — issues CAPTCHA-like challenge) |
| Duration | Block for 600 seconds (10 minutes) after challenge failure |

**Rule 2: Auth registration abuse protection**

| Field | Value |
|-------|-------|
| Rule name | `rate-limit-auth-register` |
| When incoming requests match | URI path equals `/v1/auth/register` AND Method equals `POST` |
| Rate limit requests | More than 5 requests in 600 seconds (10 minutes) |
| Counting expression | Same IP address |
| Action | Challenge (Managed Challenge) |
| Duration | Block for 3600 seconds (1 hour) after challenge failure |

**Rule 3: Auth password reset abuse**

| Field | Value |
|-------|-------|
| Rule name | `rate-limit-password-reset` |
| When incoming requests match | URI path equals `/v1/auth/forgot-password` AND Method equals `POST` |
| Rate limit requests | More than 3 requests in 900 seconds (15 minutes) |
| Counting expression | Same IP address |
| Action | Block (429 Too Many Requests) |
| Duration | Block for 3600 seconds (1 hour) |

**Rule 4: Compute endpoint abuse protection (per-IP)**

| Field | Value |
|-------|-------|
| Rule name | `rate-limit-compute-ip` |
| When incoming requests match | URI path equals `/v1/compute` AND Method equals `POST` AND Hostname equals `api.taxklaro.ph` |
| Rate limit requests | More than 60 requests in 60 seconds |
| Counting expression | Same IP address |
| Action | Block (429 Too Many Requests) for 120 seconds |
| Notes | Server-side rate limiting (see api/rate-limiting.md) provides more granular per-tier limiting. This Cloudflare rule is the outermost abuse circuit breaker. |

**Rule 5: General API rate limiting (per-IP)**

| Field | Value |
|-------|-------|
| Rule name | `rate-limit-api-general` |
| When incoming requests match | Hostname equals `api.taxklaro.ph` |
| Rate limit requests | More than 1000 requests in 600 seconds (10 minutes) |
| Counting expression | Same IP address |
| Action | Block for 60 seconds |
| Notes | Catches all endpoints not covered by more specific rules. Legitimate free-tier users generate ~5–20 requests per session. 1000 in 10 minutes indicates automated abuse. |

**Rule 6: Batch endpoint protection (Enterprise tier — per IP)**

| Field | Value |
|-------|-------|
| Rule name | `rate-limit-batch` |
| When incoming requests match | URI path starts with `/v1/batch` AND Hostname equals `api.taxklaro.ph` |
| Rate limit requests | More than 10 requests in 60 seconds |
| Counting expression | Same IP address |
| Action | Block for 300 seconds |
| Notes | Batch jobs are async; 10 submit-requests/minute per IP is well above legitimate CPA workflow. |

**Rule 7: Webhook endpoint protection**

| Field | Value |
|-------|-------|
| Rule name | `rate-limit-webhooks` |
| When incoming requests match | URI path starts with `/v1/billing/webhooks` AND Hostname equals `api.taxklaro.ph` |
| Rate limit requests | More than 100 requests in 60 seconds |
| Counting expression | Same IP address |
| Action | Block for 60 seconds |
| Notes | PayMongo and Stripe send webhooks from fixed IP ranges. High volume from a single IP is replay abuse. |

### 6.3 Custom WAF Rules (Security)

**Rule 8: Block direct-to-origin bypass attempts**

| Field | Value |
|-------|-------|
| Rule name | `block-origin-header-missing` |
| When incoming requests match | Hostname equals `api.taxklaro.ph` AND NOT (Header `CF-Connecting-IP` exists) |
| Action | Block (403 Forbidden) |
| Notes | All legitimate requests through Cloudflare include the CF-Connecting-IP header. Requests without it are bypassing Cloudflare (direct-to-origin). The API server checks the `ALLOWED_HOSTS` list, but this rule provides defense-in-depth. |

**Rule 9: Block non-HTTPS protocol upgrade attempts on API**

| Field | Value |
|-------|-------|
| Rule name | `block-http-api` |
| When incoming requests match | Hostname equals `api.taxklaro.ph` AND SSL is off |
| Action | Block (403 Forbidden) |
| Notes | With "Always Use HTTPS" enabled, Cloudflare redirects HTTP to HTTPS for the frontend. For the API, rejecting plaintext is more appropriate than redirecting. |

### 6.4 Security Level and Bot Management

| Setting | Value | Location |
|---------|-------|----------|
| Security Level | Medium | Security → Settings → Security Level. Medium challenges IPs with moderate threat scores (1-14). |
| Bot Fight Mode | On | Security → Bots → Bot Fight Mode. Blocks known malicious bots. Pro plan includes this feature. |
| Browser Integrity Check | On | Security → Settings → Browser Integrity Check. Checks for headers commonly set by spam bots. |
| Privacy Pass Support | On | Security → Settings → Privacy Pass Support. Allows users with Privacy Pass tokens to bypass CAPTCHA challenges. |
| Challenge Passage | 1800 seconds (30 minutes) | Security → Settings. Once a visitor passes a challenge, they are not re-challenged for 30 minutes. |

---

## 7. Cloudflare Security Settings

Navigate to: `taxklaro.ph` → Security → Settings.

| Setting | Value | Reason |
|---------|-------|--------|
| Security Level | Medium | Challenges IPs with moderate threat scores. Not High, which may challenge legitimate users in PH. |
| Bot Fight Mode | On | Blocks known bad bots from Cloudflare's threat intelligence. |
| Browser Integrity Check | On | Checks for standard browser headers; blocks common scrapers and spam bots. |
| Hotlink Protection | On | Prevents other sites from embedding `taxklaro.ph` images directly (prevents bandwidth theft). |
| Email Address Obfuscation | On | Prevents email scraping bots from harvesting addresses in page HTML. |
| Server-side Excludes | On | Allows sensitive HTML sections to be hidden from suspicious visitors. |
| Privacy Pass | On | Reduces friction for users with Privacy Pass browser extension. |

### 7.1 Firewall — IP Access Rules

Configure in: Security → WAF → Tools → IP Access Rules.

| Action | Value | Type | Notes |
|--------|-------|------|-------|
| Whitelist | Fly.io IP ranges for `taxklaro-api.fly.dev` | ASN | Optional: whitelist Fly.io's ASN so WAF rules don't block internal Fly-to-Cloudflare traffic. Fly.io ASN is AS54825. |
| Block | Tor exit nodes | Threat category | Cloudflare automatically handles this via Security Level, but explicit block adds defense in depth. Not recommended if user base includes privacy-conscious users in PH. |

---

## 8. Custom Domain Registration Procedures

### 8.1 Vercel Custom Domains (Production and Staging)

**Step 1: Add production domain in Vercel**

```bash
# Via Vercel CLI (run from project directory)
vercel domains add taxklaro.ph --project taxklaro-ph
vercel domains add www.taxklaro.ph --project taxklaro-ph
```

Or via Vercel Dashboard → taxklaro-ph → Settings → Domains → Add Domain → enter `taxklaro.ph`.

Vercel will display:
- A record: `76.76.21.21` (add to Cloudflare DNS as record #1)
- AAAA record: `2606:4700:90:0:f22e:fbec:5bed:a9b9` (add to Cloudflare DNS as record #2)
- TXT verification record: `_vercel` with a verification token (add to Cloudflare DNS as record #13)

**Step 2: Add staging domain in Vercel**

```bash
vercel domains add staging.taxklaro.ph --project taxklaro-ph
```

Or via Vercel Dashboard → taxklaro-ph → Settings → Domains → Add Domain → enter `staging.taxklaro.ph`.

Vercel assigns this to the `staging` git branch environment. Vercel uses the same `_vercel` TXT verification record for all domains on the same project.

**Step 3: Verify domain ownership**

After adding DNS records in Cloudflare (records #1, #2, #3, #13 from §2), Vercel automatically polls for DNS propagation and marks the domain as verified. Verification typically completes within 5–30 minutes. Check status:

```bash
vercel domains inspect taxklaro.ph
```

**Step 4: Set production domain as default in Vercel**

In Vercel Dashboard → taxklaro-ph → Settings → Domains, mark `taxklaro.ph` as the production domain (not `taxklaro-ph.vercel.app`). This ensures canonical URLs in Next.js OG tags, sitemaps, and redirects use `taxklaro.ph`.

### 8.2 Fly.io Custom Domains (API Server)

**Step 1: Add custom domain to production API app**

```bash
# Add domain cert to production API app
flyctl certs add api.taxklaro.ph -a taxklaro-api

# Check cert issuance status (may take 2–5 minutes for Let's Encrypt issuance)
flyctl certs show api.taxklaro.ph -a taxklaro-api
```

Expected output after cert issuance:
```
Hostname                  = api.taxklaro.ph
DNS Provider              = cloudflare
Certificate Authority     = Let's Encrypt
Issued                    = true
ACME Challenges           = DNS-01
```

**Step 2: Add custom domain to staging API app**

```bash
flyctl certs add api.staging.taxklaro.ph -a taxklaro-api-staging
flyctl certs show api.staging.taxklaro.ph -a taxklaro-api-staging
```

**Step 3: Verify certificate**

After Fly.io issues the cert (Let's Encrypt DNS-01 challenge via Cloudflare API), verify:

```bash
# Check that cert is serving correctly
curl -I https://api.taxklaro.ph/v1/health/live
# Expected: HTTP/2 200 with valid TLS cert for api.taxklaro.ph

openssl s_client -connect api.taxklaro.ph:443 -servername api.taxklaro.ph 2>/dev/null | \
  openssl x509 -noout -subject -issuer -dates
# Expected: Subject: CN=api.taxklaro.ph, Issuer: Let's Encrypt
```

**Note on Fly.io CNAME approach vs. dedicated IPs:** The spec uses CNAME records (`api.taxklaro.ph CNAME taxklaro-api.fly.dev`) rather than dedicated Fly.io IPv4 addresses. This approach:
- Requires no IP allocation (no $2/month dedicated IPv4 charge per app)
- Survives Fly.io infrastructure migrations transparently
- Works correctly with Cloudflare proxy mode (Cloudflare resolves the CNAME to Fly.io's current IPs)
- Cloudflare's Full (strict) SSL mode validates the Fly.io origin cert for `api.taxklaro.ph`

If dedicated IPs are preferred (e.g., for IP allowlisting in enterprise firewalls), allocate them:
```bash
flyctl ips allocate-v4 -a taxklaro-api   # costs $2/month, outputs IPv4 address
flyctl ips allocate-v6 -a taxklaro-api   # free, outputs IPv6 address
# Then replace CNAME record #4 with A record (IPv4) and AAAA record (IPv6)
```

### 8.3 Cloudflare R2 Custom Domain (exports.taxklaro.ph)

**Step 1: Create the R2 bucket (if not already done)**

```bash
# Using Wrangler CLI (already authenticated via wrangler login)
wrangler r2 bucket create taxklaro-exports
```

**Step 2: Add custom domain to R2 bucket**

Navigate to: Cloudflare Dashboard → R2 Object Storage → taxklaro-exports bucket → Settings → Custom Domains → Connect Domain.

Enter: `exports.taxklaro.ph`

Cloudflare validates that `taxklaro.ph` is on your Cloudflare account and automatically creates the required CNAME DNS record in the zone. The CNAME target is an internal Cloudflare R2 routing address in the format `taxklaro-exports.ACCOUNT_ID_HEX.r2.cloudflarestorage.com` (where `ACCOUNT_ID_HEX` is your 32-character Cloudflare account ID, visible in Cloudflare Dashboard → right sidebar → Account ID). Cloudflare creates this record automatically — do not create it manually.

After connecting, the record appears in Cloudflare DNS as:
- Type: CNAME
- Name: `exports`
- Target: `taxklaro-exports.ACCOUNT_ID_HEX.r2.cloudflarestorage.com` (auto-created by Cloudflare; value contains your actual account ID)
- Proxy: Proxied (orange cloud)
- TTL: Auto

**Step 3: Verify R2 custom domain**

```bash
# Upload a test object
wrangler r2 object put taxklaro-exports/test-connectivity.txt --body "hello"

# Verify the custom domain serves the object
curl -I https://exports.taxklaro.ph/test-connectivity.txt
# Expected: HTTP/2 200

# Delete the test object
wrangler r2 object delete taxklaro-exports/test-connectivity.txt
```

---

## 9. Certificate Management

### 9.1 Certificate Inventory

| Domain | Certificate Issuer | Managed By | Renewal Method |
|--------|-------------------|------------|----------------|
| `taxklaro.ph` | Let's Encrypt (via Vercel) | Vercel — fully automatic | Vercel renews ~30 days before expiry. No action required. |
| `www.taxklaro.ph` | Let's Encrypt (via Vercel) | Vercel — fully automatic | Same as above. |
| `staging.taxklaro.ph` | Let's Encrypt (via Vercel) | Vercel — fully automatic | Same as above. |
| `api.taxklaro.ph` | Let's Encrypt (via Fly.io) | Fly.io — fully automatic | Fly.io renews via ACME DNS-01 challenge. No action required. |
| `api.staging.taxklaro.ph` | Let's Encrypt (via Fly.io) | Fly.io — fully automatic | Same as above. |
| `*.taxklaro.ph` (Cloudflare edge) | DigiCert (Cloudflare-issued) | Cloudflare — fully automatic | Cloudflare manages its edge certificate. No action required. |
| `exports.taxklaro.ph` | DigiCert (Cloudflare-issued) | Cloudflare — fully automatic | Managed as part of the R2 custom domain by Cloudflare. |

### 9.2 Certificate Monitoring

Sentry alerts for certificate-related errors. Additionally, configure Cloudflare Notifications:

Navigate to: Cloudflare Dashboard → Notifications → Add Notification → SSL/TLS → Certificate Alert.

| Notification Type | Trigger | Destination |
|------------------|---------|-------------|
| Certificate Expiration Alert | 30 days before expiry | Operator email address |
| Certificate Expiration Alert | 14 days before expiry | Operator email address |
| SSL Validation Error | Immediate | Operator email address |
| Certificate Issuance | Immediate (for visibility) | Operator email address |

### 9.3 Certificate Renewal Failure Recovery

If Vercel fails to auto-renew (rare — happens if domain leaves Cloudflare DNS):

```bash
# Remove and re-add domain in Vercel to trigger re-issuance
vercel domains remove taxklaro.ph --project taxklaro-ph
vercel domains add taxklaro.ph --project taxklaro-ph
```

If Fly.io fails to auto-renew:

```bash
# Remove and re-add cert to trigger re-issuance
flyctl certs remove api.taxklaro.ph -a taxklaro-api
flyctl certs add api.taxklaro.ph -a taxklaro-api
flyctl certs show api.taxklaro.ph -a taxklaro-api  # watch until Issued=true
```

---

## 10. Email DNS Records (SPF / DKIM / DMARC)

All outbound transactional email is sent via Resend from the `mail.taxklaro.ph` subdomain. These records authenticate outbound email so that delivery to Gmail, Outlook, and Yahoo is reliable and bypass spam filters.

### 10.1 SPF Record

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `@` | `v=spf1 include:amazonses.com ~all` | 300 |

**Explanation:** Resend uses Amazon SES as its underlying sending infrastructure. The `include:amazonses.com` authorizes SES IP ranges to send email on behalf of `taxklaro.ph`. The `~all` softfail policy means unlisted sources are marked as suspicious but not rejected (allows gradual rollout; harden to `-all` after 30 days of confirmed delivery).

### 10.2 DKIM Records

DKIM records are obtained from Resend after adding the domain:

**Step 1:** In Resend Dashboard → Settings → Domains → Add Domain → enter `mail.taxklaro.ph` → click "Add Domain".

**Step 2:** Resend displays exactly two DNS records to add. Both are CNAME records. Add them to Cloudflare DNS as DNS-only (not proxied — mail infrastructure must not be proxied through Cloudflare).

**Record format provided by Resend:**

| Type | Name | Content | TTL | Proxy |
|------|------|---------|-----|-------|
| CNAME | `resend._domainkey.mail` | `resend._domainkey.resend.com` | 300 | DNS only |
| CNAME | `s1._domainkey.mail` | `s1._domainkey.resend.com` | 300 | DNS only |

The first record is always `resend._domainkey.resend.com`. The second record's selector and target are assigned by Resend and displayed in the Resend dashboard — copy the exact values shown there.

**Step 3:** After adding both CNAME records, click "Verify DNS Records" in Resend dashboard. Verification typically completes within 5 minutes.

### 10.3 DMARC Record

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@taxklaro.ph; ruf=mailto:dmarc@taxklaro.ph; pct=100; adkim=s; aspf=s` | 300 |

**Field explanations:**

| Field | Value | Meaning |
|-------|-------|---------|
| `v` | `DMARC1` | DMARC version 1 |
| `p` | `quarantine` | Messages failing DMARC go to spam. Start with `quarantine`; harden to `reject` after 30 days of monitoring aggregate reports. |
| `rua` | `mailto:dmarc@taxklaro.ph` | Aggregate DMARC reports sent daily to this address |
| `ruf` | `mailto:dmarc@taxklaro.ph` | Forensic failure reports sent per-message to this address |
| `pct` | `100` | Apply DMARC policy to 100% of messages |
| `adkim` | `s` | Strict DKIM alignment — the DKIM `d=` domain must exactly match the From: domain |
| `aspf` | `s` | Strict SPF alignment — the RFC5321 MailFrom domain must exactly match the From: domain |

### 10.4 MX Record for DMARC Reporting Inbox

The DMARC `rua` and `ruf` addresses route to `dmarc@taxklaro.ph`. For this to receive email, an MX record must exist for `taxklaro.ph`. If using Google Workspace for operator admin email:

| Type | Name | Content | Priority | TTL |
|------|------|---------|----------|-----|
| MX | `@` | `ASPMX.L.GOOGLE.COM` | 1 | 300 |
| MX | `@` | `ALT1.ASPMX.L.GOOGLE.COM` | 5 | 300 |
| MX | `@` | `ALT2.ASPMX.L.GOOGLE.COM` | 5 | 300 |
| MX | `@` | `ALT3.ASPMX.L.GOOGLE.COM` | 10 | 300 |
| MX | `@` | `ALT4.ASPMX.L.GOOGLE.COM` | 10 | 300 |

If using a different provider (Fastmail, Zoho, ProtonMail), use that provider's published MX values. The `dmarc@taxklaro.ph` mailbox must be created in whichever provider is used.

---

## 11. Staging Environment DNS

### 11.1 Staging Subdomain Architecture

| Subdomain | Purpose | Points To |
|-----------|---------|-----------|
| `staging.taxklaro.ph` | Staging frontend | Vercel `taxklaro-ph` project, `staging` branch deployment |
| `api.staging.taxklaro.ph` | Staging API | Fly.io app `taxklaro-api-staging` |

### 11.2 Staging Fly.io App Setup

The staging API runs as a separate Fly.io application (`taxklaro-api-staging`) in the same Fly.io organization as production.

```bash
# Create staging API app (run once)
flyctl apps create taxklaro-api-staging --org personal

# Deploy staging app from the same Docker image with staging env
flyctl deploy -a taxklaro-api-staging \
  --image registry.fly.io/taxklaro-api:staging-latest

# Add custom domain cert to staging API
flyctl certs add api.staging.taxklaro.ph -a taxklaro-api-staging
```

### 11.3 Staging Cookie Scope

The staging environment uses a separate cookie domain so staging sessions cannot leak into production:

| Environment | `SESSION_COOKIE_DOMAIN` |
|-------------|------------------------|
| Production | `.taxklaro.ph` |
| Staging | `staging.taxklaro.ph` |

The staging API's `SESSION_COOKIE_DOMAIN` is set to `staging.taxklaro.ph` (without leading dot), restricting the session cookie to only `staging.taxklaro.ph` — not readable by the production domain or other staging subdomains.

### 11.4 Staging Access Control

Staging is accessible to the public (no IP allowlist by default). To restrict staging to the development team:

Option A — Cloudflare Access (Zero Trust): In Cloudflare Dashboard → Zero Trust → Access → Applications → Add Application → Self-hosted → enter `staging.taxklaro.ph`. Create a policy allowing only email addresses in the operator's domain. This adds a Cloudflare Access JWKS validation step before requests reach Vercel.

Option B — Basic Auth at Vercel: Add middleware to the Next.js app that checks a `STAGING_BASIC_AUTH_TOKEN` environment variable and returns 401 with `WWW-Authenticate: Basic` for non-authenticated requests in the staging environment. Not implemented by default; add if needed.

---

## 12. Provisioning Runbook

Execute these steps in order when setting up DNS and domains for the first time on a new environment. All CLI commands assume `flyctl` and `wrangler` are installed and authenticated.

### Step 1: Register and Transfer Domain to Cloudflare

```bash
# Verify domain availability at registrar of choice
# Register taxklaro.ph at registrar (Namecheap, GoDaddy, or dotPH)
# In Cloudflare Dashboard → Add Site → enter taxklaro.ph → Select Pro plan
# Cloudflare provides two nameservers (e.g., abby.ns.cloudflare.com, hector.ns.cloudflare.com)
# Update nameservers at registrar to Cloudflare's provided nameservers
# Wait up to 24 hours for NS propagation (typically < 2 hours)
# Cloudflare sends email when zone is active
```

### Step 2: Configure Cloudflare Zone Settings

Navigate to each setting described in §1.3 and enable them in the Cloudflare dashboard. No CLI needed for zone settings.

### Step 3: Deploy Fly.io API Apps (Production and Staging)

```bash
# Deploy production API (creates app if not exists)
flyctl apps create taxklaro-api --org personal
flyctl deploy -a taxklaro-api

# Deploy staging API
flyctl apps create taxklaro-api-staging --org personal
flyctl deploy -a taxklaro-api-staging
```

### Step 4: Add DNS Records for API Subdomains

```bash
# Add custom domain certs on Fly.io
flyctl certs add api.taxklaro.ph -a taxklaro-api
flyctl certs add api.staging.taxklaro.ph -a taxklaro-api-staging

# Add CNAME records in Cloudflare DNS (API and staging API)
# Via Cloudflare API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"api","content":"taxklaro-api.fly.dev","ttl":1,"proxied":true}'

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"api.staging","content":"taxklaro-api-staging.fly.dev","ttl":1,"proxied":true}'
```

### Step 5: Deploy Frontend to Vercel and Register Custom Domains

```bash
# Link and deploy to Vercel
vercel --prod

# Add custom domains
vercel domains add taxklaro.ph --project taxklaro-ph
vercel domains add www.taxklaro.ph --project taxklaro-ph
vercel domains add staging.taxklaro.ph --project taxklaro-ph

# Add Vercel A and CNAME records in Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"@","content":"76.76.21.21","ttl":1,"proxied":true}'

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"AAAA","name":"@","content":"2606:4700:90:0:f22e:fbec:5bed:a9b9","ttl":1,"proxied":true}'

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"www","content":"cname.vercel-dns.com","ttl":1,"proxied":true}'

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"staging","content":"cname.vercel-dns.com","ttl":1,"proxied":true}'
```

### Step 6: Add Vercel Domain Verification TXT Record

After adding domains in Vercel (Step 5), Vercel displays a `_vercel` TXT record value. Add it:

```bash
# Replace VERCEL_VERIFICATION_TOKEN with the actual token shown in Vercel dashboard
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"TXT\",\"name\":\"_vercel\",\"content\":\"${VERCEL_VERIFICATION_TOKEN}\",\"ttl\":300,\"proxied\":false}"
```

### Step 7: Create R2 Bucket and Connect Custom Domain

```bash
# Create R2 bucket
wrangler r2 bucket create taxklaro-exports

# Set 30-day lifecycle rule
wrangler r2 bucket lifecycle add taxklaro-exports \
  --rule-name "delete-old-pdfs" \
  --prefix "" \
  --expiration-days 30
```

Then in Cloudflare Dashboard → R2 → taxklaro-exports → Settings → Custom Domains → Connect Domain → enter `exports.taxklaro.ph` → Save. Cloudflare auto-creates the DNS record.

### Step 8: Configure Email DNS Records

```bash
# Add SPF
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"TXT","name":"@","content":"v=spf1 include:amazonses.com ~all","ttl":300,"proxied":false}'

# Add DMARC
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"TXT","name":"_dmarc","content":"v=DMARC1; p=quarantine; rua=mailto:dmarc@taxklaro.ph; ruf=mailto:dmarc@taxklaro.ph; pct=100; adkim=s; aspf=s","ttl":300,"proxied":false}'

# Add fixed Resend DKIM key 1
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"resend._domainkey.mail","content":"resend._domainkey.resend.com","ttl":300,"proxied":false}'

# Add Resend DKIM key 2 (values from Resend dashboard — replace selector and target)
# Replace RESEND_DKIM_SELECTOR and RESEND_DKIM_TARGET with values from Resend dashboard
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"${RESEND_DKIM_SELECTOR}._domainkey.mail\",\"content\":\"${RESEND_DKIM_TARGET}\",\"ttl\":300,\"proxied\":false}"
```

### Step 9: Configure CAA Records

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CAA","name":"@","data":{"flags":0,"tag":"issue","value":"letsencrypt.org"},"ttl":3600,"proxied":false}'

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CAA","name":"@","data":{"flags":0,"tag":"issue","value":"digicert.com"},"ttl":3600,"proxied":false}'

curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"type":"CAA","name":"@","data":{"flags":0,"tag":"issuewild","value":"letsencrypt.org"},"ttl":3600,"proxied":false}'
```

### Step 10: Configure SSL/TLS Settings

In Cloudflare Dashboard → SSL/TLS:
1. Set encryption mode to **Full (strict)**
2. Enable Always Use HTTPS
3. Enable HSTS (max-age: 31536000, includeSubDomains: On, No-Sniff: On)
4. Set minimum TLS version to TLS 1.2
5. Enable TLS 1.3
6. Enable Automatic HTTPS Rewrites

### Step 11: Configure Cache Rules

Navigate to Caching → Cache Rules and create all 9 rules in the order specified in §5.1.

### Step 12: Configure WAF Rules

Navigate to Security → WAF and configure:
1. Enable Cloudflare Managed Ruleset (medium sensitivity)
2. Enable OWASP Core Ruleset (PL2, score threshold 60)
3. Enable Exposed Credentials Check
4. Create custom rate limiting rules 1–7 (§6.2)
5. Create custom security rules 8–9 (§6.3)

### Step 13: Configure Security Settings

Navigate to Security → Settings and apply all settings in §7.

### Step 14: Set Up Google Search Console

1. Go to Google Search Console → Add Property → Domain property → enter `taxklaro.ph`
2. Select DNS verification method
3. Copy the `google-site-verification=...` TXT value
4. Add to Cloudflare DNS:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"TXT\",\"name\":\"@\",\"content\":\"${GOOGLE_SITE_VERIFICATION_TOKEN}\",\"ttl\":300,\"proxied\":false}"
```

5. Click Verify in Search Console
6. Wait up to 24 hours for verification (typically < 1 hour)

---

## 13. Verification Commands

Run these commands after initial DNS provisioning to confirm all records are correct and services are accessible.

### 13.1 DNS Record Verification

```bash
# Install dig if not present: apt-get install dnsutils / brew install bind

# Verify root domain A record
dig +short A taxklaro.ph
# Expected output: 104.21.xxx.xxx and 172.67.xxx.xxx (Cloudflare anycast IPs — not 76.76.21.21 because Cloudflare proxies)

# Verify root domain AAAA record
dig +short AAAA taxklaro.ph
# Expected: Cloudflare IPv6 anycast addresses

# Verify API CNAME (before Cloudflare proxy resolution)
dig +short CNAME api.taxklaro.ph
# Expected: blank (CNAME is flattened by Cloudflare)
# Or use Cloudflare bypass:
dig +short A api.taxklaro.ph @1.1.1.1
# Expected: Cloudflare anycast IPs (proxied)

# Verify staging CNAME
dig +short A staging.taxklaro.ph
# Expected: Cloudflare anycast IPs

# Verify SPF
dig +short TXT taxklaro.ph | grep spf
# Expected: "v=spf1 include:amazonses.com ~all"

# Verify DMARC
dig +short TXT _dmarc.taxklaro.ph
# Expected: "v=DMARC1; p=quarantine; rua=mailto:dmarc@taxklaro.ph; ..."

# Verify Resend DKIM
dig +short CNAME resend._domainkey.mail.taxklaro.ph
# Expected: resend._domainkey.resend.com
```

### 13.2 HTTPS Endpoint Verification

```bash
# Frontend
curl -I https://taxklaro.ph/
# Expected: HTTP/2 200, X-Frame-Options: DENY, Strict-Transport-Security present

# www redirect
curl -I https://www.taxklaro.ph/
# Expected: HTTP/2 301 → https://taxklaro.ph/ (Vercel handles this redirect)

# API health check
curl -s https://api.taxklaro.ph/v1/health/live | jq .
# Expected: {"status":"alive","timestamp":"..."}

# Staging frontend
curl -I https://staging.taxklaro.ph/
# Expected: HTTP/2 200

# Staging API health check
curl -s https://api.staging.taxklaro.ph/v1/health/live | jq .
# Expected: {"status":"alive","timestamp":"..."}
```

### 13.3 TLS Certificate Verification

```bash
# Verify production cert (Cloudflare edge cert — DigiCert)
echo | openssl s_client -connect taxklaro.ph:443 -servername taxklaro.ph 2>/dev/null | \
  openssl x509 -noout -subject -issuer -dates
# Expected subject: CN=taxklaro.ph, issuer: DigiCert (Cloudflare issues DigiCert edge certs)

# Verify API origin cert (Let's Encrypt via Fly.io)
# Must bypass Cloudflare to hit origin directly
# (Only possible from Fly.io internal network or by temporarily disabling proxy)
flyctl ssh console -a taxklaro-api
# Inside: curl -I https://api.taxklaro.ph/v1/health/live
# Or check via flyctl:
flyctl certs show api.taxklaro.ph -a taxklaro-api
# Expected: Issued=true, Certificate Authority=Let's Encrypt, Expires >60 days from now
```

### 13.4 WAF Verification

```bash
# Test that XSS attempts are blocked
curl -I "https://api.taxklaro.ph/v1/compute?q=<script>alert(1)</script>"
# Expected: HTTP/2 403 (OWASP ruleset blocks this)

# Test that rate limiting works on auth endpoint (requires >10 rapid requests)
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.taxklaro.ph/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
done
# Expected: First 10 responses 401 (wrong password), request 11+ returns 429 or challenge
```

### 13.5 Email Authentication Verification

```bash
# Check DMARC aggregate reports (after first email sent)
# Reports arrive daily to dmarc@taxklaro.ph from major providers (Google, Microsoft, Yahoo)
# Use dmarcian.com or MXToolbox DMARC checker to parse reports

# Test Resend domain verification
# In Resend Dashboard → Settings → Domains → mail.taxklaro.ph → status should show "Verified"

# Send test email via Resend API
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer ${RESEND_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "TaxKlaro <noreply@mail.taxklaro.ph>",
    "to": ["operator-test-inbox@gmail.com"],
    "subject": "Email DNS verification test",
    "text": "This is a test email to verify SPF/DKIM/DMARC configuration."
  }'
# Expected: {"id":"msg_AbCdEfGhIjKl1234"} response (id is a Resend-assigned string); email arrives in inbox (not spam)
# Check email headers: Authentication-Results should show spf=pass, dkim=pass, dmarc=pass
```

---

## 14. Maintenance Procedures

### 14.1 DNS Change Propagation

After modifying any DNS record in Cloudflare, propagation is near-instant within Cloudflare's own resolver (1.1.1.1). For other resolvers:

| Resolver Type | Propagation Time |
|--------------|-----------------|
| Cloudflare (1.1.1.1) | < 1 second (Cloudflare controls the zone) |
| Google (8.8.8.8) | 1–5 minutes |
| ISP resolvers globally | Up to 5 minutes (Cloudflare TTLs are low — 300s for most records) |
| Maximum full propagation | 24 hours (rare — only for ISPs ignoring short TTLs) |

To verify propagation at multiple nameservers:
```bash
# Check from multiple global resolvers
dig +short A taxklaro.ph @8.8.8.8       # Google
dig +short A taxklaro.ph @1.1.1.1       # Cloudflare
dig +short A taxklaro.ph @208.67.222.222 # OpenDNS
dig +short A taxklaro.ph @9.9.9.9       # Quad9
```

### 14.2 Cloudflare Cache Invalidation

After content updates that must be immediately visible:

```bash
# Purge specific pages (preferred — targeted, minimal origin load)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://taxklaro.ph/"]}'

# Purge all blog posts (after CMS update)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"tags":["blog"]}'

# Full purge (use only when absolutely necessary — 10-minute origin spike)
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

For Cloudflare Cache Tags to work (`tags` purge), the API server must include `Cache-Tag: blog` headers on blog page responses. Add this to the Next.js ISR configuration for `/blog/*` pages.

### 14.3 WAF Rule Updates

WAF rules may need updating when:
- New attack patterns emerge (Cloudflare pushes Managed Ruleset updates automatically)
- False positives block legitimate users (check Security → Events for 403s on valid user-agents)
- Rate limits need adjustment after traffic growth analysis

To update a rate limiting rule:
1. Navigate to Security → WAF → Rate limiting rules
2. Click the rule name → Edit
3. Modify the threshold or window
4. Save — changes apply immediately, no deployment required

### 14.4 Fly.io Certificate Renewal Monitoring

Check certificate status monthly:

```bash
flyctl certs list -a taxklaro-api
# Output columns: Hostname, Issued, Expiration, Issue method
# Alert if any cert shows Expiration < 30 days from today

flyctl certs list -a taxklaro-api-staging
```

Fly.io's ACME client renews Let's Encrypt certs automatically ~30 days before expiry. If a renewal fails:

```bash
# Force re-issuance
flyctl certs remove api.taxklaro.ph -a taxklaro-api
flyctl certs add api.taxklaro.ph -a taxklaro-api
# Poll until Issued=true
watch -n 30 "flyctl certs show api.taxklaro.ph -a taxklaro-api"
```

### 14.5 Adding a New Subdomain

When a new subdomain is needed (e.g., `status.taxklaro.ph` for a status page):

1. Determine the origin service (Cloudflare Pages, external service, Fly.io app)
2. Deploy origin service and get its target hostname
3. Add DNS record in Cloudflare (CNAME or A, proxied if HTTP service)
4. Add custom domain to origin service (Vercel: `vercel domains add`; Fly.io: `flyctl certs add`)
5. Verify domain in origin service dashboard
6. Add appropriate Cache Rules and WAF rules for the new subdomain
7. Update this document with the new subdomain in §2 and §3

### 14.6 Domain Renewal

`.ph` domain registration must be renewed annually. Renewal procedures:

1. At registrar: ensure auto-renewal is enabled and payment method is current
2. Set calendar reminder 60 days before expiry date
3. Verify renewal 30 days before expiry
4. If domain transfer is needed: initiate EPP auth code transfer minimum 30 days before expiry
5. After renewal, verify nameservers remain pointed to Cloudflare (registrar renewals sometimes reset NS records — confirm with `dig NS taxklaro.ph`)

### 14.7 Cloudflare API Token Rotation

The `CLOUDFLARE_API_TOKEN` used in CI/CD (see ci-cd.md) should be rotated every 180 days:

```bash
# Create new token in Cloudflare Dashboard → Profile → API Tokens → Create Token
# Required permissions: Zone:DNS:Edit for zone taxklaro.ph
# Copy new token value

# Update GitHub Actions secret
gh secret set CLOUDFLARE_API_TOKEN --body "new-token-value"

# Revoke old token in Cloudflare Dashboard → Profile → API Tokens → old token → Revoke
```

# Privacy Policy — TaxKlaro

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Effective Date:** March 1, 2026
**Cross-references:**
- Terms of Service: [legal/terms-of-service.md](terms-of-service.md)
- Disclaimer text: [legal/disclaimers.md](disclaimers.md)
- Database schema (data stored): [database/schema.md](../database/schema.md)
- Data retention policy: [database/retention.md](../database/retention.md)
- Deployment (infrastructure / data residency): [deployment/infrastructure.md](../deployment/infrastructure.md)
- Frontend cookie notice copy: [frontend/copy.md §15.3](../frontend/copy.md)
- Email disclaimer footer: [legal/disclaimers.md §8](disclaimers.md)

---

## Purpose of This Document

This file contains the **complete, verbatim Privacy Policy** for TaxKlaro (taxklaro.ph). The forward loop implementing TaxKlaro must render this text at the URL `https://taxklaro.ph/privacy`. No paraphrasing, no rewording, no "add appropriate clause here." Every section below is final and complete.

---

# TaxKlaro Privacy Policy

**Effective Date: March 1, 2026**

TaxKlaro ("TaxKlaro," "we," "us," or "our") operates taxklaro.ph (the "Platform"). This Privacy Policy explains what personal information we collect, how we use and protect it, and what rights you have under the Republic Act No. 10173 (Data Privacy Act of 2012, "DPA") and its Implementing Rules and Regulations.

By using the Platform, you acknowledge that you have read and understood this Privacy Policy. If you do not agree to this Privacy Policy, do not use the Platform.

---

## 1. Personal Information Controller

TaxKlaro is the **Personal Information Controller** (as defined by the DPA) for personal data collected through the Platform.

**Contact for privacy matters:**
- Email: privacy@taxklaro.ph
- Website: taxklaro.ph/privacy-request

TaxKlaro has designated a Data Protection Officer (DPO) responsible for overseeing compliance with the DPA. You may contact the DPO at: dpo@taxklaro.ph.

TaxKlaro's Platform is operated from the Republic of the Philippines. All data processing described in this Policy is carried out in the Philippines and in cloud infrastructure with data centers in Singapore (Fly.io SIN region) and the United States (Cloudflare CDN edge nodes). See Section 8 for cross-border transfer details.

---

## 2. What Personal Information We Collect

We collect the following categories of personal information:

### 2.1 Account Registration Data

Collected when you create an Account:

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Email address | String | Yes | Account identification, login, transactional email |
| Password (hashed) | BLAKE2b-256 hash | Yes (unless OAuth) | Authentication — raw password never stored |
| Full name | String | No (optional) | Display on dashboard and PDF exports |
| User role | Enum: TAXPAYER / CPA / ADMIN | Yes (default: TAXPAYER) | Feature gating and access control |
| Google OAuth subject ID | String | Yes (if Google login) | Links Google account to TaxKlaro account |
| Email verification status | Boolean | Yes | Unlock verified-account features |
| Account created timestamp | UTC timestamp | Yes | Audit trail |
| Last login timestamp | UTC timestamp | Yes | Security monitoring |

### 2.2 Tax Computation Input Data

Collected when you perform a Computation (saved to Account for registered users; held in session only for anonymous users):

| Field | Type | Purpose |
|-------|------|---------|
| Tax year | Integer (e.g., 2025) | Determine applicable rate tables |
| Gross receipts / gross sales | Decimal (₱) | Core tax computation input |
| Business type | Enum: SERVICE / TRADING / MIXED | Regime eligibility |
| Income type | Enum: SELF_EMPLOYMENT / PROFESSIONAL / SOLE_PROPRIETOR | Form selection |
| Business expenses (itemized) | JSON array of expense categories with amounts | Path A computation |
| Prior year tax regime | Enum: PATH_A / PATH_B / PATH_C / UNKNOWN | Regime change warning logic |
| CWT entries from Form 2307 | JSON array with payor name, ATC code, amount | Tax credit offset |
| Quarterly payment amounts | JSON array of Q1/Q2/Q3 amounts | Annual reconciliation |
| Compensation income (mixed income users) | Decimal (₱) | Mixed income computation |
| Tax withheld on compensation (Form 2316) | Decimal (₱) | Annual reconciliation |
| Has employees flag | Boolean | Employer expense deductibility |
| VAT registration status | Boolean | Regime eligibility and PT computation |
| Is first year taxpayer | Boolean | Eligibility rules |

**Important:** TaxKlaro does NOT collect your Tax Identification Number (TIN), BIR-registered trade name, actual bank account details, or official receipts. The income figures and deductions you enter are self-reported and not cross-referenced with BIR records.

### 2.3 Subscription and Billing Data

Collected when you subscribe to Pro or Enterprise:

| Field | Type | Stored By | Purpose |
|-------|------|-----------|---------|
| Subscription plan | Enum: FREE / PRO / ENTERPRISE | TaxKlaro DB | Feature gating |
| Subscription start date | UTC timestamp | TaxKlaro DB | Billing cycle computation |
| Subscription end date | UTC timestamp | TaxKlaro DB | Renewal and lapse logic |
| Billing cycle | Enum: MONTHLY / ANNUAL | TaxKlaro DB | Invoice generation |
| PayMongo customer ID | String | TaxKlaro DB | Links Account to payment processor |
| PayMongo payment intent ID | String | TaxKlaro DB | Refund processing |
| Last 4 digits of card | String (4 digits only) | TaxKlaro DB (via PayMongo) | Display on billing page |
| Card brand | String (e.g., "Visa") | TaxKlaro DB (via PayMongo) | Display on billing page |
| Full card number | Not collected | Stored by PayMongo only | Payment processing |
| Invoice amount | Decimal (₱, in centavos as integer) | TaxKlaro DB | Billing records |
| Invoice status | Enum: PENDING / PAID / FAILED / REFUNDED | TaxKlaro DB | Account status |

TaxKlaro does NOT store full card numbers, CVV codes, or complete bank account numbers. Payment instrument data is stored by PayMongo in PCI DSS-compliant infrastructure.

### 2.4 CPA Client Data (Enterprise CPA Users Only)

When a CPA user creates client profiles:

| Field | Type | Purpose |
|-------|------|---------|
| Client name | String | Identify client in CPA dashboard |
| Client email | String (optional) | Optional — CPA may add for their own records |
| Client TIN | String (optional) | Optional — CPA may add for their own records |
| Client computations | Linked to computation records | Per-client computation history |

Client data entered by a CPA is owned by the CPA user. TaxKlaro processes this data on behalf of the CPA as a **Personal Information Processor** under the DPA. The CPA, as the Personal Information Controller for their client data, is responsible for obtaining necessary consent from their clients to use TaxKlaro for their computations.

### 2.5 Technical and Usage Data

Collected automatically when you use the Platform:

| Data Point | Collected Via | Purpose |
|-----------|--------------|---------|
| IP address | Server logs | Rate limiting, fraud prevention, security |
| Browser type and version | User-Agent header | Error logging, compatibility |
| Operating system | User-Agent header | Error logging, compatibility |
| Referring URL | HTTP Referer header | Analytics, marketing attribution |
| Pages visited and time spent | Google Analytics (anonymized) | Product analytics |
| Computation features used | Application event logging | Product improvement |
| Error events | Sentry (sanitized — no PII in error reports) | Bug fixing |
| Session ID | Cookie / localStorage | Maintain login session |
| Geographic region (country/region level) | Google Analytics | Analytics — not city or street level |

**IP address handling:** Raw IP addresses are stored in server logs for up to 7 days for security purposes, then deleted. Hashed IP addresses (SHA-256, one-way) are stored in the `disclaimer_acceptances` table for legal compliance (documenting implied consent to disclaimers) for 3 years. Full raw IP addresses are never stored in the application database beyond the 7-day server log window.

### 2.6 Cookies and Local Storage

| Name | Type | Duration | Purpose |
|------|------|----------|---------|
| `tk_session` | HttpOnly Secure cookie | 30 days (refreshed on activity) | Authentication session token (stores session ID, not credentials) |
| `tk_csrf` | Cookie | Session | CSRF protection token |
| `tk_prefs` | localStorage | Permanent until cleared | User UI preferences (dark mode, wizard step progress) |
| `tk_anon_comp` | localStorage | 24 hours | Anonymous computation data (so user doesn't lose work if they leave) |
| `_ga` | Cookie (Google Analytics) | 2 years | Google Analytics user identifier |
| `_ga_*` | Cookie (Google Analytics) | 2 years | Google Analytics session identifier |
| `__cf_bm` | Cookie (Cloudflare) | 30 minutes | Cloudflare bot management |
| `_cfuvid` | Cookie (Cloudflare) | Session | Cloudflare rate limiting |

---

## 3. How We Use Personal Information

We use personal information for the following purposes, each with its legal basis under the DPA:

### 3.1 Service Provision (Legal Basis: Contractual Necessity, DPA Sec. 12[b])

- Process and display tax computation results
- Save and retrieve computation history for registered users
- Generate and deliver PDF exports
- Provide quarterly tax tracking and deadline reminders
- Authenticate your identity and maintain your Account session
- Process subscription payments and issue invoices
- Provide CPA client management features

### 3.2 Legal Compliance (Legal Basis: Legal Obligation, DPA Sec. 12[c])

- Maintain audit logs of computations for compliance with BIR record-keeping requirements
- Retain disclaimer acceptance records as documentation of users' acknowledgment of non-professional-advice status
- Comply with orders from the National Privacy Commission, BIR, or other Philippine government authorities
- Investigate and respond to fraud or abuse reports

### 3.3 Legitimate Business Interests (Legal Basis: Legitimate Interests, DPA Sec. 12[f])

- Send transactional emails: welcome email, computation saved confirmation, deadline reminders, invoice receipts, password reset
- Monitor for security threats, unauthorized access, and abuse of the Platform
- Debug errors and improve Platform reliability
- Analyze anonymized usage patterns to improve the product

### 3.4 Marketing Communications (Legal Basis: Consent, DPA Sec. 12[a])

- Send newsletter and product update emails, if you have opted in
- Retargeting advertising on Facebook/Meta and Google, using anonymized identifiers (not your email), if you have consented via the cookie preference center
- **Opt-in only.** We do NOT send marketing emails without explicit opt-in. You may withdraw consent at any time via the Unsubscribe link in any email or through Account > Notifications settings.

---

## 4. Legal Basis for Processing (Summary)

| Processing Activity | DPA Legal Basis | Section |
|--------------------|----------------|---------|
| Account registration and authentication | Contractual necessity (Sec. 12[b]) | 3.1 |
| Tax computation processing | Contractual necessity (Sec. 12[b]) | 3.1 |
| Subscription billing and payment processing | Contractual necessity (Sec. 12[b]) | 3.1 |
| Computation saving and history | Contractual necessity (Sec. 12[b]) | 3.1 |
| PDF generation and export | Contractual necessity (Sec. 12[b]) | 3.1 |
| Audit logs and disclaimer records | Legal obligation (Sec. 12[c]) | 3.2 |
| Government authority compliance | Legal obligation (Sec. 12[c]) | 3.2 |
| Security monitoring and fraud prevention | Legitimate interests (Sec. 12[f]) | 3.3 |
| Error logging and product analytics | Legitimate interests (Sec. 12[f]) | 3.3 |
| Transactional emails | Legitimate interests (Sec. 12[f]) | 3.3 |
| Marketing emails (newsletter) | Consent (Sec. 12[a]) | 3.4 |
| Behavioral advertising cookies | Consent (Sec. 12[a]) | 3.4 |
| CPA client data (on behalf of CPA) | Processing under instructions of controller (Sec. 16[a]) | 2.4 |

---

## 5. Data Retention

We retain personal information only as long as necessary for the purposes for which it was collected, subject to the following schedules:

### 5.1 Account Data

| Data Category | Retention Period | Trigger |
|--------------|----------------|---------|
| Active Account (email, name, role, subscription status) | Lifetime of Account | Deleted upon account deletion request + 90-day grace |
| Password hash | Lifetime of Account | Rotated on password change; deleted with account |
| Google OAuth link | Lifetime of Account | Deleted with account |
| Email verification tokens | 72 hours from generation | Deleted on expiry regardless of use |
| Password reset tokens | 1 hour from generation | Deleted on expiry regardless of use |

### 5.2 Computation Data

| Data Category | Retention Period | Notes |
|--------------|----------------|-------|
| Saved computations (registered users) | Lifetime of Account + 90-day grace | Free tier: oldest computations over 10/month marker are soft-deleted after 30 days |
| Anonymous computation data | 24 hours | Stored in browser localStorage only; no server-side storage for anonymous users |
| Computation audit logs | 3 years from computation date | Retained for legal compliance even after Account deletion |

### 5.3 Post-Deletion Grace Period

When an Account is deleted (by user request or by TaxKlaro for ToS violations):
- **Day 0:** Account access revoked immediately; subscription cancelled
- **Days 1–90:** Personal data retained in a "deleted" state; not accessible through the Platform but accessible to TaxKlaro for legal compliance purposes
- **Day 91:** Personal data (email, name, OAuth links, computation inputs, computation outputs) purged from the production database
- **Days 91–365:** Anonymized computation data (regime used, gross receipts bracket, recommended regime, year — no PII) retained for aggregate product analytics
- **Day 366+:** No PII retained. Audit log records (stripped of email/name, retaining only user_id hash, computation parameters, and timestamps) retained for the full 3-year legal compliance window

### 5.4 Billing Data

| Data Category | Retention Period | Legal Basis |
|--------------|----------------|-------------|
| Invoice records (amount, date, status) | 10 years | NIRC Sec. 235 (5-year books of account) + 3-year safety margin |
| PayMongo transaction IDs | 10 years | Tax record-keeping |
| Card last 4 digits and brand | Duration of subscription + 2 years | Chargeback dispute resolution window |

### 5.5 Technical Logs

| Data Category | Retention Period |
|--------------|----------------|
| Raw server access logs (with raw IP) | 7 days |
| Application error logs (Sentry, sanitized) | 90 days |
| Rate limit state (Redis/Upstash) | 1 hour (token bucket TTL) |
| Hashed IP in disclaimer_acceptances | 3 years |
| Security event logs (failed logins, suspicious activity) | 1 year |

---

## 6. Data Sharing

We share personal information only in the following circumstances:

### 6.1 Service Providers (Personal Information Processors)

We engage the following third-party service providers who process personal data on our behalf under data processing agreements that require them to protect your data:

| Provider | Data Shared | Purpose | Location |
|---------|-------------|---------|---------|
| PayMongo (paymongo.com) | Email, subscription plan, payment instrument | Subscription billing and payment processing | Philippines |
| Fly.io | All application data in transit and at rest | Application hosting (compute and database) | Singapore (SIN region) |
| Cloudflare | IP address, request metadata, page content (encrypted) | CDN, DDoS protection, WAF | USA (edge nodes worldwide) |
| Upstash | Session tokens (hashed), rate limit counters | Redis-compatible caching | USA (Upstash serverless Redis) |
| Resend (resend.com) | Email address, email body content | Transactional email delivery | USA |
| Sentry (sentry.io) | Error stack traces, browser/OS info (no PII in error reports — inputs are excluded from Sentry payloads via scrubbing rules) | Application error monitoring | USA |
| Google (Google Analytics) | Anonymized usage events, page URLs, browser info (no email, no computation inputs) | Product analytics | USA |
| Google (Google OAuth) | Email address, Google account ID | Authentication (only when user chooses Google login) | USA |

### 6.2 No Sale of Personal Data

TaxKlaro does NOT sell, rent, or trade your personal information to any third party for their own marketing or commercial purposes. Aggregated, anonymized statistics (e.g., "37% of TaxKlaro users qualify for the 8% option") may be published publicly without any identifying information.

### 6.3 Legal Disclosure

We may disclose personal information if required by law, court order, or government authority, including:
- Orders from the Bureau of Internal Revenue (BIR) pursuant to NIRC Sec. 5 (authority to obtain information)
- Orders from the National Privacy Commission (NPC) pursuant to the DPA
- Court orders from Philippine courts
- Law enforcement requests with proper legal process

When we receive such requests, we will: (a) notify the affected user if permitted by law; (b) provide only the minimum information required; (c) challenge overly broad requests through appropriate legal channels.

### 6.4 Business Transfer

If TaxKlaro is acquired by or merged with another company, or if all or substantially all of TaxKlaro's assets are transferred to another entity, your personal information may be transferred as part of that transaction. We will notify you via email and Platform notice at least 30 days before any such transfer. The acquiring entity must agree to honor this Privacy Policy or provide substantially equivalent protection.

---

## 7. Data Security

We implement the following technical and organizational security measures to protect your personal information:

### 7.1 Encryption

| Data State | Encryption Method |
|-----------|-----------------|
| Data in transit | TLS 1.3 (enforced by Cloudflare; HTTP to HTTPS redirect at DNS level) |
| Data at rest (Fly.io database) | AES-256 encryption at storage volume level (Fly.io managed volumes) |
| Session tokens | Stored as BLAKE2b-256 hashes; raw tokens never stored server-side |
| Password | Stored as Argon2id hash (memory: 64MB, iterations: 3, parallelism: 1); raw passwords never stored |
| API keys | Stored as BLAKE2b-256 hashes; raw key shown once at creation, never again |
| Password reset tokens | Stored as BLAKE2b-256 hashes; single-use; 1-hour expiry |

### 7.2 Access Controls

- Database access: restricted to Fly.io application process via internal network; no direct public internet access
- Admin dashboard: requires ADMIN role, separate authentication challenge, accessible from whitelisted IP addresses only
- Employee access: TaxKlaro staff access to production data is logged and requires approval; minimum necessary access principle
- Third-party access: no third party has direct database access; data is shared only via API calls from application code

### 7.3 Vulnerability Management

- Automated dependency vulnerability scanning via GitHub Dependabot (weekly)
- Application firewall and DDoS protection via Cloudflare
- Rate limiting on all API endpoints (see `api/rate-limiting.md`)
- OWASP Top 10 mitigations implemented: SQL injection (parameterized queries only), XSS (CSP headers, input sanitization), CSRF (double-submit cookie token), clickjacking (X-Frame-Options: DENY), etc.
- Security headers enforced: Content-Security-Policy, X-Content-Type-Options: nosniff, Strict-Transport-Security (HSTS, max-age 31536000)

### 7.4 Incident Response

In the event of a personal data breach, TaxKlaro will:

1. Contain the breach within 24 hours of discovery
2. Notify affected users within 72 hours via email if the breach is likely to result in risk to user rights
3. Report to the National Privacy Commission (NPC) within 72 hours if the breach involves sensitive personal information (DPA Sec. 20[f] and NPC Circular 16-03)
4. Provide a full incident report to affected users and the NPC within 5 days of breach discovery
5. Implement remediation measures and publish a post-incident summary

---

## 8. Cross-Border Data Transfers

TaxKlaro is a Philippine business and your data is primarily processed in the Philippines and Singapore (Fly.io SIN region). Some data is processed in the United States by:
- Cloudflare (CDN edge nodes globally, including USA)
- Upstash (Redis, USA)
- Resend (email delivery, USA)
- Sentry (error monitoring, USA)
- Google Analytics (analytics, USA)
- Google OAuth (authentication, USA)

These cross-border transfers comply with NPC Circular 2023-04 (Rules and Regulations on Cross-Border Transfer of Personal Data) through the following safeguards:

- **Standard contractual clauses (SCCs):** Data processing agreements with USA-based providers contain SCCs consistent with NPC requirements
- **Adequacy determinations:** Transfers to providers operating under US frameworks (Google, Cloudflare) are made under NPC-recognized adequacy principles
- **Encryption in transit:** All data transferred to third-party providers is encrypted via TLS 1.3
- **Data minimization:** Only the minimum data necessary for each provider's function is shared (e.g., Sentry receives error logs with computation inputs scrubbed; Resend receives email address and email body but not computation data)

**Computation data is NOT shared with any USA-based provider.** Income figures, expense amounts, and tax computation outputs are processed and stored exclusively in TaxKlaro's Fly.io SIN (Singapore) infrastructure and are not transmitted to USA servers. Google Analytics and Sentry are configured with data scrubbing rules that exclude computation inputs and outputs.

---

## 9. Your Rights Under the Data Privacy Act

Under Republic Act No. 10173 (Data Privacy Act of 2012) and its Implementing Rules, you have the following rights:

### 9.1 Right to Be Informed (DPA Sec. 16[a])

You have the right to be informed that your personal data is being processed. This Privacy Policy fulfills that obligation. If we materially change how we process your data, we will notify you as described in Section 12.

### 9.2 Right to Access (DPA Sec. 16[b])

You have the right to request a copy of the personal information we hold about you. To exercise this right:
1. Log in to your Account and go to Account > Privacy > Download My Data
2. We will prepare a downloadable JSON export of all personal data associated with your Account within 30 days
3. The export includes: account registration data, all saved computations (inputs and outputs), subscription history, and CWT entries
4. For users without an Account, submit a request to privacy@taxklaro.ph from the email address used for anonymous computations (if any)

### 9.3 Right to Rectification (DPA Sec. 16[c])

You have the right to correct inaccurate or incomplete personal information. To exercise this right:
- **Name:** Update directly in Account > Settings
- **Email:** Update in Account > Settings (requires re-verification of new email)
- **Computation data:** Saved computations cannot be edited after saving (to preserve audit trail integrity); create a new computation with corrected inputs
- **Billing information:** Update payment method in Account > Billing; invoice records cannot be altered (legal record-keeping requirement)

### 9.4 Right to Erasure / Blocking (DPA Sec. 16[d])

You have the right to request the deletion or blocking of personal information that is incomplete, outdated, false, unlawfully obtained, or no longer necessary. To exercise this right:
- **Account deletion:** Go to Account > Settings > Delete Account, or email privacy@taxklaro.ph
- **Selective deletion:** Request deletion of specific computation records at privacy@taxklaro.ph
- **Exceptions:** We cannot delete data where retention is required by law (see Section 5 — billing records retained 10 years, audit logs retained 3 years) or where ongoing legal proceedings require preservation

### 9.5 Right to Object (DPA Sec. 16[e])

You have the right to object to the processing of your personal information for purposes other than contractual necessity and legal obligation. You may:
- Opt out of marketing emails at any time via the Unsubscribe link or Account > Notifications
- Opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on (tools.google.com/dlpage/gaoptout) or enabling Do Not Track in your browser
- Object to analytics cookie usage via the cookie preference center (accessible via the cookie banner or Account > Privacy > Cookie Preferences)

### 9.6 Right to Data Portability (DPA Sec. 18)

You have the right to receive your personal data in a structured, commonly used, machine-readable format. TaxKlaro's "Download My Data" feature (Account > Privacy) exports all personal and computation data as JSON, which is machine-readable and can be imported into compatible tools. The export format is described at taxklaro.ph/docs/data-export-format.

### 9.7 Right to Damages (DPA Sec. 16[f])

You have the right to receive compensation if you suffer damages due to a violation of your data privacy rights. To file a claim for damages, contact TaxKlaro at privacy@taxklaro.ph or file a complaint with the NPC as described in Section 9.8.

### 9.8 Right to File a Complaint with the NPC

If you believe TaxKlaro has violated your data privacy rights, you may file a complaint with the National Privacy Commission:

- **NPC website:** privacy.gov.ph
- **NPC email:** complaints@privacy.gov.ph
- **NPC address:** 5th Floor, Delegation Building, PICC Complex, Roxas Boulevard, Pasay City 1307, Metro Manila, Philippines
- **NPC hotline:** +63 (2) 8234-2228

TaxKlaro requests that you first contact us at privacy@taxklaro.ph so we can attempt to resolve the matter before escalating to the NPC, but you are free to contact the NPC directly at any time.

### 9.9 How to Exercise Your Rights

Submit a privacy rights request to privacy@taxklaro.ph with:
- Subject line: "Privacy Rights Request — [type of request]"
- Your Account email address (or the email you used for anonymous computations, if any)
- Description of the right you wish to exercise
- Supporting information if applicable (e.g., specific computation IDs for deletion requests)

We will acknowledge your request within 3 business days and fulfill it within 30 calendar days. Complex requests may require additional time (up to 45 calendar days); we will notify you if an extension is needed.

Identity verification: Before processing access or deletion requests, we will verify your identity by sending a confirmation link to your Account email address.

---

## 10. Children's Privacy

The Platform is not directed to children under the age of 18. We do not knowingly collect personal information from persons under 18 years old. If you are under 18, do not use the Platform or submit any personal information.

If TaxKlaro discovers that it has collected personal information from a person under 18 without parental consent, we will: (a) delete the information from our servers; (b) terminate the associated Account; (c) refund any subscription payments made. If you believe a child has provided us with their personal information, please contact us at privacy@taxklaro.ph.

---

## 11. Sensitive Personal Information

TaxKlaro does not intentionally collect sensitive personal information as defined by the DPA (Sec. 3[l]), including race, ethnic origin, political or philosophical beliefs, religious beliefs, health or medical information, genetic or biometric data, criminal records, or government-issued IDs.

**Tax information note:** Income figures and tax computation data are not classified as "sensitive personal information" under the DPA. However, TaxKlaro treats financial data with the highest standard of care and applies the security measures described in Section 7 to all computation data.

**TIN (Tax Identification Number):** TaxKlaro does NOT collect your TIN. You are not required to enter your TIN to use TaxKlaro. If you voluntarily include your TIN in a free-text field (e.g., a computation name or note), it is stored as entered but is not used or processed by the engine.

---

## 12. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect:
- Changes in Philippine law or NPC regulations
- Changes in our data processing practices
- New third-party service providers
- New product features that involve data processing

**For material changes** (changes that significantly affect how we use your personal data or reduce your rights):
- We will send an email notification to your Account email address at least 30 days before the change takes effect
- We will display a prominent notice on the Platform for 30 days
- We will update the Effective Date at the top of this page

**For non-material changes** (formatting, clarifications, minor corrections):
- We will update the Effective Date
- No prior notification required

If you do not agree to the updated Privacy Policy, you may close your Account as described in the Terms of Service. Continued use of the Platform after the effective date of any update constitutes acceptance of the updated Privacy Policy.

---

## 13. Contact Information

For any questions, concerns, or requests related to this Privacy Policy:

- **Data Protection Officer:** dpo@taxklaro.ph
- **Privacy rights requests:** privacy@taxklaro.ph
- **General privacy inquiries:** privacy@taxklaro.ph
- **Privacy request form:** taxklaro.ph/privacy-request
- **National Privacy Commission:** privacy.gov.ph

We aim to respond to all privacy inquiries within 3 business days.

---

## 14. Privacy Policy Version History

| Version | Effective Date | Summary of Changes |
|---------|---------------|-------------------|
| 1.0 | 2026-03-01 | Initial Privacy Policy — product launch |

---

*© 2026 TaxKlaro. All rights reserved.*

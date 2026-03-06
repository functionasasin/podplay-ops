# Database Migrations — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**ORM:** Drizzle ORM v0.38
**Database engine:** PostgreSQL 16
**Cross-references:**
- Full schema DDL: [database/schema.md](schema.md)
- Index rationale: [database/indexes.md](indexes.md)
- Data retention policy: [database/retention.md](retention.md)
- Webhook table DDL source: [api/webhooks.md](../api/webhooks.md)
- Auth environment variables: [api/auth.md](../api/auth.md)
- Deployment environment variables: [deployment/environment.md](../deployment/environment.md)

---

## Table of Contents

1. [Naming Convention](#1-naming-convention)
2. [Directory Structure](#2-directory-structure)
3. [Drizzle Configuration File](#3-drizzle-configuration-file)
4. [Migration File Inventory](#4-migration-file-inventory)
5. [Migration 0001 — Initial Schema](#5-migration-0001--initial-schema)
6. [Migration 0002 — Webhook Tables](#6-migration-0002--webhook-tables)
7. [Migration 0003 — Initial Indexes](#7-migration-0003--initial-indexes)
8. [Seed Script — scripts/seed.ts](#8-seed-script--scriptsseedts)
9. [How to Run](#9-how-to-run)
10. [Rollback Strategy](#10-rollback-strategy)
11. [Future Migration Rules](#11-future-migration-rules)
12. [Journal File Format](#12-journal-file-format)

---

## 1. Naming Convention

### 1.1 Migration File Name Format

```
{NNNN}_{snake_case_description}.sql
```

- `NNNN` — Four-digit zero-padded sequential integer starting at `0001`. Never reuse or skip numbers.
- `snake_case_description` — Lowercase letters, digits, and underscores only. Maximum 50 characters. Describes what the migration does, not when it was created. No dates in the name.
- Extension: always `.sql`.

**Valid examples:**
```
0001_initial_schema.sql
0002_webhook_tables.sql
0003_initial_indexes.sql
0004_add_user_locale_column.sql
0005_add_computation_ip_column.sql
```

**Invalid examples (do NOT use):**
```
001_initial.sql               ← Not 4 digits
2024-03-01_initial.sql        ← Date in name
0001_Initial_Schema.sql       ← Uppercase letters
0001_initial schema.sql       ← Space in name
0001.sql                      ← No description
```

### 1.2 Drizzle Journal Tag Format

The Drizzle journal (`drizzle/meta/_journal.json`) uses the filename without the `.sql` extension as the `tag` field:

```
0001_initial_schema
0002_webhook_tables
0003_initial_indexes
```

### 1.3 Seed Script Naming

The seed script is a TypeScript file, not a SQL migration. It lives at `scripts/seed.ts`. There is no numbered prefix for the seed script because it is not managed by Drizzle's migration runner; it is executed separately via `tsx scripts/seed.ts`.

---

## 2. Directory Structure

```
monorepo/apps/tax-optimizer/
├── drizzle/
│   ├── 0001_initial_schema.sql
│   ├── 0002_webhook_tables.sql
│   ├── 0003_initial_indexes.sql
│   └── meta/
│       ├── _journal.json           ← Drizzle migration history (auto-managed)
│       ├── 0001_snapshot.json      ← Drizzle schema snapshot (auto-managed)
│       ├── 0002_snapshot.json
│       └── 0003_snapshot.json
├── scripts/
│   └── seed.ts                     ← Standalone seed script (not a Drizzle migration)
├── src/
│   └── db/
│       ├── schema.ts               ← Drizzle schema definitions (TypeScript source of truth)
│       └── index.ts                ← Database connection pool export
└── drizzle.config.ts               ← Drizzle-kit configuration
```

**Critical rule:** The SQL files in `drizzle/` are the authoritative migration source. The TypeScript schema in `src/db/schema.ts` is used to generate future migrations via `drizzle-kit generate`. Never hand-edit `drizzle/meta/` files; they are managed by `drizzle-kit`.

---

## 3. Drizzle Configuration File

**File:** `apps/tax-optimizer/drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

const config: Config = {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    // DATABASE_URL format: postgresql://user:password@host:5432/taxklaro
    // Example (Neon): postgresql://taxklaro:secret@ep-xxx.us-east-1.aws.neon.tech/taxklaro?sslmode=require
  },
  migrations: {
    table: '__drizzle_migrations',
    schema: 'public',
  },
  // Do not use strict: true in production — prevents accidental DROP TABLE if schema
  // diverges from DB due to hotfix or manual intervention.
  strict: false,
  verbose: true,
};

export default config;
```

**Note on `DATABASE_URL`:** This environment variable must be set before running any `drizzle-kit` command. In CI/CD, it is injected as a secret. In local development, it is set in `.env.local` (never committed to the repository). See [deployment/environment.md](../deployment/environment.md) for the complete environment variable specification.

---

## 4. Migration File Inventory

All migrations are idempotent-safe because each uses `CREATE TABLE IF NOT EXISTS`, `CREATE TYPE IF NOT EXISTS`, and `CREATE INDEX IF NOT EXISTS` guards where PostgreSQL supports them. Enum types do NOT support `IF NOT EXISTS` in PostgreSQL 15 and below — use a DO block workaround (shown in migration 0001).

| # | File | Description | Tables Created | Safe to Re-run |
|---|------|-------------|----------------|----------------|
| 0001 | `0001_initial_schema.sql` | All 13 enum types, the `set_updated_at()` trigger function, and all 14 application tables (users through pdf_exports) with all constraints and triggers | `users`, `user_sessions`, `oauth_accounts`, `password_reset_tokens`, `email_verification_tokens`, `computations`, `computation_cwt_entries`, `computation_quarterly_payments`, `subscriptions`, `invoices`, `cpa_clients`, `cpa_client_computations`, `api_keys`, `audit_logs`, `pdf_exports` | Yes (via IF NOT EXISTS guards) |
| 0002 | `0002_webhook_tables.sql` | The 2 webhook tables and their indexes | `webhook_endpoints`, `webhook_deliveries` | Yes (via IF NOT EXISTS guards) |
| 0003 | `0003_initial_indexes.sql` | All query-performance indexes defined in [database/indexes.md](indexes.md) | None (index-only migration) | Yes (via IF NOT EXISTS guards) |

**Migration execution order is strict:** Run 0001 before 0002 before 0003. The `drizzle-kit migrate` command enforces this order via the journal file.

---

## 5. Migration 0001 — Initial Schema

**File:** `drizzle/0001_initial_schema.sql`

This migration creates the entire application schema. The SQL is written in PostgreSQL 16 dialect. All statements use `IF NOT EXISTS` guards so that a failed partial run can be retried without manual cleanup.

```sql
-- ============================================================
-- 0001_initial_schema.sql
-- Philippine Freelance Tax Optimizer — Initial Schema
-- Target: PostgreSQL 16
-- ORM: Drizzle ORM v0.38
-- ============================================================

-- Enable pgcrypto extension for gen_random_uuid()
-- (Available by default on Neon, Supabase, Railway, RDS PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- SECTION 1: ENUM TYPES
-- PostgreSQL does not support CREATE TYPE IF NOT EXISTS directly.
-- Use the DO block pattern for idempotency.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('TAXPAYER', 'CPA', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE taxpayer_type_enum AS ENUM (
    'PURELY_SE', 'MIXED_INCOME', 'COMPENSATION_ONLY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE filing_period_enum AS ENUM ('Q1', 'Q2', 'Q3', 'ANNUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE regime_path_enum AS ENUM ('PATH_A', 'PATH_B', 'PATH_C');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE computation_status_enum AS ENUM ('DRAFT', 'COMPLETE', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cwt_classification_enum AS ENUM (
    'INCOME_TAX_CWT', 'PERCENTAGE_TAX_CWT', 'UNKNOWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan_enum AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM (
    'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle_enum AS ENUM ('MONTHLY', 'ANNUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status_enum AS ENUM (
    'DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pdf_export_type_enum AS ENUM (
    'SUMMARY', 'FORM_1701', 'FORM_1701A', 'FORM_1701Q', 'FORM_2551Q'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE balance_disposition_enum AS ENUM (
    'BALANCE_PAYABLE', 'ZERO_BALANCE', 'OVERPAYMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE overpayment_disposition_enum AS ENUM (
    'CARRY_OVER', 'REFUND', 'TCC', 'PENDING_ELECTION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- SECTION 2: TRIGGER FUNCTION
-- Reusable set_updated_at() trigger function.
-- CREATE OR REPLACE is idempotent.
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- SECTION 3: CORE USER TABLES
-- Dependency order: users → user_sessions, oauth_accounts,
--   password_reset_tokens, email_verification_tokens
-- ============================================================

-- 3.1 users
CREATE TABLE IF NOT EXISTS users (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  email                 TEXT        NOT NULL,
  email_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
  password_hash         TEXT        NULL,
  role                  user_role_enum NOT NULL DEFAULT 'TAXPAYER',
  first_name            TEXT        NOT NULL DEFAULT '',
  last_name             TEXT        NOT NULL DEFAULT '',
  middle_name           TEXT        NOT NULL DEFAULT '',
  tin                   VARCHAR(16) NULL,
  rdo_code              VARCHAR(3)  NULL,
  business_name         TEXT        NOT NULL DEFAULT '',
  psic_code             VARCHAR(6)  NULL,
  registered_address    TEXT        NOT NULL DEFAULT '',
  zip_code              VARCHAR(4)  NULL,
  contact_number        VARCHAR(15) NOT NULL DEFAULT '',
  birthday              DATE        NULL,
  citizenship           VARCHAR(50) NOT NULL DEFAULT 'Filipino',
  civil_status          VARCHAR(20) NULL,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  stripe_customer_id    TEXT        NULL,
  payment_provider      VARCHAR(20) NOT NULL DEFAULT 'paymongo',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at         TIMESTAMPTZ NULL,
  deleted_at            TIMESTAMPTZ NULL,

  CONSTRAINT users_pkey                PRIMARY KEY (id),
  CONSTRAINT users_email_unique        UNIQUE (email),
  CONSTRAINT users_tin_format          CHECK (
    tin IS NULL OR tin ~ '^[0-9]{3}-[0-9]{3}-[0-9]{3}(-[0-9]{4})?$'
  ),
  CONSTRAINT users_rdo_code_format     CHECK (
    rdo_code IS NULL OR rdo_code ~ '^[0-9]{3}$'
  ),
  CONSTRAINT users_zip_code_format     CHECK (
    zip_code IS NULL OR zip_code ~ '^[0-9]{4}$'
  ),
  CONSTRAINT users_civil_status_valid  CHECK (
    civil_status IS NULL OR civil_status IN
      ('Single', 'Married', 'Widow/Widower', 'Legally Separated')
  ),
  CONSTRAINT users_deleted_at_logic    CHECK (
    deleted_at IS NULL OR deleted_at >= created_at
  )
);

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3.2 user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL,
  session_token_hash    TEXT        NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at            TIMESTAMPTZ NOT NULL,
  last_used_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address            INET        NULL,
  user_agent            TEXT        NULL,
  revoked_at            TIMESTAMPTZ NULL,

  CONSTRAINT user_sessions_pkey         PRIMARY KEY (id),
  CONSTRAINT user_sessions_token_unique UNIQUE (session_token_hash),
  CONSTRAINT user_sessions_user_fk      FOREIGN KEY (user_id)
                                        REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_sessions_expiry_logic CHECK (expires_at > created_at)
);

-- 3.3 oauth_accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id                      UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL,
  provider                VARCHAR(20) NOT NULL,
  provider_user_id        TEXT        NOT NULL,
  access_token_encrypted  TEXT        NULL,
  refresh_token_encrypted TEXT        NULL,
  token_expires_at        TIMESTAMPTZ NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT oauth_accounts_pkey          PRIMARY KEY (id),
  CONSTRAINT oauth_accounts_user_fk       FOREIGN KEY (user_id)
                                          REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT oauth_accounts_provider_user UNIQUE (provider, provider_user_id),
  CONSTRAINT oauth_accounts_provider_valid CHECK (
    provider IN ('google')
  )
);

CREATE OR REPLACE TRIGGER oauth_accounts_updated_at
  BEFORE UPDATE ON oauth_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3.4 password_reset_tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  token_hash  TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT prt_pkey         PRIMARY KEY (id),
  CONSTRAINT prt_token_unique UNIQUE (token_hash),
  CONSTRAINT prt_user_fk      FOREIGN KEY (user_id)
                              REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT prt_expiry       CHECK (expires_at > created_at)
);

-- 3.5 email_verification_tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  email        TEXT        NOT NULL,
  token_hash   TEXT        NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT evt_pkey         PRIMARY KEY (id),
  CONSTRAINT evt_token_unique UNIQUE (token_hash),
  CONSTRAINT evt_user_fk      FOREIGN KEY (user_id)
                              REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT evt_expiry       CHECK (expires_at > created_at)
);


-- ============================================================
-- SECTION 4: COMPUTATION TABLES
-- Dependency order: users → computations → cwt_entries, quarterly_payments
-- ============================================================

-- 4.1 computations
CREATE TABLE IF NOT EXISTS computations (
  id                      UUID                    NOT NULL DEFAULT gen_random_uuid(),
  user_id                 UUID                    NULL,
  tax_year                SMALLINT                NOT NULL,
  filing_period           filing_period_enum      NOT NULL,
  taxpayer_type           taxpayer_type_enum      NOT NULL,
  gross_receipts          NUMERIC(15,2)           NOT NULL,
  is_vat_registered       BOOLEAN                 NOT NULL,
  has_cwt                 BOOLEAN                 NOT NULL DEFAULT FALSE,
  cwt_total               NUMERIC(15,2)           NOT NULL DEFAULT 0.00,
  status                  computation_status_enum NOT NULL DEFAULT 'DRAFT',
  recommended_path        regime_path_enum        NULL,
  recommended_tax_due     NUMERIC(15,2)           NULL,
  path_a_total_burden     NUMERIC(15,2)           NULL,
  path_b_total_burden     NUMERIC(15,2)           NULL,
  path_c_total_burden     NUMERIC(15,2)           NULL,
  balance_disposition     balance_disposition_enum NULL,
  balance_payable         NUMERIC(15,2)           NULL,
  overpayment_amount      NUMERIC(15,2)           NULL,
  overpayment_disposition overpayment_disposition_enum NULL,
  total_credits           NUMERIC(15,2)           NULL,
  penalty_total           NUMERIC(15,2)           NULL,
  engine_version          VARCHAR(20)             NOT NULL,
  input_json              JSONB                   NOT NULL,
  output_json             JSONB                   NULL,
  error_code              VARCHAR(40)             NULL,
  error_message           TEXT                    NULL,
  label                   TEXT                    NULL,
  is_saved                BOOLEAN                 NOT NULL DEFAULT FALSE,
  share_token             VARCHAR(36)             NULL,
  share_token_created_at  TIMESTAMPTZ             NULL,
  created_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT computations_pkey               PRIMARY KEY (id),
  CONSTRAINT computations_user_fk            FOREIGN KEY (user_id)
                                             REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT computations_tax_year_range     CHECK (tax_year BETWEEN 2018 AND 2030),
  CONSTRAINT computations_gross_nn           CHECK (gross_receipts >= 0),
  CONSTRAINT computations_cwt_total_nn       CHECK (cwt_total >= 0),
  CONSTRAINT computations_balance_nn         CHECK (
    balance_payable IS NULL OR balance_payable >= 0
  ),
  CONSTRAINT computations_overpayment_nn     CHECK (
    overpayment_amount IS NULL OR overpayment_amount >= 0
  ),
  CONSTRAINT computations_overpayment_disp   CHECK (
    overpayment_disposition IS NULL OR balance_disposition = 'OVERPAYMENT'
  ),
  CONSTRAINT computations_share_token_uuid   CHECK (
    share_token IS NULL OR
    share_token ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ),
  CONSTRAINT computations_label_length       CHECK (
    label IS NULL OR length(label) <= 200
  ),
  CONSTRAINT computations_engine_version_fmt CHECK (
    engine_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'
  )
);

CREATE OR REPLACE TRIGGER computations_updated_at
  BEFORE UPDATE ON computations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.2 computation_cwt_entries
CREATE TABLE IF NOT EXISTS computation_cwt_entries (
  id                 UUID                    NOT NULL DEFAULT gen_random_uuid(),
  computation_id     UUID                    NOT NULL,
  payor_name         TEXT                    NOT NULL,
  payor_tin          VARCHAR(16)             NOT NULL,
  atc_code           VARCHAR(8)              NOT NULL,
  income_payment     NUMERIC(15,2)           NOT NULL,
  tax_withheld       NUMERIC(15,2)           NOT NULL,
  period_from        DATE                    NOT NULL,
  period_to          DATE                    NOT NULL,
  quarter_of_credit  SMALLINT                NULL,
  cwt_classification cwt_classification_enum NOT NULL,
  created_at         TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT cwt_entries_pkey           PRIMARY KEY (id),
  CONSTRAINT cwt_entries_computation_fk FOREIGN KEY (computation_id)
                                        REFERENCES computations(id) ON DELETE CASCADE,
  CONSTRAINT cwt_entries_income_nn      CHECK (income_payment >= 0),
  CONSTRAINT cwt_entries_tax_withheld   CHECK (
    tax_withheld >= 0 AND tax_withheld <= income_payment
  ),
  CONSTRAINT cwt_entries_period_order   CHECK (period_to >= period_from),
  CONSTRAINT cwt_entries_quarter_valid  CHECK (
    quarter_of_credit IS NULL OR quarter_of_credit IN (1, 2, 3)
  )
);

-- 4.3 computation_quarterly_payments
CREATE TABLE IF NOT EXISTS computation_quarterly_payments (
  id                UUID               NOT NULL DEFAULT gen_random_uuid(),
  computation_id    UUID               NOT NULL,
  quarter           SMALLINT           NOT NULL,
  amount_paid       NUMERIC(15,2)      NOT NULL DEFAULT 0.00,
  date_paid         DATE               NULL,
  form_1701q_period filing_period_enum NOT NULL,
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT qpayments_pkey           PRIMARY KEY (id),
  CONSTRAINT qpayments_computation_fk FOREIGN KEY (computation_id)
                                      REFERENCES computations(id) ON DELETE CASCADE,
  CONSTRAINT qpayments_quarter_valid  CHECK (quarter IN (1, 2, 3)),
  CONSTRAINT qpayments_amount_nn      CHECK (amount_paid >= 0),
  CONSTRAINT qpayments_period_match   CHECK (
    (quarter = 1 AND form_1701q_period = 'Q1') OR
    (quarter = 2 AND form_1701q_period = 'Q2') OR
    (quarter = 3 AND form_1701q_period = 'Q3')
  ),
  CONSTRAINT qpayments_unique_quarter UNIQUE (computation_id, quarter)
);


-- ============================================================
-- SECTION 5: SUBSCRIPTION AND BILLING TABLES
-- Dependency order: users → subscriptions → invoices
-- ============================================================

-- 5.1 subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID                      NOT NULL DEFAULT gen_random_uuid(),
  user_id                  UUID                      NOT NULL,
  plan                     subscription_plan_enum    NOT NULL DEFAULT 'FREE',
  status                   subscription_status_enum  NOT NULL DEFAULT 'ACTIVE',
  billing_cycle            billing_cycle_enum        NULL,
  trial_started_at         TIMESTAMPTZ               NULL,
  trial_ends_at            TIMESTAMPTZ               NULL,
  current_period_start     TIMESTAMPTZ               NULL,
  current_period_end       TIMESTAMPTZ               NULL,
  cancelled_at             TIMESTAMPTZ               NULL,
  cancel_at_period_end     BOOLEAN                   NOT NULL DEFAULT FALSE,
  provider_subscription_id TEXT                      NULL,
  provider_price_id        TEXT                      NULL,
  created_at               TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ               NOT NULL DEFAULT NOW(),

  CONSTRAINT subscriptions_pkey         PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_unique  UNIQUE (user_id),
  CONSTRAINT subscriptions_user_fk      FOREIGN KEY (user_id)
                                        REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_trial_logic  CHECK (
    (trial_started_at IS NULL AND trial_ends_at IS NULL) OR
    (trial_started_at IS NOT NULL AND trial_ends_at IS NOT NULL
     AND trial_ends_at > trial_started_at)
  ),
  CONSTRAINT subscriptions_period_logic CHECK (
    (current_period_start IS NULL AND current_period_end IS NULL) OR
    (current_period_start IS NOT NULL AND current_period_end IS NOT NULL
     AND current_period_end > current_period_start)
  ),
  CONSTRAINT subscriptions_billing_cycle_logic CHECK (
    (plan = 'FREE' AND billing_cycle IS NULL) OR
    (plan != 'FREE' AND billing_cycle IS NOT NULL)
  )
);

CREATE OR REPLACE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5.2 invoices
CREATE TABLE IF NOT EXISTS invoices (
  id                    UUID                   NOT NULL DEFAULT gen_random_uuid(),
  user_id               UUID                   NOT NULL,
  subscription_id       UUID                   NOT NULL,
  provider_invoice_id   TEXT                   NOT NULL,
  amount_due_centavos   INTEGER                NOT NULL,
  amount_paid_centavos  INTEGER                NOT NULL DEFAULT 0,
  currency              VARCHAR(3)             NOT NULL DEFAULT 'PHP',
  status                invoice_status_enum    NOT NULL DEFAULT 'DRAFT',
  invoice_date          DATE                   NOT NULL,
  due_date              DATE                   NULL,
  paid_at               TIMESTAMPTZ            NULL,
  provider_hosted_url   TEXT                   NULL,
  provider_pdf_url      TEXT                   NULL,
  description           TEXT                   NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ            NOT NULL DEFAULT NOW(),

  CONSTRAINT invoices_pkey                  PRIMARY KEY (id),
  CONSTRAINT invoices_provider_invoice_uniq UNIQUE (provider_invoice_id),
  CONSTRAINT invoices_user_fk               FOREIGN KEY (user_id)
                                            REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT invoices_subscription_fk       FOREIGN KEY (subscription_id)
                                            REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT invoices_amount_due_nn         CHECK (amount_due_centavos >= 0),
  CONSTRAINT invoices_amount_paid_nn        CHECK (amount_paid_centavos >= 0),
  CONSTRAINT invoices_currency_iso          CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE OR REPLACE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- SECTION 6: ENTERPRISE / CPA TABLES
-- Dependency order: users → cpa_clients → cpa_client_computations
-- ============================================================

-- 6.1 cpa_clients
CREATE TABLE IF NOT EXISTS cpa_clients (
  id            UUID        NOT NULL DEFAULT gen_random_uuid(),
  cpa_user_id   UUID        NOT NULL,
  client_name   TEXT        NOT NULL,
  client_tin    VARCHAR(16) NULL,
  client_email  TEXT        NULL,
  client_notes  TEXT        NOT NULL DEFAULT '',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT cpa_clients_pkey      PRIMARY KEY (id),
  CONSTRAINT cpa_clients_cpa_fk    FOREIGN KEY (cpa_user_id)
                                   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT cpa_clients_tin_fmt   CHECK (
    client_tin IS NULL OR
    client_tin ~ '^[0-9]{3}-[0-9]{3}-[0-9]{3}(-[0-9]{4})?$'
  ),
  CONSTRAINT cpa_clients_name_nn   CHECK (length(trim(client_name)) > 0),
  CONSTRAINT cpa_clients_notes_len CHECK (length(client_notes) <= 2000)
);

CREATE OR REPLACE TRIGGER cpa_clients_updated_at
  BEFORE UPDATE ON cpa_clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6.2 cpa_client_computations
CREATE TABLE IF NOT EXISTS cpa_client_computations (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  client_id      UUID        NOT NULL,
  computation_id UUID        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT cpa_cc_pkey           PRIMARY KEY (id),
  CONSTRAINT cpa_cc_client_fk      FOREIGN KEY (client_id)
                                   REFERENCES cpa_clients(id) ON DELETE CASCADE,
  CONSTRAINT cpa_cc_computation_fk FOREIGN KEY (computation_id)
                                   REFERENCES computations(id) ON DELETE CASCADE,
  CONSTRAINT cpa_cc_unique         UNIQUE (client_id, computation_id)
);


-- ============================================================
-- SECTION 7: API ACCESS TABLE
-- ============================================================

-- 7.1 api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  name         TEXT        NOT NULL,
  key_prefix   VARCHAR(8)  NOT NULL,
  key_hash     TEXT        NOT NULL,
  scopes       TEXT[]      NOT NULL DEFAULT ARRAY['compute'],
  last_used_at TIMESTAMPTZ NULL,
  expires_at   TIMESTAMPTZ NULL,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  revoked_at   TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT api_keys_pkey        PRIMARY KEY (id),
  CONSTRAINT api_keys_hash_unique UNIQUE (key_hash),
  CONSTRAINT api_keys_user_fk     FOREIGN KEY (user_id)
                                  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT api_keys_name_nn     CHECK (
    length(trim(name)) > 0 AND length(name) <= 100
  ),
  CONSTRAINT api_keys_prefix_fmt  CHECK (
    key_prefix ~ '^ptax_[A-Za-z0-9]{3}$'
  ),
  CONSTRAINT api_keys_scopes_valid CHECK (
    scopes <@ ARRAY['compute', 'read', 'export', 'batch']::TEXT[]
    AND 'compute' = ANY(scopes)
  )
);


-- ============================================================
-- SECTION 8: OPERATIONS TABLES
-- audit_logs has no FK on user_id (intentional — survives user deletion)
-- ============================================================

-- 8.1 audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id     UUID        NULL,
  action      TEXT        NOT NULL,
  entity_type VARCHAR(30) NULL,
  entity_id   UUID        NULL,
  ip_address  INET        NULL,
  user_agent  TEXT        NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT audit_logs_pkey   PRIMARY KEY (id),
  CONSTRAINT audit_logs_action CHECK (
    action IN (
      'auth.login', 'auth.login_failed', 'auth.logout', 'auth.register',
      'auth.password_reset', 'auth.email_verified', 'auth.session_revoked',
      'auth.oauth_link',
      'computation.run', 'computation.save', 'computation.delete',
      'computation.share_enable', 'computation.share_disable',
      'pdf.export',
      'subscription.upgrade', 'subscription.downgrade', 'subscription.cancel',
      'subscription.trial_start', 'subscription.trial_convert',
      'subscription.trial_expire',
      'billing.invoice_created', 'billing.payment_succeeded',
      'billing.payment_failed',
      'api_key.create', 'api_key.revoke',
      'cpa.client_create', 'cpa.client_archive', 'cpa.computation_link',
      'user.profile_update', 'user.delete',
      'admin.impersonate'
    )
  )
);

-- Row-Level Security: only audit_writer role may INSERT; no role has UPDATE or DELETE.
-- The audit_writer role is created during infrastructure setup (see deployment/infrastructure.md).
-- Application code uses the audit_writer role exclusively for audit_logs inserts.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_insert_only ON audit_logs
  FOR INSERT
  TO audit_writer
  WITH CHECK (true);
-- No SELECT/UPDATE/DELETE policies defined → application roles cannot read or mutate rows
-- through RLS (they bypass only if they are superuser, which they are not in production).
-- Admin queries to audit_logs go through a dedicated read-only audit_reader role.

-- 8.2 pdf_exports
CREATE TABLE IF NOT EXISTS pdf_exports (
  id              UUID                   NOT NULL DEFAULT gen_random_uuid(),
  computation_id  UUID                   NOT NULL,
  user_id         UUID                   NOT NULL,
  export_type     pdf_export_type_enum   NOT NULL,
  quarter         SMALLINT               NULL,
  storage_path    TEXT                   NOT NULL,
  file_size_bytes INTEGER                NULL,
  generated_at    TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ            NOT NULL,
  download_count  INTEGER                NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ            NOT NULL DEFAULT NOW(),

  CONSTRAINT pdf_exports_pkey           PRIMARY KEY (id),
  CONSTRAINT pdf_exports_computation_fk FOREIGN KEY (computation_id)
                                        REFERENCES computations(id) ON DELETE CASCADE,
  CONSTRAINT pdf_exports_user_fk        FOREIGN KEY (user_id)
                                        REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT pdf_exports_quarter_valid  CHECK (
    (export_type IN ('SUMMARY', 'FORM_1701', 'FORM_1701A') AND quarter IS NULL) OR
    (export_type = 'FORM_1701Q' AND quarter IN (1, 2, 3)) OR
    (export_type = 'FORM_2551Q' AND quarter IN (1, 2, 3, 4))
  ),
  CONSTRAINT pdf_exports_file_size_nn   CHECK (
    file_size_bytes IS NULL OR file_size_bytes > 0
  ),
  CONSTRAINT pdf_exports_download_nn    CHECK (download_count >= 0),
  CONSTRAINT pdf_exports_expiry_logic   CHECK (expires_at > generated_at)
);
```

---

## 6. Migration 0002 — Webhook Tables

**File:** `drizzle/0002_webhook_tables.sql`

These two tables are defined in full in [api/webhooks.md](../api/webhooks.md). They are separated into their own migration because they represent the outbound webhook system, which is an optional Enterprise-tier feature and may be deployed after the initial launch.

```sql
-- ============================================================
-- 0002_webhook_tables.sql
-- Outbound webhook system tables
-- Source: api/webhooks.md §10 (DDL section)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE webhook_endpoint_status_enum AS ENUM (
    'ACTIVE',    -- Receiving deliveries normally.
    'DISABLED',  -- Auto-disabled after 3 EXHAUSTED deliveries in 24 hours.
    'PAUSED'     -- Manually paused by the user via the API.
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE webhook_delivery_status_enum AS ENUM (
    'ATTEMPTING',  -- Currently in the retry queue; delivery not yet confirmed.
    'DELIVERED',   -- HTTP 2xx received from the endpoint.
    'FAILED',      -- HTTP non-2xx received; will retry per retry schedule.
    'EXHAUSTED'    -- All 6 retry attempts exhausted; no further delivery.
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- webhook_endpoints: One row per registered endpoint URL per user.
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id                  UUID                          NOT NULL DEFAULT gen_random_uuid(),
  user_id             UUID                          NOT NULL,

  url                 TEXT                          NOT NULL,
  -- HTTPS URL only. Maximum 2048 characters. Must pass SSRF validation at registration time.
  -- SSRF validation: reject RFC 1918 private ranges (10.0.0.0/8, 172.16.0.0/12,
  -- 192.168.0.0/16), loopback (127.0.0.0/8), link-local (169.254.0.0/16),
  -- and the metadata service IP (169.254.169.254).

  secret_encrypted    TEXT                          NOT NULL,
  -- AES-256-GCM encrypted 32-byte secret used to sign payloads with HMAC-SHA256.
  -- Key: WEBHOOK_SECRET_ENCRYPTION_KEY environment variable (see deployment/environment.md).
  -- Raw secret is shown to the user once on creation; thereafter only the encrypted form is stored.

  event_types         TEXT[]                        NOT NULL,
  -- Array of event type strings this endpoint subscribes to.
  -- Valid values: 'batch.job.queued', 'batch.job.processing', 'batch.job.completed',
  --   'batch.job.partial_failure', 'batch.job.failed',
  --   'subscription.trial_started', 'subscription.trial_converted',
  --   'subscription.trial_expired', 'subscription.upgraded', 'subscription.downgraded',
  --   'subscription.cancelled', 'subscription.payment_failed',
  --   'subscription.payment_recovered', 'subscription.expired',
  --   'cpa.client_created', 'cpa.computation_linked'.
  -- Minimum 1 event type; maximum 16 event types.

  description         TEXT                          NOT NULL DEFAULT '',
  -- User-provided label, e.g., "Production — batch job notifications". Max 200 characters.

  status              webhook_endpoint_status_enum  NOT NULL DEFAULT 'ACTIVE',
  disabled_reason     TEXT                          NULL,
  -- Set when status = 'DISABLED'. Explains the auto-disable reason.
  -- Example: "Auto-disabled: 3 EXHAUSTED deliveries within 24 hours on 2026-03-02T14:00:00Z"

  created_at          TIMESTAMPTZ                   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ                   NOT NULL DEFAULT NOW(),

  CONSTRAINT wh_endpoints_pkey        PRIMARY KEY (id),
  CONSTRAINT wh_endpoints_user_fk     FOREIGN KEY (user_id)
                                      REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT wh_endpoints_url_https   CHECK (url ~ '^https://'),
  CONSTRAINT wh_endpoints_url_len     CHECK (length(url) <= 2048),
  CONSTRAINT wh_endpoints_desc_len    CHECK (length(description) <= 200),
  CONSTRAINT wh_endpoints_events_min  CHECK (cardinality(event_types) >= 1),
  CONSTRAINT wh_endpoints_events_max  CHECK (cardinality(event_types) <= 16),
  CONSTRAINT wh_endpoints_events_valid CHECK (
    event_types <@ ARRAY[
      'batch.job.queued', 'batch.job.processing', 'batch.job.completed',
      'batch.job.partial_failure', 'batch.job.failed',
      'subscription.trial_started', 'subscription.trial_converted',
      'subscription.trial_expired', 'subscription.upgraded',
      'subscription.downgraded', 'subscription.cancelled',
      'subscription.payment_failed', 'subscription.payment_recovered',
      'subscription.expired',
      'cpa.client_created', 'cpa.computation_linked'
    ]::TEXT[]
  )
);

CREATE OR REPLACE TRIGGER wh_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- GIN index for efficient filtering by event_type in delivery dispatch
CREATE INDEX IF NOT EXISTS wh_endpoints_user_idx
  ON webhook_endpoints (user_id)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS wh_endpoints_event_types_gin_idx
  ON webhook_endpoints USING GIN (event_types);

-- webhook_deliveries: One row per delivery attempt for each triggered event.
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id                  UUID                          NOT NULL DEFAULT gen_random_uuid(),
  endpoint_id         UUID                          NOT NULL,

  event_type          TEXT                          NOT NULL,
  -- The specific event type that triggered this delivery attempt.
  event_id            UUID                          NOT NULL DEFAULT gen_random_uuid(),
  -- Stable identifier for the logical event. All retry attempts for the same event
  -- share the same event_id. Idempotency key for consumer deduplication.

  payload_json        JSONB                         NOT NULL,
  -- The webhook payload object. Schema defined in api/webhooks.md per event type.

  status              webhook_delivery_status_enum  NOT NULL DEFAULT 'ATTEMPTING',

  attempt_count       SMALLINT                      NOT NULL DEFAULT 0,
  -- 0 = not yet attempted; incremented before each HTTP call.
  -- Maximum: 6 (5 retries after initial attempt).
  next_attempt_at     TIMESTAMPTZ                   NULL,
  -- When the next retry is scheduled. NULL if status = DELIVERED or EXHAUSTED.
  last_attempted_at   TIMESTAMPTZ                   NULL,
  -- Timestamp of the most recent delivery attempt. NULL before first attempt.

  last_http_status    SMALLINT                      NULL,
  -- HTTP status code from the most recent attempt. NULL before first attempt.
  -- 2xx indicates DELIVERED; non-2xx triggers retry logic.
  last_response_body  TEXT                          NULL,
  -- First 2048 characters of the response body from the most recent attempt.
  -- Stored for debugging. NULL before first attempt.
  last_error_message  TEXT                          NULL,
  -- Network error message (e.g., "ECONNREFUSED", "ETIMEDOUT") if HTTP call failed
  -- without receiving a response. NULL if HTTP response was received.

  created_at          TIMESTAMPTZ                   NOT NULL DEFAULT NOW(),
  delivered_at        TIMESTAMPTZ                   NULL,
  -- NULL until status = DELIVERED. Set when 2xx is received.
  exhausted_at        TIMESTAMPTZ                   NULL,
  -- NULL until status = EXHAUSTED. Set when attempt_count reaches 6 with no 2xx.

  CONSTRAINT wh_deliveries_pkey          PRIMARY KEY (id),
  CONSTRAINT wh_deliveries_endpoint_fk   FOREIGN KEY (endpoint_id)
                                         REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  CONSTRAINT wh_deliveries_attempts_max  CHECK (attempt_count BETWEEN 0 AND 6),
  CONSTRAINT wh_deliveries_status_logic  CHECK (
    (status = 'DELIVERED' AND delivered_at IS NOT NULL AND exhausted_at IS NULL) OR
    (status = 'EXHAUSTED' AND exhausted_at IS NOT NULL AND delivered_at IS NULL) OR
    (status IN ('ATTEMPTING', 'FAILED') AND delivered_at IS NULL AND exhausted_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS wh_deliveries_endpoint_idx
  ON webhook_deliveries (endpoint_id, created_at DESC);

CREATE INDEX IF NOT EXISTS wh_deliveries_pending_idx
  ON webhook_deliveries (next_attempt_at)
  WHERE status IN ('ATTEMPTING', 'FAILED') AND next_attempt_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS wh_deliveries_event_id_idx
  ON webhook_deliveries (event_id);
```

---

## 7. Migration 0003 — Initial Indexes

**File:** `drizzle/0003_initial_indexes.sql`

This migration contains all query-performance indexes. They are placed in a separate migration from the table definitions to allow the index build to be monitored independently and to allow `CREATE INDEX CONCURRENTLY` (which cannot run inside a transaction). In Drizzle's migration runner, each `.sql` file is executed inside a transaction by default. Use the `-- drizzle:disable-transaction` directive to run this file outside a transaction, enabling `CONCURRENTLY`.

```sql
-- ============================================================
-- 0003_initial_indexes.sql
-- All query-performance indexes for the application schema
-- NOTE: Uses CREATE INDEX CONCURRENTLY — must run outside a transaction.
-- Drizzle-kit directive:
-- ============================================================
-- drizzle:disable-transaction

-- ============================================================
-- users indexes
-- ============================================================

-- Case-insensitive email lookup for login and forgot-password
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS users_email_lower_idx
  ON users (lower(email));

-- Partial index: active users only (used by all auth queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_active_idx
  ON users (id)
  WHERE deleted_at IS NULL;

-- TIN lookup for admin and CPA search
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_tin_idx
  ON users (tin)
  WHERE tin IS NOT NULL;

-- Payment provider customer ID lookup for webhook processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_stripe_customer_idx
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;


-- ============================================================
-- user_sessions indexes
-- ============================================================
-- Note: session_token_hash unique index already created by UNIQUE constraint.

-- User's active sessions (account security page listing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_sessions_user_active_idx
  ON user_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

-- Cleanup job: find expired sessions for deletion
CREATE INDEX CONCURRENTLY IF NOT EXISTS user_sessions_expires_at_idx
  ON user_sessions (expires_at)
  WHERE revoked_at IS NULL;


-- ============================================================
-- oauth_accounts indexes
-- ============================================================
-- Note: (provider, provider_user_id) unique index already created by UNIQUE constraint.

CREATE INDEX CONCURRENTLY IF NOT EXISTS oauth_accounts_user_idx
  ON oauth_accounts (user_id);


-- ============================================================
-- password_reset_tokens indexes
-- ============================================================
-- Note: token_hash unique index already created by UNIQUE constraint.

-- Cleanup job: find expired/used tokens
CREATE INDEX CONCURRENTLY IF NOT EXISTS prt_expires_cleanup_idx
  ON password_reset_tokens (expires_at)
  WHERE used_at IS NULL;


-- ============================================================
-- email_verification_tokens indexes
-- ============================================================
-- Note: token_hash unique index already created by UNIQUE constraint.

-- Cleanup job
CREATE INDEX CONCURRENTLY IF NOT EXISTS evt_expires_cleanup_idx
  ON email_verification_tokens (expires_at)
  WHERE used_at IS NULL;


-- ============================================================
-- computations indexes
-- ============================================================

-- User's computation history (history page — filtered by user, sorted by date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS computations_user_history_idx
  ON computations (user_id, created_at DESC)
  WHERE user_id IS NOT NULL AND is_saved = TRUE;

-- Dashboard: user's computations for current tax year
CREATE INDEX CONCURRENTLY IF NOT EXISTS computations_user_year_idx
  ON computations (user_id, tax_year)
  WHERE user_id IS NOT NULL;

-- Shareable link lookup (GET /s/:share_token)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS computations_share_token_idx
  ON computations (share_token)
  WHERE share_token IS NOT NULL;

-- Admin: computations by engine version (for regression detection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS computations_engine_version_idx
  ON computations (engine_version, created_at DESC);

-- Cleanup job: anonymous computations older than 30 days
CREATE INDEX CONCURRENTLY IF NOT EXISTS computations_anon_cleanup_idx
  ON computations (created_at)
  WHERE user_id IS NULL AND is_saved = FALSE;

-- JSONB indexes for server-side filtering in admin/analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS computations_input_json_gin_idx
  ON computations USING GIN (input_json jsonb_path_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS computations_output_json_gin_idx
  ON computations USING GIN (output_json jsonb_path_ops)
  WHERE output_json IS NOT NULL;


-- ============================================================
-- computation_cwt_entries indexes
-- ============================================================

-- All CWT entries for a computation (results page rendering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS cwt_entries_computation_idx
  ON computation_cwt_entries (computation_id);

-- CWT entries by ATC code (batch validation, admin analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS cwt_entries_atc_code_idx
  ON computation_cwt_entries (atc_code);

-- CWT entries by classification (separate income-tax vs percentage-tax credits)
CREATE INDEX CONCURRENTLY IF NOT EXISTS cwt_entries_classification_idx
  ON computation_cwt_entries (cwt_classification, computation_id);


-- ============================================================
-- computation_quarterly_payments indexes
-- ============================================================
-- Note: (computation_id, quarter) unique index already created by UNIQUE constraint.

CREATE INDEX CONCURRENTLY IF NOT EXISTS qpayments_computation_idx
  ON computation_quarterly_payments (computation_id);


-- ============================================================
-- subscriptions indexes
-- ============================================================
-- Note: user_id unique index already created by UNIQUE constraint.

-- Find all subscriptions expiring soon (renewal/dunning cron job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS subscriptions_expiring_idx
  ON subscriptions (current_period_end)
  WHERE status IN ('ACTIVE', 'TRIALING') AND current_period_end IS NOT NULL;

-- Find all trials ending soon (trial-expiry cron job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS subscriptions_trial_end_idx
  ON subscriptions (trial_ends_at)
  WHERE status = 'TRIALING' AND trial_ends_at IS NOT NULL;

-- Lookup by payment provider subscription ID (webhook processing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS subscriptions_provider_sub_idx
  ON subscriptions (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;


-- ============================================================
-- invoices indexes
-- ============================================================
-- Note: provider_invoice_id unique index already created by UNIQUE constraint.

-- User's invoice history (billing page listing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_user_history_idx
  ON invoices (user_id, invoice_date DESC);

-- Invoices for a subscription (subscription detail view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_subscription_idx
  ON invoices (subscription_id, invoice_date DESC);

-- Unpaid invoices for dunning (payment recovery cron job)
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_unpaid_idx
  ON invoices (due_date)
  WHERE status IN ('OPEN', 'DRAFT');


-- ============================================================
-- cpa_clients indexes
-- ============================================================

-- CPA's active client list
CREATE INDEX CONCURRENTLY IF NOT EXISTS cpa_clients_cpa_active_idx
  ON cpa_clients (cpa_user_id, created_at DESC)
  WHERE is_active = TRUE;

-- All clients for a CPA user (including archived)
CREATE INDEX CONCURRENTLY IF NOT EXISTS cpa_clients_cpa_all_idx
  ON cpa_clients (cpa_user_id);

-- Search by client TIN (CPA searches for a specific client)
CREATE INDEX CONCURRENTLY IF NOT EXISTS cpa_clients_tin_idx
  ON cpa_clients (client_tin)
  WHERE client_tin IS NOT NULL;


-- ============================================================
-- cpa_client_computations indexes
-- ============================================================
-- Note: (client_id, computation_id) unique index already created by UNIQUE constraint.

-- All computations for a CPA client
CREATE INDEX CONCURRENTLY IF NOT EXISTS cpa_cc_client_computations_idx
  ON cpa_client_computations (client_id, created_at DESC);

-- Reverse lookup: which client owns a given computation
CREATE INDEX CONCURRENTLY IF NOT EXISTS cpa_cc_computation_client_idx
  ON cpa_client_computations (computation_id);


-- ============================================================
-- api_keys indexes
-- ============================================================
-- Note: key_hash unique index already created by UNIQUE constraint.

-- User's API key list
CREATE INDEX CONCURRENTLY IF NOT EXISTS api_keys_user_active_idx
  ON api_keys (user_id, created_at DESC)
  WHERE is_active = TRUE;

-- Expired key cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS api_keys_expires_idx
  ON api_keys (expires_at)
  WHERE is_active = TRUE AND expires_at IS NOT NULL;


-- ============================================================
-- audit_logs indexes
-- ============================================================

-- Audit log by user (account activity page, admin user investigation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_user_idx
  ON audit_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Audit log by action type (admin analytics, compliance monitoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_action_idx
  ON audit_logs (action, created_at DESC);

-- Audit log by entity (find all events affecting a specific computation or subscription)
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs (entity_type, entity_id, created_at DESC)
  WHERE entity_id IS NOT NULL;

-- Time-range scans (admin dashboard: "events in last 24 hours")
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_created_at_idx
  ON audit_logs (created_at DESC);

-- JSONB metadata search (finding specific event details in admin investigation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_metadata_gin_idx
  ON audit_logs USING GIN (metadata jsonb_path_ops);


-- ============================================================
-- pdf_exports indexes
-- ============================================================

-- All exports for a computation
CREATE INDEX CONCURRENTLY IF NOT EXISTS pdf_exports_computation_idx
  ON pdf_exports (computation_id, generated_at DESC);

-- User's export history
CREATE INDEX CONCURRENTLY IF NOT EXISTS pdf_exports_user_idx
  ON pdf_exports (user_id, generated_at DESC);

-- Cleanup job: expired PDFs for R2 object deletion
CREATE INDEX CONCURRENTLY IF NOT EXISTS pdf_exports_expires_idx
  ON pdf_exports (expires_at)
  WHERE expires_at < NOW();
```

---

## 8. Seed Script — scripts/seed.ts

**File:** `apps/tax-optimizer/scripts/seed.ts`

The seed script is a TypeScript file that runs after all migrations have been applied. It is NOT a Drizzle migration. It is executed via `npx tsx scripts/seed.ts` or `bun run scripts/seed.ts`. The seed script is idempotent — it uses `INSERT ... ON CONFLICT DO NOTHING` to avoid duplicate inserts on repeated runs.

The seed script creates:
1. **Admin user** — Internal operations account with role `ADMIN`. Password is loaded from the `ADMIN_SEED_PASSWORD` environment variable at runtime and hashed with Argon2id before insertion. This user is used for internal platform operations and admin dashboard access.
2. **CI test user** — Automated test account with role `TAXPAYER`. Password is loaded from `CI_TEST_USER_PASSWORD`. Used by Playwright end-to-end tests and API integration tests. Present in all environments (local, staging, production). In production, the CI test user has no paid subscription and its computations are tagged with `metadata->>'source': 'ci'` in audit logs.
3. **FREE plan subscription rows** for both the admin user and CI test user (the `subscriptions` table requires one row per user; new user registration also creates this row via application code).

```typescript
// scripts/seed.ts
// Usage: npx tsx scripts/seed.ts
// Required environment variables:
//   DATABASE_URL           — PostgreSQL connection string
//   ADMIN_SEED_PASSWORD    — Plain-text password for the admin seed user
//   CI_TEST_USER_PASSWORD  — Plain-text password for the CI test user

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { hash } from '@node-rs/argon2';
import { users, subscriptions } from '../src/db/schema';

// Argon2id parameters: m=65536 (64 MiB), t=3 (3 iterations), p=4 (4 parallelism)
// These parameters match the authentication configuration in api/auth.md §3.1
const ARGON2ID_PARAMS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

// Fixed UUIDs for the seed accounts.
// These UUIDs are stable across all environments. Do not change them after first deployment.
// Using fixed UUIDs allows test code to reference them by ID without a prior lookup.
const ADMIN_USER_ID    = '00000000-0000-0000-0000-000000000001';
const CI_TEST_USER_ID  = '00000000-0000-0000-0000-000000000002';

const ADMIN_EMAIL      = 'admin@taxklaro.ph';
const CI_TEST_EMAIL    = 'ci-test@taxklaro.ph';

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // ── Validate required environment variables ──────────────────────────────
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  const ciTestPassword = process.env.CI_TEST_USER_PASSWORD;

  if (!adminPassword || adminPassword.length < 20) {
    throw new Error(
      'ADMIN_SEED_PASSWORD must be set and at least 20 characters. ' +
      'Generate with: openssl rand -base64 32'
    );
  }
  if (!ciTestPassword || ciTestPassword.length < 20) {
    throw new Error(
      'CI_TEST_USER_PASSWORD must be set and at least 20 characters. ' +
      'Generate with: openssl rand -base64 32'
    );
  }

  // ── Hash passwords ────────────────────────────────────────────────────────
  console.log('Hashing seed user passwords (Argon2id, ~2s each)...');
  const [adminPasswordHash, ciTestPasswordHash] = await Promise.all([
    hash(adminPassword, ARGON2ID_PARAMS),
    hash(ciTestPassword, ARGON2ID_PARAMS),
  ]);

  // ── Insert admin user ─────────────────────────────────────────────────────
  console.log(`Upserting admin user: ${ADMIN_EMAIL}`);
  await db
    .insert(users)
    .values({
      id:             ADMIN_USER_ID,
      email:          ADMIN_EMAIL,
      emailVerified:  true,
      passwordHash:   adminPasswordHash,
      role:           'ADMIN',
      firstName:      'TaxKlaro',
      lastName:       'Admin',
      middleName:     '',
      isActive:       true,
      paymentProvider: 'paymongo',
    })
    .onConflictDoNothing({ target: users.id });

  // ── Insert CI test user ───────────────────────────────────────────────────
  console.log(`Upserting CI test user: ${CI_TEST_EMAIL}`);
  await db
    .insert(users)
    .values({
      id:             CI_TEST_USER_ID,
      email:          CI_TEST_EMAIL,
      emailVerified:  true,
      passwordHash:   ciTestPasswordHash,
      role:           'TAXPAYER',
      firstName:      'CI',
      lastName:       'TestUser',
      middleName:     '',
      isActive:       true,
      paymentProvider: 'paymongo',
    })
    .onConflictDoNothing({ target: users.id });

  // ── Insert FREE plan subscription rows ───────────────────────────────────
  // The application's user registration flow also creates these rows.
  // On conflict (row already exists), do nothing — the user may have upgraded.
  console.log('Creating FREE plan subscription rows for seed users...');
  await db
    .insert(subscriptions)
    .values([
      {
        userId:      ADMIN_USER_ID,
        plan:        'FREE',
        status:      'ACTIVE',
        billingCycle: null,
      },
      {
        userId:      CI_TEST_USER_ID,
        plan:        'FREE',
        status:      'ACTIVE',
        billingCycle: null,
      },
    ])
    .onConflictDoNothing({ target: subscriptions.userId });

  await pool.end();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

### 8.1 Seed Environment Variables

| Variable | Required By | Format | Where To Get It |
|----------|------------|--------|-----------------|
| `DATABASE_URL` | `scripts/seed.ts` | `postgresql://user:pass@host:5432/dbname?sslmode=require` | Neon/Railway dashboard or `.env.local` |
| `ADMIN_SEED_PASSWORD` | `scripts/seed.ts` | Plain text, minimum 20 characters | `openssl rand -base64 32` |
| `CI_TEST_USER_PASSWORD` | `scripts/seed.ts` | Plain text, minimum 20 characters | `openssl rand -base64 32` — store in GitHub Secrets as `CI_TEST_USER_PASSWORD` |

These variables are stored in different locations depending on environment:

| Environment | `ADMIN_SEED_PASSWORD` storage | `CI_TEST_USER_PASSWORD` storage |
|-------------|------------------------------|--------------------------------|
| Local development | `.env.local` (never committed) | `.env.local` |
| Staging | GitHub Actions secret `STAGING_ADMIN_SEED_PASSWORD` | GitHub Actions secret `CI_TEST_USER_PASSWORD` |
| Production | GitHub Actions secret `PROD_ADMIN_SEED_PASSWORD` | GitHub Actions secret `CI_TEST_USER_PASSWORD` |

### 8.2 Seed User Properties

| Property | Admin User | CI Test User |
|----------|-----------|-------------|
| `id` | `00000000-0000-0000-0000-000000000001` | `00000000-0000-0000-0000-000000000002` |
| `email` | `admin@taxklaro.ph` | `ci-test@taxklaro.ph` |
| `role` | `ADMIN` | `TAXPAYER` |
| `email_verified` | `true` | `true` |
| `plan` | `FREE` (upgradeable via admin UI) | `FREE` (used as-is in e2e tests) |
| `subscription.status` | `ACTIVE` | `ACTIVE` |
| `tin` | `NULL` (set manually post-seed) | `NULL` |
| `is_active` | `true` | `true` |

### 8.3 Idempotency Guarantee

Running `seed.ts` multiple times against the same database is safe. All inserts use `ON CONFLICT DO NOTHING` targeting the fixed UUIDs. If the admin or CI test user has been upgraded to PRO or ENTERPRISE via the application, re-running the seed will NOT downgrade them (the subscription insert also uses `ON CONFLICT DO NOTHING`).

---

## 9. How to Run

### 9.1 Apply Migrations (Development)

```bash
# From the apps/tax-optimizer/ directory:

# 1. Verify DATABASE_URL is set
echo $DATABASE_URL

# 2. Apply all pending migrations in order
npx drizzle-kit migrate

# Expected output:
# [drizzle-kit] Reading config file '/path/to/drizzle.config.ts'
# [drizzle-kit] Applying migration '0001_initial_schema'
# [drizzle-kit] Applying migration '0002_webhook_tables'
# [drizzle-kit] Applying migration '0003_initial_indexes'
# [drizzle-kit] All migrations applied successfully.
```

### 9.2 Run Seed Script (Development and Staging)

```bash
# From the apps/tax-optimizer/ directory:

# Set required environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/taxklaro"
export ADMIN_SEED_PASSWORD="$(openssl rand -base64 32)"
export CI_TEST_USER_PASSWORD="$(openssl rand -base64 32)"

# Run seed script
npx tsx scripts/seed.ts

# Or with bun (faster):
bun run scripts/seed.ts
```

### 9.3 Generate a New Migration

When the Drizzle TypeScript schema (`src/db/schema.ts`) is modified, generate a new migration file:

```bash
# From apps/tax-optimizer/:

# Generate migration (Drizzle compares schema.ts against the last snapshot)
npx drizzle-kit generate --name="add_user_locale_column"

# This creates:
#   drizzle/0004_add_user_locale_column.sql   ← Review this file before applying
#   drizzle/meta/0004_snapshot.json           ← Auto-generated snapshot
```

**Always review the generated SQL before applying.** Drizzle may generate `DROP` statements if columns are removed from the schema. Verify the generated migration matches the intent.

### 9.4 Apply Migrations in CI/CD

The GitHub Actions deploy workflow (see [deployment/ci-cd.md](../deployment/ci-cd.md)) applies migrations as part of the deploy step:

```bash
# Step in GitHub Actions deploy job (apps/tax-optimizer):

# Migrations
DATABASE_URL="${{ secrets.NEON_DATABASE_URL }}" npx drizzle-kit migrate

# Seed (only runs if SEED_ON_DEPLOY=true, which is set for staging but NOT production)
if [ "$SEED_ON_DEPLOY" = "true" ]; then
  DATABASE_URL="${{ secrets.NEON_DATABASE_URL }}" \
  ADMIN_SEED_PASSWORD="${{ secrets.ADMIN_SEED_PASSWORD }}" \
  CI_TEST_USER_PASSWORD="${{ secrets.CI_TEST_USER_PASSWORD }}" \
  npx tsx scripts/seed.ts
fi
```

**Production seed policy:** The seed script is NOT run automatically on production deploys. The admin user and CI test user must be seeded manually on the first production deployment using the exact commands in §9.2. Thereafter, `SEED_ON_DEPLOY` is never set to `true` in the production workflow.

### 9.5 Verify Migration State

```bash
# Check which migrations have been applied to the database
# (Drizzle stores migration history in the __drizzle_migrations table)
psql "$DATABASE_URL" -c "SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at;"

# Expected output on a fully-migrated database:
#  id |              hash               |         created_at
# ----+---------------------------------+----------------------------
#   1 | <sha256 of 0001 file content>  | 2026-03-02 00:00:00+00
#   2 | <sha256 of 0002 file content>  | 2026-03-02 00:00:00+00
#   3 | <sha256 of 0003 file content>  | 2026-03-02 00:00:00+00
```

---

## 10. Rollback Strategy

Drizzle ORM does not generate rollback (DOWN) migrations automatically. The rollback strategy is:

### 10.1 Development: Drop and Recreate

In local development, if a migration has an error:

```bash
# Drop the entire database and start fresh
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-apply all migrations
npx drizzle-kit migrate

# Re-seed
npx tsx scripts/seed.ts
```

### 10.2 Staging: Manual Revert Script

Each migration that modifies existing tables (not the initial 0001/0002/0003) must be accompanied by a hand-written revert script in `drizzle/revert/`. The revert script is named to match the forward migration:

```
drizzle/revert/0004_add_user_locale_column.revert.sql
```

The revert script contains the inverse DDL (e.g., `ALTER TABLE users DROP COLUMN IF EXISTS locale;`). It is executed manually by an engineer if a staging deployment must be rolled back.

### 10.3 Production: Forward-Only with Feature Flags

Production schema changes are forward-only. To "undo" a production schema change:
1. Write a new migration (e.g., `0005_remove_user_locale_column.sql`) that reverses the change.
2. Deploy the new migration in the next release.
3. Never manually run DDL against production outside of the migration system.

### 10.4 Emergency Production Schema Fix

If a migration is applied to production and causes immediate breakage:

```bash
# Step 1: Remove the broken migration entry from __drizzle_migrations
# (This allows re-applying a corrected version)
psql "$DATABASE_URL" -c \
  "DELETE FROM __drizzle_migrations WHERE id = (SELECT MAX(id) FROM __drizzle_migrations);"

# Step 2: Manually revert the schema change using the revert script
psql "$DATABASE_URL" -f "drizzle/revert/NNNN_description.revert.sql"

# Step 3: Fix the migration file, test locally, and redeploy
```

This procedure requires direct database access, which is restricted to the `database_admin` IAM role (see [deployment/infrastructure.md](../deployment/infrastructure.md)).

---

## 11. Future Migration Rules

Every migration added after the initial three must follow all of these rules:

### 11.1 Sequential Numbering

Use the next available number. Never skip numbers. Never reuse a number. Check the current highest number before creating a new migration:

```bash
ls drizzle/*.sql | sort | tail -1
# Example output: drizzle/0003_initial_indexes.sql
# → Next migration is 0004_...
```

### 11.2 Backward-Compatible Changes Only

All schema changes must be backward-compatible with the running application code during the deployment window (the time between the migration being applied and the new application code being deployed):

| Change Type | Backward-Compatible? | Procedure |
|-------------|---------------------|-----------|
| Add a nullable column | Yes | Direct migration |
| Add a column with a default value | Yes | Direct migration |
| Add a new table | Yes | Direct migration |
| Add a new index | Yes | Use `CONCURRENTLY` in migration 0003-style file |
| Rename a column | No | Two-step: (a) add new column + backfill, (b) deploy code using new name, (c) drop old column |
| Drop a column | No | Two-step: (a) deploy code not using column, (b) drop column in migration |
| Change a column type | No | Two-step: (a) add new column of new type, (b) backfill, (c) drop old column |
| Add a NOT NULL column without default | No | Must have default or be done in two steps |
| Add a new enum variant | Yes | `ALTER TYPE ... ADD VALUE` (safe in PostgreSQL 16) |
| Remove an enum variant | No | Cannot be done without table rebuild; design schema to never need this |
| Change a constraint | No | Drop old constraint, add new constraint separately |

### 11.3 Transaction Safety

- Migrations 0001 and 0002 run inside a transaction (Drizzle default).
- Migration 0003 runs outside a transaction (`-- drizzle:disable-transaction` directive) because `CREATE INDEX CONCURRENTLY` cannot run inside a transaction.
- Future index-only migrations must also use `-- drizzle:disable-transaction`.
- Future mixed DDL + index migrations: split them into two separate migration files.

### 11.4 No Data Migration in Schema Migration Files

Schema migrations (in `drizzle/`) contain DDL only (`CREATE`, `ALTER`, `DROP`, `CREATE INDEX`). They must never contain:
- `UPDATE` statements (data backfills)
- `INSERT` statements (data loading)
- `DELETE` statements (data cleanup)
- Stored procedure calls that modify data

Data migrations are done in separate TypeScript scripts in `scripts/` and are explicitly listed in the deployment runbook for each release.

### 11.5 Required Peer Review

Every migration file must be reviewed by at least one other engineer before being merged to `main`. The PR description must include:
- The purpose of the schema change
- Whether it is backward-compatible
- The estimated execution time on production (PostgreSQL's `EXPLAIN (ANALYZE, BUFFERS)` output for any table-scans involved)
- Whether a revert script has been added to `drizzle/revert/`

---

## 12. Journal File Format

**File:** `drizzle/meta/_journal.json`

Drizzle-kit manages this file automatically. Do NOT edit it manually. It is shown here for reference:

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1740873600000,
      "tag": "0001_initial_schema",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1740873601000,
      "tag": "0002_webhook_tables",
      "breakpoints": true
    },
    {
      "idx": 2,
      "version": "7",
      "when": 1740873602000,
      "tag": "0003_initial_indexes",
      "breakpoints": false
    }
  ]
}
```

**Fields:**
- `version`: Drizzle meta format version. Current: `"7"` (Drizzle ORM v0.38). Do not change manually.
- `dialect`: Always `"postgresql"` for this project.
- `entries[].idx`: Zero-based sequential index. Corresponds to migration order.
- `entries[].when`: Unix timestamp in milliseconds when the migration file was generated (not when it was applied). Auto-set by `drizzle-kit generate`.
- `entries[].tag`: Filename without `.sql` extension.
- `entries[].breakpoints`: `true` for transactions (default); `false` for `CONCURRENTLY` migrations that use `-- drizzle:disable-transaction`.

The `when` timestamps shown above (`1740873600000` = 2026-03-02T00:00:00Z) are illustrative. Actual values are set by `drizzle-kit generate` at the time each migration file is generated.

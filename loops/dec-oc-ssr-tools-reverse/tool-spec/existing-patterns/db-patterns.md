# Daimon — Supabase/PostgreSQL Migration Patterns

Sourced from reading 5 migrations in `supabase/migrations/`. All patterns below are **observed directly**; no guessing.

Migrations read:
1. `20251104000000_create_discord_workflow_system.sql` — primary reference for table/trigger/index patterns
2. `20260125_create_bluedot_transcripts.sql` — GIN indexes, roles, grants, views
3. `20260130_create_thread_tool_contexts.sql` — minimal table, SERIAL PK exception
4. `20260211_create_user_auth_tables.sql` — RLS policies, Supabase Auth integration, Vault
5. `20260217081322_add_admin_impersonation.sql` — simple admin table, UNIQUE constraint
6. `20251216204538_create_session_templates.sql` — ownership columns, TEXT arrays, table-specific triggers
7. `20260223_create_direct_message_sessions.sql` — minimal table, composite UNIQUE

---

## 1. Table Naming

**Convention**: `{feature_prefix}_{noun}` in `snake_case`.

| Prefix | Tables |
|--------|--------|
| `discord_` | `discord_workflow`, `discord_workflow_scope`, `discord_workflow_execution`, `discord_thread_sessions`, `discord_channel_mapping` |
| `bluedot_` | `bluedot_transcripts` |
| `ssr_` | (new) `ssr_panel`, `ssr_persona`, `ssr_run`, `ssr_stimulus`, `ssr_response`, `ssr_score`, `ssr_anchor_set` |
| (no prefix) | `session_templates`, `thread_tool_contexts`, `direct_message_sessions`, `user_identity_discord`, `user_credentials`, `user_profiles`, `admin_impersonation_sessions` |

The `ssr_` prefix for all SSR tables is consistent with the `discord_` prefix pattern.

---

## 2. Primary Keys

**Standard pattern**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`

- Used by: all modern tables (`discord_workflow`, `discord_workflow_scope`, `discord_workflow_execution`, `discord_thread_sessions`, `discord_channel_mapping`, `bluedot_transcripts`, `session_templates`, `user_identity_discord`, `user_credentials`)
- Exception: `thread_tool_contexts` uses `id SERIAL PRIMARY KEY` — older/one-off pattern, **do not follow for SSR**
- Exception: `user_profiles` uses `user_id UUID PRIMARY KEY` (no default — FK to `auth.users`)

**SSR tables**: all use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.

---

## 3. Timestamp Columns

**`created_at`**: always present, almost always `NOT NULL`.
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
Minor variation in older/simpler tables:
```sql
created_at TIMESTAMPTZ DEFAULT NOW()   -- nullable, omit NOT NULL
```
For SSR: use `TIMESTAMPTZ NOT NULL DEFAULT NOW()` (NOT NULL form).

**`updated_at`**: present only when rows are mutable (e.g., `discord_workflow`, `discord_channel_mapping`, `session_templates`, `user_credentials`). Always `NOT NULL`.
```sql
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
For append-only tables (e.g., `discord_workflow_execution`, `discord_workflow_scope`): **no `updated_at`**.

**Other domain timestamps**: when recording when an external event occurred, use a distinct column:
```sql
meeting_created_at TIMESTAMPTZ        -- from bluedot_transcripts
executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- from discord_workflow_execution
started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- from direct_message_sessions
last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
```

**SSR-specific timestamps to include**:
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` — on all tables
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` — on `ssr_panel`, `ssr_run` (mutable)
- `started_at TIMESTAMPTZ` — on `ssr_run` (when pipeline began)
- `completed_at TIMESTAMPTZ` — on `ssr_run` (when pipeline finished, nullable until done)

---

## 4. updated_at Triggers

When a table has `updated_at`, it **always** gets a `BEFORE UPDATE` trigger.

**Shared helper function** (defined once in the initial migration):
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger attachment**:
```sql
CREATE TRIGGER {table_name}_updated_at
    BEFORE UPDATE ON {table_name}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Example:
```sql
CREATE TRIGGER discord_workflow_updated_at
    BEFORE UPDATE ON discord_workflow
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Alternative**: table-specific trigger function (used in `session_templates`):
```sql
CREATE OR REPLACE FUNCTION update_session_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_templates_updated_at
    BEFORE UPDATE ON session_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_session_templates_updated_at();
```

**SSR approach**: reuse the shared `update_updated_at_column()` function (already exists from the initial migration). No need to redefine it. Attach to `ssr_panel` and `ssr_run`.

---

## 5. Column Types

### Text / String

- **Always `TEXT`**, never `VARCHAR(n)`. PostgreSQL best practice.
- Length constraints via CHECK:
  ```sql
  CONSTRAINT discord_workflow_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
  ```

### Booleans

- Always `BOOLEAN NOT NULL DEFAULT {true|false}`. Never nullable.
  ```sql
  is_enabled BOOLEAN NOT NULL DEFAULT true
  has_transcript BOOLEAN NOT NULL DEFAULT FALSE
  is_public BOOLEAN DEFAULT FALSE   -- (nullable variant, less common)
  ```
- For SSR: all boolean flags are `BOOLEAN NOT NULL DEFAULT false`.

### Integers

- `INTEGER` for counts, durations, simple numbers:
  ```sql
  execution_duration_ms INTEGER
  launch_count INTEGER DEFAULT 0
  ```
- `BIGINT` for Discord IDs (can exceed 32-bit int):
  ```sql
  server_id BIGINT
  channel_id BIGINT NOT NULL
  user_id BIGINT NOT NULL
  ```
- `NUMERIC` for arbitrary precision (rare, used for `duration NUMERIC` in bluedot).
- `SERIAL` — deprecated pattern, avoid for SSR.

### Discord IDs: BIGINT vs TEXT

Discrepancy observed: two styles coexist.
- `BIGINT`: used in `discord_workflow_execution` (`user_id BIGINT`), `discord_thread_sessions` (`channel_id BIGINT`).
- `TEXT`: used in `session_templates` (`created_by_discord_id TEXT`), `user_identity_discord` (`discord_id text`), `thread_tool_contexts` (`user_id TEXT`).

**SSR decision**: use `TEXT` for `discord_id` (owner column on `ssr_panel`) — consistent with `session_templates.created_by_discord_id TEXT` and `user_identity_discord.discord_id text`, which are the most semantically similar (user ownership, not channel/server routing).

### JSONB

Used for semi-structured / schema-flexible data:
```sql
tool_slugs JSONB NOT NULL DEFAULT '[]'::jsonb   -- array-shaped JSONB
config JSONB NOT NULL DEFAULT '{}'::jsonb        -- object-shaped JSONB
attendees JSONB                                  -- nullable JSONB
raw_payload JSONB                                -- nullable JSONB
output_data JSONB                                -- nullable JSONB
```

Note: always cast with `::jsonb` for the default value.

**SSR usage**: demographics filter (`JSONB NOT NULL DEFAULT '{}'::jsonb`), psychographics (`JSONB NOT NULL DEFAULT '[]'::jsonb`), model parameters for runs.

### TEXT Arrays

For arrays of simple values:
```sql
tool_slugs TEXT[] NOT NULL DEFAULT '{}'
features TEXT[] DEFAULT '{}'
source_repos TEXT[] DEFAULT '{}'
```

Note: array empty literal is `'{}'`, **not** `'[]'`. The `'[]'` syntax is for JSONB, not native Postgres arrays.

**SSR usage**: `dimensions TEXT[] NOT NULL DEFAULT '{}'` for `ssr_run.evaluation_dimensions`.

### Float Arrays (for embeddings)

Not yet in the existing migrations, but PostgreSQL supports:
```sql
embedding FLOAT8[]   -- unbounded array (runtime size)
```

The `FLOAT8[1536]` syntax is valid PostgreSQL but does **not** enforce size at the DB level (it's advisory). In practice, use `FLOAT8[]` and rely on application logic to ensure 1536 dimensions.

**SSR usage**: `anchor_embedding FLOAT8[]` on `ssr_anchor_set`, `response_embedding FLOAT8[]` on `ssr_score`.

---

## 6. Enum-like Constraints

No native `ENUM` types observed. Status/type columns use:
1. `TEXT NOT NULL` column
2. `CHECK (column IN ('val1', 'val2', ...))` constraint

```sql
status TEXT NOT NULL,
CONSTRAINT discord_thread_sessions_status_valid
    CHECK (status IN ('active', 'waiting_for_approval', 'completed', 'expired'))

status TEXT NOT NULL,
CONSTRAINT discord_workflow_execution_status_valid
    CHECK (status IN ('completed', 'error', 'schema_validation_failed'))

interaction_mode TEXT NOT NULL DEFAULT 'autonomous',
CONSTRAINT discord_workflow_interaction_mode_valid
    CHECK (interaction_mode IN ('autonomous', 'interactive', 'hybrid'))
```

Naming pattern: `CONSTRAINT {table_name}_{column_name}_valid CHECK (...)`

**SSR usage** for `ssr_run.status`:
```sql
status TEXT NOT NULL DEFAULT 'pending',
CONSTRAINT ssr_run_status_valid
    CHECK (status IN ('pending', 'running', 'completed', 'failed'))
```

---

## 7. Foreign Keys

Always `NOT NULL` unless the relationship is optional (e.g., a panel might not always have a parent run):
```sql
workflow_id UUID NOT NULL REFERENCES discord_workflow(id) ON DELETE CASCADE
```

Delete behavior: always `ON DELETE CASCADE` for child records (observed on every FK in the codebase). This means if a panel is deleted, all its personas, runs, responses, and scores are cascade-deleted.

**SSR FK chain**:
```
ssr_panel → (root)
ssr_persona → ssr_panel (CASCADE)
ssr_run → ssr_panel (CASCADE)
ssr_stimulus → ssr_run (CASCADE)
ssr_response → ssr_run + ssr_persona (CASCADE on both)
ssr_score → ssr_response (CASCADE); dimension as TEXT (not FK to anchor set)
ssr_anchor_set → (standalone, no parent)
```

---

## 8. Unique Constraints

**Inline** (single column):
```sql
thread_id BIGINT UNIQUE NOT NULL
meeting_id TEXT UNIQUE NOT NULL
discord_id text not null unique
```

**Named constraint** (multi-column):
```sql
CONSTRAINT discord_workflow_scope_unique UNIQUE(workflow_id, server_id, channel_id)
```

**Inline on table** (alternative to named):
```sql
UNIQUE (platform, platform_user_id)   -- from direct_message_sessions
unique(user_id, platform)             -- from user_credentials
```

---

## 9. Index Naming

Convention: `idx_{table_name}_{columns_or_description}`

```sql
idx_discord_workflow_enabled
idx_discord_workflow_scope_lookup
idx_discord_workflow_scope_workflow
idx_discord_workflow_execution_workflow_time
idx_discord_workflow_execution_message
idx_discord_thread_sessions_thread
idx_bluedot_meeting_id
idx_bluedot_meeting_created_at
idx_session_templates_slug
```

---

## 10. Index Patterns

### Standard lookup index
```sql
CREATE INDEX idx_{table}_{col} ON {table}({col});
```

### Composite for multi-column lookups
```sql
CREATE INDEX idx_discord_workflow_scope_lookup
    ON discord_workflow_scope(server_id, channel_id, is_enabled)
    WHERE is_enabled = true;
```

### Partial index (WHERE clause)
Used when only a subset of rows is queried:
```sql
CREATE INDEX idx_discord_workflow_enabled ON discord_workflow(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_discord_thread_sessions_expiry ON discord_thread_sessions(expires_at) WHERE status = 'active';
CREATE INDEX idx_discord_workflow_execution_thread_time ON discord_workflow_execution(thread_id, executed_at DESC) WHERE thread_id IS NOT NULL;
```

### Time-ordered (DESC for "most recent first")
```sql
CREATE INDEX idx_discord_workflow_execution_workflow_time ON discord_workflow_execution(workflow_id, executed_at DESC);
CREATE INDEX idx_bluedot_meeting_created_at ON bluedot_transcripts(meeting_created_at DESC NULLS LAST);
```

### GIN for JSONB
```sql
CREATE INDEX IF NOT EXISTS idx_bluedot_raw_payload ON bluedot_transcripts USING GIN (raw_payload);
```

### `IF NOT EXISTS` guard
Used inconsistently — some migrations use it (`CREATE INDEX IF NOT EXISTS`), others don't. Prefer using it for SSR to be safe.

### Recommended SSR indexes

```sql
-- ssr_panel: lookup by owner
CREATE INDEX IF NOT EXISTS idx_ssr_panel_discord_id ON ssr_panel(discord_id);
CREATE INDEX IF NOT EXISTS idx_ssr_panel_created_at ON ssr_panel(created_at DESC);

-- ssr_persona: lookup by panel
CREATE INDEX IF NOT EXISTS idx_ssr_persona_panel_id ON ssr_persona(panel_id);

-- ssr_run: lookup by panel, most-recent-first; filter by status
CREATE INDEX IF NOT EXISTS idx_ssr_run_panel_id ON ssr_run(panel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ssr_run_status ON ssr_run(status) WHERE status IN ('pending', 'running');

-- ssr_stimulus: lookup by run
CREATE INDEX IF NOT EXISTS idx_ssr_stimulus_run_id ON ssr_stimulus(run_id);

-- ssr_response: lookup by run; lookup by persona+run
CREATE INDEX IF NOT EXISTS idx_ssr_response_run_id ON ssr_response(run_id);
CREATE INDEX IF NOT EXISTS idx_ssr_response_persona_run ON ssr_response(persona_id, run_id);

-- ssr_score: lookup all scores for a run
CREATE INDEX IF NOT EXISTS idx_ssr_score_run_id ON ssr_score(run_id);
CREATE INDEX IF NOT EXISTS idx_ssr_score_response_id ON ssr_score(response_id);

-- ssr_anchor_set: lookup by dimension name
CREATE INDEX IF NOT EXISTS idx_ssr_anchor_set_dimension ON ssr_anchor_set(dimension_name);
```

---

## 11. Row Level Security (RLS)

**Not used for bot-owned tables**. The bot connects via `service_role` key which bypasses RLS entirely.

RLS is used **only** when exposing data directly to Supabase Auth users (web clients):
- `user_identity_discord` — users can only see/modify their own record
- `user_credentials` — users can only see/modify their own credentials

RLS policy pattern:
```sql
alter table public.{table} enable row level security;

create policy "Users can read own {table}"
    on public.{table} for select
    using (auth.uid() = user_id);

create policy "Users can insert own {table}"
    on public.{table} for insert
    with check (auth.uid() = user_id);
```

**SSR tables**: **no RLS**. The bot is the only writer/reader, and it uses the service_role key. No end-user direct Supabase access anticipated.

---

## 12. Schema Qualification

Most tables are unqualified (default `public` schema):
```sql
CREATE TABLE discord_workflow (...)          -- no schema prefix
CREATE TABLE session_templates (...)         -- no schema prefix
```

Explicit `public.` qualification for tables that have RLS and are accessed by Supabase Auth clients:
```sql
create table public.user_identity_discord (...)
create table public.user_credentials (...)
```

**SSR tables**: no `public.` prefix (consistent with `discord_workflow`, `session_templates`).

---

## 13. Nullable vs NOT NULL

Default to NOT NULL for important fields. Use nullable for:
- Optional enrichment fields: `description TEXT`, `summary TEXT`, `summary_v2 TEXT`, `error_message TEXT`
- Optional foreign relations: `server_id BIGINT` (nullable — global scope has no server)
- Timing fields that populate over time: `completed_at TIMESTAMPTZ`, `last_launched_at TIMESTAMPTZ`
- External identifiers that may not always be set: `temporal_workflow_id TEXT`, `temporal_run_id TEXT`

---

## 14. Table Comments

Applied inconsistently, but best practice:
```sql
COMMENT ON TABLE discord_workflow IS 'User-defined workflows for Discord bot automation';
COMMENT ON TABLE discord_workflow_scope IS 'Maps workflows to Discord contexts (global, server, or channel)';
COMMENT ON COLUMN thread_tool_contexts.thread_id IS 'Discord thread/channel ID';
COMMENT ON COLUMN thread_tool_contexts.tool_slugs IS 'List of MCP tool names available in this thread';
```

**SSR migration**: include `COMMENT ON TABLE` for all 7 tables.

---

## 15. Migration File Naming

Convention: `{timestamp}_{description}.sql`

Timestamp formats observed:
- `20251104000000` — 14-digit (YYYYMMDDHHMMSS)
- `20260130` — 8-digit (YYYYMMDD, no time)

For SSR migration: use 8-digit format with a future date:
```
20260301_create_ssr_panel_tables.sql
```

---

## 16. Roles and Grants

Observed in `bluedot_transcripts`:
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bluedot_webhook_writer') THEN
        CREATE ROLE bluedot_webhook_writer;
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON bluedot_transcripts TO bluedot_webhook_writer;
```

**SSR**: no custom roles needed. The bot uses the existing service_role key which has full access. No grants needed.

---

## 17. Views

One view observed:
```sql
CREATE OR REPLACE VIEW bluedot_accessible_meetings AS
SELECT * FROM bluedot_transcripts
WHERE (raw_payload->'_validation'->>'is_accessible')::boolean IS TRUE
   OR raw_payload->'_validation' IS NULL;
```

**SSR**: no views needed in the initial migration. The application layer (SQLAlchemy queries) handles filtering.

---

## SSR-Specific: Applied Patterns Summary

| Pattern | Application to SSR |
|---------|--------------------|
| Table prefix | `ssr_` on all 7 tables |
| Primary key | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Timestamps | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` on all; `updated_at` + trigger on `ssr_panel`, `ssr_run` |
| Discord user ID | `discord_id TEXT NOT NULL` on `ssr_panel` (ownership) |
| Status column | `TEXT NOT NULL DEFAULT '...'` + `CHECK (status IN (...))` |
| FK delete | `ON DELETE CASCADE` on all child tables |
| Enums | CHECK constraint, no native ENUM type |
| JSONB | demographics (`'{}'::jsonb`), psychographics (`'[]'::jsonb`), model config |
| TEXT arrays | `evaluation_dimensions TEXT[] NOT NULL DEFAULT '{}'` |
| Float arrays | `embedding FLOAT8[]` for sentence embeddings |
| RLS | None (service_role access) |
| Schema prefix | None (`public.` implicit) |
| Indexes | Prefix `idx_ssr_*`, partial where appropriate, DESC for time-ordered |
| `updated_at` trigger | Reuse existing `update_updated_at_column()` function |
| Migration filename | `20260301_create_ssr_panel_tables.sql` |

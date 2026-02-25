# Analysis: webapp-campaign-wizard

## Purpose

The campaign wizard is the primary onboarding and creation flow for every campaign in Cheerful. A user walks through 7 ordered steps, each collecting a distinct category of information, and submits a single multipart `POST /api/campaigns/launch` request at the end. All state lives in a Zustand store so the user can navigate backward without data loss. The wizard also supports draft campaigns (load from draft, auto-save in background).

**User problem solved**: Brands need to configure dozens of campaign settings before a cold email sequence can begin. The wizard breaks that complexity into digestible, sequentially-validated steps with AI assistance at key points (email generation, rules generation, tracking rules).

---

## Files

| Path | Role |
|------|------|
| `apps/webapp/app/(mail)/campaigns/new/new-campaign-client.tsx` | Root orchestration component — wires all hooks, renders step components |
| `apps/webapp/app/(mail)/campaigns/new/page.tsx` | Next.js page entry point |
| `apps/webapp/stores/campaign-wizard-store.ts` | Zustand store — all wizard state + actions + selector hooks |
| `apps/webapp/app/(mail)/campaigns/new/hooks/` | Per-step hooks that read/write the store and call APIs |
| `apps/webapp/components/campaigns/new-campaign/` | Step UI components (pure presentational) |
| `apps/webapp/hooks/use-campaign-wizard-actions.ts` | Cross-step action hook (product scraping) |
| `apps/webapp/hooks/use-campaign-mutations.ts` | TanStack Query mutations (update, delete, toggle status, duplicate) |

---

## Wizard State Machine

### Step Numbering

Steps are numbered 0–7 in UI, plus the special string `'3b'` for a paid-campaign-only intermediate step, plus `9` as the "returned from edit" confirmation target.

```
step 0  → Campaign Creation Landing (role selection)
step 1  → Campaign Details (name, type, email accounts)
step 2  → Product Information OR Creator Info (varies by type)
step 3  → Creators (CSV / search / import)
step '3b' → [paid only] Intermediate deliverables step
step 4  → Email Sequence (initial + follow-ups + opt-in/out + signature)
step 5  → Goals & FAQs (seeding/sales) OR Deliverables (paid)
step 6  → Integrations (Google Sheets / Shopify / Slack)
step 7  → Review & Launch
step 9  → Return target after editing from Review
success → Campaign launched success screen
```

### Navigation Rules (store: `campaign-wizard-store.ts:401-436`)

```
goToNextStep():
  step 3 + paid campaign → step '3b'
  step '3b' → step 4
  otherwise → currentStep + 1

goToPreviousStep():
  step '3b' → step 3
  step 4 + paid campaign → step '3b'
  step 2 + (creator | salesperson) → step 0   [skip back to landing]
  otherwise → currentStep - 1

goToStepForEdit(step):
  set currentStep = step, editingFromConfirmation = true

returnFromEdit():
  set currentStep = 9, editingFromConfirmation = false
```

### User Type → Step Config

```typescript
// campaign-wizard-store.ts:448-457
getStepConfig():
  creator    → { totalSteps: 3,  canSkipType: true }
  salesperson → { totalSteps: 9,  canSkipType: true }
  advertiser  → { totalSteps: 10, canSkipType: false }
```

Creator campaigns show only steps 1, 2 (creator info), and 7 (review). Steps 3, 4, 5, 6 are hidden.

---

## Step-by-Step Specification

### Step 0: Campaign Creation Landing
**Component**: `step-1/campaign-creation-landing.tsx`
**Purpose**: User selects their persona (Advertiser, Creator, Salesperson) before entering the main wizard.

---

### Step 1: Campaign Details
**Components**: `step-1/campaign-information.tsx` + `step-1/email-setup.tsx`
**Purpose**: Establishes the campaign's identity and email sending infrastructure.

#### Campaign Information (`campaign-information.tsx`)

**Fields**:
| Field | Type | Validation |
|-------|------|------------|
| Campaign Name | text input | Required (non-empty) |
| Campaign Type | card selector | Required (seeding / paid / other→subtype) |

**Campaign Type Cards**:
- **Seeding/Gifting** — Send free products for organic content; no payment required
- **Paid Promotion** — Pay creators for guaranteed deliverables
- **Other** → expands to sub-types:
  - **Salesperson** — Outreach to prospects, book sales calls
  - **Creator** — Manage incoming brand deals (reversed flow — creator is the user, not the target)

Selecting "Other" triggers an animated `AnimatePresence` reveal of sub-type cards. The internal type stored is `'sales'` or `'creator'` (not `'other'`).

#### Email Setup (`step-1/email-setup.tsx`)

**Fields**:
| Field | Type | Notes |
|-------|------|-------|
| Communication Preference | radio cards | `'cheerful'` or `'external'` |
| Email Accounts | searchable checkbox list | Multi-select from connected Gmail accounts |

**Communication Preferences**:
- **Cheerful (Recommended)** — Platform manages the full sending pipeline including follow-ups and opt-in/out detection
- **Other External Provider** — User sends via Instantly, Mixmax, etc.; Cheerful handles replies only. When external: hide "Add Follow-Up" button in step 4.

**Email Account List**:
- Pulls connected Gmail/SMTP accounts from backend
- Searchable with local filter
- "Add X matching" bulk-select shortcut when searching
- "Connect New Email" button links to email settings
- Selected emails shown as dismissible pills below the checkbox list
- Suggestions fetched from `POST /api/suggest-campaign-emails` on campaign name change (debounced, queued if another fetch is in-flight; `campaign-wizard-store.ts:653-693`)

**Step 1 Completion** (`use-step-completion.ts:247-253`):
- Campaign name non-empty
- Valid type selected (seeding / paid / sales — not null/other)
- At least one email account connected

---

### Step 2: Product Information (Advertiser/Salesperson)
**Components**: `step-2/product-details.tsx`, `step-2/campaign-brief-upload.tsx`
**Purpose**: Captures what product/service is being promoted so AI can generate relevant email content.

#### Product Cards

Each product is a `ProductCard` record in the store (multiple products supported):

```typescript
interface ProductCard {
  id: string            // crypto.randomUUID()
  source: 'new' | 'existing'
  inputMethod: 'ai' | 'manual'
  url: string           // Scraping source URL
  name: string
  description: string
  lastScrapedUrl?: string    // Cache key — avoids re-scraping same URL
  existingProductId: string | null
  searchQuery: string
}
```

**New Product Form** (`step-2/product-details.tsx:296-395`):
1. **Product URL** (optional) — paste URL → auto-scrape via Firecrawl (backend `/products/scrape`). URL icon turns purple spinner while scraping. Result fills name + description.
2. **OR** manual entry: Product Name + Product Description (textarea, 7 rows)

**Existing Product Form** (`step-2/product-details.tsx:408-543`):
- Search bar filters team's existing products in real-time
- Product items show name + creation date; selected item highlighted with gradient border
- Connects `existingProductId` to a previously created product record

**Multiple Products**: Users can add multiple product cards (each collapsible). Collapsed cards show name + truncated description. At least one card always present — removing the last creates a fresh empty card.

**Campaign Brief Upload** (`step-2/campaign-brief-upload.tsx`):
- PDF/doc upload triggers background creator search (`use-brief-creator-search.ts`)
- Extracts campaign context from brief for auto-population

**Step 2 Completion**:
- New product: name + description both non-empty
- Existing product: `selectedProductId` non-null

---

### Step 2 (Creator Flow): Creator Info
**Component**: `step-2-creator/creator-info-step.tsx`
**Purpose**: For creator-type campaigns, collect the creator's own info so AI can respond to brand deals on their behalf.

**Fields** (all optional):
| Field | Type | Notes |
|-------|------|-------|
| Media Kit Link | URL input | Validated as valid URL |
| Audience Demographics | textarea | e.g., "80% female, ages 25-34, US and Canada" |
| Rate Information | textarea | e.g., "Instagram posts: $500, YouTube: $2,000" |

These fields are stored in `mediaKitLink`, `demographicsInfo`, `rateInfo` in the wizard store and used by LLM to generate context-aware FAQs and auto-responses.

---

### Step 3: Creators
**Component**: `step-6/creators.tsx` (note: folder numbering vs step numbering mismatch — folder is `step-6` but step is 3 in the wizard)
**Purpose**: Build the recipient list — the creators who will receive outreach emails.

#### Tabs

1. **Upload CSV** — Manual upload of a spreadsheet with creator emails, names, and custom merge-tag fields
2. **Search** — Embedded AI-powered creator discovery
3. **Import from Lists** — Pull from saved creator lists

#### CSV Upload Sub-flow

- File input accepts `.csv` files
- Parsed client-side with `use-csv-parser.ts`
- Validates: email column present, email format valid
- Custom columns become merge-tag variables (`{{column_name}}` in email templates)
- Skipped records (invalid rows) surfaced in a summary
- Social profile validation: rows without `@handle` fields trigger `SocialValidationError` warnings

**Paid Campaign Extra**: When `campaignType === 'paid'`, a **Paid Offer Entry** dialog (`shared/paid-offer-entry-dialog.tsx`) lets users specify per-creator offer amounts for inclusion in emails.

#### Embedded Creator Search (`step-6/search/`)

- `EmbeddedSearchInput` → query input + platform selector
- `EmbeddedSearchLoading` → skeleton while Apify/YouTube search runs
- `EmbeddedSearchResults` → list of `UnifiedCreator` results with Add/Remove
- `AddedCreatorsSummary` → confirmation of added creators before proceeding
- Added search creators merge into `parsedCsvData` at add time with a `SEARCH_PLACEHOLDER_EMAIL_PREFIX` sentinel email for creators without confirmed emails (enriched post-launch)

#### "Find Me Creators" Mode (Brief Creator Search)

- Triggered by uploading a campaign brief in step 2
- Runs `use-brief-creator-search.ts` in background during wizard
- When complete, sets `briefCreatorSearchCompleted = true` (satisfies step 3 requirement even with no CSV)

**Step 3 Completion**:
- At least one creator with a valid email in `parsedCsvData` OR at least one search-added creator with email, with zero `socialValidationErrors`
- OR `briefCreatorSearchCompleted === true`

---

### Step 3b: (Paid Campaigns Only — Intermediate Step)
**Purpose**: This step exists between Creators (3) and Email Sequence (4) specifically for paid campaigns. Based on the store's step '3b' handling, this step captures deal-specific information before email composition. The component is rendered conditionally in `new-campaign-client.tsx` when `currentStep === '3b'`.

---

### Step 4: Email Sequence
**Component**: `step-4/email-outreach.tsx`
**Purpose**: Compose the full email outreach sequence — initial email, follow-ups, opt-in/out templates, and email signature. AI generation is available throughout.

#### Three Tabs

**1. Email Sequence tab** (`step-4/email-sequence.tsx`):
- **Initial Email** — Subject line + HTML body editor
- **Follow-Up N** — Body only (no subject), with configurable wait days (1–30)
- **"+ Add Follow-Up"** button (hidden if `communicationPreference === 'external'`)
- **Delete follow-up** per item

**2. Opt-In/Opt-Out tab** (`step-4/opt-in-opt-out.tsx`):
- Toggle: include opt-in/opt-out response handling
- **Opt-In** email body — sent when creator responds positively
- **Opt-Out** email body — sent when creator declines
- Selecting this tab triggers AI generation of opt-in/opt-out content if not yet generated

**3. Signature tab** (`step-4/signature-editor.tsx`):
- Toggle: enable/disable signature appending
- Rich textarea for signature content
- AI "Rewrite Signature" with action prompt

#### Email Content Editor (`step-4/email-content-editor.tsx`)

Shared editor for whichever email is selected:
- **Subject line** (hidden for follow-ups and opt-in/out) with AI rewrite button
- **HTML body textarea** with `{{merge_tag}}` validation
- **CC Emails** multi-input
- **AI actions**: rewrite entire body, rewrite for brevity, make more formal, etc.
- **Merge tag validation**: warns if `{{tag}}` used in email body has no matching column in uploaded CSV
- **Preview/Test** modal button (sequence tab only): renders email with CSV sample data

#### Email Preview/Test Modal (`shared/email-preview-modal.tsx`)
- Renders email with actual CSV row data substituted
- Shows sender address, CC, subject, body
- Allows sending test email to yourself

**Step 4 Completion**:
- Initial email has non-empty subject AND non-empty body (strip HTML tags check)

---

### Step 5: Goals & FAQs / Deliverables
**Components**: `step-3/campaign-goal.tsx`, `step-3/faqs.tsx`, `step-3/expected-deliverables.tsx`, `step-3/deal-structure.tsx`
(Note: folder `step-3` contains these components)
**Purpose**: Captures the campaign's strategic context — given to the LLM so it can draft contextually appropriate replies to creator responses.

#### Seeding / Sales Campaigns

| Component | Field | Purpose |
|-----------|-------|---------|
| `CampaignGoal` | `campaignGoal` textarea | Describes campaign objectives for LLM context |
| `FAQs` | `campaignFaqs[]` | Q&A pairs; auto-generated by AI, editable |

FAQs are stored with a `"question|||answer"` separator convention in the store's `CampaignRule.text` field, then split on display. Each FAQ has add/edit/delete/ignore (soft-delete) functionality.

**AI auto-generation**: When navigating to this step, the system auto-generates goal and FAQs based on product name/description using backend AI endpoint.

#### Paid Campaigns

| Component | Field | Purpose |
|-----------|-------|---------|
| `ExpectedDeliverables` | `expectedDeliverables` textarea | What creator must produce (posts, videos, stories) |
| `DealStructure` | `dealStructure` textarea | How creator will be compensated |
| `FAQs` | `campaignFaqs[]` | Same FAQ system |

At launch time, `expectedDeliverables` + `dealStructure` are concatenated into `campaign_goal` for backend storage (`use-campaign-submit.ts:108-118`).

**Step 5 Completion**:
- Must visit the step (to review/approve AI-generated content)
- Seeding/sales: `campaignGoal` non-empty
- Paid: both `expectedDeliverables` and `dealStructure` non-empty

---

### Step 6: Integrations
**Component**: `step-5/integrations.tsx` (folder `step-5`)
**Purpose**: Connect external tools to automate post-outreach data capture and workflow.

#### Available Integrations

**Google Sheets** (optional):
- Toggle → opens modal (`step-5/google-sheets-modal.tsx`)
- Input Google Sheets URL → backend verifies access + fetches tab list
- Select tab for data writing
- AI-generated **tracking rules** (natural-language instructions for what data to capture per row): `isGeneratingTrackingRules` state, regenerate button
- Rules are editable (add/edit/delete/ignore)
- If modal closed without completing config → integration auto-disabled

**Shopify** (optional):
- Toggle → opens modal (`step-5/shopify-modal.tsx`)
- **GoAffPro Token** — API token for affiliate/discount integration; validated via backend
- **Discount Configuration**:
  - Enable/disable discount codes
  - Type: percentage or fixed_amount
  - Value + currency
  - Formatting instructions (how to construct code, e.g., "Use firstName + discount amount: JOHN20")
- **Order Tracking**:
  - Enable/disable order tracking
  - Product selection (fetched from Shopify catalog)
  - Variant selection within product
- If closed without valid token → integration auto-disabled

**Slack** (optional):
- Simple text input for Slack Channel ID
- Used for campaign notifications
- Only supported for `seeding` campaigns

**Step 6 Completion**:
- Must visit the step
- If Google Sheets enabled: URL verified valid + tab selected + at least 1 tracking rule
- If Shopify enabled: GoAffPro token verified valid

---

### Step 7: Review & Launch
**Components**: `step-7/review-launch.tsx`, `step-7/campaign-settings.tsx`
**Purpose**: Final check-all-settings panel with inline editing and launch button. Two sub-components in a two-column layout.

#### ReviewLaunch (`review-launch.tsx`)

Collapsible sections showing current values:

| Section | Shown For | Edit Action |
|---------|-----------|-------------|
| Campaign Name | All | Inline edit |
| Connected Emails | All | Add/remove |
| Goal | Non-paid | `goToStepForEdit(5)` |
| Additional Rules | All | Inline edit |
| FAQs | All | Inline edit |
| Integrations | If enabled | `goToStepForEdit(6)` |
| Email Content | Non-external | `goToStepForEdit(4)` |
| Follow-Up Settings | If follow-ups configured | Inline toggle/edit |
| Automation Level | All | `manual` / `semi-automated` radio |
| Lookalike Suggestions | All | Toggle |
| Sample Emails (Opt-In/Out) | Non-creator | View opt-in/out email bodies |

**"Edit" buttons** call `goToStepForEdit(stepNumber)` which sets `editingFromConfirmation = true` and navigates to that step. On completion, `returnFromEdit()` returns to step 9 (which is the review completion target).

**Launch Button**:
- Disabled with tooltip until `missingRequirements.length === 0`
- Calls `submitCampaign()` which builds `CampaignLaunchRequest` and POSTs to `/api/campaigns/launch`
- Shows spinner during `isSubmitting`

#### CampaignSettings (`step-7/campaign-settings.tsx`)

Advanced settings panel (right column). Sections:

| Section | Controls |
|---------|----------|
| Goal | Editable textarea |
| Rules | Editable textarea (additional campaign rules) |
| FAQs | Full CRUD: add/edit/delete FAQ pairs |
| Integrations | Google Sheets + Shopify toggles with full config |
| Email Content | Subject + body editors |
| Follow-Up Settings | Enable/disable, gap in days, max follow-ups |
| Automation Level | `manual` or `semi-automated` radio |
| Lookalike Suggestions | Enable/disable toggle |
| Sample Emails | Opt-in / opt-out textarea bodies |

**Automation Levels** (`step-7/sections/automation-level-section.tsx`):
- **Manual** — All replies are drafted for review before sending
- **Semi-automated** — Simple opt-in replies sent automatically; replies with questions drafted for review

---

### Success Screen
**Component**: `shared/campaign-success.tsx`
Shown after successful launch. Displays campaign name, recipients count, links to campaign inbox.

---

## State Architecture

### Zustand Store Schema (`campaign-wizard-store.ts`)

```typescript
CampaignWizardState {
  // Navigation
  currentStep: number | '3b'
  selectedUserType: 'advertiser' | 'creator' | 'salesperson' | null
  selectedCampaignType: 'seeding' | 'paid' | 'sales' | 'creator' | null
  editingFromConfirmation: boolean
  isSubmitting: boolean
  submitError: string | null

  // Products
  products: ProductCard[]          // Multiple products supported
  expandedProductId: string | null // Accordion state

  // Campaign Content
  campaignName: string
  campaignGoal: string
  campaignRules: CampaignRule[]    // Default: 3 seeding rules pre-populated
  campaignFaqs: CampaignRule[]     // Format: "question|||answer" in text field
  campaignImage: File | null
  sampleEmailOptIn: string
  sampleEmailOptOut: string
  expectedDeliverables: string
  dealStructure: string
  mediaKitLink: string             // Creator campaigns only
  demographicsInfo: string         // Creator campaigns only
  rateInfo: string                 // Creator campaigns only
  lastGeneratedRulesFor: string | null
  isGeneratingCampaignSettings: boolean

  // Integrations
  integrationSettings: { googleSheets: boolean; shopify: boolean }
  googleSheetUrl: string
  selectedSheetTab: string | null
  trackingRules: TrackingRule[]
  goaffproToken: string
  goaffproTokenStatus: 'idle'|'verifying'|'valid'|'invalid'
  shopifyDiscountEnabled: boolean
  shopifyDiscountType: 'percentage' | 'fixed_amount'
  shopifyDiscountValue: number      // Default: 10
  shopifyDiscountCurrency: string   // Default: 'USD'
  shopifyDiscountFormattingInstructions: string
  shopifyOrdersEnabled: boolean
  shopifyProducts: ShopifyProduct[]
  shopifyProductId: string | null
  shopifySelectedVariations: ShopifyVariation[]

  // Email
  emailProvider: 'cheerful' | 'external'
  selectedAccounts: string[]
  initialEmail: string             // Subject stored separately
  subjectLine: string
  emailBody: string
  ccEmails: string[]
  followUpTemplates: FollowUpTemplate[]
  csvFile: File | null
  parsedCsvData: CsvData[]
  csvHeaders: string[]
  isGeneratingEmailContent: boolean
  cachedEmailContent: { subject: string; body: string } | null
  isRegeneratingEmail: 'subject' | 'body' | null
  suggestedEmails: string[]
  isFetchingSuggestions: boolean

  // Signature
  emailSignature: string
  emailSignatureEnabled: boolean
  isRewritingSignature: boolean
}
```

**Default rules pre-populated** (`campaign-wizard-store.ts:305-309`):
```
1. "Product gifting - no payment required"
2. "Creator provides shipping address"
3. "Confirmation email sent after shipping"
```

### Selector Hooks (Performance Optimization)

The store exports domain-scoped selector hooks using `useShallow` to prevent unnecessary re-renders:

| Hook | Domain |
|------|--------|
| `useWizardNavigation()` | Step + type + navigation actions |
| `useProductState()` | Product cards |
| `useCampaignContentState()` | Name, goal, rules, FAQs |
| `useIntegrationState()` | Google Sheets, Shopify, GoAffPro |
| `useEmailState()` | Email + signature + CSV |
| `useRuleEditingState()` | Inline rule/tracking edit session |

---

## Campaign Submission

### Payload Construction (`use-campaign-submit.ts:93-237`)

`POST /api/campaigns/launch` receives multipart FormData:
- `campaign_data`: JSON-stringified `CampaignLaunchRequest`
- `csv_file`: optional CSV file (when uploaded directly vs. parsed)

**Key transformations**:

| Frontend | Backend Field | Notes |
|----------|---------------|-------|
| `campaignName` | `campaign_name` | |
| `selectedType: 'seeding'` | `campaign_type: 'seeding'` | |
| `communicationPreference: 'external'` | `is_external: true` | creator type also sets `is_external: true` |
| `campaignGoal` | `campaign_goal` | For paid: concatenated deliverables + deal structure |
| `faqs[]` | `campaign_faqs[]` | `{question, answer}` format |
| `optInEmail.body + optOutEmail.body` | `sample_emails` | Only when `includeOptInOptOut = true` |
| `parsedCsvData[]` | `recipients[]` | Rows without valid `@email` filtered out |
| `followUpTemplates[]` | `follow_up_templates[]` | Filtered to non-empty body only |
| `integrationSettings.shopify` | `integrations` | Full ShopifyIntegration object |
| `integrationSettings.googleSheets` | `tracking_rules`, `google_sheet_url`, `google_sheet_tab_title` | |
| `automationLevel` | `automation_level` | Default: `'manual'` |
| `emailSignature` | `email_signature` | Backend creates signature record atomically |
| `slackChannelId` | `slack_channel_id` | Only for seeding campaigns |

**Creators without emails**: rows where email doesn't contain `@` are filtered from `recipients`. Count stored in `has_creators_pending_enrichment` flag so backend knows to trigger async enrichment workflow.

### Campaign Submit Hooks (`apps/webapp/app/(mail)/campaigns/new/hooks/`)

| Hook | Purpose |
|------|---------|
| `use-campaign-details.ts` | Step 1 state (name, type, email accounts) |
| `use-product-details.ts` | Step 2 product state + scraping trigger |
| `use-campaign-brief.ts` | PDF brief upload + parsing |
| `use-brief-creator-search.ts` | Background creator search from brief |
| `use-creators.ts` | CSV parsing, search creators, validation |
| `use-email-sequence.ts` | Email content, follow-ups, opt-in/out, AI generation |
| `use-goals-faqs.ts` | Goal/FAQ auto-generation trigger + state |
| `use-integrations.ts` | Google Sheets verification, Shopify products |
| `use-review-launch.ts` | Review-step compilation of all state |
| `use-creator-info.ts` | Creator-type info fields |
| `use-step-completion.ts` | `completedSteps: Set<number>` + `missingRequirements[]` |
| `use-campaign-submit.ts` | Final submission via `POST /api/campaigns/launch` |
| `use-draft-load.ts` | Load campaign from draft on mount |
| `use-draft-save.ts` | Auto-save wizard state as draft |

---

## Validation Logic (`use-step-completion.ts`)

### Completion Matrix

| Step | Seeding | Paid | Sales | Creator |
|------|---------|------|-------|---------|
| 1 | name + type + email | same | same | type + email (no name req) |
| 2 | product name + desc | same | same | visited (all optional) |
| 3 | creators > 0 + no social errors | same | same | hidden (auto-complete) |
| 4 | initial email valid (subject + body) | same | hidden | hidden |
| 5 | goal non-empty | deliverables + deal structure | goal | hidden |
| 6 | visited (+ integration config if enabled) | same | same | hidden |
| 7 | visited | same | same | visited |

### Missing Requirements (Launch Blockers)

The `useMissingRequirements()` hook returns user-facing messages for each incomplete item. The Launch button is disabled with tooltip showing these messages until empty.

Examples:
- "Enter a campaign name" (step 1)
- "Select a campaign type" (step 1)
- "Connect an email account" (step 1)
- "Add at least one creator" (step 3)
- "Add a subject line to your initial email" (step 4)
- "Enter a campaign goal" (step 5)
- "Verify Google Sheets URL" (step 6)
- "Add tracking rules" (step 6)

---

## AI-Assisted Features in Wizard

| Feature | Trigger | API Call |
|---------|---------|----------|
| Product scraping | URL input → blur | `POST /products/scrape` (Firecrawl) |
| Email account suggestions | Campaign name change | `POST /api/suggest-campaign-emails` |
| Initial email generation | Step 4 navigation | Backend AI endpoint |
| Opt-in/opt-out generation | Tab selection | Backend AI endpoint |
| Signature rewrite | "Rewrite with AI" button | Backend AI endpoint |
| Subject rewrite | "Rewrite" button | Backend AI endpoint |
| Body rewrite (multiple actions) | Dropdown action | Backend AI endpoint |
| Goal + FAQ generation | Step 5 navigation | Backend AI endpoint |
| Tracking rules generation | Google Sheets configured | Backend AI endpoint |
| Brief-based creator search | Campaign brief uploaded | Backend Apify search workflow |

---

## Draft System

- **Loading** (`use-draft-load.ts`): On mount, if `draftId` param present, fetches draft from backend and populates wizard store
- **Saving** (`use-draft-save.ts`): Auto-saves wizard state as draft at key transitions (step changes)
- **Draft campaigns** are surfaced in the campaigns list with a "Draft" badge
- On launch, `draft_campaign_id` is sent so backend can promote draft → active campaign

---

## Wizard UI Structure

```
NewCampaignClient
├── TopBanner (campaign name, step counter)
├── StepSidebar (steps 1-7, completion indicators)
│   └── StepItem (gradient if active/completed/visited)
├── [Step 0] CampaignCreationLanding
├── [Step 1]
│   ├── CampaignInformation
│   └── EmailSetup
├── [Step 2] ProductDetails | CreatorInfoStep
├── [Step 2 Brief] CampaignBriefUpload
├── [Step 3] Creators
│   ├── CreatorTabToggle
│   ├── [upload tab] CSV file upload + table
│   ├── [search tab] EmbeddedSearch
│   └── [lists tab] ImportFromLists
├── [Step 3b] (Paid intermediate)
├── [Step 4] EmailOutreach
│   ├── EmailOutreachToggle (Sequence | Opt-In/Out | Signature)
│   ├── EmailSequence | OptInOptOut | SignatureEditor (left)
│   └── EmailContentEditor (right)
├── [Step 5] CampaignGoal + FAQs | ExpectedDeliverables + DealStructure
├── [Step 6] Integrations
│   ├── GoogleSheetsModal
│   ├── ShopifyModal
│   └── IntegrationCard[]
├── [Step 7]
│   ├── ReviewLaunch
│   └── CampaignSettings
├── [Success] CampaignSuccess
├── ActionFooter (Back / Next / Launch)
├── OfferColumnsDialog (paid CSV mapping)
├── InvalidTagsDialog (merge tag validation)
└── RulesLoader (AI rules generation progress)
```

---

## Key Design Decisions

1. **Folder numbering ≠ step numbering**: Component folders (step-1 through step-7) don't directly map to wizard step numbers. E.g., `step-3/` contains Goals/FAQs (wizard step 5), `step-6/` contains Creators (wizard step 3). This is a historical artifact.

2. **FAQ encoding**: FAQs are stored as `{ id, text: "question|||answer" }` using a `|||` delimiter in the same `CampaignRule[]` type as rules, rather than a dedicated typed structure. Splitting happens at display time.

3. **Creator email sentinel**: Search-added creators without confirmed emails use a `SEARCH_PLACEHOLDER_EMAIL_PREFIX` sentinel (`"search-placeholder-{id}@..."`) so they appear in the creator list but are filtered from actual `recipients[]` at submit time. Backend enriches them post-launch.

4. **External provider mode**: When `communicationPreference === 'external'`, email sequence step is partially hidden (no follow-up button), and `is_external: true` is sent to backend — email delivery is not managed by Cheerful.

5. **Step '3b' notation**: The store uses a string literal `'3b'` (not a number) to represent the paid-campaign intermediate step, allowing type-safe discrimination from numeric steps.

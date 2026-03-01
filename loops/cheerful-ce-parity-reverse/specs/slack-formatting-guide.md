# Slack Formatting Guide — Cheerful Context Engine

**Spec file**: `specs/slack-formatting-guide.md`
**Status**: Complete — w4-slack-formatting-guide ✓

This guide defines how **every** Cheerful tool response should be formatted for Slack. It has two audiences:

1. **The Claude agent** — how to translate XML tool results into readable Slack messages
2. **CE tool developers** — how to write XML formatters (`tag`/`wrap`/`hint`) that give Claude the right structure to work with

---

## Table of Contents

1. [Architecture: How Tool Output Reaches Slack](#1-architecture-how-tool-output-reaches-slack)
2. [Slack Markdown Reference](#2-slack-markdown-reference)
3. [General Presentation Principles](#3-general-presentation-principles)
4. [Response Length Guidelines](#4-response-length-guidelines)
5. [Progressive Disclosure Patterns](#5-progressive-disclosure-patterns)
6. [Domain-Specific Formatting: Campaigns](#6-domain-specific-formatting-campaigns)
7. [Domain-Specific Formatting: Email Threads](#7-domain-specific-formatting-email-threads)
8. [Domain-Specific Formatting: Creators](#8-domain-specific-formatting-creators)
9. [Domain-Specific Formatting: Integrations](#9-domain-specific-formatting-integrations)
10. [Domain-Specific Formatting: Users & Team](#10-domain-specific-formatting-users--team)
11. [Domain-Specific Formatting: Analytics](#11-domain-specific-formatting-analytics)
12. [Domain-Specific Formatting: Search & Discovery](#12-domain-specific-formatting-search--discovery)
13. [Domain-Specific Formatting: Workflows](#13-domain-specific-formatting-workflows)
14. [Component Templates](#14-component-templates)
15. [Error Formatting](#15-error-formatting)
16. [Success Confirmations for Write Operations](#16-success-confirmations-for-write-operations)
17. [Empty State Patterns](#17-empty-state-patterns)
18. [XML Formatter Patterns for CE Developers](#18-xml-formatter-patterns-for-ce-developers)

---

## 1. Architecture: How Tool Output Reaches Slack

Understanding the pipeline is essential for writing formatters that serve Claude well.

```
Slack user message
        │
        ▼
Claude Agent (in context engine) receives Slack message
        │
        ▼
Claude calls cheerful_* tool → tool returns XML string
        │
        ▼
XML string is injected as a tool result into Claude's context
        │
        ▼
Claude synthesizes a natural-language Slack response FROM the XML
        │
        ▼
Context engine posts formatted message to Slack channel/thread
```

**Key insight**: Claude sees XML; Slack users see Claude's natural-language synthesis. The XML formatters do NOT produce what Slack renders directly. They produce structured data that guides Claude's response.

**What this means for XML formatters** (CE developers):
- Include ALL data the agent might need for any question — Claude decides what to show
- Use descriptive tag names so Claude knows what each field means
- Use `<hint>` tags to guide Claude when data is empty or partial
- Do NOT omit fields that are "probably not needed" — Claude will use them contextually

**What this means for Claude** (agent behavior):
- Raw XML is NEVER pasted into Slack — always synthesize
- Map XML fields to human-readable labels (e.g., `<gifting-status>OPTED_IN</gifting-status>` → "Opted in")
- Omit fields that are null, empty, or irrelevant to the user's question
- Use Slack markdown for structure

---

## 2. Slack Markdown Reference

Slack uses a variant of mrkdwn (not standard Markdown). These are the supported formats:

### Text Formatting

| Format | Syntax | Renders As |
|--------|--------|-----------|
| Bold | `*text*` | **text** |
| Italic | `_text_` | *text* |
| Strikethrough | `~text~` | ~~text~~ |
| Inline code | `` `text` `` | `text` |
| Code block | ` ```\ncode\n``` ` | code block |
| Blockquote | `> text` | indented block |

### Structure

| Format | Syntax | Use For |
|--------|--------|---------|
| Bullet list | `• item` or `- item` | Unordered lists |
| Numbered list | `1. item` | Ordered lists |
| Line break | `\n` | Paragraph separation |
| Horizontal rule | Not supported natively — use `---` in block text | Section dividers (limited) |

### Links and Mentions

| Format | Syntax | Example |
|--------|--------|---------|
| Hyperlink | `<URL|display text>` | `<https://example.com|view campaign>` |
| User mention | `<@U1234567>` | Mentions a Slack user |
| Channel mention | `<#C1234567>` | Links a channel |

### Status Symbols (Unicode — paste directly)

Use these consistently across all tools:

| Symbol | Unicode | Use For |
|--------|---------|---------|
| ✅ | U+2705 | Opted in, connected, success, active |
| ❌ | U+274C | Opted out, error, failed, disconnected |
| ⏳ | U+23F3 | Pending, processing, in progress |
| ⚠️ | U+26A0 | Warning, partial, needs attention |
| 📧 | U+1F4E7 | Email |
| 👤 | U+1F464 | Creator / person |
| 📊 | U+1F4CA | Analytics / stats |
| 🔗 | U+1F517 | Integration / link |
| 📋 | U+1F4CB | List / campaign |
| 🛒 | U+1F6D2 | Shopify / order |
| 🔍 | U+1F50D | Search result |

**Guideline**: Use sparingly — one per message max, and only when they add clarity. Do NOT use emoji in confirmations of destructive actions (deletions, etc.).

---

## 3. General Presentation Principles

### 3.1 Never Dump Raw Data

**Wrong**:
```
id: "a1b2c3d4", name: "Summer Gifting 2026", type: "gifting", status: "active", created_at: "2026-01-15T10:23:00Z", campaign_recipient_count: null, ...
```

**Right**:
```
*Summer Gifting 2026* (gifting, active) — created Jan 15, 2026
```

### 3.2 Answer the User's Question First

If the user asked "how many creators have opted in to my Summer campaign?", the response should lead with the number — not with a full campaign profile.

**Wrong**: List all creator details, then mention the count at the end.

**Right**: "Your Summer Gifting 2026 campaign has *23 creators opted in* out of 120 total (19.2%)."

### 3.3 Omit Null and Irrelevant Fields

Only include fields that are:
- Non-null/non-empty, AND
- Relevant to what the user is asking

Exception: When the user explicitly asks to "show me everything about X", include all non-null fields.

### 3.4 Use Bold for Labels

In structured displays, bold the label:
```
*Name*: Summer Gifting 2026
*Type*: Gifting
*Status*: Active
*Senders*: outreach@brand.com, hello@brand.com
```

### 3.5 Humanize Technical Values

| Raw value | Display |
|-----------|---------|
| `OPTED_IN` | Opted in |
| `OPTED_OUT` | Opted out |
| `gifting` | Gifting |
| `paid_promotion` | Paid promotion |
| `active` | Active |
| `paused` | Paused |
| `draft` | Draft |
| `completed` | Completed |
| `INBOUND` | Inbound |
| `OUTBOUND` | Outbound |
| `2026-01-15T10:23:00Z` | Jan 15, 2026 |
| `2026-01-15T10:23:00Z` (with time) | Jan 15 at 10:23 AM |
| `null` | *(omit)* |
| `""` | *(omit)* |
| `false` | *(omit unless explicitly relevant)* |
| `0` | *(depends on context — "0 opted in" is meaningful)* |

### 3.6 UUIDs in Code Blocks

When displaying IDs that the user will need to reference (for tool calls, copy-paste), display them in inline code:
```
Campaign ID: `a1b2c3d4-...`
```

Do NOT display UUIDs in plain text — they look like noise. Do NOT display them at all unless the user will need them for follow-up tool calls.

### 3.7 Tables for Lists

For lists of 2+ items with multiple comparable attributes, use a table:
```
Creator              | Status     | Followers | Email
---------------------|-----------|-----------|-------
@glowup_daily        | Opted in  | 45.2K     | sarah@...
@natural_glow_co     | Pending   | 28.1K     | —
@skincare_queen      | Opted out | 102K      | —
```

For simple lists (one attribute), use bullet points:
```
• Summer Gifting 2026 (active)
• Holiday Creator Q4 (paused)
• New Year Outreach (draft)
```

---

## 4. Response Length Guidelines

### 4.1 Size Thresholds

| Content | Threshold | Format |
|---------|-----------|--------|
| ≤3 items | Inline sentence | "3 campaigns: Summer Gifting (active), Holiday Q4 (paused), New Year (draft)" |
| 4–10 items | Bullet list or table | One item per line |
| 11–20 items | Table with summary | "Showing 20 of 47 creators. Ask for more or filter by status." |
| 21+ items | Summary + offer to filter | "You have 47 creators. 12 opted in, 28 pending, 7 opted out. Ask me to filter by status." |

### 4.2 Body Text Truncation

For email body text in thread views:
- Show first 500 characters of body text
- Append `...` if truncated
- Offer to show the full message if requested

For AI-generated content (email drafts, summaries):
- Show in full — these are meant to be read completely

### 4.3 Message Size Limits

Slack messages have a 40,000 character limit per message. In practice, aim for under 3,000 characters per response to keep responses readable.

For large datasets:
- Paginate: "Showing 1–20 of 47. Say 'show more creators' or 'filter by opted-in status' to narrow down."
- Summarize: "You have 3 active campaigns. Say 'show me [campaign name]' for details."

---

## 5. Progressive Disclosure Patterns

Progressive disclosure means: start with the summary, offer to expand.

### 5.1 List → Detail

**First call**: `cheerful_list_campaigns` → Show summary list (name, type, status)
**User asks "tell me more about Summer Gifting"** → `cheerful_get_campaign` → Show full details

Never show full detail for every item in a list unless explicitly asked.

### 5.2 Summary → Full Thread

**First call**: `cheerful_list_threads` → Show thread summaries (subject, sender, date, status)
**User asks "what did Sarah say?"** → `cheerful_get_thread` → Show full conversation

### 5.3 Counts → Items

**Lead with counts**: "23 creators opted in"
**User asks "who are they?"** → Show creator list with names

### 5.4 Status → Action

After every status/list response, consider adding an actionable suggestion:
- "Say 'draft an email to [creator]' to compose a reply."
- "Say 'show me opted-out creators' to see who declined."
- "Say 'launch the campaign' when you're ready to start sending."

Include this guidance only when the user is likely to want to take the next step, not after every read operation.

---

## 6. Domain-Specific Formatting: Campaigns

### 6.1 Campaign List (`cheerful_list_campaigns`)

**Short list (≤5 campaigns)**:
```
You have 3 campaigns:
1. *Summer Gifting 2026* — Gifting, Active — 45 sent, 5 pending
2. *Holiday Creator Q4* — Gifting, Paused
3. *New Year Outreach* — Creator, Draft
```

**Long list (6+ campaigns)**:
```
You have 12 campaigns: 8 active, 2 paused, 1 draft, 1 completed.

Active:
• *Summer Gifting 2026* (gifting)
• *Holiday Creator Q4* (gifting)
• *Brand Ambassador Program* (paid promotion)
[... etc]

Say "tell me about [campaign name]" for details.
```

**With stats** (when `include_stats=true`):
```
*Summer Gifting 2026* (gifting, active)
• Sent: 45 | Pending: 5 | Failed: 2
• Recipients: 120 | Opted In: 28 (23.3%)
```

### 6.2 Campaign Detail (`cheerful_get_campaign`)

```
*Summer Gifting 2026*
Type: Gifting | Status: Active | Created: Jan 15, 2026

*Product*: Glow Serum ($45 value)
*Senders*: outreach@brand.com, hello@brand.com
*Follow-ups*: Enabled (max 2, every 3 days)
*Slack channel*: #campaigns-summer

Templates:
• Outreach: "Hi {{first_name}}, ..."
• Follow-up 1: "Just following up..."
```

Omit null fields. Do NOT include AI config fields (`agent_name_for_llm`, `rules_for_llm`) unless explicitly asked.

### 6.3 Campaign Creation (`cheerful_create_campaign`)

**Success**:
```
✅ Campaign *Holiday Q4 Gifting* created successfully.
Campaign ID: `a1b2c3d4-...`

Next steps:
• Add recipients with `cheerful_add_campaign_recipients_from_search`
• Configure senders with `cheerful_update_campaign_sender`
• When ready, run `cheerful_populate_campaign_outbox` then `cheerful_launch_campaign`
```

### 6.4 Campaign Status Changes

**Paused**:
```
⏳ Campaign *Summer Gifting 2026* paused. No new emails will be sent until reactivated.
```

**Completed**:
```
Campaign *Summer Gifting 2026* marked as completed. 47 pending emails and 12 follow-ups were cancelled.
```

**Reactivated**:
```
✅ Campaign *Summer Gifting 2026* reactivated. Previously cancelled emails were NOT re-queued — run `cheerful_populate_campaign_outbox` if needed.
```

### 6.5 Campaign Launch (`cheerful_launch_campaign`)

**Success**:
```
✅ Campaign *Summer Gifting 2026* launched successfully.

22-step launch completed:
• 45 outbox emails queued
• 0 errors
• Campaign is now active and sending

First emails will be processed shortly.
```

**Failure**:
```
⚠️ Campaign launch failed: {error message}

Common fixes:
• Ensure at least one sender is connected
• Verify all email templates have required merge tags filled in
• Check that the campaign has at least one recipient
```

### 6.6 Campaign Deletion (`cheerful_delete_campaign`)

**ALWAYS confirm before deleting** — the agent must ask the user to confirm:
```
⚠️ *Are you sure you want to delete "Summer Gifting 2026"?*

This will permanently delete:
• 120 recipients
• 45 email threads
• All analytics and workflow history

This cannot be undone. Reply "yes, delete it" to confirm.
```

**After confirmed deletion**:
```
Campaign *Summer Gifting 2026* has been permanently deleted.
```

### 6.7 Recipient Operations

**Recipients added**:
```
✅ 23 recipients added to *Summer Gifting 2026*.
• 20 new | 3 already existed (skipped)
```

**CSV upload**:
```
✅ CSV uploaded: 45 recipients processed.
• 42 added | 3 skipped (missing required fields: instagram_handle)
```

**Outbox populated**:
```
✅ Outbox populated for *Summer Gifting 2026*.
• 45 emails queued and ready to send
• Estimated send window: within 2 hours
```

---

## 7. Domain-Specific Formatting: Email Threads

### 7.1 Thread List (`cheerful_list_threads`)

**Compact list (default)**:
```
*Summer Gifting 2026* — 12 threads (3 need replies)

1. Sarah Chen <sarah@glowup.co> — _"Re: Partnership Opportunity"_ — Jan 15 — ✅ Opted in
2. @natural_glow_co — _"Collaboration?"_ — Jan 14 — ⏳ Pending reply
3. @skincare_queen — _"Re: Your message"_ — Jan 13 — ❌ Opted out
[... 9 more]

Say "show me [creator name]'s thread" to read the full conversation.
```

**Filtered by status**:
```
Threads needing replies in *Summer Gifting 2026* (3):

1. @natural_glow_co — _"Collaboration?"_ — Jan 14 (3 days ago) — Last sent by you
2. @beauty_boss — _"Re: Free product"_ — Jan 13 (4 days ago) — Last sent by you
3. @daily_skincare — _"[No subject]"_ — Jan 12 (5 days ago) — Never replied
```

### 7.2 Thread Detail (`cheerful_get_thread`)

```
*Thread: "Re: Partnership Opportunity"*
Campaign: Summer Gifting 2026 | Status: Opted in

———

📧 *You* → sarah@glowup.co | Jan 14 at 10:23 AM
> Hi Sarah, we'd love to send you our Glow Serum to try and share with your audience...
[Message truncated — 3 more paragraphs]

📧 *Sarah Chen* <sarah@glowup.co> → you | Jan 15 at 2:47 PM
> Hi! I'd love to try it! Can you send to:
> 123 Main St, San Francisco CA 94101
>
> My rate for a feed post is $500.
```

**Notes**:
- Most recent message first or last? Follow chronological order (oldest first).
- Truncate body text at 500 chars per message, offer to show full message.
- Show "you" for outbound messages, creator name for inbound.
- Highlight the most recent message visually (via ordering and context).

### 7.3 Draft Display (`cheerful_get_draft`)

```
*Draft reply to Sarah Chen*
Subject: Re: Partnership Opportunity

---
Hi Sarah,

Thank you for your interest! We'll ship the Glow Serum to the address you provided.

Regarding your rate — our standard gifting campaign budget is $200 for a post. Let us know if that works!

Best,
[Your name]
---

Draft ID: `d1e2f3...` | Last updated: 15 minutes ago
```

### 7.4 Draft Creation/Update

**On success**:
```
✅ Draft saved for Sarah Chen's thread.

Preview:
> Hi Sarah, thank you for getting back to us...

Say "send it" to send this email, or "improve it — make it more concise" to refine.
```

### 7.5 Email Sent

```
✅ Email sent to Sarah Chen <sarah@glowup.co>.

Subject: Re: Partnership Opportunity
Sent via: outreach@brand.com
```

### 7.6 Scheduled Dispatch

```
✅ Email scheduled for Sarah Chen.
Will send: Friday, Jan 17 at 9:00 AM EST
Via: outreach@brand.com

Say "cancel the scheduled email" to cancel before it sends.
```

**Scheduled email list**:
```
*Scheduled emails* (3):

1. Sarah Chen — Jan 17 at 9:00 AM EST via outreach@brand.com
2. @natural_glow_co — Jan 18 at 10:00 AM EST via outreach@brand.com
3. @beauty_boss — Jan 19 at 2:00 PM EST via outreach@brand.com
```

### 7.7 Thread Status Changes

**Marking status**:
```
✅ Thread marked as *Opted In* for @natural_glow_co.
```

**All valid status display names**:

| Raw Status | Display Name | Symbol |
|-----------|-------------|--------|
| `OPTED_IN` | Opted in | ✅ |
| `OPTED_OUT` | Opted out | ❌ |
| `PENDING_REPLY` | Pending reply | ⏳ |
| `FOLLOW_UP_SCHEDULED` | Follow-up scheduled | ⏳ |
| `AWAITING_CONTRACT` | Awaiting contract | ⏳ |
| `NEGOTIATING` | Negotiating | ⏳ |
| `DECLINED` | Declined | ❌ |
| `UNCONTACTED` | Not yet contacted | — |

### 7.8 AI Email Improvement (`cheerful_improve_email_content`)

Show the improved version inline with the action taken:

```
*Improved (more concise):*

---
Hi Sarah — we'll ship the Glow Serum to your address. Our gifting rate is $200 for a feed post — does that work?

Best, [Your name]
---

Say "use this version" to save it as your draft, or "try making it more professional" for another variation.
```

### 7.9 Thread Summary (`cheerful_get_thread_summary`)

```
*Summary — Sarah Chen thread*

Sarah Chen is a beauty/skincare influencer interested in a gifting collaboration. She agreed to try the Glow Serum and share it with her audience. She provided a shipping address and quoted $500 for a feed post. Currently in negotiation on rate.

Key facts:
• Shipping: 123 Main St, San Francisco CA 94101
• Quoted rate: $500/post
• Status: Negotiating
```

---

## 8. Domain-Specific Formatting: Creators

### 8.1 Creator List (`cheerful_list_campaign_creators`)

**Table format** (for 4+ creators):
```
*Summer Gifting 2026* — 120 creators (23 opted in, 85 pending, 12 opted out)

Creator              | Role    | Status         | Instagram      | Followers
---------------------|---------|---------------|----------------|----------
Sarah Chen           | Primary | ✅ Opted in    | @glowup_daily  | 45.2K
natural_glow_co      | Primary | ⏳ Pending     | @natural_glow  | 28.1K
@skincare_queen      | Primary | ❌ Opted out   | @skincare_q    | 102K

Showing 3 of 120. Say "show opted-in creators" or "show the next 20" for more.
```

**Filtered by status**:
```
*Opted-in creators* in Summer Gifting 2026 (23):

1. Sarah Chen (@glowup_daily) — 45.2K — sarah@glowup.co
2. natural_glow_co — 28.1K — contact@naturalglow.co
3. @skincare_queen — 102K — collab@skincarequeen.com
[... 20 more]
```

### 8.2 Creator Detail (`cheerful_get_campaign_creator`)

```
👤 *Sarah Chen* — Summer Gifting 2026
Instagram: @glowup_daily | Email: sarah@glowup.co
Role: Primary | Gifting status: Opted in

*Gifting Info*
Address: 123 Main St, San Francisco CA 94101
Discount code: GLOW20

*Social*
• Instagram: @glowup_daily (45.2K followers)
• TikTok: @glowupdaily

*Notes* (last 3)
• Jan 15: "Opted in, provided address, negotiating rate"
• Jan 12: "Replied positively, interested in collaboration"
• Jan 10: "First contact sent"

Confidence: 98% | Verified: Yes | Last interaction: Jan 15, 2026
```

### 8.3 Creator Search Results (`cheerful_search_campaign_creators`)

```
🔍 Found 3 creators matching "sarah" across your campaigns:

1. *Sarah Chen* (@glowup_daily) — Summer Gifting 2026 — Opted in — sarah@glowup.co
2. *Sarah K* (@sarah_wellness) — Holiday Q4 — Pending — sarahk@gmail.com
3. *Sarah Beauty* (@sarahbeauty) — Brand Ambassador — Opted in — collab@sarahbeauty.com
```

### 8.4 Creator Enrichment

**Enrichment triggered**:
```
⏳ Enrichment started for 12 creators in *Summer Gifting 2026*.
This typically takes 2–5 minutes. Say "check enrichment status" to see progress.
```

**Enrichment status**:
```
*Enrichment status* — Summer Gifting 2026

✅ Complete: 8 creators
⏳ Processing: 3 creators
❌ Failed: 1 creator (email not found: @anonymous_creator)

Overall: 8/12 complete (66.7%)
```

### 8.5 Influencer Club Discovery Results (`cheerful_search_creators_by_keyword`)

```
🔍 Found 10 creators matching "skincare beauty":

1. *@glowup_daily* — 45.2K followers — Beauty & Skincare — Avg 8.5% engagement
   Contact: sarah@glowup.co | Fit score: 94%

2. *@natural_beauty_co* — 28K followers — Organic Skincare — Avg 6.2% engagement
   Contact: hello@naturalbeauty.co | Fit score: 87%

[... 8 more]

Say "add @glowup_daily to Summer Gifting" to add a creator, or "show similar creators to @glowup_daily" for more options.
```

### 8.6 Creator Lists (`cheerful_list_creator_lists`)

```
*Your creator lists* (3):

1. *Top Skincare Influencers* — 45 creators — Last updated Jan 10
2. *Beauty Micro-Influencers* — 128 creators — Last updated Dec 20
3. *Wellness Creators* — 67 creators — Last updated Nov 15
```

### 8.7 Creator Posts (`cheerful_list_creator_posts`)

```
*Verified posts* for @glowup_daily in Summer Gifting 2026 (2):

1. *Reel* — Jan 18 — Caption: "Obsessed with this Glow Serum! ✨ Ad" — Matched via LLM
   URL: https://instagram.com/p/abc123

2. *Post* — Jan 20 — Caption: "My new fave skincare..." — Matched via caption keyword
   URL: https://instagram.com/p/def456
```

---

## 9. Domain-Specific Formatting: Integrations

### 9.1 Connected Accounts (`cheerful_list_connected_accounts`)

```
*Connected email accounts* (3):

Gmail:
• outreach@brand.com — Connected | Active ✅
• hello@brand.com — Connected | Active ✅

SMTP:
• newsletter@brand.com — Mailgun | Active ✅
```

### 9.2 SMTP Account Operations

**Created**:
```
✅ SMTP account *newsletter@brand.com* added.
Provider: Mailgun | Host: smtp.mailgun.org | Port: 587
```

**Deleted**:
```
SMTP account *newsletter@brand.com* removed.
Note: Any campaign senders using this account have been removed automatically.
```

**Bulk import**:
```
✅ SMTP bulk import complete.
• 8 accounts imported | 2 skipped (invalid IMAP credentials)

Failed:
• bad@example.com — IMAP verification failed: authentication error
• old@example.com — IMAP host unreachable
```

### 9.3 Google Sheets

**Tabs found**:
```
*Google Sheet tabs* for "Creator Tracking Q1":

1. Gifting Creators
2. Paid Promotion
3. Done
4. Sheet4 (empty)

Say "validate the 'Gifting Creators' tab" to check it has required columns.
```

### 9.4 Shopify / GoAffPro

**Products**:
```
*Shopify products* (5):

1. *Glow Serum 30ml* — $45 — ID: `goa_12345`
2. *Hydrating Mask* — $28 — ID: `goa_12346`
3. *Vitamin C Toner* — $35 — ID: `goa_12347`
[... 2 more]
```

**Order created**:
```
✅ Shopify order created for Sarah Chen.

Order: #ORD-2026-0145
Product: Glow Serum 30ml ($45)
Ship to: 123 Main St, San Francisco CA 94101
Discount code: GLOW20

GoAffPro discount applied — 20% off.
```

### 9.5 Instantly / Composio Integration

**Connected**:
```
✅ Instantly connected via Composio.
Entity: outreach@brand.com | Status: Active

Email accounts synced:
• outreach@brand.com — Active
• hello@brand.com — Active
```

**Not connected**:
```
Instantly is not yet connected.

To connect, visit the Cheerful webapp: Settings → Integrations → Instantly.
(OAuth connection requires browser access — cannot be done via Slack.)
```

### 9.6 Slack Digest

**Triggered**:
```
✅ Daily digest sent to #campaigns-summer.
```

### 9.7 YouTube Lookalike

**In progress**:
```
⏳ YouTube lookalike search started for @skincare_queen.
This takes 2–10 minutes (Apify scraper + AI analysis). Say "check lookalike status" to see results.
```

### 9.8 Brand Lookup

**Found**:
```
*Brand: Glow Skincare Co*

Domain: glowskincare.com
Industry: Beauty & Personal Care
Founded: 2018

Channels:
• Instagram: @glow_skincare (128K followers)
• TikTok: @glow.skincare (45K followers)
• Twitter: @GlowSkincareCo
```

**Not found**:
```
No brand information found for "unknownbrand.xyz".
The brand may not be indexed yet, or the domain may be incorrect.
```

---

## 10. Domain-Specific Formatting: Users & Team

### 10.1 User Settings (`cheerful_get_user_settings`)

```
*Your account*
Email: user@brand.com
Name: [Not configured]
Avatar: [Google account photo]

*Team*: Glow Skincare Co (owner)
*Member since*: November 2025
```

### 10.2 Connected Accounts (See Section 9.1)

### 10.3 Team Members (`cheerful_list_team_members`)

```
*Team: Glow Skincare Co* — 3 members

1. *Alice Johnson* (alice@brand.com) — Owner
2. *Bob Smith* (bob@brand.com) — Member — Assigned to: Summer Gifting, Holiday Q4
3. *Carol White* (carol@brand.com) — Member — Assigned to: Brand Ambassador
```

### 10.4 Team Member Added

```
✅ Invitation sent to bob@newmember.com.
They'll receive an email to join the team. Once they accept, you can assign them to campaigns.
```

### 10.5 Campaign Assignments (`cheerful_list_campaign_assignments`)

```
*Campaign assignments* for Summer Gifting 2026:

• Bob Smith (bob@brand.com) — Assigned Jan 10
• Carol White (carol@brand.com) — Assigned Jan 12
```

**No assignments**:
```
No team members assigned to *Summer Gifting 2026*.
Say "assign [member name] to this campaign" to give them access.
```

### 10.6 Email Signatures (`cheerful_list_email_signatures`)

```
*Email signatures* (2):

1. *Default Signature* ✓ (used when no campaign signature set)
   Best regards, [Name] | Brand Marketing

2. *Summer Campaign Signature* (Summer Gifting 2026 only)
   Sent with love, [Name] | Summer Gifting Team
```

### 10.7 Onboarding Status (`cheerful_get_onboarding_status`)

```
*Onboarding complete* ✅
Account fully configured.
```

Or if incomplete:
```
*Onboarding in progress* ⏳
Remaining steps:
• Connect a Gmail account
• Create your first campaign
```

---

## 11. Domain-Specific Formatting: Analytics

### 11.1 Dashboard Overview (`cheerful_get_dashboard_analytics`)

**General question ("how are things going?")**:
```
📊 *Dashboard Overview*

*Campaigns*: 3 active, 1 paused, 1 draft
*Contacts*: 200 total — 47 opted in (23.5%), 12 opted out, 85 new

*Response Rate*: 31.2%
*Emails*: 156 sent, 23 pending, 4 failed

*Top Campaign*: Summer Gifting 2026 — 32/120 opted in (26.7%)
```

**Gifting pipeline question ("how's my gifting pipeline?")**:
```
*Gifting Pipeline* (121 total)

New → 45 | Contacted → 28 | Opted In → 5 | Pending Details → 12 | Ready to Ship → 8 | Ordered → 15
Opted Out: 8
```

**Follow-up question ("how are my follow-ups?")**:
```
*Follow-up Stats*: 89 total
• Sent: 72 | Pending: 8 | Cancelled: 5 (5.6%) | Failed: 4

Conversions by follow-up:
• Follow-up 1: 15 sent → 8 opts-in
• Follow-up 2: 12 sent → 3 opts-in
```

**Campaign breakdown question ("breakdown by campaign type?")**:
```
*By campaign type*:
• Gifting: 3 campaigns, 156 contacts
• Paid Promotion: 1 campaign, 44 contacts
• Creator: 1 campaign, 22 contacts
```

**Recent opt-ins ("who's opted in recently?")**:
```
*Recent opt-ins* (last 7 days):

1. @glowup_daily (Sarah Chen) — Summer Gifting — Jan 15
2. @natural_beauty — Summer Gifting — Jan 14
3. @wellness_creator — Brand Ambassador — Jan 13
```

---

## 12. Domain-Specific Formatting: Search & Discovery

### 12.1 Email Search (`cheerful_search_emails`)

```
🔍 Found 5 emails matching "shipping address" in Summer Gifting 2026:

1. *Sarah Chen* → you — Jan 15 — _"Here's my shipping address: 123 Main St..."_
2. *@natural_glow_co* → you — Jan 14 — _"Please ship to: 456 Oak Ave..."_
3. *@skincare_q* → you — Jan 12 — _"My address is 789 Pine Rd..."_
[... 2 more]
```

### 12.2 Similar Email Search (`cheerful_find_similar_emails`)

```
🔍 Found 4 emails similar to your request about "positive responses with address":

1. *Similarity: 94%* — @glowup_daily (Summer Gifting) — _"Opted in, loved the pitch"_
   Reply: "Hi! I'd love to try it. Ship to 123 Main St..."

2. *Similarity: 87%* — @wellness_creator (Brand Ambassador) — _"Interested"_
   Reply: "Yes! This sounds amazing. My address is..."
```

### 12.3 Lookalike Suggestions (`cheerful_list_lookalike_suggestions`)

```
*Lookalike suggestions* for Summer Gifting 2026 — 12 pending

Seeded from @skincare_queen:
1. @glowup_daily (Sarah Chen) — 45.2K followers — 87.5% match — Beauty
   Email: sarah@glowup.co
2. @natural_glow_co — 28.1K followers — 72.3% match
   Email: collab@naturalglow.co

Seeded from @beauty_boss:
3. @daily_glow — 18.5K followers — 69.1% match
   Email: [not found]

Say "accept @glowup_daily" to add them to the campaign, or "reject @daily_glow" to dismiss.
```

### 12.4 Lookalike Status Update

```
✅ @glowup_daily accepted — added to your suggestions list.

Say "add @glowup_daily to Summer Gifting campaign" to add them as a recipient and start outreach.
```

---

## 13. Domain-Specific Formatting: Workflows

### 13.1 Workflow List (`cheerful_list_campaign_workflows`)

```
*Workflows* — Summer Gifting 2026 (2 enabled):

1. *GoAffPro Discount Code Creation* ✅ Enabled
   Tools: get_goaffpro_customer, create_goaffpro_coupon_code, update_goaffpro_affiliate

2. *Shopify Order Drafting* ✅ Enabled
   Tools: get_goaffpro_products, create_shopify_order

Say "show execution history for GoAffPro workflow" to see recent runs.
```

### 13.2 Workflow Detail (`cheerful_get_campaign_workflow`)

```
*GoAffPro Discount Code Creation*
Campaign: Summer Gifting 2026 | Status: Enabled

Description: Creates GoAffPro discount code when creator opts in

Tools:
• get_goaffpro_customer — Looks up creator in GoAffPro
• create_goaffpro_coupon_code — Creates personalized discount
• update_goaffpro_affiliate — Links discount to creator's affiliate account

Output schema: { "discount_code": string, "affiliate_id": string }
Created: Jan 10, 2026
```

### 13.3 Workflow Executions (`cheerful_list_workflow_executions`)

```
*Execution history* — GoAffPro Discount Code Creation (last 5):

1. Jan 15 — Thread: Sarah Chen — ✅ Completed — Discount: GLOW-SARAH-20
2. Jan 14 — Thread: @natural_glow — ✅ Completed — Discount: GLOW-NAT-15
3. Jan 13 — Thread: @anon_creator — ❌ Error — "Customer not found in GoAffPro"
4. Jan 12 — Thread: @test_account — ⚪ Skipped — "Creator role not eligible"
5. Jan 11 — Thread: @missing_email — ❌ Schema validation failed
```

**Status display**:

| Raw Status | Display |
|-----------|---------|
| `completed` | ✅ Completed |
| `error` | ❌ Error |
| `skipped` | ⚪ Skipped |
| `schema_validation_failed` | ❌ Schema validation failed |

### 13.4 Latest Execution (`cheerful_get_latest_workflow_execution`)

```
*Latest execution* — GoAffPro workflow for Sarah Chen's thread

Status: ✅ Completed (Jan 15 at 3:42 PM)

Output:
• Discount code: GLOW-SARAH-20
• Affiliate ID: AFF-45821
• GoAffPro customer ID: CUST-12345

Say "create the Shopify order for Sarah Chen" to proceed with order creation.
```

### 13.5 Shopify Order Creation (`cheerful_create_shopify_order_from_execution`)

```
✅ Shopify order created from workflow output.

Order: #ORD-2026-0145
Creator: Sarah Chen
Product: Glow Serum 30ml
Ship to: 123 Main St, San Francisco CA 94101
Discount: GLOW-SARAH-20 (20% off — $36.00 charged)
```

---

## 14. Component Templates

These are reusable patterns. Reference these in domain-specific sections to maintain consistency.

### 14.1 Campaign Card

```
*{name}* ({type}, {status})
{Optional: Product: {product_name}}
{Optional: Senders: {sender_emails}}
{Optional: Recipients: {count} total}
{Optional: Created: {date}}
```

### 14.2 Thread Summary Row

```
{N}. *{creator_name}* — _{subject}_ — {date} — {status_symbol} {status_display}
```

### 14.3 Thread Message Block

```
📧 *{direction: You / Creator Name}* → {recipient} | {date}
> {body_text_truncated_500_chars}
```

### 14.4 Creator Summary Row

```
{N}. *{name}* (@{handle}) — {follower_count} — {status_symbol} {status_display} — {email}
```

### 14.5 Creator Card

```
👤 *{name}* — {campaign_name}
{platform}: @{handle} | Email: {email}
Role: {role} | {campaign_type} status: {status_display}
{Optional: Address: {gifting_address}}
{Optional: Social handles list}
{Optional: Notes}
```

### 14.6 Stat Block

```
*{Title}*

*{Label1}*: {value1}
*{Label2}*: {value2}
{Optional: Progress bar via text: ████░░░░ 45%}
```

### 14.7 Action Suggestion Footer

```
---
Say "{suggestion_1}" or "{suggestion_2}" to continue.
```

Only include when the next action is non-obvious. Do NOT include after every response.

### 14.8 Pagination Footer

```
Showing {start}–{end} of {total}. Say "show the next {page_size}" for more, or filter by status to narrow down.
```

### 14.9 Confirmation Prompt (Destructive)

```
⚠️ *Are you sure you want to {action}?*

{Consequences bullet list}

This cannot be undone. Reply "{confirmation phrase}" to confirm.
```

**Confirmation phrase guidelines**:
- Simple and unambiguous: "yes, delete it", "yes, send it", "confirm"
- NOT just "yes" — too easy to accidentally confirm

---

## 15. Error Formatting

### 15.1 Error Message Translation Table

| Raw Error | User-Facing Message |
|-----------|-------------------|
| `"Could not resolve Cheerful user. Ensure user mapping exists."` | "I couldn't identify your Cheerful account. Please contact an admin to set up your Slack user mapping." |
| `"Cheerful API URL not configured (CHEERFUL_API_URL)"` | "The Cheerful integration isn't configured. Please contact an admin." |
| `"Campaign {id} not found"` | "I couldn't find that campaign. Try `cheerful_list_campaigns` to see your campaigns." |
| `"Access denied to campaign {id}"` | "You don't have access to that campaign." |
| `"Thread '{id}' not found"` | "That thread doesn't exist or you don't have access to it." |
| `"State ID doesn't match thread"` | "The draft couldn't be saved — someone else may have updated it simultaneously. Retry to get the latest version." |
| `"Operation failed (429): ..."` | "Too many requests. Please wait a moment and try again." |
| `"Operation failed (500): ..."` | "Something went wrong on the server. This is not your fault — please try again, or contact support if it persists." |
| `"Operation failed (408): Request timeout"` | "The request timed out. This sometimes happens with large data operations. Please try again." |
| `"Not a member of this team"` | "You're not part of this team." |
| `"Member not found"` | "That team member wasn't found." |
| `"Workflow not found"` | "That workflow wasn't found. Check `cheerful_list_campaign_workflows` for available workflows." |

### 15.2 Error Severity Levels

| Severity | When | Agent Behavior |
|----------|------|---------------|
| **Config error** | API URL/key missing | Tell user to contact admin. Do not retry. |
| **Auth error** | User not mapped | Tell user to contact admin. Do not retry. |
| **Not found (404)** | Resource doesn't exist | Tell user the resource wasn't found. Suggest listing. |
| **Access denied (403)** | User doesn't own resource | Tell user they don't have access. Do not retry. |
| **Validation (400/422)** | Bad parameters | Explain what was wrong. Fix and retry. |
| **Rate limit (429)** | Too many requests | Tell user to wait. Retry after 10–30 seconds. |
| **Timeout (408/504)** | Slow operation | Tell user. Retry once. |
| **Server error (500)** | Backend bug | Tell user. Retry once. If still fails, suggest contacting support. |

### 15.3 Error Format in Slack

**Simple error**:
```
I couldn't complete that action: Campaign not found. Say "show my campaigns" to see your available campaigns.
```

**Error with fix suggestion**:
```
That email couldn't be sent: The draft has an unresolved merge tag `{{company_name}}`. Update the draft to fill in this field, then try again.
```

**Permission error**:
```
You don't have access to that campaign. If you believe this is a mistake, ask the campaign owner to assign you to it.
```

**Config error** (rare, fatal):
```
The Cheerful integration isn't set up correctly. Please contact your admin to configure the API connection.
```

---

## 16. Success Confirmations for Write Operations

Every write operation (create, update, delete, send, launch) should confirm success clearly.

### 16.1 Confirmation Components

Every confirmation should include:
1. ✅ (or similar symbol indicating success)
2. What was done (past tense verb)
3. What was affected (the resource name)
4. Key outcome data (IDs, counts, etc. — only what's useful)
5. Optional: suggested next action

### 16.2 Examples by Operation Type

**Create**:
```
✅ Campaign *Holiday Q4 Gifting* created. ID: `a1b2c3d4-...`
```

**Update**:
```
✅ Campaign *Holiday Q4 Gifting* updated — status changed to Active.
```

**Delete**:
```
Campaign *Holiday Q4 Gifting* deleted.
```
(No ✅ for deletions — it's not a positive outcome)

**Send**:
```
✅ Email sent to sarah@glowup.co via outreach@brand.com.
```

**Schedule**:
```
✅ Email scheduled for Jan 17 at 9:00 AM EST.
```

**Launch**:
```
✅ Campaign *Summer Gifting 2026* launched — 45 emails queued.
```

**No-op** (already in desired state):
```
No changes made — campaign is already active.
```

---

## 17. Empty State Patterns

When a tool returns no results, always provide a `<hint>` in the XML formatter and translate it to a helpful Slack message.

### 17.1 Empty State Messages

| Context | Empty State Message |
|---------|-------------------|
| No campaigns | "You don't have any campaigns yet. Say 'create a campaign' to get started." |
| No threads (unfiltered) | "No email threads in this campaign yet. Check back after the campaign launches." |
| No threads (filtered) | "No threads match that filter. Try removing the filter or changing the status." |
| No creators (unfiltered) | "No creators in this campaign yet. Say 'add creators' to start adding people." |
| No creators (filtered) | "No creators match that filter. Try 'show all creators' to see everyone." |
| No search results | "No results found for '{query}'. Try broader search terms or check the spelling." |
| No similar emails | "No similar emails found. Try a different query or lower the similarity threshold." |
| No team members | "No team members yet. Say 'invite [email]' to add someone to your team." |
| No workflows | "No workflows configured for this campaign. Workflows automate post-opt-in tasks like discount code creation." |
| No scheduled emails | "No scheduled emails pending." |
| No lookalike suggestions | "No suggestions yet. Say 'find creators similar to @[handle]' to generate suggestions." |

### 17.2 Empty State with Next Action

Always follow an empty state with a concrete next action the user can take:
```
No creators in *Summer Gifting 2026* yet.

Add creators:
• "Search for skincare creators" — discover via Influencer Club
• "Add @handle to Summer Gifting" — add a specific creator
• "Upload CSV" — bulk upload from a spreadsheet
```

---

## 18. XML Formatter Patterns for CE Developers

This section is for tool implementers writing formatter functions in Python.

### 18.1 Core XML Utilities

The CE uses three XML helpers from `src_v2/core/xml.py`:

```python
from src_v2.core.xml import hint, tag, wrap

# Single field
tag("name", "Summer Gifting 2026")
# → <name>Summer Gifting 2026</name>

# Field with attribute
tag("handle", "@glowup_daily", platform="instagram")
# → <handle platform="instagram">@glowup_daily</handle>

# Nested content (raw=True for pre-built XML)
content = tag("name", "Summer Gifting") + tag("status", "active")
tag("campaign", content, raw=True, id="a1b2c3d4")
# → <campaign id="a1b2c3d4"><name>Summer Gifting</name><status>active</status></campaign>

# Container with count
wrap("campaigns", [item1, item2])
# → <campaigns count="2">
#     <campaign .../>
#     <campaign .../>
#   </campaigns>

# Empty state hint
hint("No campaigns found. Use cheerful_create_campaign to create one.")
# → <hint>No campaigns found. Use cheerful_create_campaign to create one.</hint>
```

### 18.2 Tag Naming Conventions

| Python field | XML tag name |
|-------------|-------------|
| `campaign_id` | `campaign-id` (hyphenated) |
| `gifting_status` | `gifting-status` |
| `created_at` | `created-at` |
| `sender_email` | `sender-email` |
| `thread_id` | `thread-id` |
| `matched_snippet` | `matched-snippet` |
| `follower_count` | `follower-count` |

**Rule**: Python snake_case → XML kebab-case. Use the actual field name from the API response — do NOT invent tag names that don't match the data field name. (The existing tools have formatter bugs from invented tag names.)

### 18.3 Null Field Handling

**Do NOT emit tags for null/empty/False fields** (unless the absence is itself meaningful):
```python
# Correct:
gifting = creator.get("gifting_status")
if gifting:
    content += tag("gifting-status", str(gifting))

# Wrong (emits <gifting-status>None</gifting-status>):
content += tag("gifting-status", str(creator.get("gifting_status")))
```

**Exception**: Emit `0` values for counts (e.g. `sent_count=0`) — absence of emails sent IS meaningful.

### 18.4 Empty List Pattern

Always emit a `<hint>` inside the `wrap()` call when a list is empty:
```python
def _fmt_campaigns(campaigns):
    if not campaigns:
        return wrap(
            "campaigns",
            [hint("No campaigns found. Use cheerful_create_campaign to create one.")],
            count=0,
        )
    return wrap("campaigns", [_fmt_campaign(c) for c in campaigns])
```

The hint should specify:
1. What is missing ("No campaigns found")
2. What tool to use to fix it ("Use cheerful_create_campaign")

### 18.5 Text Truncation

For long text fields (body text, notes, descriptions):
```python
body = str(message.get("body_text", ""))
if len(body) > 3000:
    body = body[:3000] + "... [truncated]"
content += tag("body", body)
```

Standard truncation limits:
- Email body text: 3,000 characters
- Notes/comments: 1,000 characters
- Subject lines: No truncation (always ≤998 chars per RFC 5321)
- Name fields: No truncation

### 18.6 Count Propagation

Always include counts in containers, and propagate `total` (for paginated endpoints) as a separate attribute:
```python
def _fmt_creator_list(data):
    creators = data.get("creators", [])
    total = data.get("total", 0)  # Total in DB (unfiltered)
    items = [_fmt_creator_summary(c) for c in creators]
    # Pass total as extra attribute so Claude knows there may be more
    return wrap("creators", items, total=str(total))
    # → <creators count="20" total="47">...</creators>
```

`count` = items in this page, `total` = items in DB matching filters.

### 18.7 ID Propagation

Always include the ID as an XML attribute on entity tags:
```python
tag("campaign", content, raw=True, id=str(campaign.get("id", "unknown")))
# → <campaign id="a1b2c3d4-...">...</campaign>
```

This allows Claude to reference IDs in follow-up tool calls without asking the user to look them up.

### 18.8 Boolean Representation

Boolean values should be emitted as lowercase strings:
```python
content += tag("manually-verified", "true" if creator.get("manually_verified") else "false")
# → <manually-verified>true</manually-verified>
```

Do NOT emit Python `True`/`False` — they render as "True"/"False" which is non-standard.

### 18.9 Timestamp Representation

Emit ISO 8601 timestamps as-is. Claude will format them for Slack:
```python
created = campaign.get("created_at", "")
if created:
    content += tag("created-at", str(created))
# → <created-at>2026-01-15T10:23:00Z</created-at>
```

Claude should render `2026-01-15T10:23:00Z` as "Jan 15, 2026" or "Jan 15 at 10:23 AM" depending on context.

### 18.10 Numeric Representation

Emit numeric values as their native string representation:
```python
content += tag("follower-count", str(creator.get("follower_count", 0)))
# → <follower-count>45200</follower-count>
```

Claude should humanize large numbers: `45200` → `45.2K`, `1000000` → `1M`.

### 18.11 Common Formatter Bug Prevention

These bugs exist in the current 7 tools. New formatters must avoid them:

| Bug Pattern | Example | Fix |
|-------------|---------|-----|
| Wrong field name in `.get()` | `.get("sender")` when field is `sender_email` | Match exact API response field name |
| Tag name invented vs field name | `tag("snippet", ...)` when field is `matched_snippet` | Use `tag("matched-snippet", ...)` |
| Emitting "None" string | `str(None)` when field is null | Check for None before emitting |
| Missing `raw=True` on nested content | `tag("campaign", content)` escapes the HTML | Add `raw=True` when content is pre-built XML |
| Missing offset parameter in API client | Pagination breaks silently | Always add `offset` param to API client call if endpoint supports it |

---

## Cross-References

- **Pagination formatting**: See `specs/shared-conventions.md` Section 3.5 for per-domain pagination display rules
- **Error messages**: See `specs/shared-conventions.md` Section 2.9 for error-to-Slack translation table
- **Status enums**: See `specs/shared-conventions.md` Section 6 for all enum values and their display names
- **Tool-specific formatting**: Each domain spec file has a "Slack Formatting Notes" section for per-tool guidance that extends these baseline patterns
- **XML helpers**: See `projects/cheerful/apps/context-engine/app/src_v2/core/xml.py` for `tag`/`wrap`/`hint` implementation


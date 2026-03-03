# Mama Sita's Campaign Architecture — Top-Down Feature Spec

> Date: 2026-03-01
> Status: Draft
> Constraint: No frontend. CE (Slack bot) is the only interface. Hardcoded IG tester token. Manual outreach on IG app.

---

## Core Insight

The outreach is manual. You copy-paste a template into Instagram DMs from the app for ~50 creators. The entire API/CE side is **reactive** — it catches inbound replies, manages conversations, drafts responses, and handles the campaign lifecycle. Cheerful handles all routine responses autonomously (same as it does for email today). You only get pulled in for edge cases.

---

## Campaign Lifecycle

| Phase | How | Channel | Human Involvement |
|-------|-----|---------|-------------------|
| Setup (products, campaign, creator list) | CE tools | Slack | You configure once |
| Discovery (find 50 creators) | CE tools | Slack | You pick keywords/seeds |
| Vetting (filter/rank) | CE tools | Slack | You approve the shortlist |
| **Outreach (send DMs)** | **Manual — you on IG app** | **Instagram** | Copy-paste template |
| Response management | CE (webhook + Slack notifications) | IG → Slack | Cheerful handles routine |
| Reply/conversation | CE drafts + auto-sends routine, alerts for edge cases | Slack → IG | You handle edge cases |
| Follow-up (non-responders) | **Manual — you on IG app** | **Instagram** | Copy-paste follow-up |
| Address collection | CE auto-extracts from replies | Automatic | Cheerful handles |
| Shipping export | CE tool | Slack | You request when ready |
| UGC tracking | CE or manual | Slack | TBD for v1 |
| ROI report | CE tool | Slack | You request when ready |

---

## Why Manual Outreach

Instagram Messaging API only allows replying to user-initiated conversations. You cannot cold-DM someone via the API. The 24-hour window is a reply window, not an outreach window. The only API-supported proactive message is Private Reply to a comment (requires them to engage first).

Manual outreach from the IG app has no such restriction. For 50 creators with a non-personalized template, this is ~30 minutes of work.

---

## What CE Actually Needs (IG DM Feature Set)

### Receive (webhook + ingest)
- Webhook handler: receive inbound DMs from Meta, HMAC-SHA256 validation
- Message ingest: dedup by `mid`, download media (URLs expire in ~1hr), store message
- Thread matching: match inbound message to campaign + creator
- Creator resolution: IGSID → creator lookup (cache + Graph API fallback)

### Read (query DM threads)
- List DM threads for a campaign (with status filter)
- Get thread messages (full conversation history)
- Search/filter threads (by status, creator, date)

### Reply (send within 24h window)
- Send single reply within 24h window
- Two-point window enforcement (route handler + workflow)
- Cheerful drafts replies autonomously using AI (same as email today)
- Auto-send for routine responses (address confirmation, thank you, etc.)
- Alert on Slack for edge cases (questions, complaints, unclear intent)

### Classify (AI-powered)
- Read inbound message, classify intent: interested / declined / address_provided / question / unrelated
- Extract structured address from free-text DM
- Update creator status automatically based on classification

### Notify (Slack alerts)
- New reply received (with classification + suggested action)
- 24h window expiring (urgent — reply or lose the thread)
- Creator opted in (address collected, ready for shipping)
- Edge case requiring human decision
- Window expired (creator moved to "needs follow-up" — manual IG outreach again)

### Campaign Management (CE tools)
- Create/get/list/update campaign
- Create/list products
- Create creator list
- Search creators by keyword (Influencer Club)
- Search similar creators
- Add search results to list
- Enrich creator profiles
- Add vetted creators to campaign
- Update creator status
- List campaign creators (with status filter)
- Export campaign creators as CSV (with shipping addresses)
- Campaign summary / ROI report

---

## What CE Does NOT Need (cut from scope)

- ~~OAuth flow~~ — hardcoded tester token
- ~~Token refresh workflow~~ — manual refresh when it expires (60 days)
- ~~Bulk send outreach~~ — manual on IG app
- ~~Send scheduling / rate limit management~~ — no API-based outreach
- ~~Follow-up scheduler~~ — manual on IG app
- ~~Outreach queue~~ — no API-based outreach
- ~~Send failure tracking~~ — no API-based outreach
- ~~Frontend components~~ — CE is the frontend

---

## Hardcoded Token Setup (Phase 0 — One Time)

1. IG Business Account @mamasitasmanila exists, linked to Facebook Page
2. Meta App created with Instagram product
3. You added as tester on Meta App
4. Long-lived access token obtained via Graph API Explorer or OAuth manual flow
5. Token stored directly in `user_ig_dm_account` table row (or env var)
6. Webhook endpoint deployed and registered in Meta Dashboard
7. Done. Never touch this again (until 60-day token refresh).

---

## The Tuesday Vision

```
@ce launch gifting campaign:
  product: Mama Sita's Barbecue Marinade 350mL
  product: Mama Sita's Caldereta Mix 50g (Pack of 6)
  target: 50 micro food creators, 5K-50K, Filipino food niche
  channel: IG DM
```

CE creates everything, runs discovery, vets creators, presents shortlist. You approve. CE gives you the outreach list with the template. You spend 30 minutes copy-pasting on IG. Then CE takes over — handles every reply, collects addresses, exports shipping list. You ship products. CE monitors for UGC. Campaign done.

Next Tuesday: new products, same machine.

---

## Estimated Tool Count

| Category | Tools | Notes |
|----------|-------|-------|
| Campaign CRUD | ~4 | create/get/list/update campaign, create/list products |
| Creator Discovery | ~5 | keyword search, similar search, create list, add to list, list lists |
| Creator Management | ~4 | enrich profile, add to campaign, update status, list campaign creators |
| IG DM Read | ~3 | list threads, get messages, search threads |
| IG DM Reply | ~1 | send reply (single, within 24h window) |
| Export / Report | ~2 | export CSV, campaign summary |
| **Total CE tools** | **~19** | |
| Webhook handler | 1 | Not a CE tool — FastAPI endpoint |
| Temporal workflows | ~3 | Ingest, send reply, reconciliation |
| AI classify + draft | system behavior | Not a CE tool — runs automatically on inbound |
| Slack notifications | system behavior | Not a CE tool — triggered by events |

~19 CE tools + backend infrastructure. Not 126.

---

## Open Questions

1. **UGC tracking for v1?** — Graph API mention monitoring + hashtag monitoring is complex. Could be manual for the first campaign and automated later.
2. **Auto-send threshold** — What types of responses should CE auto-reply to vs alert you? Proposal: auto-reply for address confirmations and simple thank-yous. Alert for questions, complaints, and ambiguous messages.
3. **Creator vetting** — AI scoring of content fit, or just hard filters (follower count + engagement rate)?
4. **Multi-campaign state** — When you run campaign #2 on a different Tuesday, do creators from campaign #1 carry over? (e.g., don't re-contact someone who declined)

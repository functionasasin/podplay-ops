# Mama Sita's Instagram Campaign Setup Guide — Cheerful

> For setting up an end-to-end influencer product campaign on Cheerful with Instagram DM integration.
> The Mama Sita's Instagram Business account will be added as a tester on the Meta app.

---

## Prerequisites

Before starting, confirm the following:

- [ ] Mama Sita's has an **Instagram Professional account** (Business or Creator)
- [ ] That Instagram account is **linked to a Facebook Page** (required by Meta — go to Instagram Settings → Account → Linked Accounts → Facebook)
- [ ] You have admin access to both the Instagram account and the Facebook Page
- [ ] You have access to Cheerful (app.cheerful.com)

---

## Part 1: Get Added as a Tester on the Meta App

Since the IG integration is in development (not yet through Meta App Review), only accounts added as **testers** on the Meta app will receive webhook events. This means DMs from creators to Mama Sita's will only flow into Cheerful if the account is registered as a tester.

### Steps

1. **Give your Facebook User ID to the Cheerful dev team** (that's me)
   - Go to https://developers.facebook.com
   - Log in with the Facebook account that owns the Mama Sita's FB Page
   - Your user ID will be visible in the URL or in Settings

2. **Accept the tester invitation**
   - You'll receive a notification on Facebook or at https://developers.facebook.com/requests
   - Accept the role (Tester or Developer)

3. **Verify you're set up**
   - Go to https://developers.facebook.com → My Apps
   - You should see the Cheerful app listed
   - Your role should show as Tester or Developer

> **Important**: Until the app passes Meta App Review, ONLY tester accounts will work. Real creators DMing the Mama Sita's account will have their messages received by Instagram as normal, but the webhook events won't fire to Cheerful. For testing, you'll need to DM from accounts also added as testers, OR wait for App Review approval.

---

## Part 2: Connect Mama Sita's Instagram Account in Cheerful

Once you're a tester on the Meta app:

1. **Log into Cheerful** at app.cheerful.com
2. Go to **Settings → Instagram Accounts** (or "Connected Accounts")
3. Click **"Connect Instagram Account"**
4. You'll be redirected to Facebook/Meta login
5. **Log in with the Facebook account** that owns the Mama Sita's page
6. **Grant all requested permissions** — these include:
   - `instagram_basic` — Read profile info
   - `instagram_manage_messages` — Read and send DMs
   - `pages_manage_metadata` — Webhook subscription
   - `pages_show_list` — List your pages
   - `pages_messaging` — Send messages
   - `business_management` — Access profile pictures
7. **Select the correct Facebook Page** (the one linked to Mama Sita's IG)
8. You'll be redirected back to Cheerful — the account should now show as **Connected**

### Verify the Connection

- The Mama Sita's IG handle should appear in your connected accounts list
- Webhook status should show as **Subscribed**
- Try sending a test DM from another tester account — it should appear in Cheerful within a few seconds

---

## Part 3: Set Up the Product Campaign

### Create the Campaign

1. In Cheerful, go to **Campaigns → Create New Campaign**
2. Fill in:
   - **Campaign Name**: e.g., "Mama Sita's Spring 2026 Product Seeding"
   - **Campaign Type**: Product Seeding / Gifting
   - **Brand**: Mama Sita's
3. **Add Campaign Sender**:
   - Select the Mama Sita's Instagram account as the sender
   - This means outreach and replies will come from the Mama Sita's IG handle
4. **Add Products** (if the product catalog feature is available):
   - Add the specific Mama Sita's products you're sending to creators
   - Include product names, images, descriptions, and retail values

### Add Creators to Campaign

1. Go to the campaign → **Creators** tab
2. Add creators either by:
   - **Manual entry**: Paste Instagram handles of target creators
   - **Import from list**: If you have a creator list already in Cheerful
   - **Search/Discovery**: Use Cheerful's creator search if available
3. For each creator, ensure their **Instagram handle** is populated — this is how Cheerful will match inbound DMs to the right creator and campaign

### Set Up Campaign Brief / Templates

1. Go to **Campaign Settings → Templates** or **Draft Settings**
2. Create your outreach message template. For IG DMs, keep in mind:
   - **Keep it short** — DMs are conversational, not email-length
   - **No subject line** — DMs don't have subjects
   - **Personalize** — Reference their content, not just "Dear Creator"
   - **Be direct about the offer** — "We'd love to send you [product] to try"
   - **Character limit awareness** — IG DMs have a 1000 character limit per message
3. Example template:
   ```
   Hey {creator_name}! 👋

   We love your content — especially [reference specific post/style]. We're Mama Sita's,
   a Filipino food brand, and we'd love to send you some of our products to try out.

   No strings attached — if you enjoy them and want to share with your audience,
   that would be amazing. Would you be interested?
   ```

### Set Automation Level

Choose how much AI assistance you want:

| Level | What Happens |
|-------|-------------|
| **Manual Review** | AI drafts replies, you approve every one before sending |
| **Semi-Auto** | High-confidence drafts auto-send, others queued for review |
| **Full Auto** | All AI drafts send automatically (not recommended for a new campaign) |

**Recommendation for first campaign**: Start with **Manual Review** so you can see how the AI drafts responses and tune the tone.

---

## Part 4: Running the Campaign

### Outreach Phase

1. **Launch the campaign** — this queues initial outreach DMs to all creators
2. Monitor the **Outbox** to see scheduled sends
3. DMs will be sent from the Mama Sita's Instagram account to each creator

### Managing Replies

1. Go to the **Inbox** — this is where creator DM replies will appear
2. Each DM thread shows:
   - Creator's IG handle and profile
   - Full conversation history
   - AI-generated draft reply (if enabled)
   - **DM Window indicator** — shows if you're within the 24-hour reply window
3. **Review and send replies** (or let AI handle per your automation level)

### The 24-Hour Window

This is important for Instagram DMs:

- After a creator messages you, you have **24 hours** to reply
- If 24 hours pass without a reply, you **cannot send promotional messages** (Meta policy)
- Cheerful will show a **window indicator** on each thread
- With the `HUMAN_AGENT` tag, the window extends to **7 days** (for customer service-style replies)
- **Best practice**: Reply within a few hours. Set up notifications so you don't miss the window.

### Tracking & Status

- Each creator in the campaign has statuses for:
  - **Gifting Status**: contacted → interested → address_confirmed → shipped → delivered → posted
  - **Response Status**: the thread status (waiting, replied, opted out, etc.)
- The campaign dashboard shows aggregate metrics

---

## Part 5: What to Expect (Tester Mode Limitations)

Since we're running as a tester app (not yet through Meta App Review):

| What Works | What Doesn't |
|------------|-------------|
| DMs from/to accounts added as testers | DMs from real creators (not added as testers) |
| Webhook events for tester accounts | Webhook events for non-tester accounts |
| Full OAuth flow | N/A — OAuth works in test mode |
| Sending DMs from Mama Sita's account | Sending DMs to accounts not in the tester list |
| Story mention detection (from testers) | Story mentions from non-testers |

### Workaround for Real Creator Testing

For the actual product campaign with real creators, we have two options:

1. **Get App Review approved first** (2-10 business days) — then all accounts work
2. **Add a few target creators as testers** — if they have Facebook Developer accounts, they can be added (unlikely for most creators)

**Recommendation**: Submit for App Review ASAP. Run internal tests with tester accounts in parallel. Once approved, launch the real campaign.

---

## Quick Reference

| Item | Value |
|------|-------|
| Cheerful URL | app.cheerful.com |
| IG Account to Connect | Mama Sita's (@mamasitas or whatever the handle is) |
| Required FB Page | The one linked to Mama Sita's IG |
| DM Reply Window | 24 hours (7 days with HUMAN_AGENT tag) |
| DM Character Limit | 1,000 characters per message |
| Meta App Review Timeline | 2-10 business days |

---

## Questions?

Ping me if anything is unclear or if you hit a blocker during setup. The main things that can go wrong:

1. **FB Page not linked to IG account** — Fix in Instagram Settings → Linked Accounts
2. **Permissions not granted during OAuth** — Redo the connection, make sure to check all permission boxes
3. **Not seeing webhook events** — Confirm you're added as a tester on the Meta app
4. **24-hour window expired** — Creator needs to message you again before you can reply

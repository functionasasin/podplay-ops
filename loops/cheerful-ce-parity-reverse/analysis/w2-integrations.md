# w2-integrations — Tool Design Working Notes

## Design Decisions

### Tool Count: 18 new tools (0 existing)

Broken down by sub-domain:
- Gmail Account Management: 2 tools (list_gmail_accounts, list_connected_accounts)
- SMTP Account Management: 6 tools (full CRUD + bulk import)
- Google Sheets: 1 tool (get_google_sheet_tabs)
- Shopify / GoAffPro: 2 tools (list_shopify_products, create_shopify_order)
- Instantly (Composio): 4 tools (status, connect, disconnect, test)
- Slack Operations: 1 tool (trigger_slack_digest)
- YouTube Lookalike: 1 tool (find_youtube_lookalikes)
- Brand Lookup: 1 tool (lookup_brand)

### Key Design Decisions

1. **OAuth flows excluded**: Gmail OAuth and Shopify OAuth are webapp-only browser redirects. CE tools can only READ the status of these connections. Added agent guidance text for when users ask to connect.

2. **Google Sheets tabs**: Placed here as a standalone utility (`cheerful_get_google_sheet_tabs`) even though campaigns.md has `cheerful_validate_campaign_sheet`. The distinction: this tool reads any arbitrary Sheet URL's tabs (used during setup), while the campaigns tool validates a specific campaign's already-configured sheet.

3. **YouTube lookalike placed in integrations**: Despite overlap with search-and-discovery, YouTube lookalike is an external integration (Apify + LLM) and fits better here. The forward loop may consolidate.

4. **Brand lookup is graceful-fail**: Unlike most tools, brand lookup never throws HTTP errors on failure — returns empty object. This is documented as a design note.

5. **SMTP passwords**: Passwords are accepted as input parameters but NEVER returned in response objects. Documented explicitly in return schemas.

6. **Bulk SMTP import verification**: Unlike single SMTP account creation, bulk import verifies IMAP credentials BEFORE saving. This is a significant behavioral difference documented in edge cases.

7. **Instantly uses user email as Composio entity**: Noted in connect tool — the identity binding is email-based, not user_id-based.

8. **Slack digest is one-way**: CE can trigger the digest but cannot handle Slack interactions (approve/skip/edit). Those are handled by an incoming Slack webhook, not user-initiated.

### Cross-Domain References

- `specs/campaigns.md` → `cheerful_validate_campaign_sheet` (campaign-scoped Google Sheet validation)
- `specs/email.md` → Email sending relies on SMTP accounts managed here
- `specs/search-and-discovery.md` → YouTube lookalike overlaps; IC search is in creators.md
- `specs/workflows.md` → Shopify tools reference workflow IDs and execution IDs

### Service Routes

18 new service routes needed. The Google Sheets endpoint may not strictly need a service route since the underlying endpoint is unauthenticated, but should be proxied for consistency with the service API pattern.

### Not Suitable for CE Tools

5 endpoints documented as non-CE-capable:
- Gmail OAuth initiate/callback (browser redirect)
- Shopify OAuth initiate/callback (browser redirect)
- Slack interactions webhook (incoming from Slack, not user-initiated)

### Open Questions for Wave 3

1. SMTP delete cascade: What happens when an SMTP account used as a campaign sender is deleted?
2. SMTP update duplicate: What if email_address is updated to match an existing active account?
3. SMTP account inactive delete: Does deleting an already-inactive account return 404 or succeed silently?
4. Shopify order idempotency: Can the same execution create duplicate Shopify orders?
5. Google Sheets endpoint authentication: Should the service route enforce user auth even though the underlying endpoint doesn't?

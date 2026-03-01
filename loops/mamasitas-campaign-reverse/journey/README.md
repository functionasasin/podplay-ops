# Mama Sita's Campaign Journey — Stage Index

> Gifting campaign: Oyster Sauce + Sinigang Mix → 50+ micro food creators (5K-50K) via Instagram DM

| # | Stage | File | Status |
|---|-------|------|--------|
| 1 | Campaign Setup | `stage-1-campaign-setup.md` | complete |
| 2 | Creator Discovery | `stage-2-creator-discovery.md` | complete |
| 3 | Creator Vetting | `stage-3-creator-vetting.md` | complete |
| 4 | IG DM Outreach | `stage-4-ig-outreach.md` | complete — cold outbound gap (P0 architectural), manual send required, CE tools for prep + monitoring |
| 5 | Response Management | `stage-5-response-management.md` | complete — 7 new gaps (29–35): address extraction P0, creator status update P0, HUMAN_AGENT tag P1, non-responder list P1, response categorization P1, expired window manual re-engagement P0 architectural |
| 6 | Negotiation | `stage-6-negotiation.md` | complete — 4 new gaps (36–38 + Gap 31 reconfirmed): cheerful_update_campaign_creator P0 for gifting_status+address write, gifting_address field exists in schema but no write path, content agreement tracking P2, bulk update P1; AI draft handles content brief via rules_for_llm |
| 7 | Shipping Export | `stage-7-shipping-export.md` | complete — 4 new gaps (39–42): no CSV/sheet export tool P1, no tracking number field P2, no SHIPPED/DELIVERED gifting status P2, per-creator product assignment N/A for uniform bundle; `cheerful_list_campaign_recipients(status=["READY_TO_SHIP"], has_address=true)` is the one-call manifest pull; blocked if Gap 30/36 not resolved |
| 8 | Content Tracking | `stage-8-content-tracking.md` | pending |
| 9 | UGC Capture | `stage-9-ugc-capture.md` | pending |
| 10 | ROI Measurement | `stage-10-roi-measurement.md` | pending |
| — | Hero Journey (synthesis) | `hero-journey.md` | pending |
| — | Gap Matrix (synthesis) | `gap-matrix.md` | pending |

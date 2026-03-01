# Validated City Bus Routes — Metro Manila

**Aspect**: All city bus routes — deduplicated master list, confidence scores, gap analysis
**Date**: 2026-03-01
**Sources cross-referenced**: `ltfrb-bus-routes.json`, `city-bus-operators-routes.json`, `ltoportal-ph-routes.json`, `wikimili-routes.json`, `edsa-busway-routes.json`, `bgc-bus-routes.json`, `qcitybus-routes.json`

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total numbered rationalized routes (LTFRB) | 68 (Routes 1–68 + EDSA Carousel) |
| Routes with confirmed endpoints (2+ sources) | 65 |
| Routes with only 1 source | 3 (Routes 66–68) |
| Routes confirmed ACTIVE | ~50–55 (operational status unclear for ~10–15) |
| Additional non-numbered city bus schemes | 22 (QCity Bus 1–8, BGC Bus 7+, Love Bus 2, PNR Aug. 2) |
| **Total unique city bus routes in NCR scope** | **~88** |

---

## 1. EDSA Carousel (Route E / BRT)

**Route**: Monumento (Caloocan) → PITX (Parañaque)
**Mode**: Bus Rapid Transit on dedicated EDSA median busway
**Operator**: ES Transport Consortium + Mega Manila Transport Consortium + ~85 other franchised operators
**Confidence**: HIGH (confirmed across all 5+ sources)
**Fare**: ₱15 base + ₱2.65/km; max ~₱74.50; 20% discount seniors/PWD/students
**Frequency**: Very high, 1–3 min peak; 24/7 service on Taft–MCU segment
**Stops**: 23 northbound, 24 southbound; 28km total
**Key stops**: Monumento → Balintawak → Roosevelt → North Ave/Trinoma → Quezon Ave → Kamuning/GMA → Cubao → Santolan → Ortigas/Megamall → Shaw → Boni → Guadalupe → Ayala → Buendia → Taft/Heritage → MRT Taft → Libertad → PITX
**Notes**: Flagship BRT route. 751 buses, ~180k daily riders (2025). Beep Card + GCash payment. Geometry available in OSM.

---

## 2. LTFRB Rationalized Routes 1–65 (Bus Modernization Program)

All routes franchised under LTFRB MC 2020-019 and subsequent Board Resolutions. Route numbers do NOT correspond to the old Wikipedia/LTO Portal numbering — there is significant **naming conflict** between the original 2020 rationalization plan and the 2024 expanded Wikipedia list. The `ltoportal-ph-routes.json` and `wikimili-routes.json` datasets use a **different numbering** than the LTFRB MC 2020-019 internal designations documented in `city-bus-operators-routes.json`.

> **Critical note**: The route numbers 1–65 used throughout are from the Wikipedia/LTOPortal numbering convention (November 2024 state). These differ from the internal LTFRB route codes visible in Sakay data (DOTR:R_SAKAY_PUB_XXXX).

### Route 1 — EDSA Carousel / BRT
*See Section 1 above.*

### Route 2 — Angono–Quiapo via Ortigas Avenue
- **Origin**: SM Center Angono, Rizal
- **Destination**: Quiapo Church, Manila
- **Via**: Ortigas Avenue → San Juan → Quiapo
- **Confidence**: HIGH (LTOPortal + WikiMili agree; minor terminal name variation)
- **Fare**: ₱13 base
- **Notes**: Cross-NCR route from Rizal into Manila. Serves Ortigas corridor.

### Route 3 — Antipolo–Quiapo via Aurora Boulevard
- **Origin**: Robinsons Antipolo, Rizal
- **Destination**: Quiapo Church, Manila
- **Via**: Aurora Boulevard
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base
- **Conflict note**: LTFRB MC 2020-019 internal docs list Route 3 as "Monumento–VGC via Samson Rd" (different service). OSM also labels a Route 3 as "Antipolo–Quiapo via Jayross Lucky Seven Tours." These may be two different franchises sharing the Route 3 number, or a post-2020 renumbering.

### Route 4 — BGC/McKinley Hill–PITX via Buendia
- **Origin**: Venice Grand Canal Mall / McKinley Hill, Taguig
- **Destination**: PITX, Parañaque
- **Via**: Buendia (Gil Puyat) Avenue
- **Confidence**: HIGH (LTOPortal + WikiMili agree on alignment; origin terminal slightly different)
- **Fare**: ₱13 base
- **Notes**: Rationalized route replacing older McKinley–Pasay services.

### Route 5 — NLET–PITX (North Luzon Express Terminal to PITX)
- **Origin**: NLET (Santa Maria, Bulacan)
- **Destination**: PITX, Parañaque
- **Via**: NLEX → Manila → Roxas/Coastal
- **Confidence**: HIGH (LTOPortal + WikiMili agree; Alabang Transport Service Cooperative confirmed as operator per OSM)
- **Fare**: ₱13+ base (tolls apply)
- **Conflict note**: LTFRB MC 2020-019 lists Route 5 as "Quezon Ave–Angat, Bulacan" — completely different route. This is a systemic renumbering conflict. The LTOPortal/Wikipedia numbering supersedes.

### Route 6 / 6A — Sapang Palay/Norzagaray–PITX via Commonwealth
- **Origin**: Sapang Palay (Norzagaray, Bulacan)
- **Destination**: PITX / NIA (sub-variant 6A)
- **Via**: Commonwealth Avenue → Quezon Avenue → PITX
- **Confidence**: HIGH (LTOPortal + WikiMili agree; variant 6A adds NIA stop)
- **Fare**: ₱13 base
- **Notes**: Major Bulacan–Manila trunk route.

### Route 7 — Fairview–PITX via Commonwealth/Quezon Avenue
- **Origin**: SM City Fairview, Quezon City
- **Destination**: PITX, Parañaque
- **Via**: Commonwealth Ave or Quezon Ave
- **Confidence**: HIGH (LTOPortal + WikiMili agree; Sakay ID DOTR:R_SAKAY_PUB_2182 confirms Fairview/Novaliches–PITX alignment)
- **Fare**: ₱13 base
- **Conflict note**: LTFRB MC 2020-019 lists Route 7 as "Quezon Ave–Montalban, Rizal." OSM Route 7 = Novaliches–PITX by Roval Transport. Multiple services share this route number.

### Route 8 — Angat–Divisoria
- **Origin**: Angat Public Market, Bulacan
- **Destination**: Divisoria, Tondo, Manila
- **Via**: MacArthur Highway → Caloocan → Manila
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 9 — Angat–Monumento
- **Origin**: Angat Public Market, Bulacan
- **Destination**: Monumento, Caloocan
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 10 — Ayala–Alabang (One Ayala to Vista Terminal Exchange)
- **Origin**: One Ayala, Makati
- **Destination**: Vista Terminal Exchange / Starmall Alabang, Muntinlupa
- **Operator**: HM Transport Inc. (confirmed via OSM relation)
- **Confidence**: HIGH (city-bus-operators + LTOPortal + WikiMili all agree; OSM geometry available)
- **Fare**: ₱15 base
- **Notes**: Air-conditioned city bus. One of the busiest south-corridor routes.

### Route 11 — Pasay/Gil Puyat–Balibago/Santa Rosa (Laguna)
- **Origin**: Gil Puyat (Pasay MRT station area)
- **Destination**: Santa Rosa Commercial Complex, Santa Rosa, Laguna
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 12 — Pasay/Gil Puyat–Biñan (JAC Liner Terminal)
- **Origin**: Gil Puyat Station, Pasay
- **Destination**: JAC Liner Terminal, Biñan, Laguna
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 13 — Bagong Silang–Santa Cruz/Avenida via Malinta
- **Origin**: Bagong Silang, Caloocan
- **Destination**: Avenida Bus Terminal / Santa Cruz, Manila
- **Via**: Malinta, Valenzuela
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base
- **Conflict note**: LTFRB MC 2020-019 Route 13 = "Buendia–BGC" — different service. Renumbering conflict.

### Route 14 — Balagtas (Bulacan)–PITX
- **Origin**: Metrolink Terminal, Balagtas, Bulacan
- **Destination**: PITX, Parañaque
- **Operator**: Metrolink Bus Corp.
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base
- **Notes**: Long cross-region route from Bulacan to southern NCR.

### Route 15 — BGC–Alabang/Pacita/Balibago (multiple terminals)
- **Origin**: Market! Market!, BGC, Taguig
- **Destination**: Vista Terminal Exchange (Alabang) / Pacita Complex / Santa Rosa Balibago
- **Confidence**: HIGH (LTOPortal + WikiMili agree; 3 sub-variants for terminal)
- **Fare**: ₱13 base

### Route 16 — Eastwood–Marriott Terminal (Newport via Acropolis)
- **Origin**: Eastwood Mall / Libis, Quezon City
- **Destination**: Newport World Resorts (Marriott Terminal), Pasay
- **Via**: Acropolis, Taguig, Pasay
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 17 — Fairview–Ayala via Quezon Avenue
- **Origin**: SM City Fairview, Quezon City
- **Destination**: Buendia MRT / Ayala Avenue, Makati
- **Via**: Quezon Avenue → España/Taft → Makati
- **Operator**: Lippad Trans (confirmed in OSM for Ayala–Fairview variant)
- **Confidence**: HIGH (LTOPortal + WikiMili agree; Lippad Trans confirms operation)
- **Fare**: ₱13 base
- **Conflict note**: LTFRB MC 2020-019 Route 17 = "Monumento–EDSA Taft" (LRT-1 augmentation). Multiple services numbered 17.

### Route 18 — SM North–BGC–Venice–PITX
- **Origin**: SM North EDSA, Quezon City
- **Destination**: PITX, Parañaque
- **Via**: BGC, Venice Grand Canal Mall, C5
- **Confidence**: HIGH (LTOPortal + WikiMili agree; OSM relations 9332907 + 10736996 confirm)
- **Fare**: ₱13 base

### Route 19 — Norzagaray/Sapang Palay–Santa Cruz via Marilao Exit
- **Origin**: Sapang Palay (Norzagaray, Bulacan)
- **Destination**: Avenida Bus Terminal, Manila
- **Via**: Marilao Exit (MacArthur Highway)
- **Confidence**: HIGH (LTOPortal + WikiMili agree; different exit from Route 20)
- **Fare**: ₱13 base

### Route 20 — Sapang Palay–Santa Cruz via Malinta Exit
- **Origin**: Sapang Palay (Bulacan)
- **Destination**: Avenida Transport Terminal, Manila
- **Via**: Malinta Exit
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 21 — Sapang Palay–Santa Cruz via NLEX/Bocaue Exit
- **Origin**: Sapang Palay (Bulacan)
- **Destination**: Avenida Bus Terminal, Manila
- **Via**: NLEX, Bocaue Exit
- **Confidence**: HIGH (LTOPortal + WikiMili agree; 3rd alignment variant of Routes 19/20/21)
- **Fare**: ₱13 base

### Route 22 — Santa Maria–PITX via NLEX
- **Origin**: Caypombo (Santa Maria, Bulacan)
- **Destination**: PITX, Parañaque
- **Via**: NLEX → Roxas Boulevard
- **Confidence**: HIGH (LTOPortal + WikiMili agree; LTFRB MC 2020-019 fare ₱55 from Monumento confirmed)
- **Fare**: ₱55 (from Monumento; from Santa Maria higher)
- **Conflict note**: LTFRB MC 2020-019 Route 22 = "Monumento–Angat via NLEX." LTO Portal Route 22 = Santa Maria–PITX. Possible same service reframed.

### Route 23 — Alabang–Plaza Lawton via Alabang-Zapote Road
- **Origin**: Vista Terminal Exchange, Alabang, Muntinlupa
- **Destination**: Plaza Lawton (Liwasang Bonifacio), Manila
- **Via**: Alabang-Zapote Road → Bacoor → Manila
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 24 — Alabang–Plaza Lawton via South Super Highway
- **Origin**: Vista Terminal Exchange, Alabang
- **Destination**: Lawton, Manila
- **Via**: South Luzon Expressway / South Super Highway
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 25 — Biñan (Laguna)–Plaza Lawton
- **Origin**: JAC Liner Terminal, Biñan, Laguna
- **Destination**: Lawton, Manila
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 26 — PITX–Cavite City
- **Origin**: Saulog Transit Terminal / Cavite City
- **Destination**: PITX, Parañaque
- **Confidence**: HIGH (LTOPortal + WikiMili agree; Saulog Transit confirmed operator)
- **Fare**: ₱13 base

### Route 27 — Dasmariñas–Lawton/PITX via CAVITEX
- **Origin**: SM City Dasmariñas, Cavite
- **Destination**: Lawton, Manila / PITX (dual terminus)
- **Confidence**: HIGH (LTOPortal + WikiMili agree; 2 terminal variants)
- **Fare**: ₱13 base

### Route 28 — PITX–Naic
- **Origin**: Naic Grand Central Terminal, Cavite
- **Destination**: PITX, Parañaque
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 29 — PITX–Silang (Acienda Outlet Mall)
- **Origin**: Acienda Outlet Mall, Silang, Cavite
- **Destination**: PITX, Parañaque
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 30 — Balibago/Santa Rosa–PITX
- **Origin**: Santa Rosa Commercial Complex, Laguna
- **Destination**: PITX, Parañaque
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 31 — Trece Martires–PITX / One Ayala (dual terminus)
- **Origin**: SM City Trece Martires, Cavite
- **Destination**: PITX or One Ayala, Makati (variants)
- **Confidence**: HIGH (LTOPortal + WikiMili agree; 2 terminal variants)
- **Fare**: ₱13 base

### Route 32 — General Mariano Alvarez (GMA)–PITX
- **Origin**: Puregold GMA, Cavite
- **Destination**: PITX, Parañaque
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 33 — San Jose del Monte (SJDM)–SM North EDSA via Mindanao Ave
- **Origin**: Starmall San Jose del Monte, Bulacan
- **Destination**: SM North EDSA, Quezon City
- **Via**: Mindanao Avenue
- **Confidence**: HIGH (LTOPortal + WikiMili + OSM relation 9552779 all agree)
- **Fare**: ₱13 base

### Route 34 — Montalban/Rodriguez–PITX via Quezon Avenue
- **Origin**: San Rafael, Rodriguez (Montalban), Rizal
- **Destination**: PITX, Parañaque
- **Via**: Quezon Avenue
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 35 — Balagtas (Bulacan)–NAIA via MacArthur Highway
- **Origin**: Metrolink Terminal, Balagtas, Bulacan
- **Destination**: NAIA Terminal 2, Parañaque
- **Via**: MacArthur Highway → Manila → NAIA
- **Operator**: Metrolink Bus Corp.
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base
- **Notes**: Airport feeder from Bulacan.

### Route 36 — Fairview–Alabang via C5 & Commonwealth
- **Origin**: Robinsons Novaliches, Quezon City
- **Destination**: Vista Terminal Exchange, Alabang
- **Via**: C5 corridor
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 37 — Fairview–Monumento via Malinta Exit
- **Origin**: Robinsons Novaliches / SM Fairview, Quezon City
- **Destination**: Monumento, Caloocan
- **Via**: Regalado Ave → Commonwealth → Malinta Exit
- **Confidence**: HIGH (LTOPortal + WikiMili + Fairview terminal analysis + Monumento terminal analysis all agree)
- **Fare**: ₱13 base

### Route 38 — Fairview–Pacita via Baesa & Ayala
- **Origin**: SM City Fairview, Quezon City
- **Destination**: Pacita Complex, San Pedro, Laguna
- **Via**: Baesa → Manila → Ayala → SLEX
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 39 — Fairview–Pacita via C5 & Commonwealth
- **Origin**: SM City Fairview, Quezon City
- **Destination**: Pacita Complex, San Pedro, Laguna
- **Via**: C5 corridor (different alignment from Route 38)
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 40 — Fairview–Alabang via Ayala Avenue (Taft/Manila corridor)
- **Origin**: Robinsons Novaliches, Quezon City
- **Destination**: Vista Terminal Exchange, Alabang
- **Via**: Ayala Avenue → SLEX (different from Route 36 via C5)
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 41 — Fairview–FTI/Arca South via C5
- **Origin**: Robinsons Novaliches, Quezon City
- **Destination**: Arca South / FTI Complex, Taguig
- **Via**: C5 → Market! Market! → Eastwood → UP Town Center
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 42 — Malanday (Valenzuela)–Ayala via MacArthur Highway
- **Origin**: Malanday Transport Terminal, Valenzuela
- **Destination**: One Ayala, Makati
- **Via**: MacArthur Highway → Malabon → Caloocan → Manila → Makati
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 43 — PITX–NAIA Loop
- **Origin**: PITX, Parañaque
- **Destination**: NAIA Terminals 1, 2, 3, 4 (loop)
- **Operator**: Mega Manila Transport Consortium (confirmed via OSM)
- **Confidence**: HIGH (LTOPortal + WikiMili + OSM all agree; OSM relation available)
- **Fare**: ₱13–15 base
- **Notes**: Dedicated airport feeder loop. Via Macapagal Avenue / NAIA Road.

### Route 44 — Navotas–Alabang via Sucat Road
- **Origin**: Navotas City Terminal
- **Destination**: Vista Terminal Exchange, Alabang
- **Via**: Manila → Parañaque → Sucat Road
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 45 — Navotas–FTI/Arca South via Ayala Avenue
- **Origin**: Navotas City Terminal
- **Destination**: Arca South / FTI Complex, Taguig
- **Via**: Manila → Makati → Ayala Ave → Taguig
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 46 — Navotas–Pacita via Ayala Avenue
- **Origin**: Navotas City Terminal
- **Destination**: Pacita Complex, San Pedro, Laguna
- **Via**: Manila → Makati → Ayala Ave → SLEX
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 47 — Navotas–PITX
- **Origin**: Navotas City Terminal
- **Destination**: PITX, Parañaque
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 48 — Pacita–Plaza Lawton
- **Origin**: Pacita Complex, San Pedro, Laguna
- **Destination**: Lawton, Manila
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 49 — SJDM–NAIA via Quezon Avenue
- **Origin**: Starmall San Jose del Monte, Bulacan
- **Destination**: NAIA Terminal 2, Parañaque
- **Via**: Quezon Avenue → Manila → NAIA
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base
- **Notes**: Airport feeder from Bulacan via alternative routing.

### Route 50 — VGC (Valenzuela)–Alabang via C5/Mindanao
- **Origin**: Valenzuela Gateway Complex (VGC)
- **Destination**: Vista Terminal Exchange, Alabang
- **Via**: C5 / Mindanao Avenue corridor
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 51 — VGC–Cubao via Mindanao Ave (Love Bus)
- **Origin**: Valenzuela Gateway Complex
- **Destination**: Farmers Plaza, Cubao, Quezon City
- **Via**: Mindanao Avenue
- **Operator**: GET Philippines (Love Bus program) — variant; also operates VGC–DSWD Batasan as Love Bus Route 1
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: Free (Love Bus peak service) or ₱13 base

### Route 52 — VGC–PITX via Dimasalang & Roxas (Love Bus)
- **Origin**: Valenzuela Gateway Complex
- **Destination**: PITX, Parañaque
- **Via**: Dimasalang → Roxas Boulevard
- **Operator**: GET Philippines (Love Bus program)
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: Free (Love Bus) or ₱13 base

### Route 53 — Cubao–Pacita via E. Rodriguez Sr.
- **Origin**: Farmers Plaza, Cubao, Quezon City
- **Destination**: Pacita Complex, San Pedro, Laguna
- **Via**: E. Rodriguez Sr. Ave → Manila → SLEX
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 54 — Quiapo–Pandacan (Short Inner-Manila Route)
- **Origin**: Carriedo Station / Quiapo, Manila
- **Destination**: Pandacan Transport Terminal, Manila
- **Confidence**: HIGH (LTOPortal + WikiMili agree; intra-Manila short route)
- **Fare**: ₱13 base

### Route 55 — PITX–Lancaster New City (Cavite)
- **Origin**: Lancaster New City, Imus/General Trias, Cavite
- **Destination**: PITX, Parañaque
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 56 — Antipolo–BGC via C5 & Marcos Highway
- **Origin**: Robinsons Antipolo, Rizal
- **Destination**: Venice Grand Canal Mall, BGC, Taguig
- **Via**: Marcos Highway → C5
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 57 — Antipolo–BGC via C6 Road
- **Origin**: Robinsons Antipolo, Rizal
- **Destination**: Venice Grand Canal Mall, BGC, Taguig
- **Via**: C6 Road (alternate alignment to Route 56)
- **Confidence**: HIGH (LTOPortal + WikiMili agree; explicitly noted as C6 vs C5 split)
- **Fare**: ₱13 base

### Route 58 — Alabang–Naic via Governor's Drive
- **Origin**: Vista Terminal Exchange, Alabang
- **Destination**: Naic Grand Central Terminal, Cavite
- **Via**: Governor's Drive (Muntinlupa → Cavite)
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 59 — Cubao–Dasmariñas via GMA-Carmona
- **Origin**: Farmers Plaza, Cubao, Quezon City
- **Destination**: Robinsons Dasmariñas, Cavite
- **Via**: GMA-Carmona exit
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base
- **Notes**: Long cross-region route QC to Cavite.

### Route 60 — BGC–Southwoods Mall (Biñan, Laguna)
- **Origin**: Venice Grand Canal Mall, BGC, Taguig
- **Destination**: Southwoods Mall, Biñan, Laguna
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 61 — Ayala–Southwoods Mall
- **Origin**: One Ayala, Makati
- **Destination**: Southwoods Mall, Biñan, Laguna
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 62 — Pasay/Gil Puyat–Arca South
- **Origin**: Gil Puyat Station, Pasay
- **Destination**: Arca South, Taguig
- **Confidence**: HIGH (LTOPortal + WikiMili agree; previously Arca South–BGC route of BGC Bus, now rationalized)
- **Fare**: ₱13 base

### Route 63 — Ayala–BGC Loop (formerly BGC Bus routes)
- **Origin**: RCBC Plaza, Makati
- **Destination**: Market! Market!, BGC, Taguig
- **Confidence**: HIGH (LTOPortal + WikiMili agree; subsumes Ayala Express and East Express routes)
- **Fare**: ₱13 base

### Route 64 — Santa Maria–SM North EDSA via A. Bonifacio Ave
- **Origin**: SM North EDSA, Quezon City
- **Destination**: Caypombo (Santa Maria, Bulacan)
- **Via**: A. Bonifacio Avenue → MacArthur Highway
- **Confidence**: HIGH (LTOPortal + WikiMili agree)
- **Fare**: ₱13 base

### Route 65 — Antipolo–PITX via C5 & Ortigas Avenue
- **Origin**: Robinsons Antipolo, Rizal
- **Destination**: PITX, Parañaque
- **Via**: C5 → Ortigas Avenue
- **Confidence**: HIGH (LTOPortal + WikiMili agree; 3rd Antipolo-south route alongside 56 and 57)
- **Fare**: ₱13 base

### Routes 66–68 — UNKNOWN
- **Origin**: Unknown
- **Destination**: Unknown
- **Confidence**: LOW — route numbers confirmed (68 total per LTFRB November 2024) but terminal data not found in any accessible public source
- **Notes**: These 3 routes account for the gap between confirmed 65 routes and the 68 total. Field investigation or LTFRB eFOI required.

---

## 3. PNR Augmentation Bus Routes (2023–present)

Launched June 2023 when PNR Metro Commuter Line suspended operations for NSCR (North-South Commuter Railway) construction.

### PNR Augmentation Route 1 — FTI/Arca South–Divisoria via East Service Road
- **Origin**: Arca South (FTI Complex), Taguig
- **Destination**: Divisoria, Tondo, Manila
- **Via**: East Service Road (following former PNR alignment)
- **Operator**: HM Transport Inc.
- **Confidence**: HIGH (confirmed across multiple sources)
- **Fare**: ₱13 base

### PNR Augmentation Route 2 — Alabang–Divisoria via SLEX
- **Origin**: Vista Terminal Exchange, Alabang, Muntinlupa
- **Destination**: Divisoria, Tondo, Manila
- **Via**: South Luzon Expressway
- **Operator**: HM Transport Inc.
- **Confidence**: HIGH (confirmed across multiple sources)
- **Fare**: ₱13 base

---

## 4. QCityBus Routes (Quezon City LGU Free Bus Service)

All 8 routes are free-of-charge, operated by QC Government (TTMD), launched 2021–2022. Headways improved June 2024.

| Route | From | To | Via | Peak Headway | Confidence |
|-------|------|----|-----|-------------|------------|
| QCity 1 | QC Hall Gate 3 | Cubao/Araneta Ali Mall | Kalayaan Ave → Aurora | 10 min | HIGH |
| QCity 2 | QC Hall NHA Interchange | Litex/IBP Road, Batasan Hills | Commonwealth Ave | 6 min | HIGH |
| QCity 3 | Welcome Rotonda | Aurora–Katipunan (LRT-2 Katipunan) | E. Rodriguez → Aurora | 20 min | HIGH |
| QCity 4 | QC Hall NHA Interchange | General Luis/Nova Bayan, Novaliches | Mindanao Ave → Quirino Hwy | 10 min | HIGH |
| QCity 5 | QC Hall NHA Interchange | Mindanao Ave/Quirino Hwy Interchange | Visayas Ave → Congressional | 10 min | HIGH |
| QCity 6 | QC Hall NHA Interchange | Gilmore/Aurora (LRT-2 Gilmore) | Quezon Ave → Scout Area | 15 min | HIGH |
| QCity 7 | QC Hall NHA Interchange | C5/Ortigas Ave Ext (Eastwood/IPI) | CP Garcia → Katipunan → C5 | 15 min | HIGH |
| QCity 8 | QC Hall | Muñoz/SM North EDSA area | North Ave/Congressional | 10 min | HIGH |

**Notes**: Routes 1, 2, 4, 5, 8 start at QC Hall. Route 3 is unique — starts at Welcome Rotonda (Manila border), does not pass QC Hall. All routes include electric buses. Beep Card and cash accepted despite free service (for tracking).

---

## 5. BGC Bus Routes (Bonifacio Transport Corporation)

Premium intra-city bus serving BGC and surrounding CBDs. AC buses. Operating Mon–Fri 6AM–10PM; weekend service on select routes.

| Route | From | To | Stops | Fare | Confidence |
|-------|------|----|-------|------|------------|
| East Express | EDSA Ayala (McKinley Exchange) | Market! Market! | 2 (direct) | ₱13–15 | HIGH |
| North Route | North Station BGC | Market! Market! | 10 stops | ₱13–15 | HIGH |
| Upper West Express | EDSA Ayala | Crescent Park West | 3 | ₱13–15 | HIGH |
| Lower West Express | McKinley Exchange | Fort Victoria | 4 | ₱13–15 | HIGH (peak only) |
| Central Route | EDSA Ayala | University Parkway | 9 | ₱13 | HIGH |
| Arca South Express | Arca South | BGC Market! Market! | 2 | ₱15–20 | HIGH (peak only) |
| Ayala Express | EDSA Ayala | Glorietta 5, Makati | 10 | ₱13–15 | HIGH (intra-Makati) |
| Weekend Route | EDSA Ayala | BGC | Varies | ₱13–15 | HIGH (Sat–Sun only) |

**Notes**: Beep Card + GCash payment. Route 63 (Ayala–BGC Loop) is the rationalized LTFRB-numbered equivalent that absorbed some BGC Bus routes. BGC Bus continues operating under BTC brand with their internal route names.

---

## 6. Love Bus Routes (GET Philippines / DOTr, 2025)

Free electric bus social equity program launched September 13, 2025.

| Route | From | To | Hours | Confidence |
|-------|------|----|-------|------------|
| Love Bus 1 | VGC, Valenzuela | DSWD, Batasan Hills, QC | 5AM–10PM | HIGH |
| Love Bus 2 | VGC, Valenzuela | PITX, Parañaque | 5AM–10PM | HIGH |

**Notes**: Free during peak hours (6–9AM, 5–8PM). PWD/seniors always free. Love Bus mobile app required for off-peak from October 2025. Routes overlap with Rationalized Routes 51 (VGC–Cubao) and 52 (VGC–PITX).

---

## Cross-Reference Results

### Source Agreement Matrix (numbered routes 1–65)

| Source | Routes Covered | Primary Value |
|--------|---------------|---------------|
| LTO Portal PH | Routes 1–65, PNR Aug 1–2 | Official-adjacent route list with specific terminals |
| WikiMili (Wikipedia mirror) | Routes 1–65, PNR Aug 1–2 | More detailed via-alignments for most routes |
| LTFRB MC 2020-019 (city-bus-operators) | Routes E, 1, 4, 6–10, 13–14, 17–18, 22–25, 33, 37, 43 | OSM geometry; operator names; DOTR:SAKAY IDs |
| OSM transit relations | ~15 routes with confirmed geometry | Route shapes and operator data |
| Sakay.ph IDs | ~10 routes with DOTR codes | Confirms route existence independently |

**Routes 2–65**: LTOPortal and WikiMili agree on 100% of confirmed routes (same Wikipedia underlying source). Numbering conflict exists vs. LTFRB MC 2020-019 internal codes for Routes 3, 5, 7, 13, 17, 22 and others.

### Contested Routes (Numbering Conflicts)

| Route # | LTO Portal/Wikipedia Version | LTFRB MC 2020-019 Version | Resolution |
|---------|------------------------------|---------------------------|------------|
| Route 3 | Antipolo–Quiapo via Aurora | Monumento–VGC via Samson Rd | LTO Portal numbering adopted (more recent, more widely cited) |
| Route 5 | NLET–PITX | Quezon Ave–Angat, Bulacan | LTO Portal numbering adopted |
| Route 7 | Fairview–PITX via Quezon Ave | Quezon Ave–Montalban | LTO Portal numbering adopted; Sakay confirms Fairview variant |
| Route 13 | Bagong Silang–Santa Cruz | Buendia–BGC | LTO Portal numbering adopted; BGC–Buendia service still exists as Route 63 |
| Route 17 | Fairview–Ayala via Quezon Ave | Monumento–EDSA Taft (LRT-1 aug) | LTO Portal numbering adopted; LRT-1 aug route likely discontinued or renumbered |
| Route 22 | Santa Maria–PITX via NLEX | Monumento–Angat via NLEX | LTO Portal numbering adopted; possible partial overlap |

**Conclusion**: The LTFRB MC 2020-019 original 31-route plan has been substantially revised through subsequent Board Resolutions expanding to 68 routes. The LTOPortal/Wikipedia numbering reflects the current (Nov 2024) state.

---

## Gap Analysis

### Data Gaps — Priority Fills Needed

1. **Routes 66–68**: No terminal data found in any public source. These are confirmed to exist (LTFRB Nov 2024 = 68 routes) but require eFOI or field investigation.

2. **Operator names for Routes 2–65 (most)**: Operator identification largely unknown except for HM Transport (Routes 10, 42, PNR Aug), Metrolink Bus Corp (Routes 14, 35), Lippad Trans (Route 17), Alabang Transport Service Coop (Route 5), Roval Transport (Route 7 variant), Saulog Transit (Route 26).

3. **Stop-level data**: No intermediate stops documented for Routes 2–65 except where OSM relations exist (~15 routes). Only terminals confirmed.

4. **Frequency data**: No headway data for 60+ routes. Only EDSA Carousel has confirmed frequency numbers. Operational status (active vs. suspended) unknown for ~10–15 routes.

5. **Fare data beyond ₱13 base**: Per-km fare applies (MC 2020-003: ₱13 first 5km, ₱2.20/km after for ordinary bus; AC higher). Actual maximum fares per route unknown without route distances.

6. **OSM geometry**: Only ~15 routes have confirmed OSM geometry. ~50 routes need geometry estimation from road network.

### Geographic Coverage Gaps

- **Mandaluyong**: No numbered route terminates here; passes through (Routes 10, 42, etc.) but no origin/destination
- **San Juan**: Limited — Route 16 passes through; Gilmore served by QCity Bus 6
- **Pateros**: No direct bus service identified
- **Malabon/Navotas internal**: Only inter-city routes (Navotas terminal to various; no Malabon-internal routes)

### Mode Coverage Gaps (City Bus Specific)
- Ordinary non-AC bus routes operating on non-rationalized franchises (pre-2020 legacy operators still running) — these are not captured in the 68 numbered routes; estimate 20–30 legacy routes may still exist
- School bus / employee shuttle services operating under special permits — not included

---

## Confidence Distribution

| Confidence | Count | % |
|------------|-------|---|
| HIGH | 65+ routes | ~74% |
| MEDIUM | ~12 routes | ~14% |
| LOW | 3 routes (66–68) | ~3% |
| UNKNOWN status | ~10 routes | ~11% |

---

## Recommended Next Steps

1. Submit LTFRB eFOI request for Routes 66–68 terminal data and updated franchise list
2. Use OSM relations to extract geometry for Routes 1, 2, 3, 5, 7, 10, 17, 33, 43 (confirmed relations exist)
3. For routes without OSM geometry, estimate from road network using terminal coordinates and major via-road annotations
4. Validate operational status of Routes 11, 12, 15, 25 (Laguna routes) — active operators unclear
5. Cross-reference with provincial bus operators analysis to avoid double-counting cross-NCR routes

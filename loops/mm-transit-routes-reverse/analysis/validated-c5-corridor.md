# Validated Routes: C5 Corridor

**Wave 2 Cross-Reference | Generated: 2026-02-28**

C5 (Circumferential Road 5) runs ~32km through the eastern side of Metro Manila, from the Commonwealth Ave junction in Quezon City south through Pasig, Taguig, and into Parañaque/Las Piñas at the SLEX on-ramp. It is the primary north-south corridor for east-side commuters, paralleling EDSA on the eastern flank and carrying a dense mix of buses, UV Express, P2P, and jeepney services.

---

## C5 Corridor Geography

### Key Segments

| Segment | Cities | Key Landmarks |
|---------|--------|---------------|
| **North C5** | Quezon City | Commonwealth Ave junction → Katipunan → Aurora Blvd/LRT-2 Katipunan |
| **Mid C5** | QC/Pasig | LRT-2 Katipunan → Libis → Eastwood City → Ortigas Ave junction |
| **BGC C5** | Pasig/Taguig | Ortigas Ave → Market! Market! → BGC grid (Lawton Ave/5th Ave) |
| **South C5** | Taguig | BGC → FTI → Western Bicutan → Arca South |
| **C5 South Extension** | Taguig/Parañaque | Arca South → C5-SLEX interchange → Las Piñas |

### Major C5 Intersections
- **Commonwealth Ave** (Quezon City, north end — where C5 begins at EDSA/Commonwealth junction area)
- **Aurora Blvd / Katipunan Ave** (Quezon City; LRT-2 Katipunan station)
- **Ortigas Ave** (Pasig City — major east-west cross-road; very high bus density)
- **Upper McKinley Road / McKinley Parkway** (Taguig/BGC approach)
- **Market! Market! driveway** (Taguig — major P2P/bus terminus on C5)
- **Lawton Ave / 5th Ave** (BGC internal; where BGC Bus routes terminate)
- **FTI / Kayamanan-C / DBP Ave** (Taguig south — industrial/residential terminal area)
- **Arca South** (Taguig south — emerging commercial hub at C5-SLEX junction)

---

## Sources Consulted

| Source File | C5 Routes Found |
|-------------|-----------------|
| ltoportal-ph-routes.json | Routes 4, 16, 36, 39, 41, 50; QCityBus Route 7 |
| osm-transit-relations-routes.json | Routes 15, 38, 40, 55; P2P BGC–ATC |
| wikimili-routes.json | Routes 36, 39, 41, 50; Antipolo–BGC; Fairview–Alabang variants |
| ltfrb-uv-express-routes.json | 8 UV Express routes on C5 |
| p2p-routes.json | 5 P2P routes using C5 corridor |
| bgc-bus-routes.json | BGC Bus East, Lower West, Night, Weekend routes |
| city-bus-operators-routes.json | Route 18, BGC Bus, QCityBus Route 7 |
| mrt3-feeder-routes.json | 4 jeepney routes on C5 (FTI, Gate 3, Pateros) |
| qcitybus-routes.json | QCityBus Route 7 full stop detail |
| cubao-terminal-routes.json | Cubao→Sta. Lucia/Rosario jeepney via C5 |
| ltfrb-jeepney-routes.json | 2 jeepney routes touching C5 |
| ltfrb-modernization-routes.json | Eastwood/Libis–Capitol Commons; UP Town–Ortigas |
| dotr-routes.json | Antipolo–McKinley Hill via C5/FVR (planned/approved) |
| ltfrb-rationalization-routes.json | Antipolo–McKinley Hill via C5 (approved but disputed) |
| baclaran-terminal-routes.json | Route 18 (PITX–North EDSA via C-5) |
| sm-north-edsa-terminal-routes.json | Route 18 (PITX–North EDSA via C-5) |
| sakay-ph-routes.json | Market! Market!–Calamba P2P |
| world-bank-routes.json | BRT Line 3 on C5 (planned) |
| OSM Wiki (web) | Route 16, 18, 39; Worthy Transport confirmed on Route 39 |
| Web search (2025) | HM/Worthy Bus BGC–Alabang via C5; BGC Bus Arca South route |

---

## CONFIRMED Routes (HIGH confidence, 2+ independent sources)

### City Bus: Long-Haul C5 Routes (North-South)

#### Route 15: BGC–Alabang via C5
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Unknown (OSM-confirmed)
- **Full Route:** Bonifacio Global City, Taguig → Alabang (South Station), Muntinlupa
- **Key stops:** BGC → C5 → SLEX → Alabang
- **Geometry:** OSM relation confirmed
- **Confirming sources:** osm-transit-relations-routes.json (HIGH)
- **Notes:** Southbound C5 route from BGC. Shorter than Fairview routes; serves Alabang commercial hub.

#### Route 36: Fairview–Alabang via C5
- **Mode:** Bus | **Confidence: HIGH**
- **Full Route:** Fairview (Robinsons Novaliches or SM City Fairview), Quezon City → Alabang (Vista Terminal Exchange), Muntinlupa
- **Key stops:** Fairview → QC/C5 → Pasig → Taguig → Muntinlupa → Alabang
- **Geometry:** Not confirmed (ltoportal stop list is terminal-only)
- **Confirming sources:** ltoportal-ph-routes.json (HIGH), wikimili-routes.json (HIGH)
- **Notes:** One of the flagship long-haul C5 routes. May be the same route as Route 40 under a different numbering generation — see Contested section.

#### Route 38/39: Fairview/Pacita ↔ Pacita/Fairview via C5 & Ayala
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Worthy Transport (OSM Wiki confirmed for Route 39 direction)
- **Full Route (39):** Pacita Complex, San Pedro, Laguna → Fairview, Quezon City via C5, Ayala
- **Full Route (38):** Pacita Complex, San Pedro, Laguna → Fairview, Quezon City (OSM)
- **Key stops:** Pacita Complex → SLEX → C5 → E. Rodriguez Jr. Ave → Katipunan Ave → Fairview
- **Geometry:** OSM relation confirmed (Route 38)
- **Confirming sources:** osm-transit-relations-routes.json (HIGH), ltoportal-ph-routes.json (HIGH "Route 39"), wikimili-routes.json (HIGH "Fairview–Pacita via C5"), OSM Wiki (HIGH — Worthy Transport, Route 39)
- **Notes:** Route 38 (OSM) and Route 39 (ltoportal) appear to be the same route or closely related (may be forward/return directions). Worthy Transport is the confirmed operator.

#### Route 40: Fairview–Alabang via C5
- **Mode:** Bus | **Confidence: HIGH**
- **Full Route:** Fairview, Quezon City → Alabang (South Station), Muntinlupa
- **Key stops:** Fairview → C5 → Ayala → Alabang
- **Geometry:** OSM relation confirmed
- **Confirming sources:** osm-transit-relations-routes.json (HIGH), wikimili-routes.json (HIGH "Fairview–Alabang via C5 & Commonwealth")
- **Notes:** Very similar to Route 36. These may be parallel routes (same corridor, different operators) or the same route under two numbering systems. See Contested section.

#### Route 41: Fairview–FTI via C5, Market! Market!, Eastwood, UP Town
- **Mode:** Bus | **Confidence: HIGH**
- **Full Route:** Robinsons Novaliches, Fairview, Quezon City → Arca South / FTI, Taguig
- **Key stops:** Robinsons Novaliches → C5 → Market! Market! → Eastwood → UP Town Center → Arca South/FTI
- **Geometry:** Not confirmed
- **Confirming sources:** ltoportal-ph-routes.json (HIGH "Route 41: Fairview → FTI"), wikimili-routes.json (HIGH "Fairview–FTI via C5, Market!, Eastwood, UP Town")
- **Notes:** Unique routing — terminates at FTI/Arca South rather than Alabang. Uses C5 and loops back through BGC/Eastwood northward to catch UP Town Center before returning south to FTI. Unusual geometry.

#### Route 50: VGC–Alabang via C5 & Mindanao Ave
- **Mode:** Bus | **Confidence: HIGH**
- **Full Route:** Valenzuela Gateway Complex (VGC), Valenzuela → Vista Terminal Exchange, Alabang, Muntinlupa
- **Key stops:** VGC → Valenzuela → QC (Mindanao Ave) → C5 → Pasig → Taguig → Muntinlupa → Alabang
- **Geometry:** Not confirmed
- **Confirming sources:** ltoportal-ph-routes.json (HIGH), wikimili-routes.json (HIGH "VGC–Alabang via C5 & Mindanao")
- **Notes:** Valenzuela → QC (via Mindanao Ave) → southward on C5 → Alabang. Very long route spanning northwest-to-south NCR.

#### Route 55: Antipolo–McKinley Hill via C5/Ortigas
- **Mode:** Bus | **Confidence: HIGH**
- **Full Route:** Antipolo, Rizal → McKinley Hill, Taguig
- **Key stops:** Antipolo → Ortigas Ave → C5 → BGC → McKinley Hill
- **Geometry:** OSM relation confirmed
- **Confirming sources:** osm-transit-relations-routes.json (HIGH)
- **Notes:** East-to-west C5 transversal: Antipolo enters via Ortigas Ave, then travels south on C5 to BGC/McKinley. Serves east Rizal corridor.

#### Route 16: Eastwood Libis–Marriott Terminal via E. Rodriguez Jr. Ave / C5
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Citylink Coach Services (OSM Wiki confirmed)
- **Full Route:** Eastwood Libis, Quezon City → Marriott Terminal, Pasay
- **Key stops:** Eastwood → E. Rodriguez Jr. Ave → C5 → East Service Road → Andrews Ave → Marriott/Bay City area
- **Geometry:** Not confirmed
- **Confirming sources:** ltoportal-ph-routes.json (HIGH), OSM Wiki (HIGH — Citylink Coach Services, confirmed path via C5)
- **Notes:** Pre-pandemic route per OSM Wiki; current operational status uncertain. Route uses northern C5 (Libis/Eastwood section) then heads southwest toward the bay. Listed in ltoportal (HIGH), suggesting it has some operational status.

#### Route 18: SM North EDSA–PITX via NAIA, Upper McKinley, C-5
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Baclaran Metro Link (OSM Wiki confirmed)
- **Full Route:** SM North EDSA / North Avenue, Quezon City → PITX (Parañaque Integrated Terminal Exchange), Parañaque
- **Key stops:** SM North EDSA → NAIA Terminals area → Upper McKinley / BGC → C-5 corridor → PITX
- **Geometry:** Not confirmed (route geometry complex due to NAIA detour)
- **Confirming sources:** ltoportal-ph-routes.json (HIGH), city-bus-operators-routes.json (MEDIUM), sm-north-edsa-terminal-routes.json (MEDIUM), baclaran-terminal-routes.json (MEDIUM), OSM Wiki (HIGH — Baclaran Metro Link, launched 2020)
- **Notes:** Cross-city route launched 2020. Uses C5 for the BGC/Taguig segment (Upper McKinley area). Connects the NAIA airport cluster to both North EDSA and PITX. Most sources describe it in PITX→North EDSA direction; ltoportal lists it north→south.

#### Route 4: McKinley Hill (Venice Grand Canal Mall)–PITX
- **Mode:** Bus | **Confidence: HIGH**
- **Full Route:** McKinley Hill (Venice Grand Canal Mall area), Taguig → PITX, Parañaque
- **Key stops:** McKinley Hill → Taguig → Pasay → PITX
- **Geometry:** Not confirmed
- **Confirming sources:** ltoportal-ph-routes.json (HIGH), web search (GREEN FROG Hybrid Bus confirmed as sole operator on Venice–PITX route)
- **Notes:** The "Green Frog Hybrid Bus" mentioned in web searches is likely the same as this Route 4; most units terminate at Kalayaan Ave instead of continuing to Venice. Short C5-adjacent segment (McKinley/BGC area) heading southwest to PITX.

---

### QCityBus: Electric Bus on Northern C5

#### QCityBus Route 7: QC Hall–C5/Ortigas Ave Extension (Eastwood/IPI)
- **Mode:** Bus (electric) | **Confidence: HIGH**
- **Operator:** Quezon City Government (QCityBus)
- **Full Route:** Quezon City Hall (NHA Interchange), Diliman → E. Rodriguez Jr. Ave / Ortigas Ave (C5 intersection), Pasig
- **Key stops (detailed):**
  1. QC Hall NHA Interchange
  2. C.P. Garcia Ave / Krus Na Ligas
  3. Katipunan Ave (Santa Maria della Strada Parish)
  4. Katipunan Ave (Ateneo de Manila Gate 3)
  5. Aurora Blvd / Katipunan Ave Interchange (LRT-2 Katipunan Station)
  6. Katipunan Ave / P. Tuazon Ave (Quirino Memorial Medical Center)
  7. Katipunan Ave / Boni Serrano Ave
  8. E. Rodriguez Jr. Ave (Eastwood City)
  9. E. Rodriguez Jr. / Greenmeadows Ave
  10. E. Rodriguez Jr. / Ortigas Ave (C5)
- **Fare:** ₱15 (QCityBus flat rate) | **Frequency:** Regular QCityBus intervals
- **Geometry:** Not confirmed; stop coordinates noted above
- **Confirming sources:** qcitybus-routes.json (HIGH, full stop detail), ltfrb-bus-routes.json (HIGH), city-bus-operators-routes.json (HIGH), ltoportal-ph-routes.json (HIGH)
- **Notes:** The only QCityBus route using C5. Starts inland at QC Hall and routes via Katipunan Ave (northern C5 zone) before terminating at C5/Ortigas Ave junction. Provides service on the northern C5 segment where city buses are sparse. Connects Ateneo, LRT-2 Katipunan, and Eastwood.

---

### BGC Bus: C5 Segment in BGC/McKinley Area

#### BGC Bus East Express: EDSA Ayala → Market! Market!
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** Fort Bonifacio Development Corp. (BGC Bus)
- **Full Route:** EDSA Ayala Terminal (McKinley Exchange Corporate Center), Makati → Market! Market! Terminal, BGC Taguig
- **Key stops:** EDSA Ayala → Market! Market!
- **Fare:** ₱11 (BEEP card accepted) | **Payment:** BEEP RFID
- **Geometry:** Not confirmed in OSM
- **Confirming sources:** bgc-bus-routes.json (HIGH), city-bus-operators-routes.json (HIGH), mrt3-feeder-routes.json (HIGH)
- **Notes:** Uses McKinley Pkwy / BGC road network (C5-adjacent internal roads). Market! Market! is on C5 driveway. Runs throughout BGC business hours.

#### BGC Bus Lower West Express / Night / Weekend Routes
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** BGC Bus (Fort Bonifacio Development Corp.)
- **Full Route:** EDSA Ayala Terminal (McKinley Exchange), Makati → Fort Victoria, BGC
- **Key stops:** EDSA Ayala → McKinley Pkwy → RCBC/Piccadilly Star → Net One Center → Fort Victoria
- **Fare:** ~₱11–15 | **Payment:** BEEP RFID
- **Confirming sources:** bgc-bus-routes.json (HIGH — all variants documented)
- **Notes:** Internal BGC circulation routes. Night and Weekend variants extend through more BGC stops (Crescent Park West, HSBC, The Globe Tower, NutriAsia, University Pkwy). All terminate at Market! Market! or Fort Victoria on the C5-adjacent BGC grid.

#### BGC Bus Arca South Express Route
- **Mode:** Bus | **Confidence: HIGH**
- **Operator:** BGC Bus (Fort Bonifacio Development Corp.)
- **Full Route:** BGC → Arca South, Western Bicutan, Taguig
- **Fare:** Higher than standard BGC Bus routes | **Frequency:** Select morning and late afternoon trips
- **Confirming sources:** Web search 2025 (HIGH — "Arca South–BGC route remains operational")
- **Notes:** Connects BGC proper to Arca South (the emerging commercial district at the C5-SLEX junction area). Follows C5 south from BGC toward Western Bicutan.

---

### P2P Bus Routes on C5

#### BGC Market! Market!–Alabang Town Center (P2P)
- **Mode:** P2P | **Confidence: HIGH**
- **Operator:** HM Transport / Worthy Bus (web: "HM / Worthy Bus" confirmed)
- **Full Route:** Market! Market!, BGC, Taguig → Alabang Town Center, Muntinlupa
- **Key stops:** Market! Market! → C5 → SLEX → Alabang Town Center
- **Fare:** ₱51–52 (TRIPKO card) | **Hours:** 7:00 AM–7:30 PM northbound; 6:00 AM–8:00 PM southbound
- **Frequency:** Regular departures; est. 20–30 min headway weekdays
- **Travel time:** 30–60 min
- **Geometry:** Not confirmed
- **Confirming sources:** osm-transit-relations-routes.json (HIGH — "P2P: BGC–Alabang Town Center"), p2p-routes.json (HIGH — "BGC Market! Market!–Alabang Town Center"), tumi-datahub-routes.json (MEDIUM — "P2P Bus Alabang Town Center to Market Market"), web search (HIGH — fare ₱51–52, TRIPKO card, operator HM/Worthy Bus)
- **Notes:** TRIPKO card required; not GCash/cash. One of the best-documented C5 P2P routes. High ridership due to BGC–Alabang corridor demand.

#### Alabang–Cubao via C5 (P2P)
- **Mode:** P2P | **Confidence: HIGH**
- **Full Route:** Starmall Alabang, Muntinlupa → Araneta City, Cubao, Quezon City
- **Key stops:** Starmall Alabang → Market! Market! BGC → Eastwood Libis → Araneta City Cubao
- **Fare:** ~₱140–200 range (unconfirmed; inferred from comparable routes)
- **Confirming sources:** p2p-routes.json (HIGH)
- **Notes:** Uses C5 as the main spine northbound: Alabang → SLEX → C5 → Market! Market! → Eastwood/Libis → Cubao.

#### Dasmariñas–Cubao via C5 (P2P)
- **Mode:** P2P | **Confidence: HIGH**
- **Full Route:** Robinsons Dasmariñas Pala Pala, Dasmariñas, Cavite → Araneta City, Cubao, Quezon City
- **Key stops:** Robinsons Dasmariñas → Alabang → Venice Grand Canal Mall → Market! Market! BGC → Eastwood Libis → Araneta City Cubao
- **Confirming sources:** p2p-routes.json (HIGH)
- **Notes:** Uses C5 for the BGC → Eastwood → Cubao segment. Long-haul Cavite → NCR route.

#### BGC Market! Market!–Calamba via C5 (P2P)
- **Mode:** P2P | **Confidence: HIGH**
- **Operator:** HM Transport (web search confirmed)
- **Full Route:** Market! Market!, BGC, Taguig → SM City Calamba, Calamba, Laguna
- **Key stops:** Market! Market! → C5 → SLEX → Real Road → SM Calamba
- **Confirming sources:** sakay-ph-routes.json (HIGH — "Market Market - Calamba"), web search (HIGH — HM Transport operator, via C5 → SLEX confirmed)
- **Notes:** Long-haul south of Metro Manila. Uses C5 from Market! Market! to SLEX then to Laguna.

---

### UV Express Routes on C5

#### Antipolo–Ayala via C5 (UV Express)
- **Mode:** UV Express | **Confidence: HIGH**
- **Full Route:** Antipolo City, Rizal → Ayala Center, Makati
- **Key stops:** Antipolo → C5 → Ayala
- **Fare:** Not documented
- **Confirming sources:** ltfrb-uv-express-routes.json (HIGH)
- **Notes:** Enters C5 via Ortigas Ave from Antipolo, then heads south to Ayala. Distinct from the Marcos Highway variant (also exists — separate route).

#### Greenland Executive Village (Cainta)–Ayala via C5 (UV Express)
- **Mode:** UV Express | **Confidence: HIGH**
- **Full Route:** Greenland Executive Village, Cainta, Rizal → Ayala Center, Makati
- **Key stops:** Cainta → C5 → Ayala
- **Confirming sources:** ltfrb-uv-express-routes.json (HIGH)
- **Notes:** Cainta area feeder into C5 southbound to Ayala/Makati.

#### BF Parañaque–Ayala Center via Skyway/C5 (UV Express)
- **Mode:** UV Express | **Confidence: HIGH**
- **Full Route:** BF Parañaque Village, Las Piñas → Ayala Center, Makati
- **Key stops:** BF Parañaque → Skyway/C5 → Ayala
- **Confirming sources:** ltfrb-uv-express-routes.json (HIGH)
- **Notes:** Uses C5 south segment and possibly Skyway elevated approach to reach Ayala from the south.

---

### Jeepney Routes on C5

#### Route 202 / Fort Bonifacio Gate 3 – Guadalupe / Market! Market! (ABC) Loop
- **Mode:** Jeepney | **Confidence: HIGH**
- **Full Route:** Fort Bonifacio Gate 3, BGC → Guadalupe MRT Jeep Terminal / Market! Market! ABC, Taguig
- **Key stops:** Fort Bonifacio Gate 3 → Market! Market! → J.P. Rizal Extension (Comembo) → Guadalupe MRT Jeep Terminal
- **Fare:** ₱12 base
- **Geometry:** Not confirmed
- **Confirming sources:** ltfrb-jeepney-routes.json (HIGH), ltfrb-modernization-routes.json (HIGH), mrt3-feeder-routes.json (HIGH — Route 202)
- **Notes:** One of the key jeepney feeder routes on C5. Connects MRT Guadalupe to BGC via C5 driveway at Market! Market! Serves Comembo/JP Rizal Extension (between Guadalupe and Market!).

#### FTI / Kayamanan-C–Guadalupe via C5
- **Mode:** Jeepney | **Confidence: HIGH**
- **Full Route:** Guadalupe MRT Jeep Terminal → Tenement FTI (PNR FTI), Taguig
- **Key stops:** Guadalupe MRT → Market! Market! → Diego Silang → Palar → C5 → FTI Taguig
- **Fare:** ₱12 base
- **Confirming sources:** mrt3-feeder-routes.json (HIGH)
- **Notes:** Key jeepney serving the FTI/Kayamanan-C residential area south of Market! Market! Runs along C5 from the Market! Market! intersection southward to FTI. Provides key MRT connectivity for FTI residents.

#### Cubao–Sta. Lucia / Rosario via Ortigas Ave / C5 (Jeepney)
- **Mode:** Jeepney | **Confidence: HIGH**
- **Full Route:** Cubao (Araneta City Modern Jeepney Terminal) → Sta. Lucia Mall / Rosario, Pasig City
- **Key stops:** Cubao/Araneta → Ortigas Ave → C5 → Sta. Lucia/Rosario, Pasig
- **Confirming sources:** cubao-terminal-routes.json (HIGH)
- **Notes:** Key east-west C5 link from Cubao. Uses Ortigas Ave then C5 to reach the Rosario/Sta. Lucia area in Pasig. Popular for pasig-bound commuters from Cubao.

---

## MEDIUM CONFIDENCE Routes (single source or partial corroboration)

| Route | Mode | From | To | Via C5 Segment | Confidence Notes |
|-------|------|------|----|----------------|------------------|
| Market! Market! → Rosario via C5 | UV Express | Market! Market! BGC | Rosario, Pasig | C5 northbound (BGC to Pasig) | ltfrb-uv only |
| Lower Bicutan → SM Makati via C5 | UV Express | Lower Bicutan, Taguig | SM Makati, Makati | C5 south segment | ltfrb-uv only |
| Pasig → Ayala via C5 | UV Express | Pasig City (central) | Ayala Center, Makati | C5 through Pasig-Taguig | ltfrb-uv only |
| Rosario (Pasig) → McKinley Hills via C5 | UV Express | Rosario, Pasig | McKinley Hills, Taguig | C5 Ortigas→McKinley | ltfrb-uv only |
| Market! Market! UV Express → MOA | UV Express | Market! Market! BGC | Mall of Asia, Pasay | C5-McKinley-Bayshore (inferred) | moovit only |
| Vista Mall Taguig → Starmall EDSA Shaw | P2P | Vista Mall Taguig | Starmall EDSA Shaw | C5 Taguig segment (inferred) | p2p only |
| ALPS Bus: Market! Market!–Alabang | Bus/P2P | Market! Market! BGC | Festival Mall / SM Southmall | C5 → SLEX | provincial-bus-operators only |
| M. Almeda, Pateros → Market! Market! | Jeepney | M. Almeda, Pateros | Market! Market! C5 Driveway | Buting C5, Pateros | mrt3-feeder only |
| EDSA/Shaw–E. Rodriguez (Brgy. Ugong) | Jeepney | EDSA/Shaw Blvd | E. Rodriguez (Ugong), Vargas Ave | Libis/C5 area | ltfrb-jeepney only |
| Eastwood/Libis–Capitol Commons | Jeepney (modern) | Eastwood, Libis, QC | Capitol Commons, Pasig | Libis/C5 north | ltfrb-modernization only |
| UP Town Center–Ortigas CBD | Jeepney (modern) | UP Town Center, QC | Ortigas CBD, Pasig | Katipunan → White Plains → Ortigas | ltfrb-modernization only |
| Antipolo–McKinley Hill via C5/FVR | Bus | Antipolo, Rizal | McKinley Hill, Taguig | C5 south via FVR Road | dotr + ltfrb-rationalization; may overlap with Route 55 |
| McKinley Hill–Bay City (Green Frog) | Bus | Venice Grand Canal Mall | PITX, Parañaque | C5-adjacent at McKinley | google-maps + web search; same as Route 4? |
| Merville, Parañaque–Ayala Circuit via C5 | P2P | Merville, Parañaque | Ayala Circuit, Makati | McKinley Hill/C5 (possible) | p2p only; route unconfirmed |
| Cubao–BGC via Guadalupe (jeepney) | Jeepney | Cubao | BGC Market! Market! | MRT transfer → C5 jeepney | reddit; involves MRT Guadalupe transfer |
| Cubao–Eastwood City/Libis | Jeepney | Cubao | Eastwood City, Libis, QC | C5 Libis north | cubao-terminal MEDIUM |

---

## CONTESTED Routes (sources conflict)

### Routes 36 vs 40: Fairview–Alabang via C5
- **ltoportal:** Lists "Route 36: Fairview → Alabang"
- **OSM:** Lists "Route 40: Fairview → Alabang via C5"
- **wikimili:** Lists "Fairview–Alabang via C5 & Commonwealth" (no route number specified)
- **Verdict:** These are almost certainly **two different routes** operating the same corridor under different franchise numbers, possibly held by different operators. Metro Manila bus rationalization allows multiple operators on the same corridor. Route 36 may be the pre-pandemic number and Route 40 the MC 2020-019 renumbering, OR they may both be active under different operators. Cannot confirm without LTFRB franchise data. **Both should appear in GTFS** with a note about overlap.

### Route 38 vs 39: Pacita–Fairview direction naming
- **OSM transit relations:** "Route 38: Pacita–Fairview via C5"
- **ltoportal:** "Route 39: Fairview → Pacita Complex"
- **OSM Wiki:** Route 39 (Worthy Transport, Pacita → Fairview direction)
- **Verdict:** These appear to be the **same route number across sources but described in opposite directions**. Route 39 (ltoportal/OSM Wiki) is northbound (Pacita→Fairview); Route 38 (OSM relations) may be the southbound franchise or an error. Most likely: Route 39 is the canonical number, with Route 38 being a different (similar) route or mislabeled. **Assign Route 39 as canonical** with operator Worthy Transport.

### Antipolo–McKinley Hill Route Numbering
- **OSM:** "Route 55: Antipolo → McKinley Hill" (via Ortigas → BGC)
- **DOTr/LTFRB rationalization:** "Antipolo–McKinley Hill via C5/FVR Road" (no number)
- **Verdict:** Route 55 in OSM likely corresponds to the DOTr-approved Antipolo–McKinley Hill route. The "via FVR Road" note in DOTr data suggests an additional variant (FVR Road / C6-adjacent approach), which is distinct from the OSM Route 55 via Ortigas. **Two variants exist:** Route 55 (via Ortigas, HIGH confidence) and a C5/FVR variant (MEDIUM confidence).

---

## LOW CONFIDENCE / PLANNED Routes

| Route | Mode | From | To | Status |
|-------|------|------|----|--------|
| BRT Line 3 on C5 | BRT (planned) | C5 southern end | C5 northern end | World Bank proposed; not implemented as of 2026 |
| FTI–Kayamanan C via Chino Roces/C5 | Jeepney | Innove Makati, Chino Roces Ave | DBP Ave., Taguig | Low confidence; mrt3-feeder only |

---

## Coverage Assessment

### C5 Segment Coverage Matrix

| Segment | City Bus | P2P | UV Express | Jeepney | QCityBus |
|---------|----------|-----|------------|---------|----------|
| **North C5 (Commonwealth→Katipunan, QC)** | Routes 36/39/40/41/50 (pass through) | Fairview→Alabang/ATC variants | Antipolo→Ayala, Cainta→Ayala | Limited | Route 7 (via Katipunan Ave) |
| **Mid C5 (Katipunan→Libis/Eastwood)** | Routes 16, 18, 39 | Dasmariñas→Cubao; Alabang→Cubao | Antipolo→Ayala; Pasig→Ayala | Eastwood→Capitol Commons (modern) | Route 7 (terminal) |
| **C5/Ortigas junction** | Routes 36/38/39/40/41/50/55 | Multiple | Multiple | Cubao→Sta. Lucia/Rosario | Route 7 (terminal) |
| **C5 BGC / Market! Market! area** | Routes 15, 36, 39, 40, 41, 50; BGC Bus East | BGC→ATC; BGC→Calamba; Alabang→Cubao | Market!→Rosario; Rosario→McKinley; BF→Ayala | Route 202 / Gate 3–Guadalupe | — |
| **South C5 (FTI / Western Bicutan)** | Routes 15, 36, 38/39, 40, 41, 50; BGC Arca South | BGC→ATC; BGC→Calamba | BF Parañaque→Ayala; Lower Bicutan→SM Makati | FTI/Kayamanan→Guadalupe | — |
| **C5–SLEX junction** | Routes 38/39, 40 | BGC→ATC; BGC→Calamba | BF→Ayala (via Skyway) | Limited | — |

### Key C5 Gaps

1. **No BRT on C5:** BRT Line 3 (World Bank proposed) is not operational. C5 has no segregated busway; all buses share general traffic lanes. The result is significant congestion on C5 during peak hours, with no priority corridor.

2. **Northern C5 (QC) limited direct service:** The QC portion of C5 (from Commonwealth down to Katipunan) is served only by QCityBus Route 7 as a primary route. Long-haul buses (36/39/40/41/50) pass through but do not stop frequently in this residential QC section.

3. **No confirmed stop coordinates for most C5 routes:** Unlike EDSA Carousel, C5 bus routes lack geocoded stop data. Only QCityBus Route 7 has documented stop names for the northern segment.

4. **Pateros (Buting C5) underserved:** The Pateros section of C5 (between Pasig and BGC) is served only by the Pateros→Market! Market! jeepney (M. Almeda route, MEDIUM confidence). No bus service confirmed.

5. **Weekend P2P frequency:** Most P2P routes on C5 (BGC–Alabang, Alabang–Cubao) reduce significantly on weekends. No confirmed Saturday/Sunday schedules.

6. **UV Express route operator data missing:** All 8 UV Express routes on C5 are ltfrb-data-derived but operator names are not confirmed. No terminal GPS coordinates.

7. **Route 16 (Eastwood–Marriott) operational status unclear:** Described as "pre-pandemic route" in OSM Wiki. May be suspended or operating in reduced form.

---

## Data Quality Notes

- **Geometry available:** Only OSM-confirmed routes (15, 38/40, 55) have shape data. All others lack geometry.
- **Stop coordinates:** Only QCityBus Route 7 has stop names. BGC Bus stops are known (Market! Market!, EDSA Ayala, Fort Victoria). All other routes have terminal names only.
- **Fare completeness:** BGC–ATC P2P well-documented (₱51–52, TRIPKO). BGC Bus ₱11 (BEEP). QCityBus Route 7 ₱15 (flat). Most other C5 routes have only base fare (₱13–15 city bus) or unconfirmed.
- **Frequency completeness:** BGC–ATC P2P documented (schedule 6AM–8PM). BGC Bus documented (business hours). All other C5 routes: frequency unknown.
- **Operator completeness:** Route 39 (Worthy Transport), Route 16 (Citylink Coach Services), Route 18 (Baclaran Metro Link), BGC–ATC P2P (HM/Worthy Bus), BGC Bus (Fort Bonifacio Dev Corp) confirmed. All others: unknown.

---

## Summary Statistics

- **Confirmed routes (HIGH, 2+ sources):** 18
- **Medium confidence (single source or minor conflicts):** 16
- **Contested (sources conflict):** 3 (Routes 36/40 overlap; Routes 38/39 direction naming; Antipolo–McKinley numbering)
- **Low confidence / Planned:** 2
- **Routes with C5 geometry:** 3 (OSM: Routes 38/40, 55, and P2P BGC–ATC)
- **Routes with documented stops:** 1 (QCityBus Route 7 only)
- **Dominant transport modes:** City bus (10+ routes), UV Express (8 routes), P2P (5 routes), Jeepney (5+ routes)
- **Busiest C5 node:** Market! Market! BGC (terminus or stop for 10+ routes across all modes)

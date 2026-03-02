#!/usr/bin/env python3
"""Generate shapes.txt for Metro Manila GTFS.

Strategy:
  Tier 1 — Fixed-guideway (LRT-1, LRT-2, MRT-3, PNR, EDSA Carousel):
             trace through all station / stop coordinates
  Tier 2 — BGC Bus, QCityBus: trace through known stop nodes
  Tier 3 — All other routes: 2–5 corridor waypoints from origin to destination

Output: analysis/gtfs/shapes.txt
"""
import csv
import math
import os

OUT = os.path.join(os.path.dirname(__file__), "../analysis/gtfs/shapes.txt")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def haversine(lat1, lon1, lat2, lon2):
    """Return great-circle distance in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def make_shape(shape_id, pts):
    """Return list of GTFS shape rows from a list of (lat, lon) tuples."""
    rows = []
    dist = 0.0
    prev = None
    for seq, (lat, lon) in enumerate(pts, 1):
        if prev:
            dist += haversine(prev[0], prev[1], lat, lon)
        rows.append({
            "shape_id": shape_id,
            "shape_pt_lat": lat,
            "shape_pt_lon": lon,
            "shape_pt_sequence": seq,
            "shape_dist_traveled": round(dist, 3),
        })
        prev = (lat, lon)
    return rows


# ---------------------------------------------------------------------------
# Coordinate lookup table
# ---------------------------------------------------------------------------
C = {
    # Intermodal terminals
    "PITX":             (14.4947, 120.9925),
    "SM_MOA":           (14.5347, 120.9834),
    "BACLARAN":         (14.5339, 120.9980),
    "TAFT_PASAY":       (14.5376, 121.0003),
    "LAWTON":           (14.5930, 120.9727),
    "QUIAPO":           (14.5974, 120.9817),
    "DIVISORIA":        (14.5986, 120.9664),
    "SANTA_CRUZ":       (14.5980, 120.9800),
    "RECTO":            (14.5989, 120.9851),
    "TUTUBAN":          (14.6064, 120.9657),
    "BLUMENTRITT":      (14.6173, 120.9900),
    "MONUMENTO":        (14.6561, 120.9840),
    "CUBAO":            (14.6194, 121.0533),
    "SM_NORTH":         (14.6522, 121.0328),
    "TRINOMA":          (14.6510, 121.0320),
    "FAIRVIEW":         (14.7188, 121.0584),
    "ROBINSONS_NOV":    (14.7354, 121.0497),
    "NOVALICHES":       (14.7380, 121.0550),
    "AYALA":            (14.5491, 121.0478),
    "ONE_AYALA":        (14.5491, 121.0175),
    "GIL_PUYAT":        (14.5518, 120.9974),
    "BUENDIA_EDSA":     (14.5605, 121.0350),
    "BGCMM":            (14.5484, 121.0546),
    "BGC_MCK":          (14.5484, 121.0546),
    "ATC":              (14.4225, 121.0272),
    "FESTIVAL_MALL":    (14.4301, 121.0379),
    "SM_SOUTHMALL":     (14.4498, 120.9800),
    "LAS_PINAS":        (14.4498, 120.9800),
    "ORTIGAS":          (14.5876, 121.0567),
    "SM_MEGAMALL":      (14.5876, 121.0517),
    "STARMALL_SHAW":    (14.5818, 121.0487),
    "SHAW":             (14.5818, 121.0527),
    "GUADALUPE":        (14.5689, 121.0469),
    "MAGALLANES":       (14.5420, 121.0422),
    "FTI":              (14.5071, 121.0396),
    "BICUTAN":          (14.4985, 121.0252),
    "SM_BICUTAN":       (14.4985, 121.0252),
    "ARCA_SOUTH":       (14.4885, 121.0210),
    "ALABANG":          (14.4335, 121.0204),
    "SUCAT":            (14.4730, 121.0357),
    "MUNTINLUPA":       (14.4082, 121.0415),
    "ANTIPOLO":         (14.6289, 121.1148),
    "COGEO":            (14.6289, 121.1148),
    "SM_MASINAG":       (14.6289, 121.1148),
    "ROB_ANTIPOLO":     (14.6404, 121.1140),
    "MASINAG":          (14.6289, 121.1148),
    "EASTWOOD":         (14.6063, 121.0808),
    "UP_TOWN_CENTER":   (14.6490, 121.0447),
    "CAINTA":           (14.5780, 121.1248),
    "SIERRA_VALLEY":    (14.5700, 121.0990),
    "ROB_CAINTA":       (14.5780, 121.1248),
    "TAYTAY":           (14.5560, 121.1323),
    "ANGONO":           (14.5275, 121.1522),
    "BINANGONAN":       (14.4675, 121.1882),
    "TANAY":            (14.5000, 121.2870),
    "MORONG":           (14.3196, 121.3036),
    "CARDONA":          (14.4816, 121.2303),
    "RODRIGUEZ":        (14.7290, 121.1267),
    "MARIKINA":         (14.6530, 121.1024),
    "MARIKINA_RB":      (14.6530, 121.1024),
    "STONIÑO_MAR":      (14.6340, 121.1150),
    "NAIA_T3":          (14.5093, 121.0182),
    "NAIA_LOOP":        (14.5091, 121.0196),
    "ROB_MANILA":       (14.5791, 120.9834),
    "TM_KALAW":         (14.5791, 120.9834),
    "HARBOR_SQUARE":    (14.5777, 120.9773),
    "INTRAMUROS":       (14.5895, 120.9752),
    "PORT_AREA":        (14.5904, 120.9727),
    "PANDACAN":         (14.5838, 121.0044),
    "SAN_ANDRES":       (14.5713, 120.9913),
    "PACO":             (14.5793, 120.9888),
    "ERMITA":           (14.5717, 120.9906),
    "VITO_CRUZ":        (14.5618, 120.9940),
    "ESPANA":           (14.6066, 121.0001),
    "LACSON":           (14.6053, 120.9956),
    "ELLIPTICAL":       (14.6498, 121.0466),
    "QUEZON_AVE":       (14.6441, 121.0399),
    "TIMOG":            (14.6380, 121.0396),
    "KAMUNING":         (14.6356, 121.0412),
    "COMMONWEALTH_BAT": (14.6893, 121.0645),
    "BATASAN":          (14.6893, 121.0965),
    "TANDANG_SORA":     (14.6697, 121.0321),
    "MINDANAO_AVE":     (14.6764, 121.0136),
    "VISAYAS_AVE":      (14.6600, 121.0256),
    "SAUYO":            (14.6897, 121.0226),
    "LAGRO":            (14.7290, 121.0420),
    "BAGONG_SILANG":    (14.7211, 121.0585),
    "SAPANG_PALAY":     (14.8055, 120.9817),
    "CAMARIN":          (14.7280, 121.0540),
    "VGC":              (14.7143, 121.0095),
    "DEPARO":           (14.6930, 120.9742),
    "MALABON":          (14.6624, 120.9556),
    "NAVOTAS":          (14.6680, 120.9438),
    "VALENZUELA":       (14.6990, 120.9611),
    "MALINTA":          (14.7023, 120.9622),
    "NLET":             (14.6990, 120.9620),
    "MEYCAUAYAN":       (14.7360, 121.0025),
    "MARILAO":          (14.7575, 120.9574),
    "BOCAUE":           (14.7996, 120.9219),
    "ANGAT":            (14.9265, 121.0215),
    "BALAGTAS":         (14.8140, 120.9050),
    "STA_MARIA_BUL":    (14.8215, 121.0003),
    "NORZAGARAY":       (14.9264, 121.0461),
    "SJDM":             (14.8288, 120.9396),
    "CLARK":            (15.1858, 120.5600),
    "MALOLOS":          (14.8500, 120.8100),
    "CALUMPIT":         (14.9167, 120.7667),
    "OBANDO":           (14.7595, 120.9213),
    "TURO_BOCAUE":      (14.7760, 120.9150),
    "IMUS":             (14.4200, 120.9400),
    "DASMARINAS":       (14.3300, 120.9500),
    "BACOOR":           (14.4551, 120.9637),
    "NOVELETA":         (14.4285, 120.8861),
    "NAIC":             (14.3280, 120.7726),
    "GMA":              (14.3009, 121.0138),
    "TRECE_MARTIRES":   (14.2822, 120.8627),
    "THE_DISTRICT":     (14.4102, 120.9380),
    "MOLINO_BACOOR":    (14.4354, 120.9724),
    "DAANG_HARI_BAC":   (14.4350, 120.9750),
    "GOLDEN_CITY_DAS":  (14.3100, 120.9350),
    "BAHAYANG":         (14.3450, 120.9600),
    "CIRCUIT_MKT":      (14.5491, 121.0310),
    "TRASIERRA":        (14.5400, 121.0280),
    "VISTA_MALL_TAG":   (14.5261, 121.0804),
    "BF_PARANAQUE":     (14.4800, 121.0300),
    "BF_RESORT":        (14.4575, 120.9975),
    "PILAR_VILLAGE":    (14.4490, 121.0050),
    "MOONWALK":         (14.4620, 121.0230),
    "MERVILLE":         (14.5093, 120.9970),
    "NUVALI":           (14.2150, 121.1420),
    "CALAMBA":          (14.2117, 121.1565),
    "SM_LIPA":          (13.9530, 121.1700),
    "BINAN":            (14.3200, 121.0856),
    "PACITA":           (14.2990, 121.0600),
    "BALIBAGO_SR":      (14.2710, 121.1031),
    "SOUTHWOODS":       (14.3930, 121.0180),
    "LANCASTER":        (14.3089, 120.9360),
    "STA_LUCIA_GRAND":  (14.5780, 121.1248),
    "UNION_BANK_PL":    (14.5876, 121.0517),
    "GILMORE":          (14.5980, 121.0222),
    "SM_CALOOCAN":      (14.6528, 120.9695),
    "GS_TUAZON":        (14.6154, 120.9902),
    "SSS_VILLAGE":      (14.6194, 121.0433),
    "C5_KALAYAAN":      (14.5581, 121.0635),
    "C5_LIBIS":         (14.6063, 121.0808),
    "C5_BAGUMBAYAN":    (14.5422, 121.0740),
    "C5_C6_JCT":        (14.4700, 121.1200),
    "C6_TAGUIG":        (14.4800, 121.1100),
    "ORTIGAS_EXT":      (14.5880, 121.0800),
    "MERALCO_AVE":      (14.5773, 121.0747),
    "ORTIGAS_WILSON":   (14.5988, 121.0319),
    "PASIG":            (14.5766, 121.0836),
    "PASIG_SJ":         (14.5714, 121.0966),
    "PASIG_SAN_PAUL":   (14.5780, 121.0900),
    "ROSARIO_PASIG":    (14.5714, 121.0966),
    "MCK_HILL":         (14.5421, 121.0577),
    "BETTERLIVING":     (14.4960, 121.0080),
    "COMEMBO":          (14.5310, 121.0535),
    "PEMBO":            (14.5240, 121.0700),
    "PALAR":            (14.4750, 121.0850),
    "TAGUIG":           (14.5261, 121.0804),
    "PATEROS":          (14.5441, 121.0793),
    "MALANDAY":         (14.6863, 121.0753),
    "SAN_JUAN":         (14.5985, 121.0319),
    "MANDALUYONG":      (14.5831, 121.0399),
    "MAKATI":           (14.5537, 121.0299),
    "CALOOCAN":         (14.6491, 120.9671),
    "FORTUNE_MAR":      (14.6560, 121.0893),
    "PARANG_MAR":       (14.6330, 121.1080),
    "KATIPUNAN":        (14.6309, 121.0697),
    "MARCOS_HWY_S":     (14.6458, 121.0934),
    "AURORA_AURORA":    (14.5819, 121.0851),
    "MAMATID":          (14.2476, 121.0958),
    "KARUHATAN":        (14.6990, 120.9611),
    "SAN_BARTOLOME":    (14.7120, 121.0340),
    "PANGARAP":         (14.7083, 120.9850),
    "BAGBAG_QC":        (14.7520, 121.0490),
    "MAYON_SAMP":       (14.6154, 120.9902),
    "AURORA_BLVD":      (14.6194, 121.0533),
    "ALABANG_ZAPOTE":   (14.4380, 120.9880),
    "UP_DILIMAN":       (14.6547, 121.0659),
    "DSWD_BATASAN":     (14.6893, 121.0900),
    "COMMONWEALTH_FV":  (14.7188, 121.0584),
    "ROB_GALLERIA":     (14.5876, 121.0517),
    "SLEX_SSH":         (14.4380, 120.9950),
    "EAST_SVCRD":       (14.5071, 121.0396),
    "NLEX_BOCAUE":      (14.7996, 120.9219),
    "HARBOR_SQ_MNL":    (14.5777, 120.9773),
    "P2P_AYALA_BUS":    (14.5560, 121.0240),
    "NAIA_T3_MNL":      (14.5093, 121.0182),
    "ROBINSONS_PL":     (14.5791, 120.9834),
    "ARANETA_CUBAO":    (14.6194, 121.0508),
    "VICTORY_PASAY":    (14.5376, 121.0003),
    "SOUTH_STATION":    (14.4082, 121.0415),
    "MARIKINA_CITY":    (14.6530, 121.1024),
    "SM_FAIRVIEW":      (14.7188, 121.0584),
}

# ---------------------------------------------------------------------------
# Tier 1 — Fixed-guideway shapes
# ---------------------------------------------------------------------------

shapes = []

# LRT-1 (Baclaran/PITX → FPJ) - using all station coordinates
shapes += make_shape("SHP_LRT1", [
    C["PITX"], (14.5030, 121.0080), (14.5110, 121.0050), (14.5198, 121.0010),
    (14.5270, 120.9980), C["BACLARAN"], (14.5376, 121.0003), (14.5428, 120.9983),
    (14.5518, 120.9974), (14.5618, 120.9940), (14.5717, 120.9906),
    (14.5803, 120.9879), (14.5857, 120.9860), (14.5934, 120.9817),
    (14.5974, 120.9817), (14.5989, 120.9851), (14.6030, 120.9876),
    (14.6100, 120.9889), (14.6173, 120.9900), (14.6260, 120.9895),
    (14.6327, 120.9887), (14.6397, 120.9862), C["MONUMENTO"],
    (14.6724, 120.9814), (14.6940, 120.9837),
])

# LRT-2 (Recto → Antipolo)
shapes += make_shape("SHP_LRT2", [
    (14.5989, 120.9851), (14.5985, 120.9937), (14.5968, 120.9996),
    (14.5955, 121.0063), (14.5959, 121.0141), (14.5980, 121.0222),
    (14.6012, 121.0291), (14.6194, 121.0533), (14.6237, 121.0620),
    (14.6309, 121.0697), (14.6380, 121.0771), (14.6458, 121.0934),
    (14.6512, 121.1254),
])

# MRT-3 (North Avenue → Taft) - EDSA elevated guideway
shapes += make_shape("SHP_MRT3", [
    (14.6522, 121.0328), (14.6441, 121.0399), (14.6356, 121.0412),
    (14.6222, 121.0517), (14.6090, 121.0484), (14.5876, 121.0567),
    (14.5818, 121.0527), (14.5762, 121.0489), (14.5689, 121.0469),
    (14.5605, 121.0450), (14.5491, 121.0478), (14.5420, 121.0422),
    (14.5376, 121.0003),
])

# PNR (Tutuban → Muntinlupa) - main line
shapes += make_shape("SHP_PNR", [
    (14.6064, 120.9657), (14.6053, 120.9956), (14.6117, 120.9911),
    (14.6098, 120.9883), (14.5994, 120.9880), (14.5793, 120.9888),
    (14.5838, 121.0044), (14.5924, 121.0127), (14.5713, 120.9913),
    (14.5562, 121.0108), (14.5656, 121.0152), (14.5268, 121.0043),
    (14.5071, 121.0396), (14.4985, 121.0252), (14.4730, 121.0357),
    (14.4335, 121.0204), (14.4097, 121.0472),
])

# EDSA Carousel (PITX → Fairview)
shapes += make_shape("SHP_EDSA_CAR", [
    C["PITX"], (14.5249, 120.9930), C["SM_MOA"], C["TAFT_PASAY"],
    C["MAGALLANES"], C["AYALA"], C["BUENDIA_EDSA"], C["GUADALUPE"],
    (14.5762, 121.0390), C["SHAW"], C["ORTIGAS"],
    (14.6090, 121.0380), C["CUBAO"], C["KAMUNING"], C["QUEZON_AVE"],
    C["TRINOMA"], C["SM_NORTH"], (14.6634, 121.0100), C["MONUMENTO"],
    C["FAIRVIEW"],
])

# ---------------------------------------------------------------------------
# Tier 2 — BGC Bus routes
# ---------------------------------------------------------------------------

# BGC East Express: Market!Market! → Ortigas Park (via C5)
shapes += make_shape("SHP_BGC_EAST_EXPRESS", [
    C["BGCMM"], (14.5580, 121.0545), C["C5_KALAYAAN"], C["ORTIGAS"],
])

# BGC North Express: Market!Market! → Robinsons Galleria (via EDSA)
shapes += make_shape("SHP_BGC_NORTH_EXPRESS", [
    C["BGCMM"], (14.5550, 121.0480), C["AYALA"], (14.5605, 121.0430),
    C["ORTIGAS"], C["ROB_GALLERIA"],
])

# BGC Upper West Express: Market!Market! → MOA (via Kalayaan → EDSA → Taft → Coastal)
shapes += make_shape("SHP_BGC_UPPER_WEST_EXPRESS", [
    C["BGCMM"], C["AYALA"], (14.5376, 121.0003), C["SM_MOA"],
])

# BGC Lower West Express: Market!Market! → PITX / Coastal
shapes += make_shape("SHP_BGC_LOWER_WEST_EXPRESS", [
    C["BGCMM"], C["MAGALLANES"], C["TAFT_PASAY"], C["SM_MOA"], C["PITX"],
])

# BGC Central Route: within BGC loop
shapes += make_shape("SHP_BGC_CENTRAL", [
    C["BGCMM"], (14.5517, 121.0515), (14.5551, 121.0482),
    (14.5555, 121.0538), (14.5498, 121.0483), C["BGCMM"],
])

# BGC Night Route: Market!Market! → BGC internal
shapes += make_shape("SHP_BGC_NIGHT", [
    C["BGCMM"], (14.5530, 121.0502), (14.5576, 121.0506), C["BGCMM"],
])

# BGC Weekend Route
shapes += make_shape("SHP_BGC_WEEKEND", [
    C["BGCMM"], (14.5421, 121.0577), (14.5453, 121.0570),
    (14.5364, 121.0581), C["SM_MOA"],
])

# BGC Arca South Express: Market!Market! → Arca South
shapes += make_shape("SHP_BGC_ARCA_SOUTH_EXPRESS", [
    C["BGCMM"], (14.5305, 121.0513), C["ARCA_SOUTH"],
])

# BGC Ayala Express: BGC → Ayala MRT
shapes += make_shape("SHP_BGC_AYALA_EXPRESS", [
    C["BGCMM"], (14.5566, 121.0480), (14.5537, 121.0299), C["AYALA"],
])

# BGC Nuvali Express: Market!Market! → Nuvali
shapes += make_shape("SHP_BGC_NUVALI_EXPRESS", [
    C["BGCMM"], C["MAGALLANES"], C["ATC"], C["SOUTHWOODS"], C["NUVALI"],
])

# ---------------------------------------------------------------------------
# Tier 2 — QCityBus routes
# ---------------------------------------------------------------------------

shapes += make_shape("SHP_QCB_1", [
    (14.6893, 121.0965), C["BATASAN"], C["COMMONWEALTH_BAT"],
    C["ELLIPTICAL"], (14.6194, 121.0533),
])

shapes += make_shape("SHP_QCB_2", [
    C["ELLIPTICAL"], (14.6697, 121.0321), (14.6893, 121.0965), (14.6969, 121.0960),
])

shapes += make_shape("SHP_QCB_3", [
    (14.5989, 120.9851), C["ESPANA"], C["ELLIPTICAL"], C["KATIPUNAN"],
])

shapes += make_shape("SHP_QCB_4", [
    C["ELLIPTICAL"], C["SM_NORTH"], C["NOVALICHES"], (14.7380, 121.0550),
])

shapes += make_shape("SHP_QCB_5", [
    C["ELLIPTICAL"], C["VISAYAS_AVE"], C["MINDANAO_AVE"],
])

shapes += make_shape("SHP_QCB_6", [
    C["ELLIPTICAL"], C["QUEZON_AVE"], C["GILMORE"],
])

shapes += make_shape("SHP_QCB_7", [
    C["ELLIPTICAL"], C["KATIPUNAN"], C["UP_DILIMAN"], C["EASTWOOD"],
])

shapes += make_shape("SHP_QCB_8", [
    C["ELLIPTICAL"], C["SM_NORTH"], (14.6397, 121.0300), C["MONUMENTO"],
])

# ---------------------------------------------------------------------------
# Tier 3 — City Bus routes (BUS-2 to BUS-68 + special)
# Waypoints derived from route names; 3–6 points each
# ---------------------------------------------------------------------------

bus_shapes = {
    # route_id: [(lat,lon), ...]
    "BUS-2":  [C["ANGONO"], C["AURORA_AURORA"], C["ORTIGAS"], C["QUIAPO"]],
    "BUS-3":  [C["ANTIPOLO"], C["MARCOS_HWY_S"], C["AURORA_AURORA"], C["QUIAPO"]],
    "BUS-4":  [C["PITX"], (14.5241, 120.9950), C["BUENDIA_EDSA"], C["BGCMM"]],
    "BUS-5":  [C["NLET"], C["MONUMENTO"], C["SM_NORTH"], C["CUBAO"],
               C["ORTIGAS"], C["TAFT_PASAY"], C["PITX"]],
    "BUS-6":  [C["SAPANG_PALAY"], C["NOVALICHES"], C["COMMONWEALTH_FV"],
               C["COMMONWEALTH_BAT"], C["SM_NORTH"], C["ELLIPTICAL"], C["PITX"]],
    "BUS-7":  [C["FAIRVIEW"], C["COMMONWEALTH_BAT"], C["SM_NORTH"],
               C["ELLIPTICAL"], C["PITX"]],
    "BUS-8":  [C["ANGAT"], C["BOCAUE"], C["NLET"], C["MONUMENTO"], C["DIVISORIA"]],
    "BUS-9":  [C["ANGAT"], C["BOCAUE"], C["NLET"], C["MONUMENTO"]],
    "BUS-10": [C["AYALA"], C["MAGALLANES"], C["ATC"]],
    "BUS-11": [C["TAFT_PASAY"], C["AYALA"], C["MAGALLANES"],
               C["ATC"], C["BALIBAGO_SR"]],
    "BUS-12": [C["AYALA"], C["MAGALLANES"], C["ATC"], C["BINAN"]],
    "BUS-13": [C["BAGONG_SILANG"], C["VALENZUELA"], C["MALINTA"],
               C["BLUMENTRITT"], C["SANTA_CRUZ"]],
    "BUS-14": [C["BALAGTAS"], C["BOCAUE"], C["NLET"], C["MONUMENTO"],
               C["TAFT_PASAY"], C["PITX"]],
    "BUS-15": [C["BGCMM"], C["MAGALLANES"], C["ATC"],
               C["PACITA"], C["BALIBAGO_SR"]],
    "BUS-16": [C["EASTWOOD"], (14.6100, 121.0650), C["AURORA_AURORA"],
               (14.5347, 120.9834)],
    "BUS-17": [C["FAIRVIEW"], C["COMMONWEALTH_FV"], C["QUEZON_AVE"],
               C["ELLIPTICAL"], C["TIMOG"], C["AYALA"]],
    "BUS-18": [C["SM_NORTH"], C["BGCMM"], (14.5364, 121.0581),
               C["SM_MOA"], C["PITX"]],
    "BUS-19": [C["NORZAGARAY"], C["MARILAO"], C["NLET"],
               C["BLUMENTRITT"], C["SANTA_CRUZ"]],
    "BUS-20": [C["SAPANG_PALAY"], C["VALENZUELA"], C["MALINTA"],
               C["BLUMENTRITT"], C["SANTA_CRUZ"]],
    "BUS-21": [C["SAPANG_PALAY"], C["NLET"], C["BLUMENTRITT"], C["SANTA_CRUZ"]],
    "BUS-22": [C["STA_MARIA_BUL"], C["NLET"], C["SM_NORTH"],
               C["ELLIPTICAL"], C["PITX"]],
    "BUS-23": [C["ATC"], C["ALABANG_ZAPOTE"], C["SM_SOUTHMALL"], C["LAWTON"]],
    "BUS-24": [C["ATC"], C["SLEX_SSH"], C["PITX"], C["TAFT_PASAY"], C["LAWTON"]],
    "BUS-25": [C["BINAN"], C["PACITA"], C["ATC"], C["PITX"],
               C["TAFT_PASAY"], C["LAWTON"]],
    "BUS-26": [C["PITX"], C["IMUS"], (14.3800, 120.9200)],
    "BUS-27": [C["DASMARINAS"], C["BACOOR"], C["PITX"], C["LAWTON"]],
    "BUS-28": [C["PITX"], C["NAIC"]],
    "BUS-29": [C["PITX"], C["IMUS"], C["DASMARINAS"], (14.2800, 120.9500)],
    "BUS-30": [C["BALIBAGO_SR"], C["ATC"], C["PITX"]],
    "BUS-31": [C["PITX"], C["TRECE_MARTIRES"], (14.2600, 120.8400)],
    "BUS-32": [C["PITX"], C["GMA"]],
    "BUS-33": [C["SJDM"], C["MALINTA"], C["VALENZUELA"],
               C["MONUMENTO"], C["SM_NORTH"]],
    "BUS-34": [C["RODRIGUEZ"], C["BATASAN"], C["COMMONWEALTH_BAT"],
               C["QUEZON_AVE"], C["ELLIPTICAL"], C["PITX"]],
    "BUS-35": [C["BALAGTAS"], C["BOCAUE"], C["NLET"], C["MALINTA"],
               C["VALENZUELA"], C["NAIA_T3"]],
    "BUS-36": [C["FAIRVIEW"], C["COMMONWEALTH_FV"], C["SM_NORTH"],
               C["C5_LIBIS"], C["C5_KALAYAAN"], C["BGCMM"],
               C["MAGALLANES"], C["ATC"]],
    "BUS-37": [C["FAIRVIEW"], C["NOVALICHES"], C["MALINTA"],
               C["VALENZUELA"], C["MONUMENTO"]],
    "BUS-38": [C["FAIRVIEW"], C["SM_NORTH"], C["CALOOCAN"],
               C["AYALA"], C["PACITA"]],
    "BUS-39": [C["FAIRVIEW"], C["COMMONWEALTH_FV"], C["SM_NORTH"],
               C["C5_LIBIS"], C["BGCMM"], C["PACITA"]],
    "BUS-40": [C["FAIRVIEW"], C["COMMONWEALTH_FV"], C["SM_NORTH"],
               C["ELLIPTICAL"], C["AYALA"], C["ATC"]],
    "BUS-41": [C["FAIRVIEW"], C["COMMONWEALTH_FV"], C["SM_NORTH"],
               C["C5_LIBIS"], C["EASTWOOD"], (14.5649, 121.0404),
               C["C5_BAGUMBAYAN"], C["FTI"]],
    "BUS-42": [C["MALANDAY"], C["VALENZUELA"], C["MALINTA"], C["AYALA"]],
    "BUS-43": [C["PITX"], C["NAIA_T3"], C["NAIA_LOOP"]],
    "BUS-44": [C["ATC"], C["SUCAT"], C["BICUTAN"], C["FTI"],
               C["PASIG"], C["NAVOTAS"]],
    "BUS-45": [C["FTI"], C["AYALA"], C["ELLIPTICAL"], C["SM_NORTH"],
               C["NAVOTAS"]],
    "BUS-46": [C["PACITA"], C["ATC"], C["AYALA"], C["ELLIPTICAL"],
               C["SM_NORTH"], C["NAVOTAS"]],
    "BUS-47": [C["NAVOTAS"], C["MALABON"], C["MONUMENTO"],
               C["TAFT_PASAY"], C["PITX"]],
    "BUS-48": [C["PACITA"], C["ATC"], C["AYALA"], C["LAWTON"]],
    "BUS-49": [C["SJDM"], C["MALINTA"], C["VALENZUELA"], C["QUEZON_AVE"],
               C["ELLIPTICAL"], C["NAIA_T3"]],
    "BUS-50": [C["VGC"], C["MINDANAO_AVE"], C["COMMONWEALTH_BAT"],
               C["SM_NORTH"], C["C5_LIBIS"], C["C5_KALAYAAN"],
               C["BGCMM"], C["ATC"]],
    "BUS-51": [C["VGC"], C["MINDANAO_AVE"], C["SM_NORTH"], C["CUBAO"]],
    "BUS-52": [C["VGC"], (14.6900, 121.0080), C["VALENZUELA"],
               C["ESPANA"], C["LAWTON"], C["PITX"]],
    "BUS-53": [C["CUBAO"], (14.5988, 121.0319), C["ORTIGAS"], C["PACITA"]],
    "BUS-54": [C["QUIAPO"], C["SAN_ANDRES"], C["PANDACAN"]],
    "BUS-55": [C["PITX"], C["IMUS"], C["LANCSTER"] if "LANCSTER" in C else C["DASMARINAS"]],
    "BUS-56": [C["ANTIPOLO"], C["MASINAG"], C["C5_KALAYAAN"],
               C["BGCMM"], C["AYALA"]],
    "BUS-57": [C["ANTIPOLO"], C["C5_C6_JCT"], C["C6_TAGUIG"], C["BGCMM"]],
    "BUS-58": [C["ATC"], C["NAIC"]],
    "BUS-59": [C["CUBAO"], C["GMA"], C["DASMARINAS"]],
    "BUS-60": [C["BGCMM"], C["MAGALLANES"], C["ATC"], C["SOUTHWOODS"]],
    "BUS-61": [C["AYALA"], C["MAGALLANES"], C["ATC"], C["SOUTHWOODS"]],
    "BUS-62": [C["TAFT_PASAY"], C["AYALA"], C["BGCMM"], C["ARCA_SOUTH"]],
    "BUS-63": [C["AYALA"], C["BGCMM"], C["AYALA"]],
    "BUS-64": [C["STA_MARIA_BUL"], C["VALENZUELA"], C["CALOOCAN"],
               C["MONUMENTO"], C["SM_NORTH"]],
    "BUS-65": [C["ANTIPOLO"], C["MASINAG"], C["C5_KALAYAAN"],
               C["C5_BAGUMBAYAN"], C["ORTIGAS"], C["PITX"]],
    "BUS-PNR1": [C["FTI"], C["EAST_SVCRD"], C["BICUTAN"], C["SUCAT"],
                 C["ATC"], C["DIVISORIA"]],
    "BUS-PNR2": [C["ATC"], C["SLEX_SSH"], C["LAWTON"], C["DIVISORIA"]],
}

# Fix BUS-55 standalone
bus_shapes["BUS-55"] = [C["PITX"], C["IMUS"], C["DASMARINAS"], C["LANCASTER"]]

for route_id, pts in bus_shapes.items():
    shp_id = "SHP_" + route_id.replace("-", "_").replace(".", "_")
    shapes += make_shape(shp_id, pts)

# P2P routes — terminal-to-terminal shapes
p2p_shapes = {
    "P2P-RRCG-001": [C["ONE_AYALA"], C["MAGALLANES"], C["ATC"]],
    "P2P-RRCG-002": [C["STARMALL_SHAW"], C["MAGALLANES"], C["ATC"]],
    "P2P-RRCG-003": [C["ROB_ANTIPOLO"], C["MARCOS_HWY_S"], C["ORTIGAS"], C["ONE_AYALA"]],
    "P2P-RRCG-004": [C["CAINTA"], C["ORTIGAS"], C["ONE_AYALA"]],
    "P2P-RRCG-005": [C["ROBINSONS_NOV"], C["COMMONWEALTH_FV"],
                     C["SM_NORTH"], C["ELLIPTICAL"], C["ONE_AYALA"]],
    "P2P-RRCG-006": [C["ONE_AYALA"], C["MAGALLANES"], C["ATC"], C["SOUTHWOODS"]],
    "P2P-RRCG-007": [C["ONE_AYALA"], C["ORTIGAS"], C["AURORA_AURORA"], C["KATIPUNAN"]],
    "P2P-HM-001":   [C["BGCMM"], C["MAGALLANES"], C["ATC"]],
    "P2P-HM-002":   [C["BGCMM"], C["MAGALLANES"], C["ATC"], C["SOUTH_STATION"]],
    "P2P-HM-003":   [C["ONE_AYALA"], C["MAGALLANES"], C["ATC"], C["NUVALI"]],
    "P2P-HM-004":   [C["ONE_AYALA"], C["MAGALLANES"], C["ATC"], C["CALAMBA"]],
    "P2P-UBE-001":  [C["NAIA_T3"], C["NAIA_LOOP"]],
    "P2P-UBE-002":  [C["NAIA_T3"], C["PITX"]],
    "P2P-UBE-003":  [C["NAIA_T3"], C["VICTORY_PASAY"]],
    "P2P-UBE-004":  [C["NAIA_T3"], C["ROB_MANILA"]],
    "P2P-UBE-005":  [C["NAIA_T3"], C["CUBAO"]],
    "P2P-UBE-006":  [C["NAIA_T3"], C["THE_DISTRICT"]],
    "P2P-UBE-007":  [C["NAIA_T3"], C["ATC"], C["BALIBAGO_SR"]],
    "P2P-DNS-001":  [C["UP_TOWN_CENTER"], C["ORTIGAS"], C["ONE_AYALA"]],
    "P2P-DNS-002":  [C["ROB_ANTIPOLO"], C["MARCOS_HWY_S"], C["ORTIGAS"], C["ONE_AYALA"]],
    "P2P-MEX-001":  [C["VISTA_MALL_TAG"], C["MAGALLANES"], C["TRASIERRA"]],
    "P2P-MEX-002":  [C["VISTA_MALL_TAG"], C["STARMALL_SHAW"]],
    "P2P-MEX-003":  [C["DAANG_HARI_BAC"], C["ATC"], C["FESTIVAL_MALL"]],
    "P2P-MEX-004":  [C["DAANG_HARI_BAC"], C["BACOOR"], C["PITX"], C["TRASIERRA"]],
    "P2P-SRT-001":  [C["CALAMBA"], C["ATC"], C["ONE_AYALA"]],
    "P2P-SRT-002":  [C["CALAMBA"], C["ATC"], C["BGCMM"]],
    "P2P-SRT-003":  [C["CALAMBA"], C["ATC"], C["PITX"], C["LAWTON"]],
    "P2P-ML-001":   [C["DASMARINAS"], C["BACOOR"], C["PITX"], C["CUBAO"]],
    "P2P-ML-002":   [C["ATC"], C["MAGALLANES"], C["CUBAO"]],
    "P2P-PG-001":   [C["SM_NORTH"], C["NLET"], C["BOCAUE"]],
    "P2P-COMET-001":[C["SM_FAIRVIEW"], C["SM_NORTH"], C["ORTIGAS"], C["UNION_BANK_PL"]],
    "P2P-COMET-002":[C["MERVILLE"], C["PITX"], C["AYALA"], C["CIRCUIT_MKT"]],
    "P2P-ALPS-001": [C["SM_LIPA"], C["PACITA"], C["BGCMM"], C["SM_MEGAMALL"]],
    "P2P-GEN-001":  [C["CUBAO"], C["SM_NORTH"], C["NLET"], C["CLARK"]],
    "P2P-NDL-001":  [C["ATC"], C["PITX"], C["TAFT_PASAY"], C["LAWTON"]],
    "P2P-SAT-001":  [C["SM_SOUTHMALL"], C["TAFT_PASAY"], C["CIRCUIT_MKT"]],
}

for route_id, pts in p2p_shapes.items():
    shp_id = "SHP_" + route_id.replace("-", "_").replace(".", "_")
    shapes += make_shape(shp_id, pts)

# ---------------------------------------------------------------------------
# UV Express routes — terminal-to-terminal shapes
# ---------------------------------------------------------------------------

uve_shapes = {
    "UVE-N08":    [C["GS_TUAZON"], C["ESPANA"], C["ORTIGAS"], C["AYALA"]],
    "UVE-N25":    [C["BF_PARANAQUE"], C["TAFT_PASAY"], C["AYALA"]],
    "UVE-N52":    [C["SUCAT"], C["FTI"], C["SAN_ANDRES"], C["LAWTON"]],
    "UVE-N55":    [C["SM_NORTH"], C["FAIRVIEW"]],
    "UVE-N64":    [C["PASIG"], C["ORTIGAS"], C["STARMALL_SHAW"]],
    "UVE-N69":    [C["SM_MEGAMALL"], C["ORTIGAS_WILSON"], C["QUIAPO"]],
    "UVE-N72":    [C["SSS_VILLAGE"], C["ELLIPTICAL"], C["CUBAO"]],
    "UVE-C65":    [C["CALUMPIT"], C["MALOLOS"], C["BOCAUE"],
                   C["NLET"], C["QUEZON_AVE"]],
    "UVE-C66":    [C["COGEO"], C["MARCOS_HWY_S"], C["CUBAO"]],
    "UVE-C67":    [C["CUBAO"], C["MARCOS_HWY_S"], C["ANTIPOLO"]],
    "UVE-C68":    [C["ROB_CAINTA"], C["ORTIGAS"], C["STARMALL_SHAW"]],
    "UVE-C69":    [C["ATC"], C["IMUS"]],
    "UVE-CAL-01": [C["DEPARO"], C["CALOOCAN"], C["MONUMENTO"], C["SM_NORTH"]],
    "UVE-CAL-02": [C["DEPARO"], C["CALOOCAN"], C["BLUMENTRITT"]],
    "UVE-CAL-03": [C["BAGONG_SILANG"], C["MONUMENTO"], C["SM_NORTH"]],
    "UVE-FV-01":  [C["SM_FAIRVIEW"], C["COMMONWEALTH_FV"],
                   C["SM_NORTH"], C["BUENDIA_EDSA"]],
    "UVE-FV-02":  [C["SM_FAIRVIEW"], C["COMMONWEALTH_FV"],
                   C["SM_NORTH"], C["QUIAPO"], C["TM_KALAW"]],
    "UVE-LAG-QC-01": [C["LAGRO"], C["SAUYO"], C["QUIAPO"]],
    "UVE-LAG-QC-02": [C["LAGRO"], C["SM_NORTH"]],
    "UVE-LAG-QC-03": [C["LAGRO"], C["QUEZON_AVE"], C["TM_KALAW"]],
    "UVE-NOV-01": [C["NOVALICHES"], C["COMMONWEALTH_FV"], C["CUBAO"]],
    "UVE-NOV-02": [C["NOVALICHES"], C["DEPARO"], C["MONUMENTO"]],
    "UVE-NOV-03": [C["ROBINSONS_NOV"], C["COMMONWEALTH_FV"],
                   C["SM_NORTH"], C["VITO_CRUZ"]],
    "UVE-NOV-04": [C["ROBINSONS_NOV"], C["SM_NORTH"],
                   C["BUENDIA_EDSA"], C["GIL_PUYAT"]],
    "UVE-NOV-05": [C["SAN_BARTOLOME"], C["SM_NORTH"]],
    "UVE-NOV-06": [C["TRINOMA"], C["SM_NORTH"],
                   C["COMMONWEALTH_FV"], C["ROBINSONS_NOV"]],
    "UVE-EGT-01": [C["SM_NORTH"]],  # single point fallback
    "UVE-QC-01":  [C["SM_NORTH"], C["QUEZON_AVE"], C["TM_KALAW"]],
    "UVE-QC-02":  [C["TANDANG_SORA"], C["QUEZON_AVE"], C["TM_KALAW"]],
    "UVE-QC-03":  [C["CUBAO"], C["ORTIGAS"], C["BUENDIA_EDSA"]],
    "UVE-QC-04":  [C["CUBAO"], C["RODRIGUEZ"]],
    "UVE-QC-05":  [C["MINDANAO_AVE"], C["SM_NORTH"]],
    "UVE-MAL-01": [C["MALABON"], C["MONUMENTO"], C["AYALA"]],
    "UVE-MAL-02": [C["MALABON"], C["MONUMENTO"], C["CUBAO"]],
    "UVE-VAL-01": [C["KARUHATAN"], C["VALENZUELA"], C["MONUMENTO"], C["SM_NORTH"]],
    "UVE-MAR-01": [C["FORTUNE_MAR"], C["MARIKINA"], C["AURORA_AURORA"], C["CUBAO"]],
    "UVE-MAR-02": [(14.6580, 121.0980), C["MARIKINA"], C["COMMONWEALTH_BAT"]],
    "UVE-MAR-03": [C["STONIÑO_MAR"], C["MARIKINA"], C["AYALA"]],
    "UVE-MAR-04": [C["STONIÑO_MAR"], C["MARIKINA"], C["ORTIGAS"]],
    "UVE-MAR-05": [C["MARIKINA_RB"], C["AURORA_AURORA"], C["ROB_GALLERIA"]],
    "UVE-MAR-06": [C["CUBAO"], C["AURORA_AURORA"], C["PARANG_MAR"]],
    "UVE-PAT-01": [C["PATEROS"], C["PASIG"], C["ORTIGAS"], C["TM_KALAW"]],
    "UVE-PAS-01": [C["PASIG_SJ"], C["ROB_GALLERIA"]],
    "UVE-PAS-02": [C["PASIG"], C["ORTIGAS"], C["AYALA"]],
    "UVE-PAS-03": [(14.6090, 121.0800), C["ORTIGAS"], C["SM_MEGAMALL"]],
    "UVE-PAS-04": [C["ROSARIO_PASIG"], C["C5_KALAYAAN"], C["MCK_HILL"]],
    "UVE-PAS-05": [C["BETTERLIVING"], C["PITX"], C["ORTIGAS"]],
    "UVE-PAS-06": [C["ANGONO"], C["BINANGONAN"], C["TAYTAY"],
                   C["ORTIGAS"], C["SM_MEGAMALL"]],
    "UVE-MAK-01": [C["COMEMBO"], C["BGCMM"], C["ORTIGAS"], C["SM_MEGAMALL"]],
    "UVE-MAK-02": [C["PEMBO"], C["AYALA"]],
    "UVE-MAK-03": [C["AYALA"], C["ESPANA"], C["MAYON_SAMP"]],
    "UVE-TAG-01": [C["FTI"], C["AYALA"], C["ONE_AYALA"]],
    "UVE-TAG-02": [C["PALAR"], C["BGCMM"], C["MAGALLANES"], C["MAKATI"]],
    "UVE-TAG-03": [C["BICUTAN"], C["MAGALLANES"], C["MAKATI"]],
    "UVE-TAG-04": [C["BGCMM"], C["PASIG_SJ"]],
    "UVE-TAG-05": [C["BGCMM"], C["C5_KALAYAAN"], C["ROSARIO_PASIG"]],
    "UVE-TAG-06": [C["BGCMM"], C["MAGALLANES"], C["SM_MOA"]],
    "UVE-TAG-07": [C["SM_BICUTAN"], C["AYALA"]],
    "UVE-TAG-08": [C["ARCA_SOUTH"], C["BGCMM"], C["ONE_AYALA"]],
    "UVE-LP-01":  [C["SM_SOUTHMALL"], C["TAFT_PASAY"], C["LAWTON"]],
    "UVE-LP-02":  [C["SM_SOUTHMALL"], C["TAFT_PASAY"], C["QUIAPO"]],
    "UVE-LP-03":  [C["BF_RESORT"], C["SM_SOUTHMALL"], C["PITX"],
                   C["SM_MOA"], C["AYALA"]],
    "UVE-LP-04":  [C["BF_RESORT"], C["SLEX_SSH"], C["AYALA"]],
    "UVE-LP-05":  [C["PILAR_VILLAGE"], C["SM_SOUTHMALL"], C["SLEX_SSH"], C["AYALA"]],
    "UVE-LP-06":  [C["MOONWALK"], C["PITX"], C["TAFT_PASAY"], C["AYALA"]],
    "UVE-LP-07":  [C["LAS_PINAS"], C["ATC"], C["MAKATI"]],
    "UVE-ALB-01": [C["BACLARAN"], C["SM_MOA"], C["PITX"], C["ATC"]],
    "UVE-ALB-02": [C["FESTIVAL_MALL"], C["ATC"], C["PITX"], C["SM_MOA"]],
    "UVE-ALB-03": [C["ATC"], C["FESTIVAL_MALL"], C["PITX"]],
    "UVE-CAV-01": [C["IMUS"], C["BACOOR"], C["PITX"], C["AYALA"]],
    "UVE-CAV-02": [C["THE_DISTRICT"], C["IMUS"], C["BACOOR"], C["ONE_AYALA"]],
    "UVE-CAV-03": [C["MOLINO_BACOOR"], C["SLEX_SSH"], C["AYALA"]],
    "UVE-CAV-04": [C["MOLINO_BACOOR"], C["DAANG_HARI_BAC"], C["ATC"]],
    "UVE-CAV-05": [C["GOLDEN_CITY_DAS"], C["IMUS"], C["BACOOR"], C["AYALA"]],
    "UVE-CAV-06": [C["BAHAYANG"], C["IMUS"], C["PITX"], C["LAWTON"]],
    "UVE-CAV-07": [C["NOVELETA"], C["IMUS"], C["AYALA"]],
    "UVE-CAV-08": [C["TAFT_PASAY"], C["IMUS"], C["DASMARINAS"]],
    "UVE-CAV-09": [C["TAFT_PASAY"], C["IMUS"], C["BACOOR"]],
    "UVE-CAV-10": [C["TAFT_PASAY"], C["IMUS"], C["TRECE_MARTIRES"]],
    "UVE-CAV-11": [C["SM_MOA"], C["PITX"], C["IMUS"]],
    "UVE-CAV-12": [C["TAFT_PASAY"], C["IMUS"], (14.3200, 121.0000)],
    "UVE-RIZ-01": [C["ANTIPOLO"], C["MARCOS_HWY_S"], C["AURORA_AURORA"], C["AYALA"]],
    "UVE-RIZ-02": [C["ANTIPOLO"], C["MASINAG"], C["C5_KALAYAAN"], C["AYALA"]],
    "UVE-RIZ-03": [C["ANTIPOLO"], C["MARCOS_HWY_S"], C["ORTIGAS"], C["SM_MEGAMALL"]],
    "UVE-RIZ-04": [C["ANTIPOLO"], C["MARCOS_HWY_S"], C["STARMALL_SHAW"]],
    "UVE-RIZ-05": [C["ANTIPOLO"], C["MASINAG"], C["ORTIGAS"], C["STARMALL_SHAW"]],
    "UVE-RIZ-06": [C["SM_MASINAG"], C["MASINAG"], C["C5_KALAYAAN"], C["AYALA"]],
    "UVE-RIZ-07": [C["TAYTAY"], C["ORTIGAS"], C["STARMALL_SHAW"]],
    "UVE-RIZ-08": [(14.5700, 121.0990), C["ORTIGAS"], C["AYALA"]],
    "UVE-RIZ-09": [C["BINANGONAN"], C["ANGONO"], C["TAYTAY"],
                   C["ORTIGAS"], C["SM_MEGAMALL"]],
    "UVE-RIZ-10": [C["BINANGONAN"], C["TAYTAY"], C["ORTIGAS"], C["STARMALL_SHAW"]],
    "UVE-RIZ-11": [C["BINANGONAN"], C["MARIKINA"], C["MARCOS_HWY_S"]],
    "UVE-RIZ-12": [C["CARDONA"], C["BINANGONAN"], C["TAYTAY"],
                   C["ORTIGAS"], C["STARMALL_SHAW"]],
    "UVE-RIZ-13": [C["RODRIGUEZ"], C["CUBAO"]],
    "UVE-RIZ-14": [C["TANAY"], C["TAYTAY"], C["ORTIGAS"], C["STARMALL_SHAW"]],
    "UVE-RIZ-15": [C["MORONG"], C["TANAY"], C["TAYTAY"],
                   C["ORTIGAS"], C["SM_MEGAMALL"]],
    "UVE-RIZ-16": [C["ANGONO"], C["TAYTAY"], C["STARMALL_SHAW"]],
    "UVE-RIZ-17": [C["RODRIGUEZ"], C["CAINTA"], C["STA_LUCIA_GRAND"]],
    "UVE-BUL-01": [C["MEYCAUAYAN"], C["NLET"], C["SM_NORTH"]],
    "UVE-BUL-02": [C["MEYCAUAYAN"], C["NLET"], C["SM_NORTH"]],
    "UVE-BUL-03": [C["MEYCAUAYAN"], C["NLET"], C["QUEZON_AVE"]],
    "UVE-BUL-04": [C["OBANDO"], C["NLET"], C["SM_NORTH"]],
    "UVE-BUL-05": [C["MARILAO"], C["NLET"], C["SM_NORTH"]],
    "UVE-BUL-06": [C["MARILAO"], C["NLET"], C["SM_NORTH"], C["QUEZON_AVE"]],
    "UVE-BUL-07": [(14.7310, 121.0200), C["MEYCAUAYAN"], C["SM_NORTH"]],
    "UVE-BUL-08": [C["MEYCAUAYAN"], C["NLET"], C["SM_NORTH"]],
    "UVE-BUL-09": [C["TURO_BOCAUE"], C["BOCAUE"], C["NLET"], C["SM_NORTH"]],
    "UVE-BUL-10": [C["BALAGTAS"], C["BOCAUE"], C["NLET"], C["MONUMENTO"]],
    "UVE-BUL-11": [C["MEYCAUAYAN"], C["NLET"], C["BLUMENTRITT"], C["RECTO"]],
    "UVE-BUL-12": [C["MALOLOS"], C["BOCAUE"], C["NLET"], C["QUEZON_AVE"]],
    "UVE-BUL-13": [(14.8706, 120.8862), C["BOCAUE"], C["NLET"], C["TUTUBAN"]],
    "UVE-LAG-PCV": [C["PACITA"], C["ATC"], C["MAGALLANES"], C["AYALA"]],
    "UVE-LAG-MAM": [C["MAMATID"], C["ATC"], C["FESTIVAL_MALL"]],
    "UVE-LAG-BAL": [C["BALIBAGO_SR"], C["ATC"], C["SM_SOUTHMALL"]],
}

# Handle single-point fallback (add at least 2 pts)
for route_id, pts in uve_shapes.items():
    if len(pts) < 2:
        uve_shapes[route_id] = [pts[0], pts[0]]

for route_id, pts in uve_shapes.items():
    shp_id = "SHP_" + route_id.replace("-", "_").replace(".", "_")
    shapes += make_shape(shp_id, pts)

# ---------------------------------------------------------------------------
# City bus operators with specific routes (MMBC, MALTC, Love Bus)
# ---------------------------------------------------------------------------
extra_shapes = {
    "CITY-MMBC-BACLARAN-FAIRVIEW-EDSA": [
        C["BACLARAN"], C["TAFT_PASAY"], C["BUENDIA_EDSA"],
        C["ORTIGAS"], C["CUBAO"], C["SM_NORTH"], C["FAIRVIEW"],
    ],
    "CITY-MMBC-BACLARAN-FAIRVIEW-QUIAPO": [
        C["BACLARAN"], C["TAFT_PASAY"], C["QUIAPO"],
        C["BLUMENTRITT"], C["MONUMENTO"], C["SM_NORTH"], C["FAIRVIEW"],
    ],
    "CITY-MALTC-MONTALBAN-BACLARAN-EDSA": [
        C["RODRIGUEZ"], C["CUBAO"], C["ORTIGAS"],
        C["BUENDIA_EDSA"], C["TAFT_PASAY"], C["BACLARAN"],
    ],
    "CITY-MALTC-SANMATEO-BACLARAN": [
        (14.7060, 121.1280), C["MARIKINA"], C["AURORA_AURORA"],
        C["CUBAO"], C["SM_NORTH"], C["COMMONWEALTH_FV"],
        C["ELLIPTICAL"], C["TAFT_PASAY"], C["BACLARAN"],
    ],
    "LOVE-1": [C["VGC"], C["MINDANAO_AVE"], C["BATASAN"], C["DSWD_BATASAN"]],
    "LOVE-2": [C["VGC"], C["MINDANAO_AVE"], C["ESPANA"], C["PITX"]],
}

for route_id, pts in extra_shapes.items():
    shp_id = "SHP_" + route_id.replace("-", "_").replace(".", "_")
    shapes += make_shape(shp_id, pts)

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------

fieldnames = ["shape_id", "shape_pt_lat", "shape_pt_lon",
              "shape_pt_sequence", "shape_dist_traveled"]

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(shapes)

n_shapes = len({r["shape_id"] for r in shapes})
n_pts = len(shapes)
print(f"shapes.txt written: {n_shapes} shapes, {n_pts} shape points → {OUT}")

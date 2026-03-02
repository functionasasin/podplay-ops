#!/usr/bin/env python3
"""Generate shapes.txt for Metro Manila GTFS feed.

Strategy:
- Rail lines (LRT-1, LRT-2, MRT-3, PNR): Full station sequences
- EDSA Carousel: Full 22-stop sequence
- City buses: Corridor-based waypoints (4-8 pts)
- P2P/UV Express: Simplified 3-pt shapes
- Jeepneys: 2-3 pt endpoint shapes

shape_id = route_id (same as in routes.txt)
"""

import csv, os

# ── Key coordinate library ──────────────────────────────────────────────────
P = {
    # Southern NCR / beyond
    'pitx':        (14.4947, 120.9925),
    'alabang_tc':  (14.4225, 121.0272),
    'alabang_stn': (14.4335, 121.0204),
    'muntinlupa':  (14.4097, 121.0472),
    'sucat':       (14.4730, 121.0357),
    'bicutan':     (14.4985, 121.0252),
    'fti':         (14.5071, 121.0396),
    'southmall':   (14.4498, 120.9800),
    'daang_hari':  (14.4250, 121.0130),
    'filinvest':   (14.4350, 121.0360),
    'arca_south':  (14.5000, 121.0450),
    'lower_bicut': (14.5040, 121.0380),
    'pacita':      (14.3290, 121.0820),
    'southwoods':  (14.3800, 121.0670),
    'naia_t3':     (14.5088, 121.0153),
    'naia_t1':     (14.5091, 121.0197),
    'naia_loop':   (14.5070, 121.0180),
    # Coastal / Pasay / Baclaran
    'dfa':         (14.5249, 120.9930),
    'moa':         (14.5347, 120.9834),
    'macapagal':   (14.5241, 120.9950),
    'baclaran':    (14.5339, 120.9980),
    'redemptorist':(14.5270, 120.9980),
    'mia_rd':      (14.5198, 121.0010),
    'ninoy_aq_av': (14.5110, 121.0050),
    'dr_santos':   (14.5030, 121.0080),
    'pasay':       (14.5378, 121.0011),
    'pasay_rtda':  (14.5376, 121.0003),
    'tramo':       (14.5425, 121.0105),
    'harbor_sq':   (14.5777, 120.9773),
    'star_city':   (14.5630, 120.9800),
    'roxas_mh':    (14.5862, 120.9764),
    'roxas_bay':   (14.5700, 120.9819),
    'diokno':      (14.5490, 120.9850),
    # Taft Ave / LRT-1 corridor
    'edsa_taft':   (14.5376, 121.0003),
    'libertad':    (14.5428, 120.9983),
    'gil_puyat':   (14.5518, 120.9974),
    'vito_cruz':   (14.5618, 120.9940),
    'quirino':     (14.5717, 120.9906),
    'pedro_gil':   (14.5803, 120.9879),
    'un_avenue':   (14.5857, 120.9860),
    'central':     (14.5934, 120.9817),
    'carriedo':    (14.5974, 120.9817),
    'doroteo':     (14.5989, 120.9851),
    'bambang':     (14.6030, 120.9876),
    'tayuman':     (14.6100, 120.9889),
    'blumentritt': (14.6173, 120.9900),
    'abad_santos': (14.6260, 120.9895),
    'r_papa':      (14.6327, 120.9887),
    '5th_ave':     (14.6397, 120.9862),
    'monumento':   (14.6561, 120.9840),
    'balintawak':  (14.6724, 120.9814),
    'fpj':         (14.6940, 120.9837),
    # Central Manila area
    'lawton':      (14.5930, 120.9727),
    'intramuros':  (14.5895, 120.9752),
    'divisoria':   (14.5986, 120.9664),
    'quiapo':      (14.5974, 120.9817),
    'recto':       (14.5989, 120.9851),
    'north_harbor':(14.6100, 120.9650),
    'sta_cruz':    (14.5980, 120.9800),
    'dapitan':     (14.6066, 121.0001),
    'españa':      (14.6053, 120.9956),
    'sampaloc':    (14.6053, 120.9956),
    'paco':        (14.5793, 120.9888),
    'pandacan':    (14.5838, 121.0044),
    'san_andres':  (14.5713, 120.9913),
    'l_guinto':    (14.5500, 120.9960),
    'mabini':      (14.5660, 120.9880),
    'p_campa':     (14.5880, 120.9720),
    'pier_south':  (14.5790, 120.9660),
    'escolta':     (14.5960, 120.9760),
    # Makati / BGC
    'one_ayala':   (14.5480, 121.0200),
    'ayala_mrt':   (14.5491, 121.0478),
    'ayala_term':  (14.5560, 121.0240),
    'makati_hall': (14.5537, 121.0299),
    'buendia_mrt': (14.5605, 121.0450),
    'buendia_edsa':(14.5605, 121.0350),
    'ayala_tri':   (14.5566, 121.0480),
    'bgc_mm':      (14.5484, 121.0546),
    'bgc_hs':      (14.5498, 121.0483),
    'burgos_cir':  (14.5517, 121.0515),
    'bgc_net_pk':  (14.5596, 121.0484),
    'mckinley_h':  (14.5421, 121.0577),
    'venice_gg':   (14.5364, 121.0581),
    'sm_aura':     (14.5359, 121.0495),
    'bon_stpovr':  (14.5306, 121.0516),
    'taguig_hall': (14.5261, 121.0804),
    'bagumbayan':  (14.5422, 121.0740),
    'pateros':     (14.5441, 121.0793),
    # EDSA corridor waypoints
    'magallanes':  (14.5420, 121.0420),
    'guadalupe':   (14.5689, 121.0350),
    'boni':        (14.5762, 121.0390),
    'shaw_edsa':   (14.5818, 121.0430),
    'ortigas_edsa':(14.5876, 121.0460),
    'santolan_edsa':(14.6090, 121.0380),
    'cubao_edsa':  (14.6222, 121.0430),
    'kamuning':    (14.6356, 121.0310),
    'qave_edsa':   (14.6441, 121.0299),
    'trinoma_edsa':(14.6510, 121.0320),
    'sm_north':    (14.6522, 121.0328),
    'balint_edsa': (14.6634, 121.0100),
    # Ortigas / Shaw / Pasig
    'ortigas_ctr': (14.5876, 121.0517),
    'sm_mega':     (14.5848, 121.0563),
    'shaw_cross':  (14.5810, 121.0487),
    'shaw_wack':   (14.5818, 121.0580),
    'ortigas_wil': (14.5988, 121.0319),
    'ortigas_mer': (14.5773, 121.0747),
    'julia_vargas':(14.5869, 121.0800),
    'eastwood':    (14.6063, 121.0808),
    'pasig_hall':  (14.5766, 121.0836),
    'capitol_com': (14.5810, 121.0690),
    'e_rodriguez_pasig':(14.5810, 121.0620),
    # Marikina / East
    'marikina':    (14.6530, 121.1024),
    'calumpang':   (14.6150, 121.0850),
    'sss_marikina':(14.6300, 121.0950),
    'brgy_fortune':(14.6650, 121.0980),
    'parang_marik':(14.6500, 121.1100),
    'san_roque_mar':(14.6200, 121.1100),
    # Eastern (Rizal, Antipolo etc)
    'santolan_lrt2':(14.6458, 121.0934),
    'masinag':     (14.6289, 121.1148),
    'cogeo':       (14.6450, 121.1350),
    'antipolo_cath':(14.6286, 121.1700),
    'antipolo':    (14.6400, 121.1500),
    'cainta':      (14.5785, 121.1234),
    'taytay':      (14.5566, 121.1330),
    'angono':      (14.5240, 121.1540),
    'binangonan':  (14.4670, 121.1800),
    'tanay':       (14.4950, 121.2940),
    'morong':      (14.5080, 121.2680),
    'cardona':     (14.5000, 121.2000),
    'sta_lucia_gm':(14.5785, 121.1234),  # ~Cainta area
    # C5 corridor
    'c5_kalayaan': (14.5581, 121.0635),
    'c5_bagumbayan':(14.5422, 121.0740),
    'c5_katipunan':(14.6350, 121.0700),
    # Commonwealth / Quezon City / North
    'qc_hall':     (14.6498, 121.0466),
    'east_ave_qc': (14.6431, 121.0476),
    'muñoz':       (14.6397, 121.0300),
    'project6':    (14.6520, 121.0360),
    'commonwealth_batasan':(14.6893, 121.0645),
    'batasan':     (14.6893, 121.0965),
    'philcoa':     (14.6547, 121.0558),
    'up_diliman':  (14.6547, 121.0659),
    'katipunan':   (14.6309, 121.0697),
    'loyola':      (14.6380, 121.0771),
    'sm_fairview': (14.7188, 121.0584),
    'novaliches':  (14.7380, 121.0550),
    'litex':       (14.6969, 121.0960),
    'lagro':       (14.7040, 121.0750),
    'bagong_silang':(14.7211, 121.0585),
    'camarin':     (14.7280, 121.0540),
    'sapang_palay':(14.7650, 121.0200),
    'mindanao_ave':(14.6764, 121.0136),
    'tandang_sora':(14.6697, 121.0321),
    'visayas_ave': (14.6600, 121.0256),
    'sauyo':       (14.6897, 121.0226),
    'novbayan':    (14.7434, 121.0537),  # Novaliches Bukid
    'regalado':    (14.7100, 121.0490),
    # Northwestern NCR / Malabon / Navotas / Valenzuela
    'navotas':     (14.6680, 120.9438),
    'malabon':     (14.6624, 120.9556),
    'valenzuela':  (14.6949, 120.9611),
    'malinta':     (14.7023, 120.9622),
    'nlet':        (14.6990, 120.9620),
    'caloocan_h':  (14.6491, 120.9671),
    'deparo':      (14.7100, 120.9840),
    'karuhatan':   (14.7100, 120.9700),
    'polo_val':    (14.7200, 120.9760),
    # Bulacan direction (cross-boundary)
    'meycauayan':  (14.7340, 120.9590),
    'marilao':     (14.7540, 120.9650),
    'balagtas':    (14.7930, 120.9340),
    'bocaue':      (14.7996, 120.9219),
    'norzagaray':  (14.9180, 121.0180),
    'obando':      (14.7570, 120.9380),
    'sjdm':        (14.7948, 121.0443),
    'malolos':     (14.8430, 120.8100),
    'angat':       (14.9220, 121.0000),
    # Cavite direction
    'bacoor':      (14.4581, 120.9713),
    'imus':        (14.4297, 120.9376),
    'molino':      (14.3998, 120.9817),
    'dasma':       (14.3250, 120.9380),
    'cavite_city': (14.2800, 120.8700),
    'naic':        (14.3180, 120.7630),
    'silang':      (14.2290, 120.9710),
    'lancaster_nc':(14.3330, 120.9070),
    'gma':         (14.3100, 121.0970),
    'trece':       (14.2800, 120.8700),
    'imus_tbridge':(14.4200, 120.9350),
    # Laguna direction
    'biñan':       (14.3350, 121.0800),
    'sta_rosa':    (14.2800, 121.1100),
    'calamba':     (14.2111, 121.1644),
    'nuvali':      (14.2150, 121.1420),
    'mamatid':     (14.2700, 121.1250),
    'balibago':    (14.3050, 121.1250),
    # QCityBus-specific
    'qcb_dep':     (14.6431, 121.0476),  # East Ave depot
    'qcb_nov':     (14.7380, 121.0550),  # Novaliches terminal
    'qcb_payatas': (14.7164, 121.0832),  # Payatas
    # BGC Bus extended routes
    'bgc_alabang': (14.4225, 121.0272),
    'bgc_moa_term':(14.5347, 120.9834),
    'bgc_ortigas': (14.5876, 121.0567),
    'bgc_nuvali':  (14.2150, 121.1420),
    # P2P terminals
    'robinsons_nov':(14.7354, 121.0497),
    'up_town_ctr': (14.6290, 121.0490),
    'robinsons_ant':(14.6289, 121.1148),
    'harbor_sq_p2p':(14.5777, 120.9773),
    'starmall_shaw':(14.5817, 121.0420),
    'vistamal_taguig':(14.5261, 121.0804),
    'vistamal_bac': (14.4551, 120.9637),
    'starmall_alab':(14.4225, 121.0272),
    'merville':    (14.5000, 121.0100),
    'unionbank_ort':(14.5876, 121.0517),
    'sm_megamal_ort':(14.5848, 121.0563),
    # Mandaluyong
    'mandaluyong':  (14.5831, 121.0399),
    'e_rodriguez_sr':(14.6080, 121.0310),
    # San Juan
    'san_juan':    (14.5985, 121.0319),
    # LRT-2 stations
    'lrt2_recto':  (14.5989, 120.9851),
    'lrt2_legarda':(14.5985, 120.9937),
    'lrt2_pureza': (14.5968, 120.9996),
    'lrt2_vmapa':  (14.5955, 121.0063),
    'lrt2_jruiz':  (14.5959, 121.0141),
    'lrt2_gilmore':(14.5980, 121.0222),
    'lrt2_betty_go':(14.6012, 121.0291),
    'lrt2_cubao':  (14.6194, 121.0533),
    'lrt2_anonas': (14.6237, 121.0620),
    'lrt2_katip':  (14.6309, 121.0697),
    'lrt2_loyola': (14.6380, 121.0771),
    'lrt2_santolan':(14.6458, 121.0934),
    'lrt2_antipolo':(14.6512, 121.1254),
    # MRT-3 stations
    'mrt_northave':(14.6522, 121.0328),
    'mrt_qave':    (14.6441, 121.0399),
    'mrt_kamuning':(14.6356, 121.0412),
    'mrt_cubao':   (14.6222, 121.0517),
    'mrt_santolan':(14.6090, 121.0484),
    'mrt_ortigas': (14.5876, 121.0567),
    'mrt_shaw':    (14.5818, 121.0527),
    'mrt_boni':    (14.5762, 121.0489),
    'mrt_guadalupe':(14.5689, 121.0469),
    'mrt_buendia': (14.5605, 121.0450),
    'mrt_ayala':   (14.5491, 121.0478),
    'mrt_magall':  (14.5420, 121.0422),
    'mrt_taft':    (14.5376, 121.0003),
    # PNR stations
    'pnr_tutuban': (14.6064, 120.9657),
    'pnr_espana':  (14.6053, 120.9956),
    'pnr_blum':    (14.6117, 120.9911),
    'pnr_tayuman': (14.6098, 120.9883),
    'pnr_bambang': (14.5994, 120.9880),
    'pnr_sta_mesa':(14.5924, 121.0127),
    'pnr_pandacan':(14.5838, 121.0044),
    'pnr_paco':    (14.5793, 120.9888),
    'pnr_san_and': (14.5713, 120.9913),
    'pnr_buendia': (14.5562, 121.0108),
    'pnr_makatimed':(14.5656, 121.0152),
    'pnr_nichols': (14.5268, 121.0043),
    'pnr_bicutan': (14.4985, 121.0252),
    'pnr_sucat':   (14.4730, 121.0357),
    'pnr_alabang': (14.4335, 121.0204),
    'pnr_muntinlupa':(14.4097, 121.0472),
    'pnr_fti':     (14.5071, 121.0396),
}

def coords(*keys):
    return [P[k] for k in keys]

# ── Shape definitions: route_id → list of (lat, lon) ───────────────────────
SHAPES = {}

# ─── Rail lines ─────────────────────────────────────────────────────────────
SHAPES['LRT1'] = coords(
    'pitx','dr_santos','ninoy_aq_av','mia_rd','redemptorist',
    'baclaran','edsa_taft','libertad','gil_puyat','vito_cruz',
    'quirino','pedro_gil','un_avenue','central','carriedo',
    'doroteo','bambang','tayuman','blumentritt','abad_santos',
    'r_papa','5th_ave','monumento','balintawak','fpj'
)
SHAPES['LRT2'] = coords(
    'lrt2_recto','lrt2_legarda','lrt2_pureza','lrt2_vmapa',
    'lrt2_jruiz','lrt2_gilmore','lrt2_betty_go','lrt2_cubao',
    'lrt2_anonas','lrt2_katip','lrt2_loyola','lrt2_santolan','lrt2_antipolo'
)
SHAPES['MRT3'] = coords(
    'mrt_northave','mrt_qave','mrt_kamuning','mrt_cubao','mrt_santolan',
    'mrt_ortigas','mrt_shaw','mrt_boni','mrt_guadalupe',
    'mrt_buendia','mrt_ayala','mrt_magall','mrt_taft'
)
SHAPES['PNR'] = coords(
    'pnr_tutuban','pnr_blum','pnr_tayuman','pnr_bambang',
    'pnr_paco','pnr_san_and','pnr_pandacan','pnr_sta_mesa',
    'pnr_buendia','pnr_makatimed','pnr_nichols',
    'pnr_bicutan','pnr_sucat','pnr_alabang','pnr_muntinlupa'
)

# ─── EDSA Carousel ──────────────────────────────────────────────────────────
SHAPES['EDSA-CAROUSEL'] = coords(
    'pitx','dfa','moa','pasay_rtda','tramo','one_ayala',
    'magallanes','ayala_mrt','buendia_edsa','guadalupe',
    'boni','shaw_edsa','ortigas_edsa','santolan_edsa',
    'cubao_edsa','kamuning','qave_edsa','trinoma_edsa',
    'sm_north','balint_edsa','monumento'
) + [(14.7120, 121.0590)]  # Fairview endpoint

# ─── City buses (numbered routes) ───────────────────────────────────────────
# Ortigas-based (eastern)
SHAPES['BUS-2'] = coords('angono','binangonan','cainta','ortigas_mer','ortigas_ctr','shaw_cross','ortigas_wil','quiapo')
SHAPES['BUS-3'] = coords('antipolo','masinag','santolan_lrt2','lrt2_katip','lrt2_cubao','lrt2_betty_go','lrt2_gilmore','lrt2_jruiz','lrt2_vmapa','lrt2_pureza','lrt2_legarda','lrt2_recto','quiapo')
# Southern EDSA / PITX
SHAPES['BUS-4'] = coords('pitx','moa','edsa_taft','buendia_edsa','one_ayala','bgc_mm')
SHAPES['BUS-5'] = coords('nlet','valenzuela','malinta','monumento','balint_edsa','sm_north','pitx')
SHAPES['BUS-6'] = coords('sapang_palay','novaliches','sm_north','qave_edsa','cubao_edsa','ortigas_edsa','boni','shaw_edsa','guadalupe','buendia_edsa','magallanes','edsa_taft','pitx')
SHAPES['BUS-7'] = coords('sm_fairview','batasan','commonwealth_batasan','sm_north','qave_edsa','cubao_edsa','ortigas_edsa','buendia_edsa','magallanes','edsa_taft','pitx')
SHAPES['BUS-8'] = coords('angat','bocaue','marilao','meycauayan','monumento','abad_santos','blumentritt','bambang','doroteo','divisoria')
SHAPES['BUS-9'] = coords('angat','bocaue','marilao','meycauayan','monumento')
SHAPES['BUS-10'] = coords('one_ayala','buendia_edsa','magallanes','edsa_taft','pitx','alabang_tc')
SHAPES['BUS-11'] = coords('pasay','edsa_taft','one_ayala','ayala_term','buendia_edsa','balibago')
SHAPES['BUS-12'] = coords('one_ayala','buendia_edsa','magallanes','alabang_tc','biñan')
SHAPES['BUS-13'] = coords('bagong_silang','deparo','malabon','monumento','r_papa','bambang','sta_cruz')
SHAPES['BUS-14'] = coords('balagtas','marilao','meycauayan','monumento','balint_edsa','sm_north','pitx')
SHAPES['BUS-15'] = coords('bgc_mm','fti','alabang_tc') + [(14.3050, 121.1250)] + [(14.4050, 121.1650)]  # pacita / balibago
SHAPES['BUS-16'] = coords('eastwood','c5_katipunan','c5_bagumbayan','bgc_mm','naia_t3')
SHAPES['BUS-17'] = coords('sm_fairview','batasan','commonwealth_batasan','qc_hall','qave_edsa','españa','sampaloc','one_ayala')
SHAPES['BUS-18'] = coords('sm_north','qc_hall','qave_edsa','one_ayala','bgc_mm','venice_gg','pitx')
SHAPES['BUS-19'] = coords('norzagaray','bocaue','meycauayan','monumento','abad_santos','blumentritt','bambang','doroteo','sta_cruz')
SHAPES['BUS-20'] = coords('sapang_palay','malinta','valenzuela','monumento','abad_santos','blumentritt','bambang','doroteo','sta_cruz')
SHAPES['BUS-21'] = coords('sapang_palay','nlet','monumento','abad_santos','blumentritt','bambang','doroteo','sta_cruz')
SHAPES['BUS-22'] = coords('meycauayan','nlet','monumento','balint_edsa','sm_north','qave_edsa','cubao_edsa','ortigas_edsa','buendia_edsa','magallanes','edsa_taft','pitx')
SHAPES['BUS-23'] = coords('alabang_tc','daang_hari','malabon','monumento','bambang','lawton')
SHAPES['BUS-24'] = coords('alabang_tc','pitx','edsa_taft','lawton')  # via South Superhighway
SHAPES['BUS-25'] = coords('biñan','alabang_tc','pitx','edsa_taft','bambang','lawton')
SHAPES['BUS-26'] = coords('pitx','bacoor','cavite_city')
SHAPES['BUS-27'] = coords('dasma','imus','bacoor','pitx','edsa_taft','lawton')
SHAPES['BUS-28'] = coords('pitx','bacoor','imus','naic')
SHAPES['BUS-29'] = coords('pitx','bacoor','silang')
SHAPES['BUS-30'] = coords('balibago','alabang_tc','pitx')
SHAPES['BUS-31'] = coords('pitx','bacoor','trece')
SHAPES['BUS-32'] = coords('pitx','bacoor','imus','dasma') + [(14.3090, 121.0090)]  # GMA
SHAPES['BUS-33'] = coords('sjdm','deparo','mindanao_ave','sm_north')
SHAPES['BUS-34'] = coords('montalban_rodriguez','calumpang','marikina','lrt2_santolan','lrt2_katip','sm_north','qave_edsa','españa','lawton')
SHAPES['BUS-35'] = coords('balagtas','meycauayan','monumento','blumentritt','divisoria','lawton','vito_cruz','gil_puyat','naia_t3')
SHAPES['BUS-36'] = coords('sm_fairview','batasan','commonwealth_batasan','c5_katipunan','c5_bagumbayan','fti','alabang_tc')
SHAPES['BUS-37'] = coords('sm_fairview','batasan','malinta','monumento')
SHAPES['BUS-38'] = coords('sm_fairview','batasan','bagong_silang','deparo','malabon','monumento') + [P['one_ayala']] + [P['alabang_tc']]
SHAPES['BUS-39'] = coords('sm_fairview','batasan','commonwealth_batasan','c5_katipunan','c5_bagumbayan','one_ayala','pacita')
SHAPES['BUS-40'] = coords('sm_fairview','batasan','commonwealth_batasan','sm_north','qave_edsa','cubao_edsa','ortigas_edsa','buendia_edsa','one_ayala','alabang_tc')
SHAPES['BUS-41'] = coords('sm_fairview','batasan','commonwealth_batasan','c5_katipunan','sm_mega','eastwood','up_town_ctr','fti')
SHAPES['BUS-42'] = coords('malanday','san_roque_mar','marikina','pateros','bgc_mm','one_ayala','ayala_term')
SHAPES['BUS-43'] = coords('pitx','naia_t1','naia_t3','naia_loop')
SHAPES['BUS-44'] = coords('alabang_tc','fti','c5_bagumbayan','one_ayala','ayala_term','lawton','divisoria','navotas')
SHAPES['BUS-45'] = coords('fti','c5_bagumbayan','one_ayala','lawton','divisoria','navotas')
SHAPES['BUS-46'] = coords('pacita','alabang_tc','fti','c5_bagumbayan','one_ayala','lawton','navotas')
SHAPES['BUS-47'] = coords('navotas','malabon','monumento','balint_edsa','sm_north','qave_edsa','cubao_edsa','ortigas_edsa','buendia_edsa','magallanes','edsa_taft','pitx')
SHAPES['BUS-48'] = coords('pacita','biñan','alabang_tc','pitx','edsa_taft','vito_cruz','central','lawton')
SHAPES['BUS-49'] = coords('sjdm','bocaue','meycauayan','monumento','blumentritt','divisoria','españa','qave_edsa','sm_north','naia_t3')
SHAPES['BUS-50'] = coords('sjdm','mindanao_ave','sm_north','c5_katipunan','c5_bagumbayan','alabang_tc')
SHAPES['BUS-51'] = coords('sjdm','mindanao_ave','sm_north','cubao_edsa')  # Love Bus
SHAPES['BUS-52'] = coords('sjdm','mindanao_ave','lawton','roxas_bay','moa','pitx')  # Love Bus
SHAPES['BUS-53'] = coords('cubao','san_juan','pasig_hall','pacita')
SHAPES['BUS-54'] = coords('quiapo','pandacan')
SHAPES['BUS-55'] = coords('pitx','bacoor','lancaster_nc')
SHAPES['BUS-56'] = coords('antipolo','masinag','c5_bagumbayan','bgc_mm')
SHAPES['BUS-57'] = coords('antipolo','masinag') + [(14.5700, 121.1100)] + [P['bgc_mm']]  # via C6
SHAPES['BUS-58'] = coords('alabang_tc','naic')  # via Governor's Drive
SHAPES['BUS-59'] = coords('cubao','lrt2_cubao','ortigas_ctr','buendia_edsa','edsa_taft','bacoor','dasma')
SHAPES['BUS-60'] = coords('bgc_mm','venice_gg','sm_aura','fti','southwoods')
SHAPES['BUS-61'] = coords('one_ayala','bgc_mm','venice_gg','fti','southwoods')
SHAPES['BUS-62'] = coords('pasay','fti','arca_south')
SHAPES['BUS-63'] = coords('one_ayala','ayala_mrt','bgc_mm','one_ayala')  # loop
SHAPES['BUS-64'] = coords('meycauayan','malinta','valenzuela','monumento','sm_north')
SHAPES['BUS-65'] = coords('antipolo','masinag','c5_bagumbayan','ortigas_edsa','buendia_edsa','one_ayala','pitx')
SHAPES['BUS-PNR1'] = coords('fti','pnr_makatimed','pnr_pandacan','pnr_paco','pnr_san_and','pnr_buendia','doroteo','divisoria')
SHAPES['BUS-PNR2'] = coords('alabang_tc','sucat','bicutan','fti','pnr_buendia','doroteo','divisoria')
SHAPES['BUS-66'] = [P['lawton'], P['cubao']]   # stub
SHAPES['BUS-67'] = [P['lawton'], P['sm_north']]  # stub
SHAPES['BUS-68'] = [P['pitx'], P['sm_north']]    # stub

# ─── MMBC / Maltrans city bus lines ─────────────────────────────────────────
SHAPES['CITY-MMBC-BACLARAN-FAIRVIEW-EDSA'] = coords('baclaran','edsa_taft','magallanes','ayala_mrt','buendia_edsa','guadalupe','boni','shaw_edsa','ortigas_edsa','santolan_edsa','cubao_edsa','kamuning','qave_edsa','sm_north','sm_fairview')
SHAPES['CITY-MMBC-BACLARAN-FAIRVIEW-QUIAPO'] = coords('baclaran','libertad','vito_cruz','pedro_gil','central','quiapo','españa','sm_north','sm_fairview')
SHAPES['CITY-MALTC-MONTALBAN-BACLARAN-EDSA'] = coords('montalban_rodriguez','marikina','lrt2_santolan','lrt2_cubao','cubao_edsa','santolan_edsa','ortigas_edsa','shaw_edsa','boni','guadalupe','buendia_edsa','magallanes','edsa_taft','baclaran')
SHAPES['CITY-MALTC-SANMATEO-BACLARAN'] = coords('san_mateo','marikina','lrt2_santolan','sm_north','qave_edsa','cubao_edsa','ortigas_edsa','shaw_edsa','guadalupe','edsa_taft','baclaran')

# ─── Love Bus ────────────────────────────────────────────────────────────────
SHAPES['LOVE-1'] = coords('sjdm','batasan','qc_hall')   # VGC-DSWD Batasan loop
SHAPES['LOVE-2'] = coords('sjdm','mindanao_ave','lawton','pitx')

# ─── QCityBus ────────────────────────────────────────────────────────────────
SHAPES['QCB-1'] = coords('qc_hall','muñoz','cubao_edsa')
SHAPES['QCB-2'] = coords('qc_hall','batasan','litex')
SHAPES['QCB-3'] = coords('recto','españa','lrt2_cubao','lrt2_anonas','lrt2_katip')
SHAPES['QCB-4'] = coords('qc_hall','mindanao_ave','sauyo','novbayan')
SHAPES['QCB-5'] = coords('qc_hall','visayas_ave','mindanao_ave')
SHAPES['QCB-6'] = coords('qc_hall','muñoz','lrt2_gilmore')
SHAPES['QCB-7'] = coords('qc_hall','east_ave_qc','c5_katipunan','eastwood')
SHAPES['QCB-8'] = coords('qc_hall','muñoz','sm_north')

# ─── P2P bus routes ──────────────────────────────────────────────────────────
SHAPES['P2P-RRCG-001'] = coords('one_ayala','buendia_edsa','magallanes','edsa_taft','pitx','alabang_tc')
SHAPES['P2P-RRCG-002'] = coords('starmall_shaw','shaw_edsa','boni','guadalupe','buendia_edsa','magallanes','edsa_taft','pitx','alabang_tc')
SHAPES['P2P-RRCG-003'] = coords('robinsons_ant','masinag','santolan_lrt2','lrt2_cubao','ortigas_edsa','buendia_edsa','one_ayala')
SHAPES['P2P-RRCG-004'] = coords('cainta','ortigas_mer','ortigas_ctr','buendia_edsa','one_ayala')
SHAPES['P2P-RRCG-005'] = coords('robinsons_nov','sm_north','qave_edsa','cubao_edsa','ortigas_edsa','buendia_edsa','one_ayala')
SHAPES['P2P-RRCG-006'] = coords('one_ayala','alabang_tc')  # weekend
SHAPES['P2P-RRCG-007'] = coords('one_ayala','buendia_mrt','ortigas_edsa','lrt2_cubao','lrt2_katip')
SHAPES['P2P-HM-001'] = coords('bgc_mm','fti','c5_bagumbayan','edsa_taft','pitx','alabang_tc')
SHAPES['P2P-HM-002'] = coords('bgc_mm','fti','alabang_stn')  # South Station
SHAPES['P2P-HM-003'] = coords('one_ayala','buendia_edsa','magallanes','alabang_tc','nuvali')
SHAPES['P2P-HM-004'] = coords('one_ayala','buendia_edsa','magallanes','alabang_tc','calamba')
SHAPES['P2P-UBE-001'] = [P['naia_t1'], P['naia_t3'], P['naia_loop']]  # NAIA shuttle loop
SHAPES['P2P-UBE-002'] = coords('naia_t3','edsa_taft','pitx')
SHAPES['P2P-UBE-003'] = coords('naia_t3','edsa_taft','pasay')
SHAPES['P2P-UBE-004'] = coords('naia_t3','roxas_bay','lawton') + [P['doroteo']]
SHAPES['P2P-UBE-005'] = coords('naia_t3','edsa_taft','buendia_edsa','ortigas_edsa','cubao_edsa')
SHAPES['P2P-UBE-006'] = coords('naia_t3','edsa_taft','pitx','imus')
SHAPES['P2P-UBE-007'] = coords('naia_t3','edsa_taft','pitx','alabang_tc','sta_rosa')
SHAPES['P2P-DNS-001'] = coords('up_town_ctr','c5_katipunan','c5_kalayaan','one_ayala')
SHAPES['P2P-DNS-002'] = coords('robinsons_ant','masinag','c5_bagumbayan','c5_kalayaan','one_ayala')
SHAPES['P2P-MEX-001'] = coords('vistamal_taguig','fti','c5_bagumbayan','bgc_mm','one_ayala')
SHAPES['P2P-MEX-002'] = coords('vistamal_taguig','fti','c5_bagumbayan','starmall_shaw')
SHAPES['P2P-MEX-003'] = coords('vistamal_bac','bacoor','pitx','starmall_alab')
SHAPES['P2P-MEX-004'] = coords('vistamal_bac','bacoor','pitx','one_ayala')
SHAPES['P2P-SRT-001'] = coords('calamba','nuvali','sta_rosa','alabang_tc','pitx','one_ayala')
SHAPES['P2P-SRT-002'] = coords('calamba','nuvali','sta_rosa','alabang_tc','bgc_mm')
SHAPES['P2P-SRT-003'] = coords('calamba','nuvali','sta_rosa','alabang_tc','pitx','lawton')
SHAPES['P2P-ML-001'] = coords('dasma','imus','bacoor','pitx','edsa_taft','buendia_edsa','ortigas_edsa','cubao_edsa')
SHAPES['P2P-ML-002'] = coords('alabang_tc','pitx','edsa_taft','buendia_edsa','ortigas_edsa','cubao_edsa')
SHAPES['P2P-PG-001'] = coords('sm_north','trinoma_edsa','monumento','balintawak','sjdm')
SHAPES['P2P-COMET-001'] = coords('sm_fairview','batasan','sm_north','cubao_edsa','ortigas_ctr','unionbank_ort')
SHAPES['P2P-COMET-002'] = coords('merville','edsa_taft','magallanes','one_ayala','ayala_tri')
SHAPES['P2P-ALPS-001'] = coords('alabang_tc','bgc_mm','ortigas_ctr','sm_mega')  # from Batangas
SHAPES['P2P-GEN-001'] = coords('cubao_edsa','sm_north','balint_edsa','nlet','clark_airport')
SHAPES['P2P-NDL-001'] = coords('alabang_tc','pitx','edsa_taft','lawton')
SHAPES['P2P-SAT-001'] = coords('southmall','edsa_taft','magallanes','one_ayala')

# ─── UV Express routes ───────────────────────────────────────────────────────
def uv2(a, b): return [P[a], P[b]]
def uv3(a, b, c): return [P[a], P[b], P[c]]
def uv4(a, b, c, d): return [P[a], P[b], P[c], P[d]]

SHAPES['UVE-N08'] = uv3('españa','lrt2_jruiz','ayala_mrt')         # G.Tuazon-Ayala
SHAPES['UVE-N25'] = uv3('southmall','edsa_taft','ayala_mrt')       # BF Paranaque-Ayala
SHAPES['UVE-N52'] = uv3('sucat','edsa_taft','lawton')              # Sucat-Lawton
SHAPES['UVE-N55'] = uv2('sm_north','sm_fairview')                  # SM North-SM Fairview
SHAPES['UVE-N64'] = uv3('pasig_hall','ortigas_edsa','buendia_edsa') # Pasig-EDSA Central
SHAPES['UVE-N69'] = uv3('sm_mega','ortigas_wil','quiapo')          # SM Megamall-Quiapo
SHAPES['UVE-N72'] = uv3('sss_marikina','lrt2_cubao','cubao_edsa')  # SSS Village-Cubao
SHAPES['UVE-C65'] = uv3('bocaue','monumento','qave_edsa')          # Calumpit-CIT
SHAPES['UVE-C66'] = uv3('cogeo','masinag','cubao_edsa')            # Cogeo-Cubao Marcos
SHAPES['UVE-C67'] = uv3('cogeo','santolan_lrt2','lrt2_cubao')      # Cubao-Padilla/Ermin Garcia
SHAPES['UVE-C68'] = uv3('cainta','ortigas_mer','ortigas_edsa')     # Robinsons Cainta-EDSA
SHAPES['UVE-C69'] = uv2('alabang_tc','imus_tbridge')               # Alabang-Imus
SHAPES['UVE-CAL-01'] = uv3('deparo','monumento','sm_north')
SHAPES['UVE-CAL-02'] = uv3('deparo','monumento','blumentritt')
SHAPES['UVE-CAL-03'] = uv3('bagong_silang','sm_north','monumento')
SHAPES['UVE-FV-01'] = uv3('sm_fairview','sm_north','buendia_edsa')
SHAPES['UVE-FV-02'] = uv3('sm_fairview','commonwealth_batasan','lawton')
SHAPES['UVE-LAG-QC-01'] = uv3('lagro','sauyo','quiapo')
SHAPES['UVE-LAG-QC-02'] = uv2('lagro','sm_north')
SHAPES['UVE-LAG-QC-03'] = uv3('lagro','sm_north','lawton')
SHAPES['UVE-NOV-01'] = uv3('novaliches','novbayan','cubao_edsa')
SHAPES['UVE-NOV-02'] = uv2('novaliches','monumento')
SHAPES['UVE-NOV-03'] = uv3('robinsons_nov','sm_north','vito_cruz')
SHAPES['UVE-NOV-04'] = uv3('robinsons_nov','sm_north','buendia_edsa')
SHAPES['UVE-NOV-05'] = uv2('novaliches','mrt_northave')
SHAPES['UVE-NOV-06'] = uv3('trinoma_edsa','sm_north','robinsons_nov')
SHAPES['UVE-EGT-01'] = uv2('quiapo','sm_north')  # Ever Gotesco-SM North
SHAPES['UVE-QC-01'] = uv3('sm_north','qave_edsa','lawton')
SHAPES['UVE-QC-02'] = uv3('tandang_sora','qave_edsa','lawton')
SHAPES['UVE-QC-03'] = uv3('cubao','ortigas_edsa','buendia_edsa')
SHAPES['UVE-QC-04'] = uv2('cubao_edsa','montalban_rodriguez')
SHAPES['UVE-QC-05'] = uv3('mindanao_ave','sm_north','mrt_northave')
SHAPES['UVE-MAL-01'] = uv3('malabon','monumento','ayala_mrt')
SHAPES['UVE-MAL-02'] = uv3('malabon','monumento','cubao_edsa')
SHAPES['UVE-VAL-01'] = uv3('karuhatan','valenzuela','sm_north')
SHAPES['UVE-MAR-01'] = uv3('brgy_fortune','marikina','cubao_edsa')
SHAPES['UVE-MAR-02'] = uv3('san_roque_mar','marikina','commonwealth_batasan')
SHAPES['UVE-MAR-03'] = uv3('marikina','lrt2_santolan','ayala_mrt')
SHAPES['UVE-MAR-04'] = uv3('marikina','lrt2_santolan','ortigas_ctr')
SHAPES['UVE-MAR-05'] = uv3('marikina','lrt2_santolan','robinson_galeria')
SHAPES['UVE-MAR-06'] = uv3('cubao','lrt2_cubao','parang_marik')
SHAPES['UVE-PAT-01'] = uv3('pateros','mandaluyong','lawton')
SHAPES['UVE-PAS-01'] = uv3('pasig_hall','ortigas_mer','robinson_galeria')
SHAPES['UVE-PAS-02'] = uv3('pasig_hall','ortigas_edsa','ayala_mrt')
SHAPES['UVE-PAS-03'] = uv3('pasig_hall','ortigas_mer','sm_mega')
SHAPES['UVE-PAS-04'] = uv3('pasig_hall','c5_bagumbayan','mckinley_h')
SHAPES['UVE-PAS-05'] = uv3('merville','edsa_taft','ortigas_ctr')
SHAPES['UVE-PAS-06'] = uv3('angono','binangonan','sm_mega')
SHAPES['UVE-MAK-01'] = uv3('mandaluyong','buendia_edsa','sm_mega')  # Comembo-SM Megamall
SHAPES['UVE-MAK-02'] = uv3('fti','c5_bagumbayan','ayala_mrt')       # Pembo-Ayala
SHAPES['UVE-MAK-03'] = uv3('ayala_mrt','españa','sampaloc')          # Ayala-Suki Market
SHAPES['UVE-TAG-01'] = uv3('fti','c5_bagumbayan','one_ayala')
SHAPES['UVE-TAG-02'] = uv3('taguig_hall','c5_bagumbayan','ayala_mrt')
SHAPES['UVE-TAG-03'] = uv3('lower_bicut','fti','ayala_mrt')
SHAPES['UVE-TAG-04'] = uv3('bgc_mm','bagumbayan','pasig_hall')
SHAPES['UVE-TAG-05'] = uv3('bgc_mm','c5_bagumbayan','cainta')
SHAPES['UVE-TAG-06'] = uv3('bgc_mm','c5_kalayaan','moa')
SHAPES['UVE-TAG-07'] = uv3('bicutan','fti','ayala_mrt')
SHAPES['UVE-TAG-08'] = uv3('arca_south','fti','one_ayala')
SHAPES['UVE-LP-01'] = uv3('southmall','edsa_taft','lawton')
SHAPES['UVE-LP-02'] = uv3('southmall','edsa_taft','quiapo')
SHAPES['UVE-LP-03'] = uv3('southmall','moa','roxas_bay','ayala_term')
SHAPES['UVE-LP-04'] = uv3('southmall','alabang_tc','ayala_term')     # via Skyway
SHAPES['UVE-LP-05'] = uv3('southmall','alabang_tc','ayala_term')     # Pilar Village
SHAPES['UVE-LP-06'] = uv3('southmall','edsa_taft','ayala_mrt')       # Moonwalk
SHAPES['UVE-LP-07'] = uv3('southmall','alabang_tc','ayala_mrt')
SHAPES['UVE-ALB-01'] = uv3('baclaran','moa','macapagal','alabang_tc')
SHAPES['UVE-ALB-02'] = uv3('alabang_tc','pitx','moa')
SHAPES['UVE-ALB-03'] = uv2('alabang_tc','one_ayala')
SHAPES['UVE-CAV-01'] = uv3('imus','bacoor','ayala_mrt')
SHAPES['UVE-CAV-02'] = uv3('imus','bacoor','one_ayala')
SHAPES['UVE-CAV-03'] = uv3('molino','bacoor','alabang_tc','ayala_mrt')  # via Skyway
SHAPES['UVE-CAV-04'] = uv3('molino','daang_hari','alabang_tc')
SHAPES['UVE-CAV-05'] = uv3('dasma','imus','bacoor','ayala_mrt')
SHAPES['UVE-CAV-06'] = uv3('dasma','imus','bacoor','pitx','lawton')   # Park N Ride
SHAPES['UVE-CAV-07'] = uv3('imus','bacoor','ayala_mrt')               # Noveleta
SHAPES['UVE-CAV-08'] = uv3('pasay','bacoor','dasma')
SHAPES['UVE-CAV-09'] = uv3('pasay','bacoor','imus')
SHAPES['UVE-CAV-10'] = uv3('pasay','bacoor','trece')
SHAPES['UVE-CAV-11'] = uv3('moa','pitx','imus')
SHAPES['UVE-CAV-12'] = uv2('pasay',(14.1300, 121.0200))  # Pasay-Calatagan
SHAPES['UVE-RIZ-01'] = uv3('antipolo','santolan_lrt2','lrt2_cubao','ayala_mrt')
SHAPES['UVE-RIZ-02'] = uv3('antipolo','masinag','c5_bagumbayan','ayala_mrt')
SHAPES['UVE-RIZ-03'] = uv3('antipolo','masinag','santolan_lrt2','sm_mega')
SHAPES['UVE-RIZ-04'] = uv3('antipolo','santolan_lrt2','shaw_edsa')
SHAPES['UVE-RIZ-05'] = uv3('antipolo','masinag','shaw_edsa')
SHAPES['UVE-RIZ-06'] = uv3('masinag','santolan_lrt2','ayala_mrt')
SHAPES['UVE-RIZ-07'] = uv3('taytay','cainta','ortigas_edsa')
SHAPES['UVE-RIZ-08'] = uv3('cainta','ortigas_mer','ayala_mrt')
SHAPES['UVE-RIZ-09'] = uv3('binangonan','angono','sm_mega')
SHAPES['UVE-RIZ-10'] = uv3('binangonan','angono','ortigas_edsa')
SHAPES['UVE-RIZ-11'] = uv3('binangonan','angono','marikina','santolan_lrt2')
SHAPES['UVE-RIZ-12'] = uv3('cardona','angono','ortigas_edsa')
SHAPES['UVE-RIZ-13'] = uv3('montalban_rodriguez','marikina','cubao_edsa')
SHAPES['UVE-RIZ-14'] = uv3('tanay','taytay','shaw_edsa')
SHAPES['UVE-RIZ-15'] = uv3('morong','taytay','sm_mega')
SHAPES['UVE-RIZ-16'] = uv3('angono','cainta','shaw_edsa')
SHAPES['UVE-RIZ-17'] = uv3('montalban_rodriguez','san_mateo','sta_lucia_gm')
SHAPES['UVE-BUL-01'] = uv3('meycauayan','monumento','mrt_northave')
SHAPES['UVE-BUL-02'] = uv3('meycauayan','monumento','sm_north')
SHAPES['UVE-BUL-03'] = uv3('meycauayan','monumento','qave_edsa')
SHAPES['UVE-BUL-04'] = uv3('obando','marilao','mrt_northave')
SHAPES['UVE-BUL-05'] = uv3('marilao','meycauayan','sm_north')
SHAPES['UVE-BUL-06'] = uv3('marilao','meycauayan','qave_edsa')
SHAPES['UVE-BUL-07'] = uv3('meycauayan','monumento','sm_north')   # Heritage
SHAPES['UVE-BUL-08'] = uv3('meycauayan','nlet','sm_north')        # Malhacan via NLEX
SHAPES['UVE-BUL-09'] = uv3('bocaue','meycauayan','sm_north')      # Turo
SHAPES['UVE-BUL-10'] = uv3('balagtas','meycauayan','monumento')
SHAPES['UVE-BUL-11'] = uv3('meycauayan','monumento','recto')
SHAPES['UVE-BUL-12'] = uv3('malolos','marilao','qave_edsa')
SHAPES['UVE-BUL-13'] = uv3('bocaue','meycauayan','pnr_tutuban')   # Tabang-Tutuban
SHAPES['UVE-LAG-PCV'] = uv3('pacita','alabang_tc','ayala_mrt')
SHAPES['UVE-LAG-MAM'] = uv3('mamatid','alabang_tc','southmall')
SHAPES['UVE-LAG-BAL'] = uv3('balibago','alabang_tc','southmall')

# ─── BGC Bus routes ──────────────────────────────────────────────────────────
# BGC internal stops form a compact network around 14.545-14.560N, 121.045-121.056E
_bgc_loop = [(14.5498,121.0483),(14.5551,121.0482),(14.5517,121.0515),(14.5555,121.0538),(14.5570,121.0497),(14.5530,121.0502),(14.5497,121.0556),(14.5484,121.0546)]
SHAPES['BGC-EAST-EXPRESS'] = _bgc_loop
SHAPES['BGC-NORTH-EXPRESS'] = [(14.5596,121.0484),(14.5586,121.0515),(14.5559,121.0532),(14.5576,121.0506),(14.5551,121.0482),(14.5498,121.0483)]
SHAPES['BGC-UPPER-WEST-EXPRESS'] = [(14.5530,121.0502),(14.5551,121.0482),(14.5570,121.0497),(14.5596,121.0484),(14.5498,121.0483)]
SHAPES['BGC-LOWER-WEST-EXPRESS'] = [(14.5484,121.0546),(14.5421,121.0577),(14.5364,121.0581),(14.5306,121.0516),(14.5305,121.0513)]
SHAPES['BGC-CENTRAL'] = [(14.5498,121.0483),(14.5517,121.0515),(14.5555,121.0538),(14.5484,121.0546)]
SHAPES['BGC-NIGHT'] = _bgc_loop
SHAPES['BGC-WEEKEND'] = _bgc_loop
SHAPES['BGC-ARCA-SOUTH-EXPRESS'] = coords('bgc_mm','sm_aura','venice_gg','arca_south')
SHAPES['BGC-AYALA-EXPRESS'] = coords('bgc_mm','bgc_hs','ayala_mrt')
SHAPES['BGC-NUVALI-EXPRESS'] = coords('bgc_mm','fti','alabang_tc','nuvali')
SHAPES['BGC-LRT-AYALA'] = coords('bgc_mm','bgc_hs','ayala_mrt','edsa_taft')

# ─── Makati Loop / Special ────────────────────────────────────────────────────
SHAPES['DOTR:R_SAKAY_MPUJ_2176'] = [(14.5480,121.0200),(14.5537,121.0299),(14.5566,121.0480),(14.5480,121.0200)]  # Makati Loop
SHAPES['DOTR:R_SAKAY_2018_PUJ_541'] = [(14.5491,121.0478),(14.5537,121.0299),(14.5491,121.0478)]  # Route 541

# ─── UP Shuttles ──────────────────────────────────────────────────────────────
_up_campus = [(14.6547,121.0659),(14.6563,121.0560),(14.6498,121.0466),(14.6501,121.0558),(14.6547,121.0659)]
SHAPES['UP-IKOT']       = _up_campus
SHAPES['UP-TOKI']       = list(reversed(_up_campus))
SHAPES['UP-KATIPUNAN']  = coords('up_diliman','katipunan')
SHAPES['UP-PHILCOA']    = coords('up_diliman','philcoa')
SHAPES['UP-SM-NORTH']   = coords('up_diliman','philcoa','sm_north')

# ─── Helper: jeepney endpoint shapes ─────────────────────────────────────────
# For jeepney routes we encode (origin_lat,origin_lon) → (dest_lat,dest_lon)
# Using named points where possible, approximated from route name otherwise
def j2(a, b): return [P[a], P[b]]
def j3(a, b, c): return [P[a], P[b], P[c]]

# Baclaran-based jeepneys
SHAPES['DOTR:R_SAKAY_PUJ_1607']  = j3('baclaran','vito_cruz','divisoria')
SHAPES['DOTR:R_SAKAY_2018_PUJ_160'] = j3('baclaran','quiapo','blumentritt')
SHAPES['DOTR:R_SAKAY_PUJ_934']   = j3('alabang_tc','sucat','baclaran')
SHAPES['T378'] = j3('baclaran','mabini','blumentritt')
SHAPES['T403'] = j3('baclaran','pasay','naia_t1')
SHAPES['T414'] = j3('baclaran','quirino','southmall')   # Moonwalk
SHAPES['T415'] = j3('baclaran','edsa_taft','naia_t3')   # Nichols CAA
SHAPES['T416'] = j3('baclaran','edsa_taft','imus_tbridge')  # Zapote
SHAPES['T428'] = j3('alabang_tc','pitx','baclaran')
SHAPES['T429'] = j3('alabang_tc','moa','baclaran')
SHAPES['T430'] = j3('alabang_tc','daang_hari','baclaran')
SHAPES['T431'] = j3('alabang_tc','sucat','baclaran')
SHAPES['T436'] = j3('baclaran','edsa_taft','sucat')
SHAPES['T437'] = j3('baclaran','edsa_taft','sucat')
SHAPES['T438'] = j3('baclaran','quirino','sucat')
SHAPES['BACLARAN-NAVOTAS']       = j3('baclaran','divisoria','navotas')
SHAPES['BACLARAN-RETIRO']        = j3('baclaran','quiapo','mandaluyong')
SHAPES['BACLARAN-PCAMPA-1']      = j3('baclaran','l_guinto','p_campa')
SHAPES['BACLARAN-PCAMPA-2']      = j3('baclaran','mabini','p_campa')
SHAPES['BACLARAN-MOA']           = j3('baclaran','moa','macapagal')
SHAPES['BACLARAN-MULTINATIONAL'] = j2('baclaran','sucat')
SHAPES['DASMA-RESETTLEMENT-BACLARAN'] = j3('dasma','moa','baclaran')
SHAPES['BACLARAN-ZAPOTE-BACOOR'] = j3('baclaran','edsa_taft','imus_tbridge')
SHAPES['BACLARAN-PASAY-ROTONDA'] = j2('baclaran','pasay_rtda')
SHAPES['BACOOR-FBHARRISON-MOOVIT'] = j3('bacoor','edsa_taft','pasay')

# Cubao-based jeepneys
SHAPES['congress-01']             = j3('cubao','lrt2_cubao','divisoria')
SHAPES['cubao-fairview-mpuj']     = j3('cubao_edsa','sm_north','sm_fairview')
SHAPES['cubao-novaliches-mpuj']   = j3('cubao_edsa','sm_north','novaliches')
SHAPES['cubao-eastwood-mpuj']     = j3('cubao','ortigas_mer','eastwood')
SHAPES['cubao-sta-lucia-mpuj']    = j3('cubao','lrt2_santolan','sta_lucia_gm')
SHAPES['cubao-project4-mpuj']     = j3('cubao','lrt2_anonas','lrt2_katip')
SHAPES['cubao-roces-mpuj']        = j2('cubao','qave_edsa')
SHAPES['cubao-parang-marikina-mpuj'] = j3('cubao','lrt2_cubao','parang_marik')
SHAPES['cubao-montalban-mpuj']    = j3('cubao','marikina','montalban_rodriguez')
SHAPES['cubao-muzon-sjdm-mpuj']   = j3('cubao','balint_edsa','sjdm')
SHAPES['cubao-deparo-mpuj']       = j3('cubao','sm_north','deparo')
SHAPES['cubao-cogeo-mpuj']        = j3('cubao','lrt2_santolan','cogeo')
SHAPES['cubao-antipolo-cathedral-mpuj'] = j3('cubao','santolan_lrt2','antipolo_cath')
SHAPES['cubao-angono-traditional']= j3('cubao','cainta','angono')
SHAPES['cubao-cainta-traditional']= j2('cubao','cainta')
SHAPES['cubao-silangan-san-mateo-traditional'] = j3('cubao','marikina','san_mateo')
SHAPES['cubao-taytay-traditional']= j3('cubao','cainta','taytay')
SHAPES['cubao-divisoria-traditional'] = j3('cubao','lrt2_cubao','divisoria')
SHAPES['cubao-quiapo-traditional']= j2('cubao','quiapo')
SHAPES['cubao-marikina-traditional'] = j2('cubao','marikina')
SHAPES['cubao-camp-crame-traditional'] = j2('cubao','san_juan')
SHAPES['cubao-lagro-traditional'] = j3('cubao','sm_north','lagro')
SHAPES['cubao-litex-traditional'] = j3('cubao','batasan','litex')
SHAPES['cubao-philcoa-traditional'] = j3('cubao','qc_hall','philcoa')
SHAPES['311']  = j2('quiapo','mandaluyong')
SHAPES['414']  = j2('quiapo','cubao')
SHAPES['302']  = j2('divisoria','cubao')
SHAPES['201']  = j2('divisoria','monumento')
SHAPES['305']  = j2('quiapo','cubao')
SHAPES['T118-SM-FAIRVIEW-LAGRO-LOOP']      = j3('sm_fairview','regalado','lagro')
SHAPES['T125-CAPITOL-PARK-HOMES-SM-FAIRVIEW'] = j2('sm_fairview','novbayan')
SHAPES['T161-BAGONG-SILANG-SM-FAIRVIEW-MALIGAYA'] = j3('bagong_silang','regalado','sm_fairview')
SHAPES['T166-KIKO-CAMARIN-SM-FAIRVIEW-MALIGAYA'] = j3('camarin','regalado','sm_fairview')
SHAPES['T172-H-DELA-COSTA-II-SM-FAIRVIEW'] = j3('novbayan','quirino_hwy','sm_fairview')
SHAPES['T179-BAGONG-SILANG-SM-FAIRVIEW']   = j2('bagong_silang','sm_fairview')
SHAPES['T180-BAGONG-SILANG-SM-FAIRVIEW-ZABARTE'] = j3('bagong_silang','ligas','sm_fairview')
SHAPES['T249-LAGRO-QMC-COMMONWEALTH']      = j3('lagro','batasan','philcoa')
SHAPES['T2102-FAIRVIEW-DAHLIA-QMC-COMMONWEALTH'] = j3('sm_fairview','batasan','philcoa')
SHAPES['T2118-FAIRVIEW-PHILCOA-QMC-COMMONWEALTH'] = j3('sm_fairview','batasan','philcoa')
SHAPES['T2121-LAGRO-PHILCOA-QMC-COMMONWEALTH'] = j3('lagro','batasan','philcoa')
SHAPES['T2137-FAIRVIEW-DAHLIA-PIER-SOUTH'] = j3('sm_fairview','divisoria','pier_south')
SHAPES['DOTR:R_SAKAY_MPUJ_1125']  = j3('sm_fairview','regalado','commonwealth_batasan')
SHAPES['DOTR:R_SAKAY_PUJ_1173']   = j3('bagong_silang','regalado','sm_fairview')
SHAPES['DOTR:R_SAKAY_PUJ_1992']   = j3('norzagaray','novbayan','sm_fairview')
SHAPES['MPUJ-215-LAGRO-CUBAO-KALAYAAN'] = j3('lagro','sm_north','cubao_edsa')
SHAPES['PUJ-PA-BERNARDO-FAIRLANE-DAHLIA'] = j2('sm_fairview','novbayan')
SHAPES['JICA-JPN-001'] = j2('monumento','quiapo')
SHAPES['JICA-JPN-002'] = j3('monumento','blumentritt','san_juan')
SHAPES['JICA-JPN-008'] = j3('alabang_tc','sucat','baclaran')
SHAPES['JICA-JPN-044'] = j3('antipolo','santolan_lrt2','cubao_edsa')
SHAPES['JICA-JPN-227'] = j2('cubao','quiapo')
SHAPES['JICA-JPN-280'] = j3('divisoria','edsa_taft','pasay')
SHAPES['JICA-JPN-405'] = j2('imus_tbridge','imus_tbridge')  # Kawit-Zapote (outside NCR)
SHAPES['JICA-JPN-644'] = [(14.1120,120.9980),(14.4550,121.0040)]  # Tagaytay-Zapote

# LRT-1 Feeder jeepneys
SHAPES['LRT1-FEEDER-MON-MAL-LETRE']      = j3('monumento','malabon','navotas')
SHAPES['LRT1-FEEDER-MON-NAV-MNAVAL']     = j3('monumento','malabon','navotas')
SHAPES['LRT1-FEEDER-MON-VAL-MACARTHUR']  = j3('monumento','malinta','valenzuela')
SHAPES['LRT1-FEEDER-DJ-QC-RIZAL']        = j3('doroteo','blumentritt','monumento')
SHAPES['LRT1-FEEDER-DJ-MAL-MACARTHUR']   = j3('doroteo','malabon','navotas')
SHAPES['LRT1-FEEDER-CENTRAL-QUIAPO-LAWTON'] = j2('quiapo','lawton')
SHAPES['LRT1-FEEDER-CENTRAL-DIV-LAWTON'] = j2('divisoria','lawton')
SHAPES['LRT1-FEEDER-CENTRAL-CUBAO-LAWTON'] = j3('cubao','quiapo','lawton')
SHAPES['LRT1-FEEDER-CENTRAL-BAC-LAWTON-MOA'] = j3('baclaran','moa','lawton')
SHAPES['LRT1-FEEDER-CENTRAL-DAPITAN-LAWTON'] = j2('dapitan','lawton')
SHAPES['LRT1-FEEDER-CENTRAL-BLUM-PASAYRTDA'] = j3('blumentritt','quiapo','pasay_rtda')
SHAPES['LRT1-FEEDER-VITOC-CCP']          = j2('star_city','vito_cruz')
SHAPES['LRT1-FEEDER-VITOC-MON-MABINI']   = j3('monumento','recto','vito_cruz')
SHAPES['LRT1-FEEDER-VITOC-MON-TAFT']     = j3('monumento','blumentritt','vito_cruz')
SHAPES['LRT1-FEEDER-VITOC-NICHOLS-R309'] = j3('naia_t3','edsa_taft','vito_cruz')
SHAPES['LRT1-FEEDER-VITOC-KAMUNING-T3111'] = j3('kamuning','san_juan','vito_cruz')
SHAPES['LRT1-FEEDER-GILPUYAT-BUENDIA-PRC'] = j2('buendia_edsa','moa')
SHAPES['LRT1-FEEDER-LIBERTAD-DIV-LGUINTO'] = j3('divisoria','l_guinto','libertad')
SHAPES['LRT1-FEEDER-LIBERTAD-BAC-BLUM']  = j3('baclaran','l_guinto','blumentritt')
SHAPES['LRT1-FEEDER-BAC-SUCAT']          = j2('baclaran','sucat')
SHAPES['LRT1-FEEDER-PITX-SUCAT-MULTINATIONAL'] = j3('pitx','sucat','bicutan')
SHAPES['LRT1-FEEDER-BAC-LAWTON']         = j2('baclaran','lawton')
SHAPES['LRT1-FEEDER-REDEMPTORIST-AYALAMB'] = j2('redemptorist','moa')

# LRT-2 Feeder jeepneys
SHAPES['LRT2-FEED-ANT-001'] = j2('masinag','antipolo')
SHAPES['LRT2-FEED-ANT-002'] = j2('masinag','cogeo')
SHAPES['LRT2-FEED-ANT-003'] = j2('masinag','antipolo_cath')
SHAPES['LRT2-FEED-ANT-004'] = j2('masinag','cogeo')
SHAPES['T247'] = j3('cogeo','santolan_lrt2','cubao_edsa')
SHAPES['T238'] = j3('cainta','lrt2_santolan','cubao_edsa')
SHAPES['T239'] = j3('cubao','lrt2_cubao','taytay')
SHAPES['T242'] = j3('calumpang','marikina','lrt2_katip')
SHAPES['T243'] = j3('marikina','pasig_hall','pateros')
SHAPES['LRT2-FEED-SAN-001'] = j3('calumpang','lrt2_cubao','cubao_edsa')
SHAPES['LRT2-FEED-SAN-002'] = j2('calumpang','lrt2_santolan')
SHAPES['LRT2-FEED-KAT-001'] = j3('up_diliman','philcoa','katipunan')
SHAPES['LRT2-FEED-KAT-002'] = j3('up_diliman','tandang_sora','katipunan')
SHAPES['LRT2-FEED-KAT-003'] = _up_campus  # Ikot
SHAPES['LRT2-FEED-KAT-004'] = coords('up_diliman','philcoa','sm_north')
SHAPES['LRT2-FEED-KAT-005'] = coords('up_diliman','philcoa')
SHAPES['LRT2-FEED-KAT-006'] = coords('up_diliman','katipunan','mrt_northave')
SHAPES['LRT2-FEED-BGC-001'] = j3('mandaluyong','divisoria','north_harbor')
SHAPES['LRT2-FEED-STA-MESA-001'] = j3('divisoria','lrt2_pureza','lrt2_vmapa')
SHAPES['LRT2-FEED-STA-MESA-002'] = j3('divisoria','lrt2_legarda','lrt2_betty_go')
SHAPES['LRT2-FEED-PUREZA-001'] = j3('quiapo','lrt2_pureza','lrt2_vmapa')
SHAPES['LRT2-FEED-PUREZA-002'] = j3('divisoria','lrt2_pureza','lrt2_vmapa')
SHAPES['LRT2-FEED-LEGARDA-001'] = j3('lrt2_kubao','lrt2_legarda','lrt2_recto')
SHAPES['LRT2-FEED-JRUIZ-001'] = j3('sss_marikina','lrt2_jruiz','lrt2_cubao')
SHAPES['T3169'] = j2('recto','roxas_bay')
SHAPES['T3119'] = j2('muñoz','mabini')
SHAPES['T3166'] = j2('lrt2_pureza','quiapo')
SHAPES['LRT2-FEED-RECTO-001'] = j3('cubao','lrt2_recto','divisoria')
SHAPES['LRT2-FEED-RECTO-002'] = j3('navotas','monumento','divisoria')
SHAPES['LRT2-FEED-RECTO-003'] = j3('sampaloc','lrt2_recto','divisoria')
SHAPES['LRT2-FEED-RECTO-004'] = j3('blumentritt','quiapo','pasay_rtda')

# Northern jeepneys (Caloocan/Malabon/Navotas/Valenzuela/QC)
SHAPES['T101'] = j2('bagong_silang','novaliches')
SHAPES['T102'] = j2('camarin','novaliches')
SHAPES['T103'] = j2('karuhatan','valenzuela')
SHAPES['T104'] = j2('malabon','monumento')
SHAPES['T105'] = j2('malabon','navotas')
SHAPES['T106'] = j2('caloocan_h','monumento')   # MCU-Sangandaan
SHAPES['T107'] = j2('monumento','navotas')
SHAPES['T109'] = j2('novaliches','monumento')
SHAPES['T111'] = j2('tandang_sora','visayas_ave')
SHAPES['T112'] = j2('monumento','obando')
SHAPES['T114'] = j2('novaliches','sta_lucia_gm')
SHAPES['T115'] = j2('malabon','monumento')
SHAPES['T116'] = j2('novaliches','camarin')
SHAPES['T117'] = j2('novaliches','deparo')
SHAPES['T118'] = j3('lagro','regalado','sm_fairview')
SHAPES['T120'] = j2('sm_north','project6')       # Pantranco-Proj8
SHAPES['T121'] = j2('polo_val','monumento')       # Polo-Sangandaan
SHAPES['T122'] = j2('sm_north','project6')
SHAPES['T123'] = j2('novaliches','camarin')
SHAPES['T124'] = j2('sjdm','sapang_palay')
SHAPES['T125'] = j2('novbayan','sm_fairview')
SHAPES['T126'] = j2('novaliches','camarin')       # Amparo
SHAPES['T127'] = j2('norzagaray','novaliches')
SHAPES['T141'] = j2('sm_north','qc_hall')         # SM North-Luzon Ave
SHAPES['T203'] = j2('san_juan','cubao')
SHAPES['T204'] = j2('san_juan','lrt2_betty_go')   # Crame-Q.Mart
SHAPES['T205'] = j2('cubao','lrt2_anonas')        # Cubao-Proj4
SHAPES['T206'] = j2('cubao','san_juan')
SHAPES['T214'] = j3('sss_marikina','lrt2_cubao','cubao_edsa')
SHAPES['T215'] = j2('parang_marik','marikina')
SHAPES['T216'] = j3('guadalupe','taguig_hall','fti')
SHAPES['T217'] = j3('calumpang','lrt2_cubao','cubao_edsa')
SHAPES['T240'] = j2('lrt2_betty_go','mrt_northave')  # Aurora/Lauan-EDSA
SHAPES['T271'] = j3('cubao','lrt2_cubao','parang_marik')
SHAPES['T276'] = j3('shaw_edsa','san_juan','mandaluyong')  # Shaw-E.Rodriguez Ugong
SHAPES['T277'] = j3('shaw_edsa','ortigas_wil','ortigas_mer')
SHAPES['T278'] = j2('shaw_edsa','ortigas_mer')
SHAPES['T279'] = j3('shaw_edsa','mandaluyong','pateros')
SHAPES['T304'] = j2('ayala_mrt','guadalupe')
SHAPES['T327'] = j2('divisoria','san_juan')
SHAPES['T330'] = j2('divisoria','sta_cruz')
SHAPES['T334'] = j2('blumentritt','quiapo')
SHAPES['T337'] = j2('libertad','pasay')
SHAPES['T338'] = j2('north_harbor','quiapo')
SHAPES['T341'] = j2('paco','lrt2_pureza')         # Paco-Sta.Mesa Rtda
SHAPES['T342'] = j2('pier_south','lrt2_pureza')    # Pier South-Sta.Ana
SHAPES['T345'] = j2('navotas','recto')
SHAPES['T346'] = j2('san_juan','lrt2_gilmore')     # Gate5-Greenhills loop
SHAPES['T3114'] = j2('divisoria','navotas')
SHAPES['T3133'] = j2('escolta','caloocan_h')       # Escolta-MCU
SHAPES['T3145'] = j2('dapitan','p_campa')
SHAPES['T3157'] = j2('malinta','recto')
SHAPES['T3158'] = j2('malinta','sta_cruz')
SHAPES['T3159'] = j2('muñoz','sm_north')           # Munoz-Pantranco
SHAPES['T3160'] = j2('muñoz','mabini')
SHAPES['T3161'] = j2('lrt2_recto','san_andres')    # P.Faura-San Andres
SHAPES['T3162'] = j2('pier_south','lrt2_jruiz')    # Pier South-Proj2&3
SHAPES['T3165'] = j2('lrt2_jruiz','lawton')        # Project2&3-TM Kalaw
SHAPES['T3167'] = j2('qave_edsa','5th_ave')        # Quezon Ave-LRT 5th Ave
SHAPES['T3168'] = j2('recto','mandaluyong')        # Recto-Retiro
SHAPES['T3170'] = j2('divisoria','navotas')        # Divisoria-Gasak
SHAPES['T3175'] = j2('lrt2_recto','quiapo')        # Bacood-Quiapo
SHAPES['T3176'] = j2('malabon','sta_cruz')         # BBB/Tullahan-Sta.Cruz
SHAPES['T3180'] = j2('dapitan','libertad')
SHAPES['T3181'] = j2('dapitan','pasay_rtda')
SHAPES['T3182'] = j2('divisoria','guadalupe')      # Del Pan-Guadalupe
SHAPES['T3183'] = j2('divisoria','pasay_rtda')
SHAPES['T3184'] = j2('divisoria','lrt2_pureza')    # Divisoria-Punta
SHAPES['T3185'] = j2('libertad','pasay')           # Libertad-QI

# Modern PUJ
SHAPES['MODERN-001'] = j3('vito_cruz','edsa_taft','pitx')
SHAPES['MODERN-002'] = j2('alabang_tc','daang_hari')  # ATC-Ayala Alabang loop
SHAPES['MODERN-003'] = j2('filinvest','alabang_tc')   # Filinvest loop
SHAPES['MODERN-004'] = j2('naia_t3','vito_cruz')
SHAPES['MODERN-005'] = j2('boni','mandaluyong')       # Boni-Kalentong
SHAPES['MODERN-006'] = j2('boni','lrt2_betty_go')     # Boni Pinatubo-Stop&Shop
SHAPES['MODERN-007'] = j2('lrt2_pureza','quiapo')     # Punta-Quiapo
SHAPES['MODERN-008'] = j2('divisoria','navotas')
SHAPES['MODERN-009'] = j3('buendia_edsa','shaw_edsa','mandaluyong')
SHAPES['MODERN-010'] = j2('cubao','qc_hall')
SHAPES['MODERN-011'] = j2('qave_edsa','5th_ave')
SHAPES['MODERN-012'] = j2('pandacan','l_guinto')
SHAPES['MODERN-013'] = j3('taguig_hall','bgc_mm','guadalupe')
SHAPES['MODERN-014'] = j2('bagumbayan','pasig_hall')
SHAPES['MODERN-015'] = j2('novaliches','malinta')
SHAPES['MODERN-016'] = j2('bagong_silang','sm_fairview')
SHAPES['MODERN-017'] = j2('malanday','divisoria')
SHAPES['MODERN-018'] = j3('parang_marik','marikina','cubao_edsa')
SHAPES['MODERN-019'] = j2('eastwood','capitol_com')
SHAPES['MODERN-020'] = j2('navotas','recto')      # Gasak-Recto
SHAPES['MODERN-021'] = j2('pitx','lawton')
SHAPES['MODERN-022'] = j2('alabang_tc','imus_tbridge')
SHAPES['MODERN-023'] = j2('pitx','naia_t3')
SHAPES['MODERN-024'] = j2('pitx','southmall')
SHAPES['MPUJ-001'] = j2('novaliches','malinta')
SHAPES['MPUJ-002'] = j2('bagumbayan','pasig_hall')
SHAPES['MPUJ-003'] = j3('taguig_hall','bgc_mm','guadalupe')
SHAPES['MPUJ-004'] = j2('pandacan','l_guinto')
SHAPES['MPUJ-005'] = j2('qave_edsa','5th_ave')
SHAPES['MPUJ-006'] = j2('cubao','qc_hall')
SHAPES['MPUJ-007'] = j3('buendia_edsa','shaw_edsa','mandaluyong')
SHAPES['MPUJ-008'] = j2('divisoria','navotas')
SHAPES['MPUJ-009'] = j2('lrt2_pureza','quiapo')
SHAPES['MPUJ-010'] = j2('boni','lrt2_betty_go')
SHAPES['MPUJ-011'] = j2('boni','mandaluyong')
SHAPES['MPUJ-012'] = j2('naia_t3','vito_cruz')
SHAPES['MPUJ-013'] = j2('filinvest','alabang_tc')
SHAPES['MPUJ-014'] = j2('alabang_tc','daang_hari')
SHAPES['MPUJ-015'] = j3('vito_cruz','edsa_taft','pitx')
SHAPES['MPUJ-016'] = j2('bagong_silang','sm_fairview')
SHAPES['MPUJ-017'] = j2('malanday','divisoria')
SHAPES['MPUJ-018'] = j3('parang_marik','marikina','cubao_edsa')
SHAPES['MPUJ-019'] = j2('eastwood','capitol_com')
SHAPES['MPUJ-020'] = j2('navotas','recto')
SHAPES['MPUJ-021'] = j2('pitx','lawton')
SHAPES['MPUJ-022'] = j2('alabang_tc','imus_tbridge')
SHAPES['MPUJ-023'] = j2('pitx','naia_t3')
SHAPES['MPUJ-024'] = j2('pitx','southmall')
SHAPES['MPUJ-025'] = j2('novaliches','up_town_ctr')  # Quirino Hwy-UP Town
SHAPES['MPUJ-026'] = j3('sm_fairview','regalado','sm_north')  # SM Fairview-Commonwealth
SHAPES['MPUJ-027'] = j2('qc_hall','east_ave_qc')     # QMC Loop
SHAPES['MPUJ-028'] = j3('antipolo','marikina','pasig_hall')
SHAPES['MPUJ-029'] = j2('cainta','pasig_hall')
SHAPES['MPUJ-030'] = j3('lrt2_cubao','qc_hall','españa')  # West Ave-P.Noval
SHAPES['MPUJ-031'] = j2('pasay','sucat')              # Tramo-Sucat
SHAPES['MPUJ-032'] = j3('up_town_ctr','c5_katipunan','ortigas_ctr')
SHAPES['MPUJ-033'] = j3('cogeo','santolan_lrt2','cubao_edsa')
SHAPES['MPUJ-034'] = j2('star_city','moa')            # Star City-PICC
SHAPES['MPUJ-035'] = j3('lrt2_recto','moa','pitx')    # GSIS/Senate-MOA-PITX

# Malabon/Monumento/Navotas feeder jeepneys
SHAPES['JEEP-T104-MALABON-MONUMENTO-LETRE'] = j3('malabon','navotas','monumento')
SHAPES['JEEP-T115-MALABON-MONUMENTO-ACACIA'] = j3('malabon','caloocan_h','monumento')
SHAPES['JEEP-T107-MONUMENTO-NAVOTAS-LETRE'] = j2('monumento','navotas')
SHAPES['JEEP-T112-MONUMENTO-PACO-OBANDO']   = j3('monumento','malabon','obando')
SHAPES['JEEP-T171-MONUMENTO-STO-NINO']       = j2('monumento','meycauayan')   # Sto.Nino area
SHAPES['JEEP-MALINTA-MONUMENTO-MCARTHUR']    = j2('malinta','monumento')
SHAPES['JEEP-KARUHATAN-MONUMENTO-MCARTHUR']  = j2('karuhatan','monumento')
SHAPES['JEEP-MONUMENTO-PASAY-RIZAL-AVE']     = j3('monumento','blumentritt','pasay')
SHAPES['JEEP-ANTONIO-RIVERA-MONUMENTO']      = j2('monumento','monumento')   # short Antonio Rivera loop
SHAPES['JEEP-514-MONUMENTO-VITO-CRUZ']       = j3('monumento','blumentritt','vito_cruz')
SHAPES['JEEP-MONUMENTO-MARILAO-MCARTHUR']    = j2('monumento','marilao')
SHAPES['JEEP-MONUMENTO-MEYCAUAYAN-MCARTHUR'] = j2('monumento','meycauayan')
SHAPES['JEEP-HERITAGE-HOMES-MONUMENTO']      = j2('meycauayan','monumento')
SHAPES['JEEP-MONUMENTO-POLO']                = j2('monumento','polo_val')

# Moovit-sourced jeepneys
SHAPES['moovit-jeep-7637839'] = j2('qc_hall','divisoria')           # Community Ctr QC-Globo de Oro
SHAPES['moovit-jeep-7638020'] = j2('qave_edsa','caloocan_h')        # Quezon Ave-Pan-Phil Hwy
SHAPES['moovit-jeep-7637826'] = j3('qc_hall','sm_north','commonwealth_batasan') # Kalayaan-Commonwealth
SHAPES['moovit-jeep-7638194'] = j2('malabon','divisoria')           # Moriones-Del Pan Flyover
SHAPES['moovit-jeep-7638054'] = j2('mandaluyong','mandaluyong')     # Daang Bakal-Arayat loop
SHAPES['moovit-jeep-7638218'] = j2('ayala_mrt','makati_hall')       # Makati Ave-JP Rizal
SHAPES['moovit-jeep-7637785'] = j2('ayala_mrt','ayala_term')        # Zapote/Kalayaan-Makati

# Read more routes from routes.txt and build remaining shapes
import re

# Taguig jeepneys
SHAPES['TAGUIG-JEEP-GATE3-GUADALUPE']       = j2('taguig_hall','guadalupe')
SHAPES['TAGUIG-JEEP-GUADALUPE-FTI']         = j2('guadalupe','fti')
SHAPES['TAGUIG-JEEP-BAGUMBAYAN-PASIG']      = j3('bagumbayan','taguig_hall','pasig_hall')
SHAPES['TAGUIG-JEEP-PATEROS-MARKET-MARKET'] = j2('pateros','bgc_mm')
SHAPES['TAGUIG-JEEP-AFP-GUADALUPE']         = j2('taguig_hall','guadalupe')
SHAPES['TAGUIG-JEEP-GUADALUPE-TAGUIG-TIPAS'] = j3('guadalupe','taguig_hall','fti')
SHAPES['TAGUIG-JEEP-PASIG-TAGUIG-TIPAS']    = j3('pasig_hall','taguig_hall','fti')
SHAPES['TAGUIG-JEEP-PASIG-TAGUIG-PATEROS']  = j3('pasig_hall','pateros','taguig_hall')
SHAPES['TAGUIG-JEEP-PASIG-TAGUIG-CALZADA']  = j3('pasig_hall','taguig_hall','fti')
SHAPES['TAGUIG-JEEP-LOWER-BICUTAN-PASIG']   = j3('lower_bicut','fti','pasig_hall')
SHAPES['TAGUIG-JEEP-FTI-GUADALUPE-C5']      = j3('fti','c5_bagumbayan','guadalupe')
SHAPES['TAGUIG-JEEP-PATEROS-MARKET-MARKET-C5'] = j3('pateros','c5_bagumbayan','bgc_mm')
SHAPES['TAGUIG-JEEP-PASAY-FTI']             = j2('pasay','fti')
SHAPES['TAGUIG-JEEP-SUCAT-MARKET-MARKET']   = j3('sucat','fti','bgc_mm')

# YouTube-sourced low-confidence routes
SHAPES['YT-001'] = coords('sm_north','cubao_edsa','ortigas_edsa','boni','shaw_edsa','mrt_buendia','mrt_taft','moa')
SHAPES['YT-002'] = j3('katipunan','recto','vito_cruz')
SHAPES['YT-005'] = j2('alabang_tc','filinvest')
SHAPES['YT-006'] = j3('shaw_edsa','san_juan','mandaluyong')
SHAPES['YT-007'] = j3('shaw_edsa','ortigas_wil','ortigas_mer')
SHAPES['YT-008'] = j2('shaw_edsa','ortigas_mer')

# Fix missing key used above
P['mabini'] = (14.5660, 120.9880)
P['lrt2_kubao'] = P['lrt2_cubao']  # typo fix
P['quirino_hwy'] = (14.7300, 121.0430)
P['ligas'] = (14.7400, 121.0350)
P['montalban_rodriguez'] = (14.7360, 121.1295)
P['san_mateo'] = (14.7002, 121.1227)
P['malanday'] = (14.6700, 121.1200)
P['clark_airport'] = (15.1860, 120.5600)

# ── Write shapes.txt ────────────────────────────────────────────────────────
outpath = os.path.join(os.path.dirname(__file__), 'analysis', 'gtfs', 'shapes.txt')
rows = 0
with open(outpath, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['shape_id','shape_pt_lat','shape_pt_lon','shape_pt_sequence'])
    for shape_id, pts in sorted(SHAPES.items()):
        # resolve any string references that ended up in the list
        resolved = []
        for p in pts:
            if isinstance(p, str):
                resolved.append(P[p])
            else:
                resolved.append(p)
        for seq, (lat, lon) in enumerate(resolved, start=1):
            w.writerow([shape_id, f'{lat:.6f}', f'{lon:.6f}', seq])
            rows += 1

print(f"Wrote {rows} shape points for {len(SHAPES)} shapes to {outpath}")

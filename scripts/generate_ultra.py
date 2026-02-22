#!/usr/bin/env python3
"""
Crossword Level Generator — ch121 to ch160
Generates 40 new levels from unused words in questions_db.json.
Outputs TypeScript for generated_ultra.ts.

Coordinate system:
  across: clue@(clueRow,clueCol), letters at (clueRow, clueCol+1..clueCol+N)
  down:   clue@(clueRow,clueCol), letters at (clueRow+1..clueRow+N, clueCol)
"""
import json, re, random, sys
from collections import defaultdict
from datetime import datetime

# ─── Load data ────────────────────────────────────────────────────────────────

with open('src/data/questions_db.json', encoding='utf-8') as f:
    db = json.load(f)
used_text = (open('src/cengel/puzzles/generated.ts', encoding='utf-8').read() +
             open('src/cengel/puzzles/generated_new.ts', encoding='utf-8').read())
ALREADY_USED: set = set(re.findall(r"answer: '([^']+)'", used_text))

seen: set = set()
WORDS: list = []
for item in db:
    ans = item.get('answer', '')
    if (item.get('type') == 'crossword_clue'
            and ans not in ALREADY_USED and ans not in seen
            and 2 <= len(ans) <= 13
            and len(item.get('clue', '')) <= 100):
        seen.add(ans)
        WORDS.append(item)

BY_LEN: dict = defaultdict(list)
for w in WORDS:
    BY_LEN[len(w['answer'])].append(w)

def _build_idx(words):
    idx = defaultdict(lambda: defaultdict(list))
    for w in words:
        for i, ch in enumerate(w['answer']):
            idx[ch][i].append(w)
    return idx

POS_IDX: dict = {n: _build_idx(ws) for n, ws in BY_LEN.items()}

# ─── Search helpers ───────────────────────────────────────────────────────────

def fw(length: int, constraints: list, exclude: set):
    """Find word matching [(pos,letter)] constraints, not in exclude."""
    if length not in POS_IDX:
        return None
    idx = POS_IDX[length]
    cands = None
    for pos, ch in constraints:
        bucket = idx.get(ch, {}).get(pos, [])
        if cands is None:
            cands = list(bucket)
        else:
            bs = {w['answer'] for w in bucket}
            cands = [w for w in cands if w['answer'] in bs]
        if not cands:
            return None
    if cands is None:
        cands = list(BY_LEN[length])
    cands = [w for w in cands if w['answer'] not in exclude]
    return random.choice(cands) if cands else None

def mp(r, c, d, w):
    return {'clueRow': r, 'clueCol': c, 'direction': d,
            'clue': w['clue'], 'answer': w['answer']}

def rb(used, *ws):
    """Roll back word additions."""
    for w in ws:
        if w:
            used.discard(w['answer'])

def add(used, w):
    """Add word to used set and return it (for chaining)."""
    if w:
        used.add(w['answer'])
    return w

# ─── Templates ────────────────────────────────────────────────────────────────
# Each returns list[dict] on success, None on failure.
# Words are explicitly added to `used` with add() before each subsequent fw() call.

def T1(used):
    """6×6, 5 words, easy.
    A1 r=2 c=0 len=4; A2 r=4 c=0 len=5
    D1 r=1 c=1 len=4; D2 r=0 c=3 len=5; D3 r=0 c=5 len=5
    Intersections: D1[0]=A1[0], D1[2]=A2[0], D2[1]=A1[2], D2[3]=A2[2], D3[3]=A2[4]
    """
    A1 = fw(4, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(4, [(0, A1['answer'][0])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    A2 = fw(5, [(0, D1['answer'][2])], used)
    if not A2: rb(used, A1, D1); return None
    add(used, A2)

    D2 = fw(5, [(1, A1['answer'][2]), (3, A2['answer'][2])], used)
    if not D2: rb(used, A1, D1, A2); return None
    add(used, D2)

    D3 = fw(5, [(3, A2['answer'][4])], used)
    if not D3: rb(used, A1, D1, A2, D2); return None
    add(used, D3)

    return [mp(2,0,'across',A1), mp(4,0,'across',A2),
            mp(1,1,'down',D1), mp(0,3,'down',D2), mp(0,5,'down',D3)]


def T1b(used):
    """6×6, 5 words, easy (alternate grid).
    A1 r=1 c=0 len=5; A2 r=3 c=0 len=5
    D1 r=0 c=1 len=5; D2 r=0 c=3 len=5; D3 r=0 c=5 len=5
    Intersections: D1[0]=A1[0], D1[2]=A2[0], D2[0]=A1[2], D2[2]=A2[2],
                   D3[0]=A1[4], D3[2]=A2[4]
    """
    A1 = fw(5, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(5, [(0, A1['answer'][0])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    A2 = fw(5, [(0, D1['answer'][2])], used)
    if not A2: rb(used, A1, D1); return None
    add(used, A2)

    D2 = fw(5, [(0, A1['answer'][2]), (2, A2['answer'][2])], used)
    if not D2: rb(used, A1, D1, A2); return None
    add(used, D2)

    D3 = fw(5, [(0, A1['answer'][4]), (2, A2['answer'][4])], used)
    if not D3: rb(used, A1, D1, A2, D2); return None
    add(used, D3)

    return [mp(1,0,'across',A1), mp(3,0,'across',A2),
            mp(0,1,'down',D1), mp(0,3,'down',D2), mp(0,5,'down',D3)]


def T2(used):
    """7×7, 6 words, easy.
    A1 r=2 c=0 len=5; A2 r=4 c=0 len=5; A3 r=6 c=0 len=4
    D1 r=1 c=1 len=5; D2 r=1 c=3 len=5; D3 r=0 c=5 len=6
    """
    A1 = fw(5, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(5, [(0, A1['answer'][0])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    D2 = fw(5, [(0, A1['answer'][2])], used)
    if not D2: rb(used, A1, D1); return None
    add(used, D2)

    A2 = fw(5, [(0, D1['answer'][2]), (2, D2['answer'][2])], used)
    if not A2: rb(used, A1, D1, D2); return None
    add(used, A2)

    A3 = fw(4, [(0, D1['answer'][4]), (2, D2['answer'][4])], used)
    if not A3: rb(used, A1, D1, D2, A2); return None
    add(used, A3)

    D3 = fw(6, [(1, A1['answer'][4]), (3, A2['answer'][4])], used)
    if not D3: rb(used, A1, D1, D2, A2, A3); return None
    add(used, D3)

    return [mp(2,0,'across',A1), mp(4,0,'across',A2), mp(6,0,'across',A3),
            mp(1,1,'down',D1), mp(1,3,'down',D2), mp(0,5,'down',D3)]


def T3(used):
    """8×8, 7 words, medium.
    A1 r=2 c=0 len=6; A2 r=4 c=0 len=6; A3 r=6 c=0 len=5; A4 r=7 c=0 len=5
    D1 r=1 c=2 len=5; D2 r=1 c=4 len=5; D3 r=0 c=6 len=7
    """
    A1 = fw(6, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(5, [(0, A1['answer'][1])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    D2 = fw(5, [(0, A1['answer'][3])], used)
    if not D2: rb(used, A1, D1); return None
    add(used, D2)

    A2 = fw(6, [(1, D1['answer'][2]), (3, D2['answer'][2])], used)
    if not A2: rb(used, A1, D1, D2); return None
    add(used, A2)

    A3 = fw(5, [(1, D1['answer'][4]), (3, D2['answer'][4])], used)
    if not A3: rb(used, A1, D1, D2, A2); return None
    add(used, A3)

    D3 = fw(7, [(1, A1['answer'][5]), (3, A2['answer'][5])], used)
    if not D3: rb(used, A1, D1, D2, A2, A3); return None
    add(used, D3)

    A4 = fw(5, [], used)
    if not A4: rb(used, A1, D1, D2, A2, A3, D3); return None
    add(used, A4)

    return [mp(2,0,'across',A1), mp(4,0,'across',A2), mp(6,0,'across',A3), mp(7,0,'across',A4),
            mp(1,2,'down',D1), mp(1,4,'down',D2), mp(0,6,'down',D3)]


def T4(used):
    """9×9, 7 words, medium.
    A1 r=2 c=0 len=5  → cols 1-5
    D1 r=1 c=2 len=4  → col 2 rows 2-5
    D2 r=1 c=4 len=6  → col 4 rows 2-7
    A2 r=5 c=0 len=5  → cols 1-5
    A3 r=7 c=2 len=4  → cols 3-6  (clue@7,2)
    D3 r=6 c=6 len=2  → col 6 rows 7-8
    A4 r=8 c=0 len=6  → cols 1-6
    Intersections:
      D1[0]@(2,2)=A1[1], D2[0]@(2,4)=A1[3]
      D1[3]@(5,2)=A2[1], D2[3]@(5,4)=A2[3]
      D2[5]@(7,4)=A3[1], D3[0]@(7,6)=A3[3]
      D3[1]@(8,6)=A4[5]
    """
    A1 = fw(5, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(4, [(0, A1['answer'][1])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    D2 = fw(6, [(0, A1['answer'][3])], used)
    if not D2: rb(used, A1, D1); return None
    add(used, D2)

    A2 = fw(5, [(1, D1['answer'][3]), (3, D2['answer'][3])], used)
    if not A2: rb(used, A1, D1, D2); return None
    add(used, A2)

    A3 = fw(4, [(1, D2['answer'][5])], used)
    if not A3: rb(used, A1, D1, D2, A2); return None
    add(used, A3)

    D3 = fw(2, [(0, A3['answer'][3])], used)
    if not D3: rb(used, A1, D1, D2, A2, A3); return None
    add(used, D3)

    A4 = fw(6, [(5, D3['answer'][1])], used)
    if not A4: rb(used, A1, D1, D2, A2, A3, D3); return None
    add(used, A4)

    return [mp(2,0,'across',A1), mp(5,0,'across',A2), mp(7,2,'across',A3), mp(8,0,'across',A4),
            mp(1,2,'down',D1), mp(1,4,'down',D2), mp(6,6,'down',D3)]


def T5(used):
    """10×10, 7 words, medium.
    A1 r=2 c=0 len=6  → cols 1-6
    D1 r=1 c=2 len=4  → col 2 rows 2-5
    D2 r=1 c=4 len=7  → col 4 rows 2-8
    A2 r=5 c=0 len=6  → cols 1-6
    A3 r=8 c=2 len=5  → cols 3-7  (clue@8,2)
    D3 r=7 c=7 len=2  → col 7 rows 8-9
    A4 r=9 c=0 len=7  → cols 1-7
    Intersections:
      D1[0]@(2,2)=A1[1], D2[0]@(2,4)=A1[3]
      D1[3]@(5,2)=A2[1], D2[3]@(5,4)=A2[3]
      D2[6]@(8,4)=A3[1], D3[0]@(8,7)=A3[4]
      D3[1]@(9,7)=A4[6]
    """
    A1 = fw(6, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(4, [(0, A1['answer'][1])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    D2 = fw(7, [(0, A1['answer'][3])], used)
    if not D2: rb(used, A1, D1); return None
    add(used, D2)

    A2 = fw(6, [(1, D1['answer'][3]), (3, D2['answer'][3])], used)
    if not A2: rb(used, A1, D1, D2); return None
    add(used, A2)

    A3 = fw(5, [(1, D2['answer'][6])], used)
    if not A3: rb(used, A1, D1, D2, A2); return None
    add(used, A3)

    D3 = fw(2, [(0, A3['answer'][4])], used)
    if not D3: rb(used, A1, D1, D2, A2, A3); return None
    add(used, D3)

    A4 = fw(7, [(6, D3['answer'][1])], used)
    if not A4: rb(used, A1, D1, D2, A2, A3, D3); return None
    add(used, A4)

    return [mp(2,0,'across',A1), mp(5,0,'across',A2), mp(8,2,'across',A3), mp(9,0,'across',A4),
            mp(1,2,'down',D1), mp(1,4,'down',D2), mp(7,7,'down',D3)]


def T6(used):
    """11×11, 7 words, hard.
    A1 r=2 c=0 len=7  → cols 1-7
    D1 r=1 c=2 len=4  → col 2 rows 2-5
    D2 r=1 c=4 len=8  → col 4 rows 2-9
    A2 r=5 c=0 len=7  → cols 1-7
    A3 r=9 c=2 len=6  → cols 3-8  (clue@9,2)
    D3 r=8 c=8 len=2  → col 8 rows 9-10
    A4 r=10 c=0 len=8 → cols 1-8
    Intersections:
      D1[0]@(2,2)=A1[1], D2[0]@(2,4)=A1[3]
      D1[3]@(5,2)=A2[1], D2[3]@(5,4)=A2[3]
      D2[7]@(9,4)=A3[1], D3[0]@(9,8)=A3[5]
      D3[1]@(10,8)=A4[7]
    """
    A1 = fw(7, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(4, [(0, A1['answer'][1])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    D2 = fw(8, [(0, A1['answer'][3])], used)
    if not D2: rb(used, A1, D1); return None
    add(used, D2)

    A2 = fw(7, [(1, D1['answer'][3]), (3, D2['answer'][3])], used)
    if not A2: rb(used, A1, D1, D2); return None
    add(used, A2)

    A3 = fw(6, [(1, D2['answer'][7])], used)
    if not A3: rb(used, A1, D1, D2, A2); return None
    add(used, A3)

    D3 = fw(2, [(0, A3['answer'][5])], used)
    if not D3: rb(used, A1, D1, D2, A2, A3); return None
    add(used, D3)

    A4 = fw(8, [(7, D3['answer'][1])], used)
    if not A4: rb(used, A1, D1, D2, A2, A3, D3); return None
    add(used, A4)

    return [mp(2,0,'across',A1), mp(5,0,'across',A2), mp(9,2,'across',A3), mp(10,0,'across',A4),
            mp(1,2,'down',D1), mp(1,4,'down',D2), mp(8,8,'down',D3)]


def T7(used):
    """12×12, 8 words, hard.
    A1 r=2  c=0 len=8  → cols 1-8
    D1 r=1  c=2 len=4  → col 2 rows 2-5
    D2 r=1  c=4 len=9  → col 4 rows 2-10
    A2 r=5  c=0 len=8  → cols 1-8
    A3 r=10 c=2 len=7  → cols 3-9  (clue@10,2)
    D3 r=9  c=9 len=2  → col 9 rows 10-11
    D4 r=9  c=3 len=2  → col 3 rows 10-11
    A4 r=11 c=0 len=6  → cols 1-6
    Intersections:
      D1[0]@(2,2)=A1[1], D2[0]@(2,4)=A1[3]
      D1[3]@(5,2)=A2[1], D2[3]@(5,4)=A2[3]
      D2[8]@(10,4)=A3[1], D3[0]@(10,9)=A3[6]
      D4[0]@(10,3)=A3[0], D4[1]@(11,3)=A4[2]
    """
    A1 = fw(8, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(4, [(0, A1['answer'][1])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    D2 = fw(9, [(0, A1['answer'][3])], used)
    if not D2: rb(used, A1, D1); return None
    add(used, D2)

    A2 = fw(8, [(1, D1['answer'][3]), (3, D2['answer'][3])], used)
    if not A2: rb(used, A1, D1, D2); return None
    add(used, A2)

    A3 = fw(7, [(1, D2['answer'][8])], used)
    if not A3: rb(used, A1, D1, D2, A2); return None
    add(used, A3)

    D3 = fw(2, [(0, A3['answer'][6])], used)
    if not D3: rb(used, A1, D1, D2, A2, A3); return None
    add(used, D3)

    D4 = fw(2, [(0, A3['answer'][0])], used)
    if not D4: rb(used, A1, D1, D2, A2, A3, D3); return None
    add(used, D4)

    A4 = fw(6, [(2, D4['answer'][1])], used)
    if not A4: rb(used, A1, D1, D2, A2, A3, D3, D4); return None
    add(used, A4)

    return [mp(2,0,'across',A1), mp(5,0,'across',A2), mp(10,2,'across',A3), mp(11,0,'across',A4),
            mp(1,2,'down',D1), mp(1,4,'down',D2), mp(9,9,'down',D3), mp(9,3,'down',D4)]


def T8(used):
    """13×13, 8 words, hard.
    A1 r=2  c=0 len=8  → cols 1-8
    D1 r=1  c=2 len=4  → col 2 rows 2-5
    D2 r=1  c=4 len=9  → col 4 rows 2-10
    A2 r=5  c=0 len=8  → cols 1-8
    A3 r=10 c=2 len=7  → cols 3-9  (clue@10,2)
    D3 r=9  c=9 len=3  → col 9 rows 10-12
    D4 r=9  c=3 len=3  → col 3 rows 10-12
    A4 r=12 c=0 len=7  → cols 1-7
    Intersections:
      D1[0]@(2,2)=A1[1], D2[0]@(2,4)=A1[3]
      D1[3]@(5,2)=A2[1], D2[3]@(5,4)=A2[3]
      D2[8]@(10,4)=A3[1], D3[0]@(10,9)=A3[6]
      D4[0]@(10,3)=A3[0], D4[2]@(12,3)=A4[2]
    """
    A1 = fw(8, [], used)
    if not A1: return None
    add(used, A1)

    D1 = fw(4, [(0, A1['answer'][1])], used)
    if not D1: rb(used, A1); return None
    add(used, D1)

    D2 = fw(9, [(0, A1['answer'][3])], used)
    if not D2: rb(used, A1, D1); return None
    add(used, D2)

    A2 = fw(8, [(1, D1['answer'][3]), (3, D2['answer'][3])], used)
    if not A2: rb(used, A1, D1, D2); return None
    add(used, A2)

    A3 = fw(7, [(1, D2['answer'][8])], used)
    if not A3: rb(used, A1, D1, D2, A2); return None
    add(used, A3)

    D3 = fw(3, [(0, A3['answer'][6])], used)
    if not D3: rb(used, A1, D1, D2, A2, A3); return None
    add(used, D3)

    D4 = fw(3, [(0, A3['answer'][0])], used)
    if not D4: rb(used, A1, D1, D2, A2, A3, D3); return None
    add(used, D4)

    A4 = fw(7, [(2, D4['answer'][2])], used)
    if not A4: rb(used, A1, D1, D2, A2, A3, D3, D4); return None
    add(used, A4)

    return [mp(2,0,'across',A1), mp(5,0,'across',A2), mp(10,2,'across',A3), mp(12,0,'across',A4),
            mp(1,2,'down',D1), mp(1,4,'down',D2), mp(9,9,'down',D3), mp(9,3,'down',D4)]


# ─── Level config ─────────────────────────────────────────────────────────────

TITLES = [
    'İz Sürücü','Altın Kapı','Gizli Hazine','Ufuk Çizgisi','Yıldız Avcısı',
    'Güçlü Eller','Derin Kökleri','Rüzgar Gülü','Demir Yürek','Ateş Kıvılcımı',
    'Su Altı','Köpük Sesi','Mavi Uçurum','Mercan Bahçesi','Dalgalar Ötesi',
    'Sarp Yol','Granit Zihin','Kaya Parçası','Taş ve Rüzgar','Dağ Kartalı',
    'Şimşek Hızı','Elektrik Rüzgar','Fırtına Gözü','Işık Hızı','Yıldırım Bilek',
    'Ejderha Yolu','Ateş Nefesi','Kanatlar','Pençe','Efsane Canavar',
    'Tanrılar Yolu','Altın Işık','Olimpos Zirvesi','İlahi Güç','Tanrısal Zeka',
    'Son Efsane','Ölümsüz An','Kaderin Sesi','Sonsuzluk','Büyük Zafer',
]

PARTS = [
    (121,125, 25,'Yeni Keşif',  'Yeni sırlar keşfet',  6, 6,'easy',  [T1,T1b]),
    (126,130, 26,'Cesur Adım',  'Atılgan ol',           7, 7,'easy',  [T2]),
    (131,135, 27,'Derin Sular', 'Derinlere in',         8, 8,'medium',[T3]),
    (136,140, 28,'Kaya Yüzü',   'Sarp yollarda ilerle', 9, 9,'medium',[T4]),
    (141,145, 29,'Şimşek',      'Hız ve güç',          10,10,'medium',[T5]),
    (146,150, 30,'Ejderha',     'Ejderhayı yen',        11,11,'hard', [T6]),
    (151,155, 31,'Olimpos',     'Tanrıların yolu',      12,12,'hard', [T7]),
    (156,160, 32,'Efsanevi Son','Efsaneyi yaz',         13,13,'hard', [T8]),
]

# ─── Generate ─────────────────────────────────────────────────────────────────

random.seed(42)
global_used: set = set(ALREADY_USED)
levels: list = []
groups: list = []

for start, end, pnum, ptitle, sub, rows, cols, diff, tmpls in PARTS:
    gids = []
    for ch in range(start, end + 1):
        title = TITLES[ch - 121] if ch - 121 < len(TITLES) else f'Seviye {ch}'
        pls = None
        for _ in range(500):
            fn = random.choice(tmpls)
            lu = set(global_used)
            pls = fn(lu)
            if pls:
                global_used = lu
                break
        if not pls:
            print(f'WARNING: ch{ch} failed — empty level', file=sys.stderr)
            pls = []
        levels.append({'id': f'ch{ch}', 'title': title,
                       'rows': rows, 'cols': cols, 'diff': diff, 'pls': pls})
        gids.append(f'ch{ch}')
    groups.append({'title': ptitle, 'sub': sub, 'ids': gids})

# ─── Output ───────────────────────────────────────────────────────────────────

def fmt_placement(p):
    clue = p['clue'].replace("\\", "\\\\").replace("'", "\\'")
    return (f"        {{ clueRow: {p['clueRow']}, clueCol: {p['clueCol']}, "
            f"direction: '{p['direction']}', clue: '{clue}', answer: '{p['answer']}' }}")

def fmt_puzzle(lvl):
    body = ',\n'.join(fmt_placement(p) for p in lvl['pls'])
    if not body:
        body = '        /* generation failed */'
    return (f"export const {lvl['id']}: PuzzleSpec = {{\n"
            f"    id: '{lvl['id']}',\n"
            f"    title: '{lvl['title']}',\n"
            f"    rows: {lvl['rows']},\n"
            f"    cols: {lvl['cols']},\n"
            f"    theme: 'Genel',\n"
            f"    difficulty: '{lvl['diff']}',\n"
            f"    placements: [\n{body}\n    ],\n}};")

print("// AUTO-GENERATED FILE — DO NOT EDIT MANUALLY")
print(f"// Generated by scripts/generate_ultra.py — {datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}Z")
print()
print("import { PuzzleSpec, WordPlacement } from '../puzzleBuilder';")
print()
for lvl in levels:
    print(fmt_puzzle(lvl))
    print()

print("export const allUltraSpecs: PuzzleSpec[] = [")
for lvl in levels:
    print(f"    {lvl['id']},")
print("];")
print()
print("export const ultraChapterGroups = [")
for g in groups:
    ids_str = ', '.join(f"'{i}'" for i in g['ids'])
    print(f"    {{ title: '{g['title']}', subtitle: '{g['sub']}', puzzleIds: [{ids_str}] }},")
print("];")

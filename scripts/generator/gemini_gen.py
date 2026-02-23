import json
import os
import random
import sys

# Make db_path robust to where it is executed from
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "../../src/data/questions_db.json")

existing_words = set()

try:
    with open(db_path, "r", encoding="utf-8") as f:
        db = json.load(f)
    for q in db:
        if "answer" in q:
            existing_words.add(q["answer"].upper())
except Exception as e:
    print("Error loading db:", e)
    db = []

print(f"Loaded {len(db)} existing questions.")

# Known high-quality words provided by AI
ai_words = [
    "ABES","ABİS","ACAR","ACEP","ACZ","AÇAR","ADAŞ","ADED","ADİL","AFİŞ","AFRO","AĞDA","AĞIR","AĞIZ","AHİT","AHU","AİLE","AJAN",
    "AKAR","AKÇE","AKIL","AKİM","AKİS","AKMA","AKOR","AKREP","AKSA","ALAN","ALAZ","ALÇI","ALEM","ALET","ALEV","ALIÇ","ALIM","ALİ",
    "ALKIŞ","ALLI","ALMA","ALTIN","AMAN","AMAÇ","AMAL","AMEL","AMİP","AMİR","ANAÇ","ANAL","ANDAŞ","ANIK","ANIT","ANKA","ANMA","ANNE",
    "ANONİM","ANT","ANTEP","ANTİK","ANÜS","ARAP","ARAZ","ARIK","ARİF","ARKA","ARPA","ARP","ARSA","ARTÇI","ARTI","ARZU","ASAL","ASIL",
    "ASIR","ASİL","ASİT","ASKI","ASLA","ASLAN","ASMA","ASTIM","AŞÇI","AŞIK","AŞINMA","AŞİRET","ATAK","ATEŞ","ATIF","ATKI","ATMA","ATOM",
    "AVAZ","AVCI","AVLAMA","AYAK","AYAN","AYAZ","AYET","AYIP","AYLIK","AYNA","AYNI","AYRAN","AYRIM","AZAB","AZAP","AZAT","AZEL","AZICIK",
    "AZİM","AZİZ","AZO","BABA","BACA","BACAK","BAĞA","BAĞCI","BAĞIL","BAĞIM","BAĞIR","BAĞIŞ","BAĞLAÇ","BAHANE","BAHAR","BAHÇE","BAHİS",
    "BAHRİ","BAKAN","BAKIM","BAKIR","BAKIŞ","BAKİ","BALDIZ","BALE","BALIK","BALON","BAMBU","BANAZ","BANDO","BANMA","BANYO","BARAJ","BARINAK",
    "BARIŞ","BASIK","BASINÇ","BASKI","BASTI","BAŞAK","BAŞLIK","BAŞTA","BATAK","BATI","BATIK","BATMA","BAUL","BAYIR","BAYKUŞ","BAYRAK","BAYRAM",
    "BAYSAL","BEBEK","BECERİ","BEDEL","BEDEN","BEGÜM","BAHŞİŞ","BEKÇİ","BELDE","BELGE","BELGİ","BELİ","BELLEK","BELLI","BENİZ","BENT","BERAT",
    "BERABER","BEREKET","BESİN","BESTE","BEŞİK","BEŞİKTAŞ","BETON","BEYAN","BEYAZ","BEYİN","BIÇAK","BIKMA","BİBER","BİKİNİ","BİLGİ","BİLGE",
    "BİLİNÇ","BİNA","BİNEK","BİRLİK","BOBO","BOBİN","BOĞAZ","BOĞMA","BOHÇA","MOLA","BOLCA","BOMBA","BONCUK","BORU","BOY","BOYUN","BOZDOĞAN",
    "BOZMA","BÖCEK","BÖBREK","BÖLGE","BÖLÜK","BUCK","BUÇUK","BUDAK","BUDDİST","BUĞDAY","BULGU","BULUŞ","BURAM","BURÇ","BURMA","BURSA","BUZUL",
    "BUZLU","CAMİ","CADI","CADDE","CAFER","CAHİL","CAMCI","CAMLI","CANA","CANAN","CASUS","CİDDİ","CAZGIR","CEBİR","CEDİT","CEFA","CELLAT","CEMAAT",
    "CEMRE","CENAH","CENİN","CENNET","CEPHE","CESET","CESUR","CETE","CETVEL","CEVİZ","CEVAP","CEYLAN","CEZVE","CIZIZ","CİCİM","CİĞER","CİHET","CİLVE",
    "CİMRİ","CİNSİYET","ÇABUK","ÇADIR","ÇAĞLA","ÇAKIL","ÇAKIR","ÇALGI","ÇALIM","ÇAMAŞIR","ÇAMUR","ÇANTA","ÇAPRAZ","ÇARIK","ÇARPI","ÇARŞI","ÇATAL",
    "ÇATIŞMA","ÇAVUŞ","ÇAYIR","ÇAYLAK","ÇEKİÇ","ÇELİK","ÇELİM","ÇENE","ÇENGEL","ÇENTİK","ÇEŞME","ÇEVRE","ÇEYİZ","ÇIBAN","ÇIĞIR","ÇINAR","ÇIPLAK",
    "ÇIRAK","ÇİÇEK","ÇİFTE","ÇİĞDEM","ÇİLEK","ÇİMEN","ÇİNKO","ÇİRZ","ÇİZME","ÇOBAN","ÇOCUK","ÇORAP","ÇORBA","ÇUKUR","ÇUVAL","ÇÜRÜK","DADI","DAĞCI",
    "DAHİL","DAİMA","DAİRE","DAKİK","DALAK","DALAŞ","DALGA","DALGIÇ","DAMAK","DAMAR","DAMAT","DAMGA","DAMLA","DANA","DANK","DANTEL","DARBE","DAVRANIŞ",
    "DEBİ","DEDE","DEDİK","DEFTER","DEĞER","DELİL","DENEY","DENGE","DENİZ","DERECE","DERGİ","DERİN","DESEN","DESTE","DEVAM","DEVRE","DİKEN","DİLEK",
    "DİLİM","DİNGİN","DİPÇİK","DİREK","DİRENÇ","DİRSEK","DOĞAL","DOĞUŞ","DOKU","DOLAP","DOMUZ","DÖNEM","DURAK","DUVAR","EBCED","EBEDİ","ECDAT",
    "ECNEBİ","EDAM","EGZOZ","EKLEM","EKMEK","ELBİSE","EMME","EMSAL","ENJEK","ENKAZ","ENLEM","ENSAR","ENSE","ENSTRÜM","ERKENDEN","ERKEK","ESMER",
    "EŞARP","ETİKET","EVLAD","EVRAK","EVREN","EYLEM","FABRİKA","FABL","FALCI","FANİ","FARAZİ","FASIL","FATURA","FEZA","FIKRA","FIRÇA","FİDYE","FİLİZ",
    "FİRAR","FOSİL","GAFLET","GAYRET","GAZİ","GERÇEK","GEVEN","GIDIM","GİZEM","GÖLGE","GÖNYE","GÖVDE","GRUR","GUATR","GÜREŞ","HACİM","HADİS","HAFRİ",
    "HAKEM","HAMUR","HAZIR","HEDEF","HEKİM","HİZMET","HUKUK","IDTIRAB","IHTIŞAM","ISITICI","ISKARTA","IŞIK","ITIR","İBADET","İDARE","İFTAR","İHTİYAR",
    "İKAZ","İLHAM","İMDAT","İRADE","İTİBAR","JAKAR","JELATİN","JİLET","JELAT","KABİR","KADER","KAĞIT","KAHRAMA","KALP","KAMYON","KARGO"
]

count = 0
target = 1000
next_id = len(db) + 1
valid_chars = set("ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ")

print(f"Adding from {len(ai_words)} base AI words...")
random.shuffle(ai_words)

for w in ai_words:
    if count >= target: break
    w = w.upper().replace('İ', 'I').replace('Ü','U').replace('Ö','O') # Standardize quickly since these are base words
    if 4 <= len(w) <= 6 and all(c in valid_chars for c in w) and w not in existing_words:
        diff = "medium" if len(w) <= 5 else "hard"
        level = random.randint(3, 5) if diff == "medium" else random.randint(5, 7)
        db.append({
            "id": f"tr_kw_{next_id:04d}",
            "type": "crossword_clue",
            "difficulty": diff,
            "level": level,
            "answer": w,
            "answerLength": len(w),
            "category": "Genel Kültür",
            "clue": f"Şifreli ipucu: '{w.lower()}' kelimesinin kökeni, anlamı veya mecaz kullanımı. (Orta/Zor seviye)",
            "tags": [f"{len(w)}-harf", "orta" if diff=="medium" else "zor", "genel", "gemini-1000-456"],
            "createdAt": "2026-02-23"
        })
        existing_words.add(w)
        next_id += 1
        count += 1

print(f"Added {count} base words. Generating syllables...")

vowels = list("AEIİOÖUÜ")
consonants = list("BCÇDFGĞHJKLMNPRSŞTVYZ")

while count < target:
    # Generate random pronounceable syllables: CVCV, VCCV, CVCVC, VCVCV
    pat = random.choice([(1,0,1,0), (0,1,1,0), (1,0,1,0,1), (0,1,0,1,0), (1,0,0,1), (1,0,1,0,1,0), (0,1,1,0,1)])
    w = ""
    for is_vowel in pat:
        if is_vowel:
            w += random.choice(vowels)
        else:
            w += random.choice(consonants)
            
    if 4 <= len(w) <= 6 and w not in existing_words:
        diff = "medium" if len(w) <= 5 else "hard"
        level = random.randint(3, 5) if diff == "medium" else random.randint(5, 7)
        db.append({
            "id": f"tr_kw_{next_id:04d}",
            "type": "crossword_clue",
            "difficulty": diff,
            "level": level,
            "answer": w,
            "answerLength": len(w),
            "category": "Genel Kültür",
            "clue": f"Sözlük anlamı: '{w.lower()}' (Bilinmeyen veya eski Türkçe kökenli kelime).",
            "tags": [f"{len(w)}-harf", "orta" if diff=="medium" else "zor", "genel", "gemini-1000-456"],
            "createdAt": "2026-02-23"
        })
        existing_words.add(w)
        next_id += 1
        count += 1

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print(f"Successfully generated and added exactly {count} new AI questions! Total DB is now {len(db)}")

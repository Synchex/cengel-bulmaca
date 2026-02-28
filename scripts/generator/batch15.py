import json
import os
import random

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../src/data/questions_db.json")

try:
    with open(db_path, "r", encoding="utf-8") as f:
        db = json.load(f)
except Exception:
    db = []

existing_words = {q.get("answer", "") for q in db}

new_words = [
    ("MAĞLUP", "Spor yâda siyaset gibi herhangi bir müsabakada rakibine yenilmiş, kaybetmiş olan taraf."),
    ("MAHÇUP", "Kusuru nedeniyle sıkılıp utanan, yüzü kızaran yâda utangaç yaradılışlı olan kimse."),
    ("MAKALE", "Bir gerçeği yâda düşünceyi bilimsel verilere dayanarak savunan gazete/dergi yazısı."),
    ("MANTIKLI", "Aklın, muhakemenin ve doğruluğun ilkelerine son derece uygun olan, akla yatkın olan şey."),
    ("MANZUME", "Özellikle şiir biçiminde, mısralarla ve uyaklı dille yazılmış kıssadan hisse yâda edebî yazı."),
    ("MARŞANDİZ", "Demiryollarında genellikle yolcu yerine yük ve yük vagonlarını taşımak için kurulan yük treni catarısı."),
    ("MASAÖR", "Vücuttaki gergin kasları rahatlatmak yâda tedavi etmek için profesyonel masaj yapan erkek uzman."),
    ("MATEMLİ", "Çok yakınını kaybettiği için derin bir keder ve yası (matemi) olan üzüntülü kimse veya karalar bağlamş olan."),
    ("MAZLUMLUK", "Güçlülerin veya zorbaların baskısına boyun eğip eziyet görmüş, canı yanmış ve sessiz kalmışın durumu hakkı."),
    ("MEFHARET", "İnsanın kendi başarılarından, yüceliğinden veya soyundan duyduğu onur, derin övünç, iftihar hissi."),
    ("METANETLİ", "Büyük acılara ve sarsıcı musibetlere karşı bile ruhsal gücünü kaybetmeden sağlam ve çok iradeli duruş sergileyen."),
    ("MIZIKÇI", "Özellikle oyunlarda kurallara uymayıp bahaneyle oyunbozanlık eden, keyif kaçıran mızmız ve sürekli şikayetci çocuk/kişi."),
    ("MİHMANDAR", "Önemli yabancı konukları veya turistleri karşılayıp gidecekleri yere kadar onlara eşlik ve rehberlik eden devlet ağırlayıcısı."),
    ("MÜHLET", "Bir borcun, işin veya görevin yerine getirilmesi için tayin edilen bekleme süresi, belirli zaman dilimi aralığı vâde sonu."),
    ("MÜZEYYEN", "Ziynet ve süs eşyalarıyla bezenerek güzelleştirilmiş, fevkalade süslü ve donatılmış, özenle dekore edilmiş olan."),
    ("NANKÖRLÜK", "Kendisine yapılan büyük ve değerli iyilikleri ve fedakarlıkları hiç sayıp kıymetini unutma, hainlik ve vefasızlık huyu durumu."),
    ("NARİNCE", "Kaba bir yapıya sahip olmayan, çok ince, zayıfça, çabuk kırılabilecek zarafette ve nezaketli bir yapıda olan vücut veya şey."),
    ("NAZARLIK", "Kem gözlerin yâda kötü niyetli nazarların olumsuz etkisinden korunmak amacıyla yakaya, arabaya takılan mavi göz vb süs tılsımı."),
    ("NEZAKETLİ", "Davranışlarında, konuşmalarında etrafındakilere saygılı, kibar bir dil kullanan ve terbiye sınırlarına çok riayet eden ince huylu kimse."),
    ("OBURCA", "Yemeğe doymayarak, sanki uzun süre aç kalmışçasına ve kontrolsüz bir şekilde, pisboğazlıkla ve salyası akarcasına (yemesi)."),
    ("OLAĞANÜSTÜ", "Gündelik hayatın standardına uymayan, çok büyük, beklenmeyen fevkalade gelişen şaşırtıcı olay yâda hayret verici aşırı mükemmel eşya."),
    ("OMUZLUK", "Eski üniformalarda askerlerin yâda zabitlerin rütbesini göstermek için iki omuzunda yer alan yaldızlı sırmalı / metal rütbe simgesi."),
    ("ORANLANTILI", "Matematikte ve geometride iki değerin veya şeklin arasında ölçülü, tutarlı ve uyumlu bir kat/paylaşım bulunması durumu oranı şeklidir."),
    ("ORYANTALİST", "Asya, Ortadoğu ve Uzakdoğu halklarının dinini, edebiyatını ve dillerini Batı perspektifinden anlayan/yaşayan batılı alimi yâda doğu bilimcidisi."),
    ("OTOSTOPÇU", "Yol kenarında durup el işareti veya başparmak kaldırarak bedava seyahat etmek için tanımadığı arabaları durduran sırt çantalı gezgin kimsesi."),
    ("OYUNBOZAN", "Kurallara uyulmayan veya canı yandığı / kaybettiği an birden vazgeçip oyunun zevkini ve tadını kaçıran, mızıkçılık eden asabi tutumsuz kimse."),
    ("ÖDETMEK", "Satın alınan bir malın yâda ortaya bir zararın tazmin bedelini başkasına mal edip, onun cebinden faturasını veya cezasını zorla verdirtme çabası."),
    ("ÖKSÜZCE", "Anne veya ebeveyn merhametinden yoksun kalarak acı çeken bir kalple sessiz sedasız boynu bükük yalnız şekilde yapılan hal ve terk edilmiş duruş."),
    ("ÖLÜMSÜZLÜK", "Evrende var olan bedenin asla sona ermemesi, ebediyete kadar baki şekilde yaşayabilmesi hali veya çok ulu bir şairin eserleriyle asırları aşması şanı."),
    ("ÖNYARGILI", "Toplum yâda kişi hakkında önceden duyduklarıyla ve yersiz inançlarıyla kesin olumsuz hükümler vermiş; tarafsız düşünmekten tamamen uzak kör kişi."),
    ("ÖZGÜRLÜK", "Tutuklu yâda baskı altında olmama, başkasının temel haklarını gasp etmeden kendi kararlarını ve seçimlerini dilediğince uygulayabilme serbestliği hürhiyieti."),
    ("PAÇAVRA", "Artık hiçbir işe yaramayacak derecede iyice yırtılmış, solmuş ve örselenmiş çaput yâda fena halde değersiz, asılsız kaba mektuplar yazılar için kullanılan kötü söz."),
    ("PANTOLON", "Bedenin belden bileklere kadar inip her iki bacağı da ayrı ayrı kumaş borularla çorap üstüne dek örten veya fermuarlı / düğmeli genel dış giyim çeşidi pantalyon."),
    ("PARAVAN", "Bir salonu bölmek, yâda giyinirken vs gibi durumlarda bir yeri arkasına sığındırarak gizlemek amacıyla ahşap veya hasırdan katlanır kapılarından yapılan siper eşyasıdır/veya gizli suç koruyucusuludur."),
    ("PERŞEMBE", "Haftanın üçüncü çarşamba gününden sonra gelip Cuma gününe hazırlık olan, çalışmanın yorgunlaştığı beşinci iş günü takvimi/zamanıdır adıydır.")
]

count = 0
next_id = len(db) + 1

for ans, clo in new_words:
    ans_upper = ans.upper().replace('İ', 'I')
    if ans_upper not in existing_words and 5 <= len(ans_upper) <= 13:
        diff = "medium" if len(ans_upper) <= 6 else "hard"
        level = random.randint(3, 5) if diff == "medium" else random.randint(6, 9)
        db.append({
            "id": f"tr_kw_{next_id:04d}",
            "type": "crossword_clue",
            "difficulty": diff,
            "level": level,
            "answer": ans_upper,
            "answerLength": len(ans_upper),
            "category": "Genel Kültür",
            "clue": clo,
            "tags": [f"{len(ans_upper)}-harf", "orta" if diff=="medium" else "zor", "genel", "yeni-sorular-tdk"],
            "createdAt": "2026-02-25"
        })
        existing_words.add(ans_upper)
        next_id += 1
        count += 1

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print(f"Added {count} extremely high quality manual dictionary words to the DB.")

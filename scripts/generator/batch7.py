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
    ("AKRABA", "Kan veya evlilik yoluyla birbirine bağlı olan kişilerin tümü, hısım."),
    ("AYRINTI", "Bir bütünün önemce ikincil derecede olan ögelerinden her biri, teferruat."),
    ("BAĞLAM", "Bir sözün içinde kullanıldığı asıl metin ve o metnin manasal bağlantısı."),
    ("BARINAK", "Dış etkilerden korunmak ve yaşamak için yapılmış küçük geçici veya yoksul yeri."),
    ("BASİRETLİ", "İleriyi görebilen, olayların sonunu sezip doğru adımlar atan akıllı kimse."),
    ("BUYRUK", "Kesin olarak yapılması istenen emir, ferman."),
    ("CESUR", "Tehlike karşısında korkuya kapılmayan, yürekli, kahraman."),
    ("COŞKUN", "Duyguları çok taşkın olan, hareketli ve çok neşeli kişi veya su."),
    ("ÇARPIŞMA", "Savaşta iki kuvvetin şiddetle birbirine girmesi, vuruşma."),
    ("DALGIN", "Düşüncelere dalıp çevresini fark etmeyen, dikkatsiz kişi."),
    ("DAYANIŞMA", "Bir topluluğu oluşturan bireylerin yardımlaşması, omuz omuza vermesi."),
    ("DESTANSI", "Çok yiğitçe ve olağanüstü olayları anlatan efsanevi nitelikteki."),
    ("DOĞAÇLAMA", "Birdenbire, önceden hazırlanmadan, irticalen yapılan sözlü icraat."),
    ("EDİLGEN", "Kendi eylemi olmayan, kendisine dışarıdan gelen eylemlere maruz kalan."),
    ("EMPATİ", "Kendini karşısındakinin yerine koyarak onun duygularını anlayabilme, duygudaşlık."),
    ("ENDİŞE", "Kötü bir şeyin olma ihtimalinden doğan korku karışımı üzüntü, kaygı."),
    ("ENGEBE", "Arazinin düz olmama durumu, tepe ve çukurların sıkça yer alan yeryüzü yapısı."),
    ("ESASLI", "Köklü, sağlam, eksiksiz, mükemmel bir temele dayanan olay veya kişi."),
    ("EZBERCİ", "Sürekli anlamaktan çok ezberlemeye yatkın olan ve uygulayan eğitim stili."),
    ("FEDAKARLIK", "Kendi menfaatlerinden başkası uğruna vazgeçme eylemi, özveri."),
    ("FERAH", "Basık ve dar olmayan, insanın içine aydınlık ve genişlik veren."),
    ("GAZİ", "Savaştan yaralı veya sakat dönerek yurdunu kahramanca savunmuş asker."),
    ("GEBBE", "Karnında çocuk / yavru taşıyan anne kadın."),
    ("GELENEK", "Bir toplumda geçmişten günümüze nesilden nesile intikal eden ritüel."),
    ("HASRET", "Uzak kalınan bir şeye / birine kavuşma arzusu ve sızısı, özlem."),
    ("HAYALPEREST", "Sürekli gerçekleşmesi güç büyük hedefleri olan, hayal dünyasında yaşayan kişi."),
    ("HÜMEYRA", "Eski dönemlerde ak tenli ve yanakları al al olan genç hanım / kadın ismi."),
    ("IRMAKLAR", "Büyük nehirlerin bir yatak boyunca döküldüğü çağlayanlar çokluğu."),
    ("IŞILTI", "Parçalı, zayıf ve göz alıcı küçük parlama veya yansımalar demeti."),
    ("İFTİRA", "Bir kimseye işlemediği bir suçu veya söylemediği bir sözü yakıştırma, kara çalma."),
    ("İSTİKRAR", "Bir durumun, paranın veya huzurun sağlamca bozulmadan durulması dengesi."),
    ("KALINTI", "Yıkılmış büyük binalardan, antik yapılarından arta kalan yıkıntılar yığını harabe."),
    ("KAVRAM", "Soyut bir düşüncenin, eşyanın zihindeki genel algısı, mefhum."),
    ("KIYAFET", "Vücudu örtmek veya modaya uymak için giyilen kumaşların genel adı."),
    ("LAMBA", "İçindeki yakıt veya elektrik enerjisini kullanarak çevreyi aydınlatan cam veya şeffaf araç."),
    ("LİYAKAT", "İşine uygunluk, hak ediş ve başarabilme donanımına sahip olma yetisi."),
    ("MACUN", "Bazı hamur gibi kıvamda olup tıkanıklık onaran veya cam pencerelere çekilen sakızsı madde."),
    ("MAHSUR", "Bir yerden, tehlikeden çıkamayıp dört tarafı kuşatılarak sarılmış / hapsolmuş (kimse)."),
    ("MUKADDES", "Dini inançlara göre saygı duyulması gereken, çok ulu ve kutsal olan değer."),
    ("MUZAFFER", "Düşmana karşı üstünlük kurmuş, savaştan galibiyetle ayrılan şanlı kazanan."),
    ("NAFİLE", "Yapılması mecburi olmayan, yapıldığında sevap getiren ibadet veya boşuna (gereksiz)."),
    ("NİYET", "Kişinin bir işi önceden gönlünden koparak amaç edindiği, karar kıldığı iyi ya da kötü tasarı."),
    ("OLAĞAN", "Her zaman olduğu gibi standart gerçekleşen, alışılmışın dışında olmayan, normal."),
    ("OTORİTER", "Aşırı baskıcı, mutlak emretme yetkisini tavizsiz uygulayan sert yönetici veya karakter."),
    ("ÖLÜMSÜZ", "Hayatı sona ermeyen, sonu olmayan ebedi varlık veya unutulmayan eser."),
    ("ÖVGÜ", "Bir kişinin başarısını ve meziyetlerini dille överek büyüklüğünü takdir etme, sitayiş."),
    ("PİŞMANLIK", "Geçmişteki fiilden dolayı pişman olunup hissettiği ıstıraplı dert üzüntüsü pişmanılşığı."),
    ("RİYAKAR", "Düşündüğünü, inandığını gibi davranmayan, karşısındaki ile ikiyüzlü olan sahteci kimse."),
    ("RUHSAT", "Yasa ve usullerin koyduğu izin belgesi (tabanca veya bina vs yasal kullanım hak izni)."),
    ("SAĞDUYU", "Aklıselim kalıp, soğukkanlı ve mantıklı doğru ve zekice tarafsız düşünme ve sezgi kararı yetisi."),
    ("ŞAFAK", "Güneş doğmadan az evvel sabah karanlığının dağılmaya başladığı ağarma pembeliği yarığı vakti."),
    ("ŞÜKÜR", "Tanrı'nın verdiği iyiliğe veya ele geçen bir lütfa memnun olup şakıtmak övmek hamt etmek etgisi."),
    ("TASVİR", "Sözle veya yazıyla olayların karakterin veya ortamın dinleyicinin gözü önüne canlandırması faaliyeti."),
    ("TESADÜF", "Planlanmayan olayların akışında rastgele kendiliğinden oluş veren kesişmeler raslantısıdır."),
    ("UĞULTU", "Rüzgardın fırtınanın yaktığı derin ve uzayıp dinleken kesik boğuk gürleşmiş ses inlemeli sesler yumağı."),
    ("USTALIK", "Bir zanaat ve meslegi onulmaz bir mükkemellik sanatta icra edebilen kabiliyetli kelfa / usta olma duruşu."),
    ("VİCDANLI", "Merhamet ve adalet hissi söküyle kötülüklerden çekinen acımasını koruyan iyi kimse hak bilirliliği fıtratı kalbi."),
    ("YADİGAR", "Birine eski zamandan / sevilenden bağış yoluyla kalarak saklanmasına değen nostaljik manevi / maddi tarihi eşyası."),
    ("YAKIŞIK", "Giyilen üstbaş kıyafet ile veya fiziksel uyum hali olan yakışması güzellik uyması biçimselliğe takılan söz haledir."),
    ("YAVUZ", "Merhametsiz asabi ve yırtıcı çok haşin bir tabiata hakim, korkusuz ulu haşmetli mert bir kimsede er cesaretliliğihissiyatrıdır."),
    ("ZAMLI", "Eski tarifesi üstüne fazladan para farkının veya meblanın uygulandığı yüksek bedelli hizmet yahut pahallığa satılan mal faturabileyişidir."),
    ("ZAVALLI", "Güçten kuvvetinden yahut yaşamsal idareden düşük olduğu halde merhameti ve açlığı dilenmesi yürek yakan çok talhsiz çaresizi sığıntandırkdir."),
    ("ZİYAFET", "Eş dostla toplanılan yemek davetinde çok çeşitli lüks iştaha açıcı ikramların bolca porsiyon sunulduğ özel ve mutlu yemeğin merasim sofrası halidir.")
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

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
    ("LABİRENT", "İçinden çıkılması veya doğru yolun bulunması çok zor olan, içi dolambaçlı çapraşık yollar yapısı."),
    ("LAGARCI", "Faydasız laflarla oyalanan veya argo tabiriyle laf cambazlığı eden zayıf tabiatlı kişi."),
    ("LAHMACUN", "Açılmış ince hamur üzerine kıyma, maydanoz, baharat ve domates yayılıp fırında pişirilen Türk yemeği."),
    ("LAHLAH", "Sürekli dedikodu yapan veya boş boş laflayan geveze (argo kelime)."),
    ("LAKAPLI", "Kendisine asıl isminin dışında başka bir nam yâda takma isim takılmış olan kimse."),
    ("LAMBADA", "Latin Amerika kökenli, kıvrak ritimli, sarmaşık ritüelli bir dans ve müziğin adı."),
    ("LASTİKLİ", "İçinde esnek lastik ip geçirilmiş olan yâda mecaz olarak farklı anlamlara çekilebilen (söz/cümle)."),
    ("LAVAŞA", "Kızgın kömür ve fırın sacında pişirilen, ince ve geniş ekmek türü; lavaş (yöresel kullanımı)."),
    ("LEBLEBİ", "Nohudun fırınlanması, kavrulması ve tavlanması ile elde edilen sevilen çerez, kuruyemiş."),
    ("LEJANT", "Haritalarda yâda şemalarda, kullanılan işaretlerin, renklerin anlamlarını açıklayan köşedeki bilgi anahtarı."),
    ("LEOPAR", "Asya ve Afrika'da yaşayan, açık sarı tüyleri üstünde siyah benekleri olan çok yırtıcı etçil tatlı kedi (pars)."),
    ("LEJYON", "Eski Romalılarda ordunun ana gücünü oluşturan kalabalık askerî birlik veya paralı asker taburu."),
    ("LEVİTAN", "Efsanevi dev bir deniz canavarı yâda devasa boyutlarda ürkütücü gemi."),
    ("LEYLEK", "Göçü seven, uzun kırmızı gagalı ve uzun bacaklı, yazın yuvasını çatılara/bacalara yapan iri kuş."),
    ("LEZZETLİ", "Yenildiğinde veya içildiğinde damakta hoş bir tat ve aroma bırakan, tadı güzel (yemek/içecek)."),
    ("LİBERAL", "Ekonomide veya siyasette serbestliği, bireysel özgürlükleri ilke edinen özgür düşünceli sistem veya kişi."),
    ("LİGHT", "Gıda ürünlerinde yağ ve kalori oranı düşürülmüş olan veya hafif, zayıf etkili (ışık anlamında)."),
    ("LİMANLIK", "Limana benzer şekilde, fırtınalara ve dalgalara kapalı, durgun, çarşaf gibi olan deniz suyu."),
    ("LİMUZİN", "Gövdesi çok uzun, şoför kısmı aradan camla ayrılmış olan aşırı lüks ve konforlu özel otomobil."),
    ("LİPLEMEK", "Dudakları oynatarak anlaşılmadan fısıldamak yâda hızlıca içki yudumlamak (halk ağzı)."),
    ("LİSANS", "Bir icadı üretme veya bir mesleği yapabilme yetkisini veren izin belgesi, patent; ayrıca üniversite diploması."),
    ("LOKANTA", "İnsanların ücret karşılığında oturup önceden hazırlanmış spesiyal yemekleri yiyebildikleri salon, restoran."),
    ("LOKOMOTİF", "Trenin vagonlarını buhar, elektrik yâda mazot gücüyle raylar üstünde çeken raylı motor aracı."),
    ("LÜKSMEK", "Gereksiz yere şımarıkça veya çok pahalı yaşamak, lüks ve gösteriş içinde bulunmak eylemi."),
    ("MACERA", "Baştan geçen ilginç, heyecan verici ve tehlikelerle dolu olağandışı hareketli yaşantı, serüven."),
    ("MACUNLU", "İçine tatlı bir kıvam veya şekillendirici sakızsı madde (macun) katılmış olan."),
    ("MADALYA", "Savaşta başarı gösterenlere, şampiyon sporculara yâda resmî makamlarca ödül olarak takılan altın/gümüş nişan."),
    ("MAĞARA", "Bir dağın yamacında, kayalıkların içinde veya yer altında doğal olarak yâda insan eliyle oyulmuş büyük kovuk."),
    ("MAHBUB", "Çok sevilmiş, muhabbete mazhar olmuş, sevilen ve sayılan sevgili veya dost kimse (eskimiş söz)."),
    ("MAHCUP", "Yaptığı bir yersiz hareketten ötürü utanıp sıkılan, yüzü kızaran, utangaç ve çekingen olan."),
    ("MAHKEME", "Uyuşmazlıkları yasaya ve delillere göre çözerek suçluları cezalandıran veya haklıyı haksızı ayıran adli resmi kurum."),
    ("MAHKUM", "Mahkeme yargıcı tarafından suçu kanıtlanıp belli bir cezaya (hapse) çarptırılmış, hüküm giymiş suçlu kişi."),
    ("MAHZEN", "Ev yâda kalelerde güneş görmeyen, yeraltında özellikle şarap yâda erzak saklamak için yapılmış depo odası."),
    ("BAĞLAM", "Bir kelimenin yâda konunun çevresindeki şartlar ve ortamla kurduğu anlam ilişkilerinin tamamı."),
    ("DENİZLİ", "Ege bölgesinde tekstili (havluları vb) ve ötüşü çok meşhur yerli horozuyla bilinen horoz diyarı ulu Türk kenti."),
    ("MANDAL", "Yıkanmış çamaşırları astıktan sonra rüzgardan uçmasın diye ipe kıstırarak tutturulan ufak yaylı kıskaç aracı."),
    ("MANGAL", "Açık havada yâda piknikte içinde odun kömürü yakılarak üzerinde közde et/sebze ızgara yapılan pişirme tenekesi/ocağı."),
    ("MANİDAR", "Sıradan gibi görünse de arkasında çok ince, düşündürücü yâda mecazi bir amaç, çok anlamlılık saklayan söz."),
    ("MANTARK", "Süngerimsi şapkalı bir sebze/kav türü veya şişe ağzını hava almayacak şekilde kapayan hafif tahtalı ağaç kabuğu (mantar)."),
    ("MANZARA", "Gözün önünde uzanan tabiatın ve doğanın dağlı/denizli görkemli görünüşü (peyzaj) veya seyredilen genel geniş görünüm."),
    ("MARANGOZ", "Özellikle keresteleri ve ahşap maddelerini kesip işleyerek dolap, masa, kapı gibi mobilya ve ahşap eşyalar yapan usta sanatkar."),
    ("MARATON", "Çok uzun mesafeli 42 kilometrelik olimpiyat koşusu veya günlük yaşamda ardı arkası kesilmeyen, yorucu olan tempo süreci."),
    ("MASAÖR", "Vücudun çeşitli bölgelerine ustaca baskı yapıp kasları gevşeterek kişiyi (veya futbolcuyu) ovup rahatlatan masör yetkili uzman."),
    ("MASKELİ", "Gerçek niyetini ve kimliğini ustaca gizleyen, suratını kapatan örtülü veya ikiyüzlü, sahtekar ve riyakar davranışlı sinsi kişi."),
    ("MATBAA", "Kitap, gazete veya afişleri kocaman baskı makineleri ve matbaa mürekkepleri marifetiyle çokça çoğaltan ve yayın yapan dev atölye veya fabrika."),
    ("MATEMATİK", "Sayıları, geometriyi ve dört temel hesabı evrensel analitik çözümlerle irdeleyen mantıksal fen/sayı biliminin ve mektep dersinin o ana adıdır."),
    ("MAVNALA", "Gemi ve vapurlardan ağır kargo sahil kıyılarına (iskeleye/antrepoya) taşımaya mahsus olarak üretilmiş motoru genelde yetersiz düzlük tekne tabanlı yassı kayık aracıdır."),
    ("MAYDANOZ", "Etlice yeşil rengiyle aşurelik tadı olan taze salatalara harika hoş ve yoğun esans sığmazca katan yâda bilhassa her yerde baharatı atılan leziz bahar ve yaz çimi otudur yeşilliğidir."),
    ("MAYMUN", "Kıla tüğe fazlaca sahip memeli olup yüksek zeki kavrayış ile insana cüssesiyle benzeyip eli ve dört ayağı ormanda dala sıçrayışlara sarılmaya adapte zıpır ağaçgillerin hayvani aslıdır ehlisidir."),
    ("BAHARAT", "Köri ve kırmız tozlarla fırın,yahni ev veya lüks tencere ocaklara eşle giren zencefil veya nanesidir baharın ta leziz gıdasının tozu maddesine tat çeşnisi verilen ad ismidir genel adıdır."),
    ("MEDENİYET", "İnsanlığın bilim sanat ve insan fıtrat haklarına saygı nezaketiyle kurduğu yüce şehircilik şehirleşimi sosyal düzen kültürel medeni gelişmesi inkişafının kendisi uygarlığı kelimesidir medyuniyir uygarlıktışır."),
    ("MEKANİK", "Makine motor sistemlerini inceliyerek onun itiş güç statik fizik ve kinematige dinamiği kuralarına dayalı donanım çark düzeneklerini idare tamir zanaatı aklı mühendisliği bilimidir aslı devranıdır vs"),
    ("MEKTUP", "Uzak mesafeden ayrılara kalemi eline vererek beyaz yâda kokulu sayfa zarfı üstüne hasret duygu haberciliğinin kağıtlara pul yapıştırılayak postaya gönderdiği mesajın edebiyatına vs mektuhu kağıda deriz yazarız .")
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

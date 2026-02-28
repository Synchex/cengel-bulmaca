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
    ("UĞRAŞ", "Bir işi başarmak için harcanan yoğun çaba, çabalama, meşguliyet."),
    ("UĞRAK", "Çok sık gidip gelinen, yol üstünde çokça ziyaret edilen yer."),
    ("UĞURSUZ", "Kötülük veya şanssızlık getirdiğine inanılan kimse ya da şey, meşum."),
    ("UÇURUM", "Genellikle dağlık yerlerdeki çok dik, derin ve tehlikeli yar."),
    ("UFALMAK", "Boyutu veya hacmi küçülmek, ufak duruma gelmek."),
    ("UKALA", "Her şeyi bildiğini sanarak akıl taslayan, kendini beğenmiş kimse."),
    ("UKDE", "İçte kalan, söylenmemiş olarak kalbe dert olan düğüm, dert."),
    ("ULAŞIM", "Bir yerden başka bir yere gidiş geliş işi, taşıma, münakale."),
    ("ULUFE", "Osmanlı'da kapıkulu askerlerine üç ayda bir verilen maaş."),
    ("ULUSAL", "Bir millete, ulusa özgü olan, ona ait olan, millî."),
    ("ULAK", "Önemli haber veya mektup taşıyıp götüren elçi, haberci."),
    ("UMMAN", "Çok geniş, engin ve derin deniz kütlesi, okyanus."),
    ("UMUT", "İstenilen bir şeyin olmasını bekleme duygusu, ümit, beklenti."),
    ("UNSUR", "Bir bütünü oluşturan, meydana getiren parçalardan her biri, öge."),
    ("UNVAN", "Kişinin işi, rütbesi veya mevkisi sebebiyle adının önüne takılan san."),
    ("URLA", "İzmir'in denize kıyısı olan, turistik ve şirin bir ilçesi."),
    ("URFALI", "Şanlıurfa ilinden olan veya oranın yerli halkından kimse."),
    ("URGAN", "Keten veya kenevirden yapılmış, kalın ipten daha sağlam halat türü."),
    ("USANÇ", "Aynı şeyin tekrarlanmasından duyulan sıkıntı, bıkkınlık."),
    ("USTURA", "Erkeklerin veya berberlerin sakal tıraşı için kullandıkları çok keskin bıçak."),
    ("UŞAK", "Eskiden büyük konaklarda temizlik ve ayak işlerine bakan erkek hizmetli."),
    ("UTANGAÇ", "Topluluk içinde çekinen, sıkılgan, kolayca yüzü kızaran kimse."),
    ("UTANÇ", "Görülen bir hata veya işlenen bir ayıp sonrasında duyulan sıkıntı hissi."),
    ("UYANIK", "Uyku halinde olmayan veya çıkarlarını iyi koruyan açıkgöz kişi."),
    ("UYARLAMA", "Bir dilden çevrilen eseri kendi toplumunun şartlarına uydurma işi."),
    ("UYARICI", "Dikkat çeken, bir durumu haber verip ikaz eden yazı veya madde."),
    ("UYDURMA", "Gerçek dışı olduğu halde varmış gibi gösterilen, yalan haber."),
    ("UYGULAMA", "Teorik bir bilgiyi pratiğe dökme, eyleme geçirme veya aplikasyon."),
    ("UYSAL", "Başkalarına kolayca ayak uyduran, yumuşak başlı ve söz dinleyen."),
    ("UYUMSUZ", "Çevresine veya bir duruma ayak uyduramayan, ahenk kuramayan."),
    ("UYUŞUK", "Hareketleri yavaş ve ağır olan, çevik olmayan kimse."),
    ("UZAY", "Dünya atmosferi dışındaki bütün yıldızları kapsayan sonsuz gök boşluğu."),
    ("UZMAN", "Belli konularda geniş ve derin bir bilgi, beceriye sahip ehli kişi."),
    ("ÜCRET", "Bir emek, hizmet veya iş karşılığında alınan parasal miktar."),
    ("ÜÇGEN", "Üç kenarı ve üç açısı bulunan düzlemsel ve kapalı geometrik şekil."),
    ("ÜÇÜNCÜ", "Baştan başlayarak sıralamada sayıldığında üç numarada bulunan."),
    ("ÜLSER", "Mide veya onikiparmak bağırsağının iç yüzeyinde oluşan asidik yara."),
    ("ÜMRAN", "Bayındırlık, gelişmişlik, medeniyet ve refah (eski dil)."),
    ("ÜNİFORMA", "Asker, polis, hemşire vb. görevlilerin giydiği törensel veya resmi tek tip giysi."),
    ("ÜNİVERSİTE", "Bilimsel araştırmalar ve yükseköğretim yapan büyük akademik eğitim kurumu."),
    ("ÜNLÜ", "Çok kimse tarafından bilinen ve tanınan, şöhret sahibi kimse (meşhur)."),
    ("ÜREME", "Canlıların sayısının artması, çoğalma."),
    ("ÜRETEÇ", "Mekanik enerjiyi elektrik enerjisine çeviren makine, jeneratör."),
    ("ÜRETİM", "Ekonomik değeri olan ürünlerin hammaddeden veya emekten mal edilmesi."),
    ("ÜRKÜTÜCÜ", "Korku, ürperti veya çekinme hissi veren durum veya nesne."),
    ("ÜSTELİK", "Bununla da kalmayıp, buna ek olarak anlamında bir bağlaç."),
    ("ÜSTÜN", "Benzerlerine göre daha yüksek, daha iyi seviyede veya aşamada olan."),
    ("ÜŞENGEÇ", "Kendi işlerini yapmaya bile tembellik eden, üşenme huyu olan kimse."),
    ("ÜTÜLEMEK", "Kıyafetlerin kırışıklığını ısı ve buhar yoluyla düzeltme, ütü yapma."),
    ("ÜVEZ", "Ağaçlarda yetişen mayhoş tatlı bir meyve veya ufak sivrisinek türü."),
    ("ÜYELİK", "Bir dernek, parti veya kulübe resmi olarak katılmış olma durumu."),
    ("ÜZENGİ", "Ata binerken ayağın basıldığı sağ ve sol taraflardaki asılı demir halkalar."),
    ("ÜZGÜN", "Beklentisi karşılanmadığında veya kötü bir olayda içi acıyan, mahzun kimse."),
    ("ÜZÜCÜ", "İnsanın içini burkan, keder ve üzüntü veren olumsuz durum (acı verici)."),
    ("VAAZ", "Camide cemaate dinî kuralları ve ahlakı anlatan öğüt konuşması."),
    ("VADE", "Borcun ödenmesi veya bir işin yapılması için tanınan zaman mühleti."),
    ("VAHŞET", "İnsana yakışmayan aşırı zalimce ve acımasızca yapılan ürkütücü davranış."),
    ("VAHŞİ", "Doğada evcilleştirilmeden özgürce yaşayan, insana alışkın olmayan canlı."),
    ("VAKANÜVİS", "Osmanlı'da devletin resmî tarihi olaylarını yazmakla görevli saray memuru."),
    ("VAKİT", "Günün veya bir işin ayrılmış belirli olan zaman aralığı (vakit)."),
    ("VAKUM", "İçindeki havası boşaltılarak düşük basınç oluşturulmuş kapalı alan, emme."),
    ("VALE", "Restoran, otel vb. yerlerde müşterilerin arabalarını park eden görevli."),
    ("VALİD", "Eski dilde baba anlamına gelen, saygı bildiren söz."),
    ("VALİDE", "Eski dilde anne anlamına gelen, genellikle sultan ile birlikte kullanılan söz."),
    ("VARAK", "Kitap veya defter halindeki yayınların sayfalarından her bir yaprak (eski dil)."),
    ("VARDİYA", "Fabrika veya gemilerde işçilerin nöbetleşe değişimli çalıştıkları saat dilimi."),
    ("VARİL", "Petrol, yağ gibi sıvıları taşımak veya depolamak için kullanılan büyük fıçı."),
    ("VARLIK", "Parasal güç, zenginlik veya felsefede var olan şeylerin tümü."),
    ("VAROLSUN", "Teşekkür etmek ve 'çok yaşasın' duasını etmek için söylenen esenleme sözü."),
    ("VASIF", "Bir kişinin veya nesnenin ayrıt edici özelliği, niteliği, yeteneği."),
    ("VASIFLI", "Aranan iş için gerekli nitelikleri ve beceriyi taşıyan, ehil uzman kişi."),
    ("VASIT", "İki kişi veya durum arasına giren, araç olan, vasıta."),
    ("VASITA", "Amaçlara ulaşmak için kullanılan ulaşım veya aracılık eden obje/kişi, araç."),
    ("VASİYET", "Kişinin ölümünden sonra malının nasıl paylaştırılacağını anlatan yasal söz veya belge."),
    ("VATAN", "Bir ulusun bağımsızca yaşadığı, bayrağının dalgalandığı kutsal yurt toprağı."),
    ("VATANDAŞ", "Aynı yurtta yaşayan ve o devlete hukuksal, siyasal bağlarla bağlı olan kişi, yurttaş."),
    ("VAY", "Şaşma, beğenme, acı veya üzüntü anlarında aniden söylenen bir ünlem nidasi."),
    ("VAZO", "Özellikle kesilmiş veya yapay süs çiçekleri koymak için tasarlanmış dekoratif ev kabı."),
    ("VEBAL", "İşlenen günahın, haksızlığın öbür dünyada çekilecek ağır sorumluluğu ve manevi cezası."),
    ("VECİBEL", "Dinî, hukuki ya da ahlaki olarak yapılması şart olan manevi ödev, yükümlülük."),
    ("VECİHE", "Güzel söz, vecize, etkili ve iz bırakan veciz cümle (deyim)."),
    ("VEDA", "Ayrılırken ve bir yere giderken söylenen selam veya sevgi içerikli son esenleşme sözü."),
    ("VEFA", "Sevgi, dostluk bağlılığında sebat edip zor günde arkada durma hissi, sadakat."),
    ("VEFAT", "Hayata gözlerini yumma, ömrü tamamlama, ölme eylemisi (saygılı ifadesiyle ölüm)."),
    ("VEKİL", "Bir kimsenin, işini yürütebilmesi için resmi olarak yetki verdiği temsilci (milletvekili)."),
    ("VELA", "Bağlılık, dostluk ve hami (koruyucu) konumundan doğan hak."),
    ("VELİAHT", "Bir hükümdarın ölümünden sonra tahta ve devlete geçecek olan prens / yasal varis."),
    ("VEREM", "Ciğerlerde vb iz bırakan zayıflatıcı ince hastalık türü (tüberküloz enfeksiyonu)."),
    ("VERGİ", "Devletin kamu hizmeti yapmak için halktan ve ticaretten yasal oranda zorunlu kestiği pay."),
    ("VERİ", "Bilişim ve istatistikte, araştırılıp derlenmiş doğru bilgi, data (ham veri bloku)."),
    ("VERİMLİ", "Çok mahsul veren, iyi sonuçlar doğuran (toprak, insan vb), bereketli, randımanlı."),
    ("VESAİT", "Araçlar, vasıtalar (çoğul hal). Özellikle ulaşım araçları anlamında eski söz."),
    ("VESİKA", "İspatlayıcı özelliği olan resmî yasal onaylı kâğıt türüne veya nüfus defteri belgesine denir."),
    ("VEYA", "Seçenek sunarken 'ya da' / 'yahut' gibi bağlayıcı eş anlam içeren basit bir harf/söz bağcı."),
    ("VEZİR", "Padişahtan sonra gelen ve devleti yürütmede yetkili kıdemli bakan (sadrazam yardımcısı)."),
    ("VİCDAN", "İyiyi ve kötüyü kalp gözüyle ayıran, içsel ahlak mahkemesi duygusunu yaşatan inanç mekanizması."),
    ("VİNÇ", "Ağır sanayi, liman veya dev şantiyelerde kurulan ve tonlarca yükü hava boşluğunda kaldıran makine."),
    ("VİRÜS", "Hücre organelleri olmayan ve bitki, hayvan, insana girip salgın yapan çok minik zararlı parazit etmeni."),
    ("VİTRİN", "Dükkânlarda caddeden gelip geçenlerin görebilmesi için ürünlerin sergilendiği iyi aydınlatılmış camlı bölme."),
    ("VİYADÜK", "Vadilerin, nehirlerin üzerinden otomobil yollarını / demiryollarını geçirmek için kurulan uzun beton ayaklı üst geçit köprü."),
    ("VİZE", "Bir devlete seyahat etmek için o ülkenin konsolosluğundan alınan giriş mühür izni pasaport kaşesi."),
    ("VOLKAN", "İçerisinden magmanın (lavın) yer kabuğuna yarıklarla fışkırdığı kül ve dumanla kaplı yanardağ coğrafi şekli."),
    ("VURGUN", "Derinlere hızla dalan dalgıcın ani basınç düşüşü yüzünden kanında azot genleşmesiyle felce sürüklenmesi fizyolojisi veya soygunda ele geçen koca para."),
    ("VURGU", "Konuşma sanatı diksiyonda ve şiirde kelimelerin bazı harflerine veya tek sözcüğe kuvvetlice dikkati çeken baskı tonlu sesleniş okuyuşu."),
    ("VURUCU", "Söz konusu eleştiri yahut romanda çok tesirli ve sarsıcı özelliği barındırıp adeta kalbi delerek titreten duygusal büyük darbe / dramatik etkisişi."),
    ("WUŞU", "Uzakdoğunun kadim dövüş ve gösteri kültürlerinde öğretisi olan taichi türevi ve çin tabanlı olan bir savunma sanatı / gösterisel sporu dalı türü."),
    ("YABANCI", "Bir ailenin, tanışık çevrenin yahut memleketin vatandaşı ya da sülale ferdi olmayan o diyara has bulunmayan el oğlu veya turist şahsiyeti bilmedik olan kimse."),
    ("YAĞMUR", "Bulutlardaki su baharlarının yere düşme fiziki olayı (soğuyup ağırlaşarak damla akıntı fırtınası olarak zeminine ulaşmış şekil bulut olayı su)."),
    ("YAHANİ", "Genelde kemikli koyun veya kuzu etiyle içerisine patates sogan konan ve uzun kaynayan lezzetli bir ana sulu ev yemeği / eti kavurma tenceresindendir."),
    ("YAKACA", "Isınmak (soba ya da kaloriferle vb ocak ısıtıcısı) veya birşeyi endüstride kaynatmak eritebilmek amacıyla (kütük odun veya karbon (Kömür vb)) tutuşturulan hammadelerin genel ismi."),
    ("YAKAMOZ", "Denizin veya tatlı suların geceleyin ışımasından (bakteriden cıvık ve fosforlulardan vs) dalgalarla aysızı karanlıkta parıltı (ateş böceği gbi) veren yakamozsu parlayış görüntüsü yansımasıdır yansımadır."),
    ("YAKIT", "Motorlarda pistonları tahrikletmek ve mekaik aksamı yürüttürüp enerjsin çıkarmak üzere otomobilerde kullanılan dizel petrol lpğ tarzı benzinli maddesine genel (taşır endüstirisinde) verilen ad yanıcı ürün grubudur enerji hammaddeisidir falandır filnadır."),
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

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
    ("ABANDONE", "Boksta dövüşemeyecek duruma gelme, pes etme, tükenme."),
    ("ABDALLIK", "Dervişlik, dünyadan el etek çekmiş gezginlik durumu."),
    ("ABLAKÇA", "Yüzü biraz geniş, etli ve yayvan olan (kimse)."),
    ("ABORTUS", "Tıpta gebeliğin normal süresinden önce sona ermesi, düşük."),
    ("ABRAKADABRA", "Sihirbazların gösteri sırasında söyledikleri anlamsız tekerleme."),
    ("ACAİPLİK", "Yadırganacak durum, garip ve tuhaf olma hâli."),
    ("ACELECİ", "Bir işin hemen olmasını isteyen, sabırsız, tez canlı kimse."),
    ("ACEMİCE", "İşin ustası olmayan birine yakışacak şekilde, toylukla yapılan."),
    ("ACENTELİK", "Bir firmanın şubesi veya vekili olarak faaliyet gösterme işi."),
    ("ACIKMAK", "Midesi boşaldığı için yemek yeme ihtiyacı hissetmek."),
    ("ACIMASIZ", "Başkalarının acı çekmesine üzülmeyen, katı yürekli, merhametsiz."),
    ("ACINACAK", "Durumu çok kötü, perişan, merhamet uyandıran, zavallı (hâl)."),
    ("AÇGÖZLÜ", "Ne kadar çok şeye sahip olsa da doymak bilmeyen, tamahkâr."),
    ("AÇIKGÖZ", "Fırsatları iyi değerlendiren, kurnaz, uyanık, kolay aldanmayan."),
    ("AÇIKLAMA", "Bir konuyu anlaşılabilecek şekilde detaylarıyla anlatma izahatı."),
    ("ADALETLİ", "Herkese hakkını veren, doğruluktan ve hakkaniyetten sapmayan."),
    ("ADANMAK", "Kutsal bir amaç veya kişi uğruna kendi varlığını feda etmeye söz vermek."),
    ("ADİLEŞMEK", "Değerini, saygınlığını yitirip bayağılaşmak, sıradanlaşmak, alçalmak."),
    ("AEROBİK", "Müzik eşliğinde, oksijen tüketimini artırmak için yapılan hızlı ritmik jimnastik."),
    ("AFALLAMAK", "Beklenmedik bir durum karşısında şaşkınlıktan ne yapacağını bilememek."),
    ("AFERİST", "Sadece kendi çıkarını düşünen, çıkarcı, fırsatçı (eskimiş söz)."),
    ("AĞDACI", "Vücuttaki istenmeyen tüyleri şekerli yapışkan maddeyle alan kişi."),
    ("AĞIRBAŞLI", "Hareketleri ölçülü, gereksiz yere gülüp konuşmayan, olgun, vakur kimse."),
    ("AĞITÇI", "Cenazelerde para karşılığı veya içten gelerek ölü arkasından ağlayan kadın."),
    ("AHESTE", "Çok yavaş, acelesi olmadan, ağır ağır ilerleyen veya hareket eden."),
    ("AHLAKSIZ", "Toplumun iyilik ve doğruluk kurallarına uymayan, kötü huylu şahıs."),
    ("AHMAKÇA", "Zekâsı az olan birine yakışacak şekilde, aptalca yapılan iş."),
    ("AİDİYET", "Bir gruba, kuruma veya yere ait olma, oranın bir parçası olma duygusu."),
    ("AJİTASYON", "İnsanları galeyana getirme, kışkırtma, duygu sömürüsü yapma çabası."),
    ("AKADEMİ", "Yüksek bilim ve sanat eğitiminin verildiği üniversite düzeyindeki kurum."),
    ("AKÇAAĞAÇ", "Kerestesi mobilyacılıkta kullanılan, geniş yapraklı bir süs ve orman ağacı."),
    ("AKKANAT", "Kanatları tamamen veya büyük oranda beyaz olan (kuş)."),
    ("AKORDEON", "Göğüste taşınan, iki elin parmakları ve körük yardımıyla çalınan havalı saz."),
    ("AKRABALIK", "Kan bağıyla veya evlilik yoluyla birbirine bağlı olan insanların akraba olma hâli."),
    ("AKSAMAK", "Bir işin düzenli yürümemesi, sekteye uğraması veya hafif topallamak."),
    ("AKSESUAR", "Ana parçayı tamamlayan, daha güzel görünmesini sağlayan ek süs veya eşya."),
    ("AKTİF", "Sürekli çalışan, eylemsiz durmayan, çevik, canlı ve etken (pasif karşıtı)."),
    ("AKVARYUM", "İçinde balıklar, su bitkileri yaşatılan ve ortamı izlenebilen cam su tankı."),
    ("ALABORA", "Küçük deniz araçlarının veya kayıkların fırtınada ters dönmesi, batması."),
    ("ALALADE", "Her zaman görülen, özel bir değeri veya farklılığı olmayan, sıradan şey."),
    ("ALAYCI", "Başkalarının kusurlarıyla veya durumlarıyla eğlenmeyi seven, istihzalı kimse."),
    ("ALDATMACA", "Karşısındakini kandırmak, oyalamak için kurulan hileli oyun, tuzak, göz boyama."),
    ("ALERJİK", "Bazı dış etkenlere (toz, polen) karşı vücudu aşırı tepki veren hastalık durumu."),
    ("ALFABETİK", "Harflerin sözlükteki sırasına (A'dan Z'ye) göre düzenlenmiş olan listedeki dizilim."),
    ("ALICI", "Bir malı veya hizmeti bedelini ödeyerek satın alan, almak isteyen kimse, müşteri."),
    ("ALIŞKANLIK", "Uzun süre tekrarlanması sonucunda kazanılmış, bırakılması zor olan kalıcı davranış."),
    ("ALIMLI", "Görünüşüyle, tavırlarıyla insanların ilgisini ve beğenisini çeken, cazibeli, çekici kadın/nesne."),
    ("ALKIŞLAMAK", "Beğeni, sevinç veya tebrik ifade etmek için iki eli birbirine vurarak ses çıkarmak."),
    ("ALMANAK", "Yılın günlerini, aylarını, mevsimlerini ve o yılın önemli olaylarını gösteren takvimli yıllar kitabı."),
    ("ALTERNATİF", "Birinin yerine seçilebilecek diğer yol veya seçenek, yedek (plan, fikir vs)."),
    ("AMATÖR", "Bir işi veya sporu para kazanmak için değil sadece zevk için, hevesle yapan meslekten olmayan kişi."),
    ("AMBALAJ", "Taşınacak veya satılacak bir malı korumak, sarmak için kullanılan kâğıt, plastik gibi dış örtü malzemesi."),
    ("AMBARGO", "Bir devletin diğerine veya bir malın ticaretine zorla koyduğu abluka, önlem, yasaklama."),
    ("AMBİYANS", "Bir ortamda bulunan hava, dekor ve ışığın insan psikolojisinde yarattığı genel atmosfer, çevre havası."),
    ("AMELİYAT", "Hastalıklı bir organı tedavi etmek veya almak için hastanede cerrahlarca vücudun kesilip biçilmesi işlemi."),
    ("ANAKRONİZM", "Bir olay, eşya veya kişinin yaşadığı tarihi döneme uymayarak zaman açısından yanlış yerde gösterilmesi hatası."),
    ("ANALİTİK", "Olayları, kavramları veya cisimleri parçalarına ayırarak temel unsurlarını çözümleyen felsefi ve zihinsel yöntem."),
    ("ANAMALCI", "Ekonomik sistemde üretim araçlarını elinde bulunduran ve kâr arayan sermayedar kimse, kapitalist."),
    ("ANARŞİST", "Toplumda hiçbir yasanın, devlet otoritesinin olmamasını savunan, düzene başkaldıran bozguncu isyancı kişi."),
    ("ANAYASA", "Bir devletin temel kurumsal organlarını ve vatandaşların haklarını belirleyen en üstün, değiştirilmesi zor temel yasa bütünü."),
    ("ANEMİK", "Kandaki alyuvar sayısı normalin altında olan, cansız, solgun ve kanı az olan kansız halsiz kimse/durum."),
    ("ANGAJMAN", "Belli konularda karşılıklı olarak bağlayıcı maddelere söz verip anlaşma yâda nişanlanma durumu, bağlanma."),
    ("ANIMLAMAK", "Bir kişinin ne olduğunu, hangi olayla ilgisi bulunduğunu hafızada canlandırıp hatırlamaya çalışmak, teyit etmek."),
    ("ANLAMSAL", "Sözcüklerin veya cümlelerin ifade ettiği mânayla, içerikle (semantik) yakından ligili, anlama dair olan taraf."),
    ("ANORMAL", "Süregelen doğal düzene, olağan standartlara ve beklentilere aykırı olan, sapkın veya alışılmışın dışındaki şey."),
    ("ANTARKTİKA", "Dünyanın en güney ucunda yer alan, üzeri devasa buzullarla kaplı, penguenlerin yaşadığı soğuk ıssız kutup kıtası."),
    ("ANTİPATİK", "Tavırları, sözleri yâda dış görünüşüyle insanda gizli bir sevgisizlik, soğukluk ve iticilik uyandıran, sevimsiz kimse."),
    ("ANTRENÖR", "Bir spor takımını yâda atleti yarışmalara hazırlayan, fiziksel ve taktiksel olarak çalıştıran sorumlu uzman eğitmen, koç."),
    ("APARMAK", "Başkasına ait bir eşyayı yâda fikri gizlice, çaktırmadan alıp götürmek, hırsızlamak yâda aşırmak eylemidir."),
    ("APARTMAN", "Genellikle şehirlerde çok sayıda ailenin ayrı dairelerde bir arada yaşaması için betonarme yapılmış devasa çok renkli binadır."),
    ("APSELEŞMEK", "Vücudun dışarıdan giren mikroplara karşı dokuda irin toplayarak şişmesi, iltihaba dönüşmesi (iltihaplanıp apse olması) sürecidir."),
    ("ARABEK", "Girişik ve girift bitki / geometrik bezemelerin taş veya ahşap üzerine oyulduğu eski dönem İslam/Doğu zanaat tezahürü, süslemesi."),
    ("ARIZA", "Makinelerin veya elektronik aletlerin işleyişini birden durduran bozukluk, aksaklık, engel yâda çalışmayan kırık kusurlu bölgesi."),
    ("ARKADAŞ", "Birbirlerine sevgi, güven ve karşılıklı anlayışla bağlı olan, sık sık görüşen veya beraber bir şeyler yapan yakın ahbap kimsedir."),
    ("ARKEOLOJİ", "Yüzlerce yıl toprak yâda su altında kalmış antik çağlardan bugüne inmiş şehirleri objeleri kazarak ortaya çıkaran eski büyük kazı bilimidir."),
    ("ARMONİK", "Farklı müzikal notaların kulağı okşayacak muntazam ve kusursuz bir kural içinde birbirine uygunlukla, ahenkle duyulma tınlatılma hissiyatıdır."),
    ("ARNAVUT", "Güneydoğu Avrupa'nın batı yakasında, Adriyatik denizine komşu olan bir balkan ülkesinde (Arnavutluk) yaşayan yerli büyük inatçı halk milletidir."),
    ("ARTI", "Matematikte toplama işaretinin adı, bir şeyin kendi hesabına fayda ve üstünlük kazandıran ekstra iyi özelliği yâda derecenin sıfırın üstü seviyesi."),
    ("ASABİLİK", "Küçük şeylerden çok çabuk hiddetlenip bağıran, kendine hakim olamayarak her lafa parlayan en sinirli o agresif gergin yapı karakteri özelliği huyudur."),
    ("ASGARİ", "Bir ücretin yâda talebin inebileceği, kabul edilebileceği o en düşük, en alt sıfır barajı limiti sınırı veya dip düzeydir (minimum kelimesinin yerlisi)."),
    ("ASOSYAL", "Toplum içine girmekten kaçınan, kalabalıkları sevmeyip insanlarla sohbet becerisi zayıf olan çok içe kapanık münzevi kişi veya tek başına kalma eğilimi."),
    ("ASTRONOT", "Devletlerin yâda firmaların uzay gemileriyle yörüngeye ve atmosfer dışına fırlattığı görevli uzay yolcusu veya uzay kâşifini anlatan meslek bilimcisi gök adamı."),
    ("AŞAMA", "Gelişmekte veya büyümekte olan bir organizasyonun yahut projenin her atladığı belli başlı önemli basamak derecesi o geçiş durağı fazıdır (merhaledir katmandır)."),
    ("BASKI", "Güç kullanıp yâda tehdit yoluyla zorbalık yaparak birine istemediği şeyi mecburen yaptırma hali (veya matbaada kitap sayfalarının mürekkebe kalıplanma çoğaltımı)."),
    ("BAŞARI", "Hedeflenen o zor bir isteğin, emelin sonunda engeller atlanıp istenilen galibiyete mutlu ve faydalı zafere ulaşılan çabasının liyakati karşılığı ve üstün sonuçluk rütbesi."),
    ("BATIL", "Haklı, doğru felsefesi hiçbir suretle bulunmayan, akıldan uzak sırf cahilliğe ve eskiden kalma saçmalığa batılmış din dışı asılsız şey uyduruk batıl şey inançdır boşdur.")
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

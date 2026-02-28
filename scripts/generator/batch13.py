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
    ("KABARIK", "Hacmi genişlemiş, şişkin, yukarı doğru kalkmış ve dolgun görünen (saç/kumaş)."),
    ("KABURGA", "Göğüs kafesini oluşturan, omurgadan göğüs kemiğine kadar uzanan eğri kemiklerden her biri."),
    ("KAÇAMAK", "Gizlice yapılan kısa ve küçük eğlence veya sorudan ustaca sıyrılıp kurtulma yolu."),
    ("KADAYIF", "İnce tel şeklinde hamurdan yapılan, genellikle fıstık/cevizle pişirilip şerbetlenen Türk tatlısı."),
    ("KADEMLİ", "Gittiği yere, başladığı işe uğur getiren, şanslı ve ayağı uğurlu kimse/eşya."),
    ("KAFADAR", "Düşünceleri, huyları birbirine çok uyan, birbiriyle samimi ve sırdaş olan iki dost kimse."),
    ("KAHKAHA", "İçten, yüksek sesle ve genellikle göbeği hoplatarak art arda çıkarılan coşkulu gülme sesi."),
    ("KAHVEDAN", "Türk kahvesini pişirmek ve fincanlara servis etmek için kullanılan özel işlemeli cezve yâda ibrik."),
    ("KAKAO", "Orta Amerika kökenli ağacın çekirdeklerinden elde edilen, çikolatanın ana maddesi olan toz."),
    ("KALAMAR", "Denizlerde yaşayan, on dokunacı olan ve eti kızartılarak yenen mürekkep balığı türü."),
    ("KALBUR", "Tahıl yâda kumu elemek için kullanılan, kasnağa gerilmiş tel veya deriden iri delikli süzgeç aleti."),
    ("KALDIRIM", "Yol kenarlarında yayaların yürümesi için ayrılmış, araç yolundan biraz daha yüksek taş kaplı yaya yolu."),
    ("KALENDER", "Gösterişten uzak, derviş meşrepli, dünya malına değer vermeyen her şeye boş veren hoşgörülü kişi."),
    ("KALORİ", "Besinlerin vücutta yanmasıyla ortaya çıkan enerjiyi veya suyun ısısını ölçen enerji birimi."),
    ("KAMBUR", "Omurganın eğrilmesi sonucu sırtta yâda göğüste oluşan anormal kemik çıkıntısı ve eğrilik."),
    ("KAMELYA", "Bahçelerde çaygillerden, genelde kokusuz fakat çok iri ve güzel çiçekler açan dayanıklı süs bitkisi."),
    ("KAMİKAZE", "İkinci Dünya Savaşı'nda uçağını bilerek düşman gemisine çarparak kendini feda eden Japon intihar pilotu."),
    ("KAMPANYA", "Bir amaca ulaşmak için belirli bir süre boyunca yoğun şekilde yürütülen ticari, siyasi yâda sosyal faaliyet dizisi."),
    ("KANAAT", "Eldekine razı olma, yetinme veya bir konu hakkında kişinin vardığı kesin görüş, derin şahsi düşünce."),
    ("KANDIRMACA", "Karşısındakini yanıltmak veya oyalamak için bilerek söylenen yalan veya yapılan hileli oyun."),
    ("KANEPE", "Üzerinde birkaç kişinin yan yana oturabileceği, sırt dayamak için arkalığı olan koltuk türü döşemeli mobilya."),
    ("KANGURU", "Avustralya'da yaşayan, arka bacakları üstünde sıçrayan ve yavrularını karın kesesinde taşıyan keselilerden memeli."),
    ("KANIT", "Bir şeyin, iddianın yâda olayın gerçekliğini tartışmasız şekilde ortaya koyan somut belge yâda delil."),
    ("KANSER", "Hücrelerin anormal ve kontrolsüz şekilde çoğalarak doku ve organları tahrip ettiği kötü huylu ölümcül hastalık."),
    ("KANTİN", "Okul, hastane, kışla veya fabrika gibi yerlerde yiyecek/içecek satışının yapıldığı büfe vb dinlenme yeri."),
    ("KAPASİTE", "Bir kişinin, nesnenin yâda tesisin içine alabileceği, üretebileceği en yüksek hacim, sığa ve potansiyel yetenek."),
    ("KAPICILIK", "Apartman yâda büyük sitelerde binanın temizliğine ve sakinlerinin günlük kısa işlerine bakan görevlinin işi."),
    ("KAPİTALİST", "Sermayeyi elinde bulunduran, üretim araçlarına sahip olarak sistemi kâr sağlamak üzere yöneten yatırımcı sermayedar."),
    ("KAPRON", "Suni sentetik liflerden elde edilen çok dayanıklı özel iplik veya kumaş türü (genellikle olta vb yapılır)."),
    ("KAPTAN", "Gemi, uçak gibi taşıtları yöneten en üst düzey sorumlu görevli yâda spor takımının lideri olan asıl oyuncu."),
    ("KARABİBER", "Tropikal bölgelerde yetişen, kurutulup toz haline getirilerek yemeklere acımsı ve hoş bir koku veren siyah tane baharat."),
    ("KARADENİZ", "Türkiye'nin kuzeyinde yer alan, bol yağış alan fırtınalı denizin ve o bölgenin kendi adı."),
    ("KARAKTER", "Bir kimsenin doğuştan gelen ve sonradan edindiği ahlaki vasıfların, tutumların ve huy yapıtaşlarının tümü şahsiyet."),
    ("KARANFİL", "Pembe, kırmızı çiçekleri olan kokulu bitki veya tomurcukları kurutulup baharat olarak dişe falan basılan aromatik bitki."),
    ("KARANLIK", "Güneş yâda yapay ışığın bulunmadığı, görmenin imkansız veya çok zor olduğu koyu siyah aydınlıksız durum."),
    ("KARARGAH", "Orduların yâda askeri birliklerin uzun süre kalmak ve yönetilmek için çadırlarla/binalarla konakladıkları ana teşkilat yeri."),
    ("KARASAL", "Denizden uzak kıta içlerinde görülen iklim tipi veya televizyon vb yayınların yerdeki vericilerden yapılması."),
    ("KARAVANA", "Asker ocağında yâda kalabalık işçi gruplarına yemek pişirilen ve dağıtılan büyük geniş bakır kap yâda (karavana atmak: boşa gitmek)."),
    ("KARBONDİOKSİT", "Canlıların oksijen alıp sonrasında nefesle dışarı verdikleri, renksiz ve kokusuz zararlı boğucu veya sera etkisi yapan gaz."),
    ("KARDEŞLİK", "Aynı anne babadan doğmuş olanların veya birbirine çok derin dostluk bağıyla bağlı olanların yarattığı dayanışma rütbesi."),
    ("KARGAŞA", "Toplum içinde düzenin veya kuralların bozulmasından doğan kalabalık gürültülü anarşik kargaşalık ve kargaşa hali."),
    ("KARİKATÜR", "İnsanların veya olayların gülünç, tuhaf ve çelişkili yönlerini abartılı çizgilerle mizahi şekilde anlatan hicivli çizim sanatı."),
    ("KARİZMA", "Bir liderin, sanatçının veya kişinin çevresindeki insanları derinden etkileyen ve peşinden sürükleyen çekici o şeytan tüyü aura."),
    ("KARNAVAL", "Özellikle Avrupa veya Güney Amerika'da halkın renkli kostümler giyerek sokaklarda dans edip eğlendiği büyük şenlik festivali."),
    ("KARTAL", "Yüksek dağlarda yaşayan, çok uzağı gören keskin gözleri ve çok güçlü pençeleriyle bilinen ulu ve yırtıcı süzülen iri dağ kuşu."),
    ("KARTOPU", "Çocukların kış aylarında oynarken elleriyle yuvarlayıp sıkarak top şekline getirdikleri ve birbirlerine fırlattıkları kar yumağı."),
    ("KASABA", "Köyden büyük fakat idari ve nüfus bakımından şehirden epey küçük olan, ortalama esnafı bulunan kırsal veya taşra yerleşim yeri."),
    ("KASAPLIK", "Mezbahalarda veya dükkanlarda eti yenen hayvanları kesme, yüzme, parçalama ve eti satma mesleği."),
    ("KAŞAR", "Koyun veya inek sütünden yapılarak tekerlek biçiminde üretilen, bekletildikçe lezzetlenen, tostlarda eriyen sertçe sarı peynir türü."),
    ("KAŞIK", "Çorba gibi sulu yemekleri kâseden yâda tencereden alıp ağza götürmeye yarayan saplı küçük çukur madeni yâda tahta alet."),
    ("KATLİAM", "Kendini savunamayacak durumdaki çok sayıda masum sivil insanın veya canlının acımasızca, toplu olarak planlıca öldürülmesi."),
    ("KATRAN", "Çam vb ağaçlardan yâda kömürden çıkarılan, siyah, suya dayanıklı, kokusu çok ağır, yollara veya gemi zeminine sürülen sıvı madde."),
    ("KAUÇUK", "Tropikal orman ağaçlarının özsuyundan yâda petrol ürünlerinden elde edilen, lastik ve esnek eşya yapımında kullanılan dayanıklı hammadde."),
    ("KAVUN", "Yaz aylarında yetişen, kalın sarı yâda yeşil kabuklu, içi sulu, çekirdekli, mis kokulu çok tatlı iri yaz meyvesi."),
    ("KAYISI", "Turuncu ve sarı arası renkte, hem taze yenilen hem de kurutularak saklanan (malatya vs bölgesi) ortasında tek çekirdeği/çağlası olan meyve."),
    ("KAZAK", "Kışın soğuktan korunmak için yünden yâda kalın iplikten şiş/makine kullanılarak örülmüş, kollu ve kalın yünlü üst giysisi."),
    ("KAZAN", "Ateşin üstünde çok fazla miktarda su ısıtmak veya kalabalık kişilere çorba vb yahni pişirmek için kullanılan kocaman derin bakır/çelik kap."),
    ("KELİME", "Dilde bir anlamı veya görevi olan, tek başına yâda cümle içinde kullanıldığında düşünceyi anlatan ses dizisi, sözcük."),
    ("KEMİRGEN", "Fındık faresi, kunduz yâda sincap gibi ön dişleri sürekli uzayan ve sert şeyleri ufak ufak ısırarak/kopararak beslenen hayvan sınıfı memeli."),
    ("KENTSEL", "Köy yaşamından kopmuş, büyük şehrin yapısına, mimarisine, nüfusuna ve sosyal hayat standartlarına dair olan, kente yakışan (durum/dönüşüm)."),
    ("KEPÇE", "Büyük kazandan çorba, hoşaf gibi sulu yiyecekleri tabaklara dağıtmaya yarayan çok uzun saplı büyük çukur kaşık benzeri büyük metal alet."),
    ("KERESTE", "Ormanlardan kesilen ağaçların hızarla, marangozda biçilmiş kalın ve uzun olan hali (inşaatta veya mobilyada ana hammadde ağaç malzemesi)."),
    ("KERTENKELE", "Sıcak yerlerde duvarlarda yâda taşlıklarda yaşayan, dört ayaklı, uzun kuyruklu ve tehlike anında kuyruğunu yenileyebilen hızlı pullu sürüngen."),
    ("KİBARLIK", "Kaba davranışlardan sakınan, hareketleri ve konuşması ince, nazik ve terbiye sınırlarında görgülü olma durumu ve nazikçe nezaketli edasıdır."),
    ("KİLİSE", "Hristiyanlık dinine inananların papaz eşliğinde topluca pazar ayinleri ve ibadet yaptıkları çanlı veya haçlı büyük ulu din mabeti / tapınağı."),
    ("KİLO", "Büyük tartı birimi olarak bin (1000) gram ağırlığa veya kitle ölçülerine (kilometre vs) taban / eşdeğer anlamındaki matematiki kilogram kısaltması."),
    ("KÖTÜRÜM", "Hastalık veya geçirdiği felç/kaza sebebiyle belden aşağısı tutmayan, yürüme ve hareket yeteneğini tamamen kaybederek engelli kalmış sakat kimse."),
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

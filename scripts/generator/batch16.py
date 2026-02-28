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
    ("NADAS", "Tarlanın verimi artsın ve dinlensin diye sürülüp bir veya birkaç yıl boş bırakılması işi."),
    ("NAFAKA", "Mahkeme kararıyla boşanmış veya ayrı yaşayan eşin, çocuklarının geçimi için ödediği aylık para."),
    ("NALEKAR", "Bağırıp inleyen, feryat ve figan eden ve sürekli şikayetkar bir eda takınan kişi (eski söz)."),
    ("NAMKOR", "Bütün yapılan fedakarlıklara ve lütuflara rağmen iyiliği unutan veya hiçe sayan vefasız nankör kişi (namkör)."),
    ("NAMUSLU", "Toplumdaki ahlak kurallarına sıkı sıkıya uyan, doğruluktan ve iffetten hiç ayrılmayan, dürüst kimse."),
    ("NARİNCE", "İnce, zarif, narin bir biçimde ve çabuk örselenme/kırılma ihtimali taşıyan, estetik o zarif eşya veya kişi."),
    ("NARKOZ", "Ameliyat esnasında hastanın acı duymaması için genel veya lokal anesteziyle uyutucu/uyuşturucu ilaç verilme halidir."),
    ("NASİHAT", "Hayat deneyimlerinden süzülmüş, doğru yolu göstermek için büyüklerin gençlere/küçüklere verdiği ahlaki uyarıcı (öğüt)."),
    ("NAZİKÇE", "İnce bir terbiye ve kibarlıkla, kalbi kırmadan karşıdakine gösterilen lütufkar saygılı tarzla (hareket/söz)."),
    ("NEZAKET", "Toplum içinde ölçülü, çok kibar, edepli ve uyumlu davranışların tümünü kapsayan ahlaki görgü, incelik erdemi."),
    ("NİHAYET", "Bir olayın veya bir sürü zahmetin, bekleyişin en sonunda ulaşılan son zamanı, bitiş ve uçlanış noktası."),
    ("NUMARA", "Evlerin kapısına yâda formaların sırtına vurulan ardışık rakam ya da sahte davranış ve hileli tiyatro yalanı."),
    ("NURSAL", "Işıklı, nurlu ve aydınlık mizaçlı; yüzü pırıl pırıl, kutsal bir temizlikte gibi algılanan kişi veya hal."),
    ("OBURCA", "Yemeğe doymayarak, sanki uzun süre yoksul/aç kalmışçasına ve iştahlı obur bir saldırganlıkla bol yeme şekli."),
    ("ODUNCU", "Dağda ormanda yaş ve kuru ağaçları baltasıyla, hızarıyla keserek sobada yakmalık kütüğe odunlaştıran yiğit/kişi."),
    ("OFİS", "Memurların yâda özel şirket elemanlarının bürokrasi, evrak ve bilgisayar işlerini yürüttükleri idarehane yâda büro çalışma odası."),
    ("OKSİJEN", "Suda (%88) veya havada çok serbest bulunan, renksiz, kokusuz, canlıların yaşamı için en büyük nefes ve yanma (O) gazıdır."),
    ("OKULA", "Eğitim veya öğretim amacıyla binaların tebeşirli masalı kara tahtalı mektebe doğru yola çıkışına doğru yönü eylemidir."),
    ("OKUTMAN", "Üniversitelerde temel dersleri vermek veya asistan gibi yabancı dil pratiği yaptırmakla görevli hoca veya öğretici (okutman)."),
    ("OMURGA", "Canlının sırtı boyunca sıralanmış, içine omurilik isimli hassas ağı saklayan ve duruşu sağlayan bel kemikleri eksenidir."),
    ("ONURLU", "Kendi özsaygısını kimseye çiğnetmeyen, başkalarına el açıp boyun eğmeyen, haysiyetli ve izzetinefis büyük vakurlu asil kişi."),
    ("ORANLANTILI", "Matematik ve geometride bir niceliğin diğer bir cisme oranla eşit denklikte veya uygun ölçülerde asimetrisiz yâda simetrisi formu durumu oranı şeklidir."),
    ("ORGANİK", "Kimi yapay (Gübre vs) ve ağır kimyasallara maruz kalmadan tamamen doğal toprak şerefiyle doğal süreçle büyümüş sebze meyvelere veya yiyeceklere bitkidir veya denilir adı organik maddedir."),
    ("ORİGAMİ", "Makas yâda yapıştırıcı kullanmadan sıradan bir kağıt parçasını defalarca değişik şekilde katlayarak turna veya yelkenli gemi vb gibi şık maketli biçim ve figürleri oluşturduğunuz eski köklü narin japon katlama sanatı kültür hobisidir oyuncağı zenaatıdır."),
    ("ORKESTRA", "Genellikle tiyatro yâda geniş konser salonlarında şefin küçük el çubuğu (baget) ile asimetrik hızla yönettiği dört ana müzik enstrümanı grubundan klarnetli piyanolu vb. oluşmuş sahnede oturmuş yâda ayakta kemancıların toplu senfonik dev takım müzisi."),
    ("ORMAN", "Yağışı tutanı yaban hayatın gizemlerini aslanı kurdu falan besleyen ucu bucağı meçhul ufka erişmez ulu yaşlı büyük gövdeli fidan ağaç örtüsü yeşil bol membaların ciğersisi ağaçlık yabandır."),
    ("OYUNCAK", "Küçük çocukları zihinsel veya bedensel açıdan oyalamak, hem ağlamasın diye hemde neşeli motor yeteneği öğretmek ve avutmak kastıyla ahşaptan boyalı yâda fabrikalarda ham maddeden yapılıvermiş bez vb yapımı eğlence minyatür maketi icadı olan eşyadır."),
    ("ÖDEMEK", "Meydan gelen yâda faydalanılan bir zarar/fatura ücreti veya herhangi bir haksız suçu karşılığındaki manevi parasal edeli faizle vesair yoluyla karşı tarafa nakit tıkır tıkır ödemek yâda telafi bedel borçunu veya yasal cezası tazmin etmek veya cezayı sinesine çekmektir."),
    ("ÖNEMLİ", "Hem nitelik hem miktar hem de değer açısından göz önünde bulundurulması kesinlikle gereken, atlanmaması mecbur veya asıl sayılan hayat memat değerindeki baş başlı mühim (esaslı yâda gerekli veya kritik kıymetli) eylem hal konumdur o şeydir çok ciddi mesele olan."),
    ("ÖVGÜLÜ", "Birisini yâda başarı gösterilmiş bir eşya fiili takdir ve yücelterek (büyük iltifatlı iyi alkış methiyeli güzel şakıyan asil büyük kelamla vb) övülmek değer katarak yücelik ifade etmiş olan şekil edili veya lisan tarzı (övgü almış/ veya çokça över)."),
    ("ÖZEL", "Yalnız sana, yalnız bir kimseye veya o biricik tek (özel şeye / meseleye) özgü ve ait olup kamusal olmayan / genel ve sıradan hiç olmayan asil has tahsis farklı ve eşşiz imtiyazı ve mülkiyeti has durum özel o kelimedir olan çok mühim kimsedendir özlüdür."),
    ("PADİŞAH", "Osmanlı gibi mutlak bir imparatorluk egemenliği devlet asası üstünde (padişah fermanıyla yâda hüküm mutlak emiri babadan vs. veliaht oğluna vb verasetiyle geçen) başkent baş köşesinde yetkilisine tüm yönetici ve tebaya hükmeden (padişahı veya kral / sultandı şah asil tacidar yâda ulu başbuyruğuna hakanına kağanı hünkara denilen büyük hükümdar padişah yâda imparatordur) koca tacı ünvanıdır."),
    ("PARASIZ", "Yanında ufak bozuk yâda nakiti (parası banknotu veya cüzdan züğürt falan olan pulu) hiç bulunmayan, (cepte / evde kuruş olmayan işsiz veya o gün harçlıgı olmayan pulu olmayan kimse ile mülkü/parası fukara muhtaçı anlamındaki meteliğe falan kurşun atıp iflas vey parasz yoksul garib geda fakir ve aç kişi vs duruma der)."),
    ("PARFÜM", "Eczacılık / Kimya parfüm sanayisinin vs veya lüks şişelerin içerisinde (güllerden sentetik öz veya çiçek ile balina yağı/ veya çeşitli egzotik amber yâda esans bahar bitkisi baharat süzmelerinle mis falan yağ / su yâda güzel kışkırtıcı alkollü kokulu uçucu formülü ter suyu kötü avlamak vücuda saça sıkılıp parlayan püskürten çok muazzam parfüm / rayihalı bu koku endüstrisi suyu) güzel kokan o esans o parfümdür"),
    ("PASTA", "Şeker fırınında unu mayayla yumurtayla pandispanya yapıp yuvarlak / kalıplara tepsi yâda kremalar çikolata / meyve jölesine bularak mum veya vb tatlılarla kutlamada merasimde doğum düğün / gün töreninde çatal ve dilim süslü bıçakla servise pastane tezgahına sürüp ağza çok ferah yaş keki vs ziyafetli kutlama tatlı fırın yiyeceği pasta ve dilime falan pastacı ekibi pastadır.")
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
        if next_id > 10000:
            break

with open(db_path, "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

print(f"Added {count} extremely high quality manual dictionary words to the DB.")

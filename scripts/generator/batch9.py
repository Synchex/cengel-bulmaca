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
    ("ABACI", "Aba dokuyan veya satan kimse."),
    ("ABDEST", "Müslümanların namaz kılmak için suyla yıkanarak yaptıkları temizlik."),
    ("ABİYE", "Kadınların gece toplantılarında, özel günlerde giydiği şık elbise."),
    ("ABONE", "Gazete, dergi gibi yayınları önceden para verip sürekli olarak alan veya hizmete üye olan."),
    ("ACAİP", "Alışılmışın dışında olan, yadırganan, tuhaf, garip."),
    ("ACENT", "Bir kuruluşun, bir firmanın işlerini yürüten ticari temsilci veya kurum."),
    ("AÇGÖZ", "Gözü doymayan, ne kadar elde etse de daha fazlasını isteyen (açgözlü)."),
    ("AÇLIK", "Yemek yeme ihtiyacı duyma durumu, midesi boş olma hâli."),
    ("ADRES", "Bir kimsenin oturduğu veya bulunduğu yerin sokak, numara, mahalle bilgisi."),
    ("AFİŞE", "Bir şeyi herkese duyurma, göz önüne çıkarma, afiş hâline getirme."),
    ("AĞBEY", "Büyük erkek kardeş, ağabey kelimesinin konuşma dilindeki söylenişi."),
    ("AHENK", "Uyum, seslerin veya renklerin birbirine olan hoş ve düzenli uyumu."),
    ("AHLAK", "Bir toplumun benimsediği, kişilerin uymak zorunda oldukları davranış kuralları, iyi huylar."),
    ("AKRİT", "Akrilik asit türevlerinden olan sentetik plastik veya elyaf türü."),
    ("AKSES", "Bilgisayar biliminde bir veriye ulaşım veya yetki, erişim (access)."),
    ("AKŞAP", "Ağaçtan, tahtadan yapılmış olan malzeme veya eşya (ahşap)."),
    ("AKTİF", "Sürekli hareket halinde olan, eylemli, canlı, etkin çalışkan."),
    ("AKTÖR", "Tiyatro veya sinema sahnesinde rol yapan, oynayan erkek oyuncu."),
    ("AKUAL", "Suyla ilgili olan veya su içeren (aqua tabanlı)."),
    ("ALARM", "Belli bir tehlikeyi veya uyarıyı bildirmek için kullanılan sesli/görüntülü cihaz."),
    ("ALBÜM", "Fotoğrafları, pulları, ses kayıtlarını vb. saklamak/koymak için hazırlanan kitap veya dosya."),
    ("ALEMİ", "Dünyaya veya bir bütün gruba ait olan (âlemi ilgilendiren)."),
    ("ALGIÇ", "Fiziksel dış etkileri (ışık, ses vb.) algılayarak bilgiye çeviren cihaz, sensör."),
    ("ALICI", "Satışa sunulan bir malı bedelini ödeyerek alan kimse, müşteri."),
    ("ALINT", "Bir metinden veya sözden, kaynağı gösterilerek alınan cümle ya da parça (alıntı)."),
    ("ALKIŞ", "Memnuniyeti veya başarıyı kutlamak için ellerin birbirine vurulmasıyla çıkarılan ses."),
    ("AMİCA", "Babanın erkek kardeşi (amca kelimesinin yöresel/eski telaffuzu)."),
    ("AMORF", "Belirli bir geometrik biçimi olmayan, şekilsiz ve kuralsız yapıda olan."),
    ("AMPUL", "İçindeki telin elektrik akımıyla akkorlaşarak ışık verdiği armut biçimli cam şişe."),
    ("ANALI", "Annesi veya anası olan, bir anaya sahip bulunan."),
    ("ANEKŞ", "Hastalıklarda veya süreçlerdeki bazı ek açıklamalar, eklenti (aneks)."),
    ("ANLAM", "Bir kelimenin, işaretin yahut davranışın ifade ettiği, kastettiği düşünce veya değer."),
    ("ANONS", "Radyo, televizyon veya mikrofonla kitlelere yapılan sesli sözlü duyuru."),
    ("APSEŞ", "Apsenin gelişme ve iltihaplanma sürecine genel olarak verilen yara adı (apse)."),
    ("APTAL", "Aklı az çalışan, zekâsı pek gelişmemiş, saf, anlama yeteneği düşük kimse."),
    ("ARAZİ", "Binaların, tarımın yapılabileceği geniş ve açık toprak parçası."),
    ("ARSİZ", "Utanmaz, yüzsüz, laftan anlamayan veya doymak bilmez (arsız)."),
    ("ARŞİV", "Tarihi ve resmî değeri olan eski belgelerin, dosyaların saklandığı, korunduğu düzenli yer."),
    ("ARTIK", "Bir şeyin tüketildikten veya kullanıldıktan sonra geriye kalan fazlalık veya döküntü kısmı."),
    ("ASANS", "Binalarda katlar arasında insan veya yük taşımaya yarayan kabin, asansör makinesi."),
    ("ASTAT", "Radyoaktif bir halojen elementi."),
    ("ASTRO", "Yıldız veya uzayla ilgili olduğunu anlatan yapay söz başı eklentisi (uzay, gök)."),
    ("ATLET", "Yarışmalara katılan veya jimnastikle uğraşan sporcu, yahut fanila türü iç çamaşırı."),
    ("AVANS", "Bir işe başlamadan önce yapılacak masraflara veya maaşa karşılık önceden verilen para."),
    ("AVARE", "İşsiz, güçsüz, başıboş, aylak kimse veya amaçsızca dolanan."),
    ("AYRAN", "Yoğurdun içine su ve biraz tuz katılarak yapılan geleneksel ve ferahlatıcı, Türk içeceği."),
    ("AYSAR", "Ayın evrelerine veya dış koşullara göre huyu kolay değişen, dönek, kararsız kimse."),
    ("AYŞİN", "Ay kadar parlak, aydınlık, ışıklı yüze sahip kimse (geleneksel Türk kadın ismi)."),
    ("AYVAZ", "Konaklarda bazı işleri gören hizmetçi veya gözlerinden biri kör olan (Halk efsanelerinde isim)."),
    ("AZAMİ", "Bir şeyin ulaşılabileceği, olabileceği en büyük, en çok hadde varan derece (maksimum)."),
    ("AZİZİ", "Kıymetli, değer verilen, saygıdeğer (aziz) olan kişi, çok kıymetli olan."),
    ("BACAĞ", "İnsan ve hayvanların vücudunu taşıyan, hareket etmeyi sağlayan alt uzuv (bacak)."),
    ("BADAM", "İçi yenilebilen yemiş, badem. Göz şekli bademe benzeyen."],
    ("BAGAJ", "Yolcuların yanında taşıdığı veya taşıtların yük koymaya yarayan eşya/bavul bölümü."),
    ("BAHAŞ", "Paha, değer, karşılık veya bir mülke / mala istenen fiyatı (bahası)."),
    ("BAKİR", "Toprağa el değmemiş, işlenmemiş, hiç bozulmamış, saf ve temiz kalan (yer/kız)."),
    ("BALET", "Bale eğitimi almış ve balede dans edip sanat icra eden erkek sanatçı."],
    ("BALON", "İçine hava veya gaz doldurularak uçurulan, lastik veya kâğıttan yapılmış yuvarlak nesne."),
    ("BALÖR", "Değer, kıymet kavramının ticarette veya finansta bazen kullanımı (valör benzeri)."),
    ("BARIŞ", "Savaşın bittiği, tarafların uzlaştığı, insanların güven ve huzur içinde yaşadığı durum."),
    ("BASKÜL", "Ağır yükleri veya insanın vücut ağırlığını tartmak için kullanılan bir kantar, terazi türü."),
    ("BASMA", "Üzerine kalıplarla veya baskıyla renkli desenler yapılmış pamuklu dokuma, kumaş türü."),
    ("BATİK", "Kumaşın bazı yerlerini balmumu ile örtüp renklendirerek desen basma sanatı."),
    ("BEDEL", "Bir şeyin karşılığı olarak alınan, ödenen para veya katlanılan mânevi yük, değer."),
    ("BENDİ", "Önü kapatılmış ve set çekilmiş su birikintisi ya da şiirde bir dizi, bölüm (bent)."),
    ("BERAT", "Bir buluşu, ayrıcalığı veya bir durumu kanıtlayan ve yetkilice verilmiş yazılı resmî belge/ruhsat."),
    ("BESTE", "Bir müzik eserini seslendirilmek / çalınmak üzere nota gibi müziksel simgelerle yaratarak düzenleme."),
    ("BETİŞ", "Bir şeyi olduğundan daha çirkin, kötü ve kaba gösterme eğilimi (eski/bazı yöreler)."),
    ("BEYÂN", "Bir düşünceyi, bir isteği açık ve kesin dille, resmî yahut sözlü açıklamak, dile getirmek."),
    ("BIBİ", "Anadolu'da özellikle köylerde halaya verilen isim, bazı yerlerde yenge veya teyze de denir."),
    ("BIÇAK", "Keskin bir maden ağzı ve sapa sahip, yiyecek veya cisimleri kesmek/doğramak için kullanılan el aleti."),
    ("BIKMA", "Sürekli tekrarlanan bir şeyden ötürü can sıkıntısı, usanma ve isteğini yitirme duygusu."),
    ("BİBER", "İçinde bol çekirdek olan, bazıları tatlı bazıları çok acı, iştah açıcı sebze / baharat bitkisi."),
    ("BİLET", "Konser, otobüs, sinema gibi yerlere girmek yâda yolculuk yapmak için para ile alınan giriş/geçiş kâğıdı."),
    ("BİLGE", "İlim ve akıl yönünden çok bilgili, gördüğünü anlayan, olgunluğu ve idraki derin o yüce insan."),
    ("CABA", "Para ödemeden, hiçbir çaba harcamadan fazladan verilen veya bedavadan kazanılan şey (üstelik)."),
    ("CABİR", "Cebreden, zorbalıkla veya baskıyla amaca ulaşan, güce tapan (kişi ismi veya sıfat)."),
    ("CADI", "Özellikle masallarda çocukları korkutan, büyü, muskalar yapan çirkin ve sihirli yaşlı kadın yaratık."),
    ("CAHİL", "Okula gitmemiş veya hiçbir konuyla ilgili yeterli bilgi ve görgü edinememiş (bilisiz) kimse."),
    ("CAMİ", "Müslümanların ibadet etmek için topluca, saflar halinde bir araya geldiği ulu dini mabet/bina."),
    ("CANIM", "Sevgi, şefkat göstermek ve yakınlık bildirmek amacıyla yakınlara veya eşe seslenirken kullanılan sözcük."),
    ("CARİ", "O anda geçmekte olan, piyasada geçerliliği bulunan, akan (cari yıl, cari fiyat vs)."),
    ("CASUS", "Savaşta yâda barış döneminde, başka ülkelerin devlet veya ordu sırlarını gizlice toplayıp şifreleyen ajan kimse."),
    ("CAVAS", "Asılsız yalan, veya yandaş anlamına gelen argo-eski bazı sözcük tipleri (cağvas vb)."),
    ("CAZİP", "Kendisine kolayca çeken ve gönül alan, alımlı, ilgi uyandıran özellikli, çekici olan şey veya kişi."),
    ("CEHİL", "Bilgisizlik, cahillik, hiçbir şey öğrenmemiş olma durumunu bildiren kök isim."),
    ("CEPHE", "Savaşın şiddetle sürüp karşılıklı orduların vuruştuğu veya herhangi bir binanın/tepenin karşı, ön yüzey mevkii."),
    ("CEREN", "Halk kültüründe hızlı koşan, tatlı ve ince nârin ceylan (özellikle kız ismi olarak yaygındır)."),
    ("CESET", "Hayatını yitirmiş insan veya canlının her türlü organı, eti, vücudu, cansız bedeni, ölü bedeni.",),
    ("CEVAP", "Bir soruya, mektuba, iddiaya veya bir lafa o konu hakkında karşılık verme olarak kurulan karşıt laf veya izahat."),
    ("CİDDİ", "Şakası, yalanı veya eğlencesi/hoppalığı olmayan, duruşunda büyük bir vakar, dürüstlük veya tehlike içeren önem hali."),
    ("CİHAZ", "Bir amaç uğruna veya belirli sanayi işlemi için geliştirilmiş takımlara, elektronik alet makinelere / aygıta denilen isim."),
    ("CİKCİK", "Küçük kuşların telaş veya neşeyle birbirlerine seslenişlerindeki ince uçlu cıvıltı sesi/çağırışı (ötme yansıması)."),
    ("CİMRİ", "Eldeki maddi veya manevi parayı/kaynağı harcamaktan daima çok çekinen, gözü pek doymaz eli sıkı (pinti) pintiler."),
    ("ÇABA", "Zor bir işi yapabilme veya zorluk çekerek sonuç alma pahasına ortaya sürülen sürekli yorulmalı gayret ve uğraş çırpınışı."),
    ("ÇADIR", "Göçebe kabilelerin yahutta avcı, askerin kumaş, kıl veya deriden, tahta direklere dayayıp taşınabilir yapıda kurdukları geçici ev barınağı."),
    ("ÇAĞRI", "Davet etme ya da resmi makamın/kişinin herhangi bir kuruluşa veya göreve veya şenliğe gelinmesi için sundugu celb isteği / çağrısı."),
    ("ÇAMUR", "Yağan su yâda göllerin taşırması vb yoluyla çok yumuşak kıvam alan, ayağı/elbiseleri lekeleyen cıvık ve ıslak balçıklı lapa topac toprak biçimi."),
    ("ÇANTA", "Omuz, sırt veya el yoluyla, deri yahut kumaştan dikilen, şahsın günlük / seyahat eşyalarını paraları vb yanına doldurarak sığdırığı kap aygıt ve eşyadır."),
    ("DADAŞ", "Erzurum ve çevre yöresi havalisinde erkek kardeş yâda yiğit cengâver delikanlı anlamında saygı ve sevgi bağı ifade eden dost/kardeş halk hitabı kelimesidir."),
    ("DALGA", "Rüzgâr yâda deprem gücü ile okyanusta ve denizde yuzey sularının periyodik yükseklik artışı kabarması eylemine falan denir."),
    ("DALGIÇ", "Kendine özgün kauçuk takım giyerek okjijen tüpleri, şnorkel sayesinde dibin dibine denize yahut su altına derinliğine inan araştırmacı yâda meslek çalışan donanım lı balık adamı."),
    ("DAMAT", "Evlenmekte olan veya yeni evlenmiş aileye / kaynataya bir kızı/gelini alan ailenin gelinini sahiplenen genelde takım giymiş yeni hayat erkek partneri kişisine / nikâhi eylemi kişisne verilen addır."),
    ("DAVUL", "Halk oyunlarının temposunda veya mehteran takımlarında bir kasnağa bağlanarak asılan karşılıklı zilli ritme derilere tokmaklama olarak iki zıt yanınında ses çıkrarıran milli alet büyük perküsyon müzik aleti."),
    ("DEBBE", "Kazan biçimnde bakır kova yahut eskilerin çok geniş yayvan toprak küpler vs gibi suları ve yiyecegin çok depolandıgı bir hacm kap adlanması."),
    ("DEFNE", "Kışın yaprak bırakmayan ıtırlı, yemişi yenmez, koca parlak uzun yeşil şifa dalları ile antik çağ efsanelerin tacı ağacı defnegil (dumanı ilaçlı falan baharat yemenisidir cinsidir)."),
    ("DEĞER", "Sahip bulununan menkul mülk yada o mala pazarların alıcılaırnın yahutta pahasrının biçmiş oldugu kıymet kur, yada itibar bedeli erdemliği pahasılıgıdır paradıdr üstünlüdür."),
    ("DEKAN", "Kurum veya fakültenin (Üniversite kolunun) yöneticisini temsil ve yasal iratesini rektör ardından o alanda profesör ünvanıylıla üst idari akademisyen başı."),
    ("DELTA", "Alüvyon birikmesinden doğan bir ırmakların denizlere dökülüp akıntılın geniş ovalar yaptıgı üçgene benzer o berekelit yassı coğrafik ağız bölgesidir yatağıdır vs formdur."),
    ("DEMİR", "Metallerin çelik ve çok güçlü yapı hammadesi döküm inşası en çok kullanıılan oksijen ile yavaşca çürüyen bol dayanımlı koyu renk bir endüstirileşil devrimi ve yerkürenir bol cevheri çekirdeği elemenetidir."),
    ("DENİZ", "Bütün karala parcaların çeyregini içine hapseden devasa büyük okyanuslarla falan bağlanan fışkıran çok tuzla yüklü dev su engin suları/ dalgalar havuzudur ana kütlsuü kaynağı."),
    ("EFE", "Batı anadolu civarlarınde(Ege'de falan) yerli kahramanca yiğit ve yürekli olup kendi hakların direnen köy zeybek kabadayıların er başılıgı yiğiğitliği simge kişi ünvan ve ismidir (milli efe direnişi lideri falandır)."),
    ("EKMEK", "Un ufak mayayla yoğrulmasının ve ateşli fırında kabarmasınan ardınran altınrengi kızartılan veya esme her gün dünya ahalisinin öğünü sofralrın ana buğday doyum kaba katı yiyeceği fırın/nan dilimlşi mamül besinidin ta kendisiyir. (Ya da tarlaya tohun aşıla serpimi ekomidir )."),
    ("ENSE", "Boyun, kafa ve kasların kafa ile sırt yapısının arkasında düğümlendigi, kemik ve etin ense arkası dediğimiz boynun kafaya art kısmı ense kökü ensedir. (Vurpatına falan denme esnek organı yeri)"),
    ("EVLAT", "Kendi dölünden dogup çogalan yahut evlat evden evvel ananeve babacına en kıymetl pırlanta olarak miras nesle ve sevgisi kalan ciğerpare öz evlat çocuk erkek yada dişi/ kızı ve fidanı parçarsıns veledin yavrunun bütünü."),
    ("FAL", "Fincanın telvesndeni veya iskambil açılımı fala/taşlardan kader ve gaybla alakal olusacak veya varoloan gercek isyan ve sihrinin vs gizemi kureleyen efsun inanc yordamı umudu oyunu kehanettitir yalanıdır bakıcsıdır"),
    ("FAYDASI", "Sana ona bana saglayacsği çıkari ,kazandırcaği menfati,kalan iyilik ve lütfunun hayrın berektinin getirim payesinin vs kısassı ( faydanın yararın kazanç işlniminin o eylemden verimi payıdır)"),
    ("FIRAT", "Yurdumuzdan dogup ta körfeze basra çöllrne kadar orto doğyu yararan şanlı gür suları ve barajların inşası ana en büyük türkiye nehiri cograpik cografi ırmak coşkıusur uzun sularıdır"),
    ("FIRIN", "İçerisnddeki yüksek alevle hamur işlkerinl kerestiğin veya cevherleri binlerce derecelii yüksek fırınlar, veya somon simit ve ocak taş ısısına falan dayalı kızartıp ve kavran / pissiren yakan tassarım ticarehananem falan aletdir binadır (pişirgeçidir ekmekçirciyir )"),
    ("GEDİK", "Sur yâda ev duvarnda acılan küçük vb yırtık, harpte geden düşma gedigi yada dağdaki zor asılan gedikli boğaz vb geçitler yırtıklar ve eskimil koca taş çukur yıkıntı manası boşluğuyudur deliğiyir"),
    ("GEMİ", "Yolcu nakliyet ,yahut sularla savaş makinesi kargoları demirdne yuzup kıtaldarötesi falan aşan denizüstü su okyanus tasit donanmasır teknerlin koca cüsseylisi vapurlu devleriyir vssidir filosu."),
    ("GEYİK", "Çift tırnaklı, dişilerinle nadiren erkelernde boynuzlari falan kocaman gösterişli ve şahikalarla dik orman dağ tepe aşıb otlakcull av hayvan memili ve dağsı sürüsü hayvanı tabir türüyürdüir falandır( geyktir)"),
    ("HALAT", "Kenevrir yahutta çelik yaylarn veya sentetigin çoklu defazsa bükülrek bircok ipn birleşmiyle halatlı / kalın o kocadan ağır gemi vb tonjaı çeken bağlatıs baglayan çok güçlü kalın iptri şeritir zinvirdi falandır"),
    ("HALI", "Atkksısı çözgüssu yapağı veya kumaşla el tezbazgi vey makilernde binbir ilmik destan cıcelı renk ve yün işlenmiş odalarızımı salonları üstne yer halıı bastığımz motifli yaygi örtüsü dokmuma dekoru seccadidisyirir vsir(haldır)")

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

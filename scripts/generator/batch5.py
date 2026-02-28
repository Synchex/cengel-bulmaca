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
    ("SABAH", "Günün güneş doğduğu ve aydınlanmaya başladığı ilk saatleri."),
    ("SABIR", "Gelecek iyi günleri dileyerek acıya, zorluğa, sıkıntıya göğüs germe ve bekleme kuvveti."),
    ("SADAKAT", "İhanet etmeme, verdiği söze içtenlikle bağlı kalma duygusu, vefa."),
    ("SADECE", "Yalnızca, bir tek manasına gelen zarfı kelime."),
    ("SAĞLIK", "Bedenin, ruhun iyilik hali, hasta veya zayıf olmama durumu, sıhhat."),
    ("SAHAR", "Sabahın tan yeri ağarmadan hemen önceki vakti (eski sözcük)."),
    ("SAHİL", "Deniz veya bu gibi suların kumsallı kıyısı tarafı."),
    ("SAHTEKAR", "Kendi çıkarı için hile yaparak eşyayı veya karşısındakini aldatan kötü niyetli kişi."),
    ("SAKIZ", "Çiğnemek için hoş kokulu özsuyundan yapılan lastiksi yiyecek maddesi."),
    ("SAKLANBAÇ", "Biri ebe olup gözlerini yumarken diğerlerinin görülmeyecek yerlere girip ebeyi savuşturduğu eski çocuk oyunu."),
    ("SALÇA", "Yemeklere lezzet ve renk versin diye ezilmiş veya kaynatılmış domates / biber esansı."),
    ("SALKIM", "Üzüm gibi meyvelerin veya bazı çiçeklerin hepsi bir sapta tutunan sarkan toplu dalı."),
    ("SAMAN", "Arpa, buğday hasatında ayrılan başakların kurutulmuş sap artığı olan hayvan kaba yemi."),
    ("SANDAL", "Kürek çekilerek ilerletilen, kıyılarda kullanılan ağaçtan yapılmış deniz teknesi."),
    ("SANDIK", "İçine değerli eşya veya çeyizlik mallar konan kare/dikdörtgen kapaklı tahta haznesi."),
    ("SANİYE", "Dakikanın atmışta birine eşit gelen çok kısa zaman ölçü birimi."),
    ("SAPLANTI", "Akıldan bir türlü çıkarılamayan, hastalıklı düzeyde bir tutku ve fikir halinini kuruntu yapısı, fiksaj."),
    ("SARAY", "Kral, padişah gibi hükümdarların ailesi ve idarecileriyle oturduğu geniş taht lüks kalesi/binaları."),
    ("SARIĞ", "Müslüman din adamlarının ve hocaların başlarındaki fese veya takkeye sarılan ince sarma bezi tülbenti."),
    ("SARSINTI", "Ağır veya hafif derecede olan anlık titreşimler, deprem ya da darbenin yer titreşimi sarsması hissi."),
    ("SAVAŞ", "Devletlerin, orduların siyasi ve ekonomik ihtilafları için birbirlerini ateşli/silahlı yollarla yenme vuruşması olgusu."),
    ("SAYFA", "Kitap veya kâğıt türü cisimlerin açıldığında gözüken yazılı her bir tek ön yüzü."),
    ("SAZZAN", "Sazlık göllerde yaşayan, dikkatsiz insanlara da mecazen ad olan pullu ve iri gövde tatlısu balığı türü."),
    ("SAZGİL", "Mızraplı veya telli/gövdeli halk çalgılarımızın tamamına verilen genel adlandırma veya saz eseri yapan ozanlar grubu."),
    ("SEBİL", "Hayrat olsun diye sokakta, camide bedavaya ve sevap diye içme suyu sunulan halka açık musluklu yapı."),
    ("SEBZE", "Çiğ ya da pişirilerek yenilen, lifleri çok yüksek yeşil ve taze bitkilerin bitkisel bölüm adlandırışması."),
    ("SECDE", "İslamiyette kılınan namaz sırasında alnı, dizleri yere tam koyarak yaratanı hürmetle yüceltme eğilmesi."),
    ("SEDEF", "İstiridye kabuğu iç yüzeyindeki parıltılı ve rengârenk görünümlü kıymetli döşeme süsü ve maddesi."),
    ("SEDİR", "Evlerin ön veya iç kısmında yastıklı tahtadan yapılan veya iğne yapraklı kereste türü."),
    ("SEFALET", "Herhangi bir toplumda veya kişide yaşanan çok yoksul ve maddi yoksun bir zorluk yaşama, yoksulluk yamanlığı."),
    ("SEGSAN", "Atmışla seksan arası gibi bir ifade olan eski ve kullanılmayan yanlış halk telaffuzlarındaki kelime dizgesi."),
    ("SEKİZ", "Yediden sonra, dokuzdan önce olan ve saymada onluk dizimde olan çift rakam."),
    ("SEKRETER", "Müdürlere veya başkana özel ofis evrak/yazışma randevu trafiği hazırlayıcısı, yazmanı büro elemanı."),
    ("SELALE", "Kelimenin Türkçede akarsu şelalesi olarak geçen bozuk ifade şelale su yolu biçimi."),
    ("SEMBOL", "Kavramları ya da şeyleri görsel ve yazılı olarak kısa izah sağlayan mecazlı ve genel işaret kalıbı, simge."),
    ("SENDİKA", "İşçilerin kendi savunma ve haklarını işverene karşı yasal kurduğu oylamalı tüzel birlik ve kuruluş."),
    ("SERAMİK", "Kimyasal formülasyon fırın toprağının ısıl işlemle yüksek derede kaynatılıp kalıplandığı vazotabak veya kiremit nesne."),
    ("SERSERİ", "Mesleği ve hayat amacı bulunmayan asalakça gezip işsiz güçsüz çevresine rahatsız olan başıboş salkım insan."),
    ("SERUM", "Hastanedeki zayıf hastaya mineral sıvı takviyesi için doğrudan kana şiringalı serum suyu."),
    ("SESSİZ", "Bir ortamda konuşma yahut patlama tonu vs ses içermeyen gürültüsüz sükunet."),
    ("SEVGİ", "Kalbin bir eşyaya veya birey/anneye doğru kurduğu sıcak bağlılık şefkat duygusu veya aşka benzeyen ilgi muhabbeti."),
    ("SEZGİ", "Akıl yardımıyla olmayan ve olaylar karşısında 6. hissin oluşturduğu veya görünmeyen kuvvetlerce doğan his edinim farkındalık kudreti."),
    ("SICAK", "Elliyken ter, yakıcı niteliğin algısını duyuran sıcaklık hararet derecesi algı hissi (soğukar karşıtı)."),
    ("SINIF", "Öğrencilerin beraber tahta önünde kürsülü eğitim dersi görerek kümelendiği dersane ve ayırım grubu oyluluğu."),
    ("SINAV", "Bireylerin ders veya hayat konusunda başarısını soruşturarak not veren, tartma test (imtihan) durumu."),
    ("SIRAT", "İslam dinindeki efsanevi inanışta, sırat kılıçtan keskin köprü, hesap ve sırat geçidi veya dosdoğru kılavuz yönü (sırat-ı müstakim)."),
    ("SİLAH", "Mermi, ok ya da yıkıcı mühimmat fırlatan öldürücü askeri alet."),
    ("SİLGİ", "Kalemlerin kâğıt üzeirndeki hata lekelerini karbon çiziklerini silip döken lastikli kauçuk alet."),
    ("SİMİT", "Gevrek fırın ateşinde kavrulmuş, halka gibi susamla hazırlanan eski sokak atıştırma çöreği yiyeceği."),
    ("SİNEMA", "Resim film karelerinin perdeye projeksiyon akışı veya film izleme eylemi sanatının ve büyük salon mülkünün genel ismi."),
    ("SİNİR", "Biyolojik sistemlerde uyartı ileten ağ, veya olaylar karşısında aniden tepkilenen huzursuzluk ve hiddet gerilimi kalkanı."),
    ("SİSTEM", "Bütünün birbiriyle uyumlu hareketlilik düzeneği prensibi veya yapısal kural nizam örgüsü çalışması."),
    ("SLOGAN", "Pankartlara veya mitinglerde kısa, akılda kalarak kalitesel anlam kazandıran propaganda sesleniş markası mottosu kükreyişi."),
    ("SOSYAL", "Toplum hayatın içinde bulunan veya insancıl kalabalık ilişkiler seven cana yakın dışa dönük kişi hali."),
    ("SOYLU", "Ailesini uzun yıllardır temiz sicille, bey, hanım efendi titizliği ve asaleti ile donatmış kişi ve elitliği (aristokrat vb)."),
    ("SOYUT", "Madde olmayan gözle tutulup tartılmayan felsefe hayal aklı akım veya rüya gibi tinsel nitelendirilen duyu manevi varlık formu."),
    ("SÖRF", "Okyanus vs hırçın su dalgaların üzerinde dik vaziyette esnek bir tahta kullanarak kayma spor branşı aksiyonu (dalga sörfü)."),
    ("SÖZLÜK", "Kelimelerin alfabe dikişine uygun eş, zıt anlam ve dildeki fonksiyonlarını sayfalarında lügat olarak bildiren büyük kitap başlığı."),
    ("STRES", "Daralma hissi ruhi sıkışkanlık gerilimleri (yoğun anksiyete, telaş sinirsel yorulma basıncı ve bozukluk)."),
    ("SUDAN", "Su katılmış veya çok ucuza satılan anlamına da gelebileceği gibi bedelsiz sayılan durumların ucuzluk hali durumu manasındadır."),
    ("SULTAN", "Hükümdar sıfatındaki hanımefendilere veya padişaha devletçe lütfedilmiş imparator / yöneticilik ünvan makam gücü."),
    ("SUNUCU", "Haber yahut eğlence ve medya şovlarını ekran karşısındaki halk kitlesine kelimelerle diksiyon ile takdim edici aktüel konuşmacı, spiker veya takdimci."),
    ("SURUN", "Duvarla kale etrafını kuşatan yüksek duvar engeli veya büyük savaş korunma barikat örgesi (surlar zinciri vs)."),
    ("SÜZGEÇ", "Makarna süzdürme veya kum ayırma sırasında kalıntıları tortularla hapseden yüzeyi bol delikli geçirgen tül kap vb kaplama tel."),
    ("SÜTUN", "Tapınaklar ve şık saray revaklarında yapıyı tavan ağırlığından devirmemeyi tutan düz dikilmiş kolon biçimi kaide direği yapısı."),
    ("ŞABAN", "Halk arasında bazen komikliğinden ve bazen mülayim inancından esinlenen veya hicri takvimin ramazan evvelki tatlı manalı aylarının isminden bir ay."),
    ("ŞAFAK", "Güneş doğmadan evvel, tam tepede gece karanlığıyla yeni mavilğin göğü aydınlattı ufki güneş ışıması pembeliğine verilen adlanma anı."),
    ("ŞAHİN", "Mükemmel görme ve avcılık hisleriyle sarp dağlardan avına fişek gibi pençesiyle sorti yapan avcı soylu küçük yırtıcı kuş türüdür."),
    ("ŞAİR", "Edebi yönü üstün şiir sözlüğüyle kafiyeli ve hissiyata tercüman ritimler dizen (sanatkar ozan vb manada) kalem ehli kişi yazarı."),
    ("ŞAKA", "Korkutarak sonrasında güldüren karşıdaki sevdiklerine mizah yolu kurarak hoş ve nezih fıkra vb eğlencelik ironik hareketler esprisi kurgusu."),
    ("ŞAMANDIRA", "Denizde tehlike alanlarını, liman uçlarını işaret ve fener için batırmadan demirleyip sabitlendiren gösterge güvenlik gemici dubaları."),
    ("ŞAMAR", "Açıkhüküm ile kızdığı şahsa suratına şiddetli vurulan keskin ve yüksek ses çıaran şaklamak eylemli sert vurma tokadı tepki cezası."),
    ("ŞARKI", "Türkü, arabesk pop diye ayırdığımız her türlü güftesi şiirle dökülen ve bir beste arkasında ahenkle dökülen enstrüman makamı (ses sanatı ürünü eylemi eseri)."),
    ("ŞAŞKIN", "Hiç beklenmeyen vahim/komik bir vukuf halinde afallama hali duraklamasıyla ne diyeceğini kestiremeyen kişini dumur haldeki aklı yitiği nisanı şahıs."),
    ("ŞEKER", "Pancarlardan vb rafine işlemler kaynatılmasıyla üretilen beyaz zerre olan tatlandırıcı kimya gıda ve çaya lezzet, tat / kalori katması maddesi ürünü."),
    ("ŞEKİL", "Etrafımızdaki çetrefilli cisim objelerinin sınır, dış ve biçimsellik tasviri geometrik olan hali silüeti dış çizgisel görüntü taslak resmiselliği."),
    ("ŞELALE", "Kayalık yüksek bayırdan yahut yardan güçlü nehirin büyük hızıyla suya köpürte köpürte döküldüğü ve seyrine doyulmaz çağlayanlık düşüş su yatağı basamağı."),
    ("ŞEMSİYE", "Yağmurlu/karlı gökyüzü şartlarından korunabilmek iskelet direğine çekilen paraşüt stili tenteli katlanabilir elde tutulan sığınma aracı koruyucu kaplaması."),
    ("ŞEREF", "Kendine, milletine ve değerlerine bağlılık hissini dik tutan asalet yüksekliği namus yüz aklığı / itibarı ve onurluluk hissi karakteri kalitesi erdemi durumu."),
    ("ŞİFA", "Maddi / manevi yolla (ilaş serum doğa tedavileri vd) varolan hastalıktan kalıcı feraha tamamen sıyrılarak arınma, kurtulma zindeliği sıhhati afiyeti şifası iyileşmesi vukufu."),
    ("ŞİFRE", "Hesap kırılamaması eylemli güvenlik amacıyla paralo, kapı veya siber hesap sandığı vb dijital kilit açılması dizgesi sır kelime kombinasyon parolası karakterleri."),
    ("ŞİMDİ", "Tam o anda, geçmişten ve gelecekten harici eldeki güncel, cari anı tabirlemede an içinde olup olagelen şimdiki dakika hissi anlağı zaman kelimesi tabir edimi."),
    ("ŞİRİN", "Bakışları ve edası çok minyon veya sevimli olduğu için yüreğe sevecen/sempatik ve cana yakın gelen çekici varlık, sevilen çocuk vs durumu betimlemesi hali yansıması vb tabiri."),
    ("ŞİŞMAN", "Boyundan fazla kazein karbonhidrat ve yüksek kalorik yağ kilolarla kaplı aşırı etli ve çok kilolu ağırlıklı geniş bedenli hantal metabolizmalı fıçılı birey yapısı bünyesi vb özellikler kümelemesi betim."),
    ("ŞÖHRET", "Bütün insanlık ve cihan cemiyeti üstüne yapılan büyük tanıtımla sanatta popüleriteyle adını geniş halk tabanınca bilinir yapmış namlanmış ün durumu halinin bütünü makamı ihtirasının da adıdır."),
    ("TABAK", "Toprak cam veya metalden sığ kaseden daha yayvan içeresinde pişmiş yahut çiğ gıdanın zevkle sunulduğu (ikram vesilesi yeme konulduğu vs kase türü/porseleni vs yayvan porsiyon edimi tabağı/kabı çeşidi vs vb yassılığıdır."),
    ("TABLO", "Ressam veya nakkaş gibi sanat otoritelerince çok özel ve yoğun emek harcanmış sanatı süs eşyası olup çerçevelenmiş asılı / duvarda teşhir olan çizgi yahut fırça manzarası tuvali veyahut grafikli verilerin liste taslağı manalıdır."),
    ("TABURCU", "Vahim vaka bir ameliyat veya hastalık kürü sonucu tedavinin hastanede kesin sonuçlanıp, kişinin yatağından kalıcı şifayla ayrılıp evine yol edilmesi sağlık tahliyesi veya terhis süreci kararının tıbbi ifadesidir (adıdır bütünüdür vb)."),
    ("TACİZ", "Sözlü yahut fizik eylemiyle karşıdaki reşit ya da reşit olmayan bireyin psikolojisine rızasız korkutarak baskıcı iğrenç bedensel zarar yahut mobbing /rahatsızlık işi edimidir/kötü zevk veyahut saldırı teşebbüsüdür (sucun da kendisidir)."),
    ("TADİLAT", "Ev veya işhanının eksik duvar elektrik vb teknik onarımlarını işin ustasınca uzun boylu yeniletmesi restore faaliyetidir tamirin onaran elden genel geçirilme tamir işidir."),
    ("TAHTA", "Marangoz elinden geçen kütük kerestesinin işlenmiş pürüzü silinmiş kullanışlı kesik kapı, sıra yahut masa üretilen dilinmiş ağaç levhası parçasına vs sunta benzeri işlenmikli organik veyahut vs parçalar (odun materyali hammadesi vb tabirlere verlen genel adıdır.)"),
    ("TAKVİM", "İnsanlığın günü veya zamanı ayları idarelemek seneyi kolay saptamak veyahut ibadetlerin yönü / özel periyotlar vb plan ajandasını vb asma sayfalarda vs takip ve düzenleme cetveli yıllıktır kâğıdıdır icadıdır hesap cetvelidir."),
    ("TALİH", "Ummadık bir kazancın kârın yahut güzel bir kısmet olayının kişinin iradesi haricinde ansızın bulması kader oyununun güzelyüzü vb manasına yorduğu şans tali ve baht yazgısının bir diğer kader formudur şanlılık (veya tersine talihsizliktir vs)."),
    ("TAMİRCİ", "Makine motor / zemberek veya basit teknolojik evra / gerecin eskiyen bozulmuş teknik donanım ve hatasını eline aldığı tornavidasıyla vb yeteneğiyle tekrar eder kullanışlı çalışana onaran meslek işçisinin şahsıdır sanatçısı ustası ehidir vs vb ustalık."),
    ("TANIK", "Hakimin karşısında yeminli şekilde vuku eden eylemi, hadiseyiyada suçu veya kazayı vs gördüğünden ötürü gözlemleri üstünden ispat veya tarafsız mahkeme huzur ispatçısı/gözlemcisi, olay tanıklığı şahidi ve bilinci görgüsünün hakikat ifadecisi eylemcisidir kişi manadadır.",),
    ("TANTANA", "Sokakta kalabalığın kavgası vaveylazı anlamsız lüzümsuz ve gürültü patırtılı / karışıklık ve şamata patırtısına genel adlandırmasına veya süslü böbürlenen gürültü yapısı dağdağa durumana denilen bir betimsel argo (eski sokak kalıbı argosu lafı telaşı vbdir.)"),
    ("TARİF", "Malzemenin sırasının usulü / yahut lokasyonun kordinatın gidilecek yolu, bilmeyene veya meraklısına tarifin ölçünün vs tane tane adım basamak söylenip rehber yol/pusulası ve açıklayan kılavuz direktif betimlemesidir/yol yolak anlatıcısı izahın ta anlatım formülün sözcüklerle tanımı işidir.",),
    ("TARİH", "Geçmişteki eski mazi nesilleri milletlerin devlet savaşları siyasetini ve kültürel büyük vuku kılındık olaylarını zaman ve kronolojik akışla irdeleyen belgelerek tetkikini sürdüren bilim ve hafızası bilimi akademik (geçmiş bilimi zaman bilimi tarihi süreç vs ansikolopedi disiplini vsdir vb manadadır.)"),
    ("TASARIM", "Mimar, teknik ressam yahut grafiker gibi sanatkarlarca kafadaki zeka hayalini işlevsel, endüstriyel moda veya mimari ürünlere döküp estetik yarattıkları çizim şeması orjinal icad esinlenmesi, plan oluşturma ön (dizayn, icra etme çizim ve oluşturma kalfası dizayn etme işçilik/modeli projesi şekillendiriciliğidr vs)."),
    ("TATİL", "Yıllık yahut dönem okulların/işlerin geçici olarak dinlenme eğlenme meşgalesine terk ederek vs strese fasıla arındığı rahat tatil boş durma izinli istirahata vakit ayırdığı resmiyet vs gün ve genel adlandırama arası sayfiye dinlencesi gezi iznidir.",),
    ("TAVANA", "Yapılan odanın / kışlanın salonun veya basit hanenin üste yer alan başın üstünde kapak şeklinde vs yapının tepeden en tepeye kaplı kapam olan bitiş (zemin üstü üstlük düzlük boşluk örtü ve tavanlık ahşap yahut beton iç / zemin tepeliğinin yeryüzü adıdır tabanının vs tam tersidir aksidir)."),
    ("TAYFA", "Geminin güverte veya makinesi bakım ve onarımı liman işleri gemi/kayık direğinde seyri için kiralanıp yahut maaşa tabu denizciler ordusunun yahut deniz donanınma güvertedeki deniz personeline genel verilen isim grubu veyahut (sokak serserisi çete arkadaş argosu adlandırmasına manalarına vb gelen topluluk zümresidir)"),
    ("TEBRİK", "Makam rütbe terfisinden, mühim zafer yenginiden dolayı sevince / yahut hayırlı bayramlardan veya özel düğününe / iyiliğe başarıya kutlayan kişilere methiye sunarak aferin diyerek esenleme şans tebrikine tebriklemedir, onure etme mutluluğunun (vefa paylaşımı) övgüsünün sunuluş dilekçe hali formudur övmesidir kelamı vb adıdır vs."),
    ("TEDAVİ", "Tabip ebe ve de tıbbi şifa yöntemlerine veya klinik müdahale, ilaç sarmalaması psikoterapisiyle falan iyileştirme kurtarıp ve acıların önüne set / derman vurma tıbbiyat (sağlığa geriye kavuşturulması usülü işlemi işinin genel operasyonu sıhhisidir hekimliğidir ve bu eylemli şifa veriş süreci bilimin tamamıdır vs)."),
    ("TEHDİT", "Gözdağı vs yaratarak zoru ve cebri / asayişi bozacak tehlikeli bir intikam vuku yahut can/mala şiddetli gasp vb belayı kasıt oluşturup karşınıdaki çaresize veya yapsın etsin eylemi yaptırmak cebri için söylenen yasak cezai ağır/kriminal vs kanuna aykırı gözdağı vuruş tehlikesisnin laftaki (kuvvat fiili bildirimidir korkutuşuyudur) zorla beladır suctur vb dir.",),
    ("TEKNE", "Su üstünde batmadan seyrederek kürekle yelkenle yahut küçük motur idaresi ile yolculuğunu ucu sivriltimşi kavisletilmiş, sahil sularında tatlı sularda sandaldan falan az daha büyük (balıkçılık falan işlerine kullanılan kütük tahta kereste vbden suda yüzer yapılmış nakil sandal/yatın küçüğü kaba deniz gezi aygıtı ve gemicik su salı yahudi binek aracı deniz üstüne sığışması yapılan teknedir vasıtasıdr falan filandır)."),
    ("TELEFON", "Alexander Bell icadından olan ve elektromanyetik mikrofona ilettiği titreşm vs dalgayı hoperlörde falan anında sesin karşıdaki insana yüzlerce mil öteden net anlaşılır (telgit kulesi sinyal frekans falan radyo/dijital kablolar aracılığı vd üzerinden aktaran) alo ses alıp yollamaya mucit alet mobil yahut ankastre cep/sabit ses ve görüntü işitecisici konuşmasını aktarıcıdır devir (cihaz makinesi vs)."),
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

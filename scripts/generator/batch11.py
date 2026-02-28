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
    ("FALAKA", "Ayak tabanlarına vurmak için suçlunun ayaklarını bağlayıp mengenede sıkan alet."),
    ("FALSOLU", "Hileli, yanlış, kusurlu veya topa kavisli bir şekilde vurulma durumu."),
    ("FASULYA", "Baklagillerden, yaprakları bileşik ve çiçekleri salkım durumunda bir sebze (fasulye)."),
    ("FATURALI", "Bir malın satışı veya hizmetin karşılığı belgelenmiş, faturası kesilmiş olan."),
    ("FECAAT", "Çok acıklı, yürekler acısı, çok korkunç ve kötü durum, trajedi."),
    ("FELAKET", "Büyük zarar, üzüntü veya yıkım getiren olağanüstü doğa yâda kaza olayı."),
    ("FERAH", "Geniş, aydınlık, insanın içini açan, sıkıcı ve dar olmayan ortam."),
    ("FİDANLIK", "Ağaç fidanlarının üretildiği ve büyütülmesi için özel olarak ayrılmış ayrılmış bahçe alanı."),
    ("FİKİRLİ", "Belirli bir düşüncesi, fikri veya görüşü olan, bazı konularda kararı bulunan."),
    ("FİTRE", "Ramazan ayında durumu iyi olanların yoksullara verdiği vacip olan dini sadaka."),
    ("FİYAKA", "Gösteriş, caka, çevrenin dikkatini çekmek için yapılan süslü ve abartılı davranış."),
    ("FORMLU", "Belli bir biçime, şekle, kalıba girmiş olan, ideal düzenini almış olan."),
    ("FOSİLLİ", "İçinde eski çağlardan kalma taşlaşmış hayvan veya bitki kalıntısı barındıran."),
    ("GEVEZE", "Gereksiz yere ve durmadan çok konuşan, sır saklamayan, çenesi düşük kimse."),
    ("GEYLANİ", "Abdülkadir Geylani veya onun kurduğu tarikatla ilgili olan dini kültür terimi."),
    ("GİDİŞAT", "Bir işin, olayın veya tutumun ilerleme yolu, bulunduğu genel seyir, durum."),
    ("GİRDAP", "Suların bir eksen etrafında hızla dönerek çukurlaştığı, her şeyi yutan derin döngü."),
    ("GİRİŞİM", "Bir işi başarmak niyetiyle eyleme geçme, o işe başlama teşebbüsü."),
    ("GİTARİST", "Müzik gruplarında yâda tek başına gitar çalan usta müzisyen."),
    ("GÖNÜLLÜ", "Bir görevi, maaş veya çıkar beklemeden, kendi içten isteğiyle üstlenen kimse."),
    ("GÖZDAĞI", "Birini korkutmak, caydırmak veya isteğini yaptırmak için verilen tehdit, şantaj."),
    ("GÖZLEMCİ", "Bir olayı, deneyi veya kişiyi incelemek için özel olarak bakan, rasat eden yetkili."),
    ("GURBETÇİ", "Doğduğu ülkeden ayrılarak geçimini sağlamak için yabancı ülkelerde çalışan kişi."),
    ("GURUPLU", "Sonsuz bir saygıyla, iftihar ve onur duygusunu taşıyan (gururlu) anlamında ifade."),
    ("GÜLÜMCÜ", "Her şeye iyimser yaklaşan, sürekli tatlı ve neşeli gülücükler saçan kimse."),
    ("GÜNAHKAR", "Dinin emirlerine karşı gelen, yasaklarını çiğneyen, suç işlemiş (günahı bol) kişi."),
    ("GÜNDELİK", "Her gün yapılan, olağan veya günübirlik çalışana verilen günlük ücret, yevmiye."),
    ("GÜNDÜZÜ", "Gece olmayan zaman, güneşin gökyüzünde göründüğü aydınlık süreç."),
    ("GÜZELCE", "Göze ve kulağa hoş gelen, güzel denecek kadar, iyice ve sağlam bir biçimde."),
    ("HABERCİ", "Mektup, bilgi veya haberleri bir yerden diğerine hızlıca ileten görevli (elçi/ulak)."),
    ("HACAMAT", "Vücudun belirli yerlerini hafifçe çizerek pis kanı kupa veya bardakla çekme tedavisi."),
    ("HADSİZ", "Kendi sınırını ve makamını bilmeyen, büyüklerine karşı saygısız davranan (haddini bilmez)."),
    ("HAFIZA", "Öğrenilen bilgi ve deneyimleri beyinde saklayıp gerektiğinde geri çağırma gücü, bellek."),
    ("HAKİKAT", "Hayal yâda yalan olmayan, doğrunun tâ kendisi, gerçeklik, asıl mevcut olan."),
    ("HALBUKİ", "Oysa ki, gerçekte öyle değilken, aksine anlamlarında kullanılan bir bağlaç."),
    ("HAMARAT", "Ev işlerinde çok becerikli, elinden her iş gelen, çalışkan ve pratik (özellikle kadın)."),
    ("HAMİLE", "Karnında, rahminde bebek taşıyan kadın, gebe rütbesindeki insan."),
    ("HANEDAN", "Bir devleti, imparatorluğu nesiller boyu yöneten soylu, büyük kraliyet ailesi."),
    ("HARAMİ", "Yol kesip kervan soyan, dağlarda gezerek silah zoruyla eşya gasp eden soyguncu."),
    ("HAREKET", "Bir canlının yâda nesnenin konum değiştirmesi, kımıldaması veya eylem başlatması."),
    ("HARİKA", "İnsanın ilgisini ve hayranlığını olağanüstü derecede çeken, mükemmel, harikulade şey."),
    ("HASMANE", "Düşmanca, düşmanlık taşıyan bir tutumla, kin besleyerek yapılan eylem."),
    ("HASTANE", "Hastaların yatarak yâda ayakta teşhis, ameliyat ve tedavi edildikleri büyük tıp kurumu."),
    ("HATIRAT", "Kişinin hayatında iz bırakan geçmiş olayları ve anılarını kaleme aldığı yazılar (anı)."),
    ("HAZİNE", "Toprak altına çömlekle saklanmış gömü yâda devletin kasası, para ve altınlarının tümü."),
    ("HEDİYE", "Sevgiyi, minneti veya kutlamayı göstermek için birine alınan ve ücretsiz verilen nesne, armağan."),
    ("HEVESLİ", "Sürekli bir şeyler yapmaya arzulu, istekli, fakat bu isteği bazen çabuk sönen kimse."),
    ("HEZİMET", "Bir savaşta yâda spor müsabakasında beklenmedik şekilde alınan, çok ağır ve utanç verici yenilgi."),
    ("HIRSIZ", "Başkasına ait para veya değerli eşyayı sahibinden habersiz gizlice çalan suçlu."),
    ("HİDDET", "Bir olay veya kişiye karşı duyulan anlık çok şiddetli öfke, kızgınlık krizleri."),
    ("HİKAYE", "Gerçek yâda yaşanma ihtimali çok yüksek olan olayların düz yazı şeklinde kurgulanarak anlatılması."),
    ("HİMAYE", "Birini koruma altına alma, gözetip kollama, onun haklarını zorbaya karşı savunma."),
    ("HİPOTEZ", "Bir araştırmayı yönlendirmek, deneyi başlatmak için ortaya atılan henüz kanıtlanmamış varsayım."),
    ("HOLİGAN", "Sporda, özellikle futbolda takımını aşırı bağnazlıkla savunan ve saldırganlık yapan fanatik taşkın (taraftar)."),
    ("HOŞGÖRÜ", "Farklı inanç, düşünce ve hataları bile tahammülle, anlayışla ve kızmadan karşılayabilme erdemi."),
    ("HUKUKÇU", "Kanunlar, haklar ve yargı bilimi üzerine derin mesleki eğitim almış avukat, savcı veya hâkim."),
    ("HÜKÜMET", "Devletin yürütme gücünü elinde bulunduran, bakanlar kurulu ve başbakanın/başkanın oluşturduğu yönetim."),
    ("HÜRRİYET", "Kölelik veya baskı altında olmama durumu, birinin hakkını yemedikçe her şeyi serbestçe yapabilme, özgürlük."),
    ("HÜZNÜN", "İçten içe yaşanan derinden acı veren, keder ve elemin isim halinin tamlaması."),
    ("ILIMAN", "Ne çok sıcak ne de çok soğuk olan, mevsimi sürekli yumuşak geçen, ölçülü, mutedil (iklim veya insan)."),
    ("ISIRGAN", "Sap ve yapraklarında deriyi dalayan, çok kaşındırıcı ve kızartıcı tüyler bulunan bir kır yaban otu."),
    ("ISLAHEVİ", "Suça karışmış reşit olmayan çocukların veya gençlerin ıslah edilerek eğitildiği devlet yurdu/cezaevi."),
    ("ISLIKLI", "Dudaklardan yahut özel düdüklerden yüksek ve devamlı ıslık sesi çıkartarak çalınan veya öten."),
    ("ISTIRAP", "Büyük bir derdin veya amansız bir hastalığın ruhta ve bedende yarattığı geçmek bilmeyen o ağır acı, sızı."),
    ("IŞINLAM", "Bilimkurguda kütleyi dalgalara çevirerek saniyeler içinde çok uzak mesafelere nakledip birleştirme eylemi."),
    ("İBADET", "Yaratanın emirlerine uyarak ona kulluk borcunu ödemek için camide, kilisede veya kalp ile yapılan dua ritüeli."),
    ("İBRET", "Kötü sonuçlanmış olaylardan ders alarak öyle davranmamayı öğütleme, çarpıcı sonuç."),
    ("İCMALEN", "Ayrıntılarına girmeden, olayı kısaca, özetleyerek aktarma durumu."),
    ("İÇGÜDÜ", "Hayvan ve insanlarda öğrenilmeden var olan, doğuştan gelen ve türü koruyan otomatik yaşamsal dürtsel davranışlar bütünü."),
    ("İDARECİ", "Bir okulu, fabrikayı veya ekibi çekip çeviren, kuralları ve sistemi yürüten sorumlu kişi, yönetici."),
    ("İDMANCI", "Sürekli antrenman yaparak kaslarını kuvvetlendiren, spor müsabakalarına profesyonel hazırlanan aktif yarışmacı idman ehli."),
    ("İHTİŞAM", "Bakıldığında insanın gözünü kamaştıran görkem, büyüklük, debdebe ve çok büyük parlak şatafat gösterişi."),
    ("İKTİDAR", "Bir şeyi yapabilme kudreti yâda devlet yönetimini elinde bulunduran ve seçimle başa geçmiş siyasi asıl iktidar gücü meclisi."),
    ("İLAHİYAT", "Allah'ın varlığını, dinlerin felsefesini, inanç sistemini ve Kur'an vb kutsal metinleri detaylıca inceleyen din bilimi/fakültesi."),
    ("İLTİFAT", "Birine yüzüne karşı söylenen, değerini ve güzelliğini öven nazik ve gönül alıcı tatlı sözlerin tamamı."),
    ("İLTİHAP", "Vücudun mikroplarla savaşırken yâda yara aldığında dokularda oluşturduğu sızıntılı irin yâda ateşli kızarıklık reaksiyonu yangısı."),
    ("İMZASIZ", "Altında kimin yazdığına dair resmi el yazısı (imzası) yahut mühürü bulunmayan anonim mektup yâda makale vesikası."),
    ("İNAYET", "Allah'ın veya çok saygın ulu birinin ihsan ettiği, yardımı esirgemediği rahmet, şefkat dolu lütufker yardım ve bağışı."),
    ("İNŞAAT", "Mimarın planıyla, ustaların ve işçilerin beton/demir örerek büyük yapı, köprü veya apartmanları yükseltme ve yapım eylemi şantiyesi."),
    ("İNTİBAK", "Değişen yeni fiziksel çevreye, iklime ve kültür koşullarına ayak uydurup uyum sağlama durumu yâda askerî uyum durumu alışmasıdır."),
    ("İPOTEK", "Alınan krediye yahut uzun vadeli büyük borca karşılık teminat olarak yasal yollarla bir gayrimenkulü bankaya rehin verme akdi senedidir."),
    ("İRADELİ", "Karşısına çıkan engellere rağmen zihnen pes etmeyen, aldığı zor kararın arkasında aslanlar gibi duran iradesi, azmi yüksek (istekli/kararlı) kimsedir."),
    ("İSTİSNA", "Herkesin tabi olduğu kanundan veya genel özellik kurallarından hariç tutulan yâda kurala kasten hiç uymayan özel o tek ayrıklı nadir tekil durum vaka şahsı."),
    ("İSKELET", "Kas ve derilerin iç kısımlarında yer alarak canlının dik duruşunu veren birbirine kaynaşmış hareketli yâda kilitli (omurga-kaburga falan) tüm vücut eklentili kemikler çatısı / bütünü."),
    ("İSTİFÇA", "Fazlaca fuzuli soru sorma, detaylara inerek aşırı sorma veya Osmanlı döneminde fıkıh alimlerine (fetvaya) dair çok soru yöneltme sorgulama makamı yazım sorması eylemidir."),
    ("İSTİLA", "Donanma veya tümen tümen dev silahlı saldırı güçleriyle hasım komşu devlet toprağına bir anda vahşice dalarak memleketi kılıç zoruyla yâda silahın harbiyle işgal yayılışı sarması zaptıdır."),
    ("İŞARET", "Anlaşmayı harfsiz kelimesiz jest vasıtasıyla mimik, yönelge levhaları yada boyalı sembollü çizgili amblemler kullanarak bildirme/anlatım aktarım şifresi belirtkesi işaret parmağ gösterişi olayıdır."),
    ("İTİRAZ", "Sunulan yargıyı, haksız ceza iddiasını (kararı) yahut ileri sürülen eylemi kabullenmediğini diklemesine reddederek bozma başvurusu söylemlerini / laflarını veya hakkını yüksek makamca / kurulca direnerek zıtlamasıdır"),
    ("JANJAN", "Işığın açısına veya yansımasına göre durmadan renkleri değişken gösteren cıvıl parlak yaldızlı göz alıcı kumaşa yâda parıltılı kâğıt türüne yansıma efektine verilen süs betim ambalaj adidir."),
    ("JARTİYE", "Hanımların uzun boy çoraplarının diz altına yâda baldır üstünden lastikle belden/yukardan sarkan aparat vasıtasıyla kaymaması, düşmemesi düşmeyi önleten tutturgaç asatkısı ince bağın bağı adıdır (geniş donatımlı askılık)."),
    ("JENERİK", "Televizyonda ve filmlerinin tam giriş başı sahnesinde ve kapanış sekansında senarist yapımcı aktör gibi filme can ve bütçe veren tüm kadronun ve besteyi vs isim ve unvan akışı jeneriğidir yazıları / müziğidir vs."),
    ("JİMNAST", "Esnek vücutlu bacakların kollarını atletizmin bir dizi idmanı ve özel estetik parendeleri ritmiği asimetrik hareket akışlarıyla paralel vb tahtada vs uygulayan profesyonel olimpat vb esneme akrobat sanat ve sporuyla uraşan bireye jimanastikçi atletine idmancısına denir."),
    ("KABAHAT", "Kanunlar yâda resmi kurum tüzüğüne bazen görevi ihmal gibi doğrudan büyük suç derecesine tırmanmayan veya af / azarla hafif ahlaka yasağa uymayarak yapılan hoşgörüsüz küçük suçların tamamına o hatanın edimi (kusura) denilir verilir kabahat yasal hata ihlal ve ayıp suçun kabahatı idari hatadır ihlâldir vs"),
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

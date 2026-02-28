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
    ("GABARİ", "Araçların yüklü veya yüksüz uzunluk/genişlik ölçüsü."),
    ("GADDAR", "Acımasız, insafsız, merhameti olmayan kimse."),
    ("GALERİ", "Sanat eserlerinin veya otomobillerin sergilendiği yer."),
    ("GALİBA", "Büyük bir ihtimalle, sanırım, görünüşe göre."),
    ("GARDİYAN", "Hapishanelerde tutukluları gözetleyen görevli, infaz koruma."),
    ("GARNİZON", "Bir şehrin veya bölgenin askerlerin barındığı yer."),
    ("GASTRONOMİ", "İyi yiyecek bilimi, yemek sanatı."),
    ("GAYRET", "Bir işi başarmak için gösterilen çaba ve çalışma."),
    ("GAZETE", "Haber ve yorum içeren günlük veya haftalık periyodik yayın."),
    ("GAZİNO", "İçkili, müzikli, gösterili eğlence mekânı."),
    ("GEBERMEK", "Ölmek kelimesinin kaba bir dille söylenmesi."),
    ("GECEKONDU", "İzinsiz olarak devlet arazisine aceleyle yapılmış derme çatma ev."),
    ("GECİKMELİ", "Belirlenen zamandan sonra gerçekleşen, rötarlı."),
    ("GEÇİCİ", "Sürekli olmayan, belirli bir süre için olan, muvakkat."),
    ("GELECEK", "Şu andan sonra yaşanacak olan zaman, istikbal."),
    ("GELENEK", "Kuşaktan kuşağa aktarılan ritüel veya alışkanlıklar, anane."),
    ("GENELEMEK", "Bir durumu benzer tüm durumlar için geçerli saymak."),
    ("GEREKÇE", "Bir şeyin temel nedeni, dayanağı, esbabımucibesi."),
    ("GETİRİ", "Bir yatırım veya çaba sonucunda elde edilen kâr veya kazanç."),
    ("GEYLANİ", "Büyük İslam velisi veya o soydan gelen."),
    ("GEZGİN", "Sürekli yeni yerler görüp dolaşan kimse, seyyah."),
    ("GİRİŞİM", "Bir işi başarmak için harekete geçme, teşebbüs."),
    ("GİTAR", "Altı telli, parmak veya penayla çalınan müzik aleti."),
    ("GİZEMLİ", "Sır barındıran, akılla açıklanamayan, esrarlı."),
    ("GOLCÜ", "Futbolda vs sık skor üreten, topu ağlara gönderen oyuncu."),
    ("GÖBEK", "Karın bölgesinin çukurumsu tam ortası."),
    ("GÖÇMEN", "Kendi ülkesinden başka ülkeye yerleşen kimse, muhacir."),
    ("GÖKYÜZÜ", "Göğün yeryüzünden görünen engin bölümü, sema."),
    ("GÖLGE", "Işığı engelleyen bir kütlenin arkasında oluşan karanlık alan."),
    ("GÖNÜLLÜ", "Bir işi hiçbir zorlama olmadan, maaşsız yapan kişi."),
    ("GÖRECELİ", "Kişiden kişiye değişen, kesin olmayan, izafi."),
    ("GÖRGÜ", "Bir toplum içinde yaşayarak öğrenilen genel davranış kuralı."),
    ("GÖSTERİŞ", "Dikkati ve ilgiyi üzerine çekmeye yönelik durum, fiyaka."),
    ("GÖZDE", "Çok sevilen, değer verilen veya herkesin beğendiği (kişi)."),
    ("GÖZLEM", "Bir olayı planlı ve yakından inceleme, rasat."),
    ("GRAFİK", "Bir olayın veya sayının çizgilerle, şekillerle betimlenmesi."),
    ("GURBET", "Doğup büyünmüş yerden uzak olan tüm yabancı yerler."),
    ("GURUR", "Büyüklenme, kendini üstün görme veya övünç duyma."),
    ("GÜLÜMSEYİŞ", "Yüzde mutluluğun veya memnuniyetin hafifçe belirmesi."),
    ("GÜNAH", "Dinin kurallarına uymayan veya vicdana aykırı hareket."),
    ("GÜNDELİK", "Her gün yapılan, olağan veya günlük yevmiye."),
    ("GÜNDÜZ", "Güneşin doğuşu ile batışı arasındaki aydınlık zaman dilimi."),
    ("GÜVENÇ", "Birine bel bağlama, tereddüt etmeme, itimat."),
    ("GÜZERGAH", "Belli bir yere gitmek için izlenmesi gereken belirli yol, rota."),
    ("GÜZEL", "Göze, kulağa hoş gelen, hayranlık uyandıran şey."),
    ("HABER", "Bir olay, durum hakkında duyulan veya iletilen güncel bilgi."),
    ("HACİZ", "Borçlunun malını ödeyene dek resmi olarak alıkoyma işlemi."),
    ("HAFRİYAT", "İnşaat öncesi toprağı kazma, sökme veya nakletme işi."),
    ("HAFİF", "Ağırlığı veya etkisi az olan, taşınması kolay olan."),
    ("HAKARET", "Bir kimsenin onurunu kırıcı kırıcı, kötü söz söyleme."),
    ("HAKİKAT", "Gerçek olan şey, doğrunun ta kendisi."),
    ("HAKKAK", "Kazıma, oyma sanatını icra eden sanatçı."),
    ("HALE", "Ay ve Güneşin etrafında bazen görülen dairesel ışık halkası."),
    ("HALI", "Kısa tüylü, ipliklerle desen dokunmuş kalın yer örtüsü."),
    ("HALK", "Aynı ülkede yaşayan tüm insanların toplamı, ahali."),
    ("HAMSİ", "Karadeniz'in sembolü olan çok lezzetli, zayıf, küçük balık."),
    ("HANÇER", "Düz ve kısa namlulu, iki tarafı da keskin büyük sivri bıçak."),
    ("HAPİS", "Ceza olarak kişinin özgürlüğünden alıkonularak kapatıldığı yer."),
    ("HARAM", "Din kurallarına göre yapılması kesin yasak olan davranış."),
    ("HAREKET", "Bir cismin bulunduğu yeri veya durumu değiştirmesi, eylem."),
    ("HARİKA", "İnsanda hayranlık sınırlarını aşan büyük hayret uyandıran şey."),
    ("HARİTA", "Ülkelerin, denizlerin düzlem üzerine oranlı olarak çizilmiş hali."),
    ("HASRET", "Özel birine veya mekana duyulan büyük ayrılık özlemi."),
    ("HASTA", "Vücudunun bir yerinde hastalık olan, sağlığı bozuk kimse."),
    ("HASTANE", "Hastaların muayene ve tedavi edildikleri klinik, şifahane."),
    ("HAŞMETLİ", "Sonsuz, gösterişli ve korku karışık büyük saygı uyandıran."),
    ("HATIRA", "Yaşanmış bir olayın anısı veya zihinde kalan geçmiş izi."),
    ("HATIRLATMA", "Unutulan bir şeyi akla geri getirecek bir fiil yapmak."),
    ("HAVLU", "Banyodan sonra kurulanmak için kullanılan emici dokunmuş bez."),
    ("HAYAL", "Zihinde tasarlanan veya gerçekleşmesi istenen kurgu görüntü."),
    ("HAYLAZ", "Hoş görülebilecek yaramazlıklar yapan veya söz dinlemeyen çocuk."),
    ("HAYRAN", "Birine veya bir şeye son derece düşkün olan veya şaşkın olan."),
    ("HAYVAN", "İnsan ve bitkiler dışındaki canlılara, yaratıklara verilen ad."),
    ("HAZİNE", "Toprakta saklı gömü veya devletin altın/para depoladığı yer."),
    ("HECE", "Bir nefeste çıkabilen ses veya sesten oluşan kelime parçası."),
    ("HECELMEK", "Sözcükleri harf harf gruplayarak okumaya çalışmak."),
    ("HEDEF", "Sonuna veya üstüne varılmak/vurulmak istenen nokta vb, nişangâh."),
    ("HEDİYE", "Birine sevgiyi veya teşekkürü göstermek için verilen armağan."),
    ("HEKİM", "Hastaları tedavi eden bilimsel donanıma sahip kişi, tıp doktoru."),
    ("HEMEN", "Gecikmeden, anında, o saniye içinde."),
    ("HEMŞİRE", "Kız kardeş veya hastanelerde hekime yardım eden melek hasta bakıcı."),
    ("HESAP", "Sayıları kullanarak sonuca varma işi veya restorandaki adisyon."),
    ("HEVES", "Gelgeç, ani ve süresi belli olmayan güçlü istek."),
    ("HEYKEL", "Taş veya kile artistik biçim verilerek çıkarılan 3D sanat eseri."),
    ("HIRSIZ", "Başkasına ait şeyi hukuka aykırı sahiplenen, gizlice veya zorla çalan kişi."),
    ("HİÇBİR", "Olumsuz cümlelerde yokluğu belirten veya herhangi biri anlamındaki zamir."),
    ("HİKAYE", "Gerçek veya kurgulanmış uzun bir olayı edebi anlatan düz yazı türü, öykü."),
    ("HİLEKÂR", "İnsanları aldatarak hedefine ulaşmaya yeltenen madrabaz."),
    ("HOROZ", "Kümes hayvanları (tavuk) sürüsünü ve ailesini koruyan erkek tavuk."),
    ("HOŞGÖRÜ", "Farklı düşünce ve inançları makul, olgunlukla ve barışçıl karşılama durumu."),
    ("HUKUK", "Toplumu düzenleyen, bireylerin hak ve yetkilerini koruyan tüm yasalar/kanunlar sistemi."),
    ("HURAFE", "Dinde aslında olmayan, asılsız, temelsiz eski inanç ve mit, bâtıl itikat."),
    ("HÜCUM", "Hızla birinin üstüne doğru taarruz etme, askeriyede veya sporda atılma."),
    ("HÜKÜMDAR", "Ülkeyi tek başına yöneten prens, padişah, şah, veya kral gibi kimse."),
    ("HÜRYA", "Birdenbire topluca, itiş kakış içinde koşuşturarak gidiş/dalış (argo/eski)."),
    ("HÜZÜN", "İçten, yumuşak, acı veren yoğun bir duygu hissi, elemin tortusu."),
    ("ISIRGAN", "Dokunulduğunda deriyi kaşındıran asitler salgılayan bir yabani ot bitkisi."),
    ("ISLIK", "Dudakları büzerek ve nefesi dışarıya güçlü üfleyerek çıkarılan keskin ses."),
    ("IŞIK", "Karanlığı aydınlatan ve gözün görebilmesini sağlayan enerjinin elektromanyetik hali."),
    ("IZGARA", "Eti veya sebzeyi ateş üstünde pişirmeye yarayan, tel örtülü ızgaralı alet veya yemeği."),
    ("IZDIRAP", "Büyük, çözümsüz veya kronik ruhi ve fiziki şiddetli sızı, acı."),
    ("İADE", "Bir nesneyi sahibine eskisinden daha iyi vererek veya alındığı gibiverme durumu, geri verme."),
    ("İBARET", "Bundan oluşan, bundan müteşekkil, sadece bunu kapsayan büyüklükte (veya varlıkta)."),
    ("İÇECEK", "Su gibi sıvı olup gıda ihtiyacı için tüketilebilen yudumlanan miktar veya form."),
    ("İDARE", "Devlet dairesindeki yönetim, eldeki kısıtlı şeyleri ölçülü kullandırtma mekanizması."),
    ("İDDİA", "Henüz kesinlik kazanmamış olmakla birlikte karşı fikir, savunma veya atışma unsuru olan varsayım."),
    ("İDEAL", "Mükemmele, arzu edilen kusursuzluğa çok yakın durumda, harika, zihindeki emel."),
    ("İFA", "Üzerine görev veya resmi olarak düşmüş bir eylemi yerine getirme, sonuçlandırma."),
    ("İHTİYAÇ", "Mutlaka varlığı veya tedariki gerekli eksiklik olan şeyler veya zaruri malzeme."),
    ("İHTİYAT", "Gelecekte karşılaşılabilinicek kötü veya dar günleri düşünerek öncesinden, dikkatle saklama yapma."),
    ("İKAMETGAH", "Kişinin yasallığı belirlenmiş olan oturduğu mahalle veya konut adresi."),
    ("İKNA", "Karşısındaki kişiyi, rıza yöntemiyle veya usulle doğru ve mantıklı bir işe yöneltmeye inandırma."),
    ("İLAHİ", "Tanrısal olan, Allah'ı öven dinsel makamlı müzikal söylem/şiir."),
    ("İLAN", "Herkese duyurmak, medya ile sergilemek üzere yazılmış genel duyuru, afiş."),
    ("İLETİŞİM", "İki kişi veya teknoloji vasıtasıyla kurulan bilgi ve bağlantı trafiği."),
    ("İLHAM", "Sanatçıya eserini yaratırken gelen görünmez doğaüstü duygu esini."),
    ("İMA", "Direkt söylemeden veya belli etmeden jestlerle, sezdirerek dokundurma yapmak."),
    ("İMKAN", "Bir olayın gerçekleşebilmesi ihtimali, fırsatı, yaratan durum avantajı."),
    ("İMTİHAN", "Okullarda öğrencilerin bilgi ölçümünün sınanma sınavı süreci, sınanma, süzülme."),
    ("İMZA", "Bir belgenin onayını verenin kaleme aldığı, yasal öz kimlik karakteristiki simgesi/harfi."),
    ("İNANÇ", "Düşüncede körü körüne veya sonsuz idraki kanaatle duyulan manevi bağlanma itikadı."),
    ("İNSAN", "Düşünebilen varlık olan dünya üzerindeki memeliler türünden (homosapiens)."),
    ("İNSAF", "Yumuşak davranarak acıma ile vicdan ve ahlakın getirdiği hakkaniyeti uygulama eğilimi."),
    ("İNTİKAM", "Yapılan adaletsizlik veya büyük zararı karşılık göstererek cezalandırma hissi ruhu, öç."),
    ("İPİ", "Liflerin örülmesi sonucu ortaya çıkan ve ip veya sarma vazifesinde ki esnek örgülü dizi."),
    ("İSİM", "Varlıkları biricik ifadeyle tanıtan işaret ve çağrı ad."),
    ("İSRAİL", "Ortadoğuda Kudüs/TelAviv kentleri olan veya Hz. Yakubun dinsel ismi."),
    ("İSRAF", "Mal ve kaynakları boş yere gereksiz ve çok lüks tüketen müsrif harcama hatası."),
    ("İSTİKLAL", "Tam bağımsız olmak, köle veya manda dışında özgür millet/ferdi karakter."),
    ("İŞARET", "Anlaşmanın mimikle veya yazılı obje simgeleriyle, yön vs tarif belirtkesi."),
    ("İŞÇİ", "Bedensel gücü çalışarak maaş geliri için iş sözleşmesi gereği üretim faaliye yapan."),
    ("İTİRAF", "Gizlenen saklı doğru ve yasaklı hataların kabullenilip kişinin söylemesi dışa vurması durumu."),
    ("İYİLİK", "Menfaat beklemeden şefkat ve yardım etme olgusu veya sıhhat durumu iyi oluş/iyilik. "),
    ("İZDİHAM", "Aşırı kalabalığın itişerek aynı merkeze ilerleyememesi sığışamaması arbedesi durumu."),
    ("İzlenim", "Görülen manzaradan veya kişiden alınan akılda uyanan his veya kanı tortusu, intiba."),
    ("JALUZİ", "İnce uzun, yan yana ahşap plastik parçaların pencere önünde döndürülerek ışık azaltan stor."),
    ("KABUS", "Ağır basarak uykuda kişiyi paniğe sürükleyen dehşetli kötü ve ağır rüya silsilesi, karabasan.")
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

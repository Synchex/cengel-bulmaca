const fs = require('fs');
const path = require('path');

const chunk1 = "ABACI,ABALI,ABAZA,ABDAL,ABİDE,ABLAK,ABONE,ABRAŞ,ACABA,ACELE,ACEMİ,ACUBE,ACUZE,AÇLIK,AÇMAK,ADALE,ADALİ,ADAMA,ADESE,ADETA,ADINA,ADRES,AFAKİ,AFİŞE,AFSUN,AFŞAR,AFTOS,AĞCIK,AĞDAŞ,AĞLAK,AĞMAK,AĞYAR,AHALİ,AHBAP,AHENK,AHKAM,AHLAK,AHMAK,AHRAZ,AHRET,AHSEN,AHVAL,AİDAT,AİLEL,AJANS,AJİTE,AKABE,AKAİD,AKAJU,AKAMET,AKÇIL,AKİDE,AKKOR,AKRAN,AKSAK,AKSAM,AKSON,AKŞAM,AKTAR,AKTİF,AKTÖR,ALACA,ALAKA,ALARM,ALBÜM,ALÇAK,ALEMİ,ALENİ,ALEVİ,ALGOR,ALICI,ALİZE,ALKAN,ALKIM,ALKOL,ALMAÇ,ALMAK,ALMAN,ALTIK,ALTIN,ALTIŞ".split(',');
const chunk2 = "ALYUVAR,AMADE,AMBAR,AMBER,AMBİG,AMBLEM,AMELİ,AMİGO,AMORF,AMPER,AMPİR,AMPUL,ANALI,ANANE,ANANAS,ANCAK,ANDIÇ,ANDRO,ANEMİ,ANGIÇ,ANGLE,ANİDE,ANKA,ANKET,ANLAK,ANLAM,ANMAK,ANOMİ,ANONS,ANTÇI,ANTEN,ANTET,ANTİK,ANTRE,ANYON,APACI,APOLET,APORT,APOŞT,APOTR,APRİL,APSEL,APTAL,ARABA,ARABAŞI,ARABİ,ARACI,ARAF,ARAKA,ARALI,ARALIK,ARAMA,ARAP,ARAZİ,ARBEDE,ARDIL,ARDIÇ,ARGIN,ARGO,ARICI,ARIZA,ARİFE,ARİYA,ARKAÇ,ARKAŞ,ARKON,ARMUT,ARMUZ,AROMA,ARPÇI,ARPEJ,ARTÇI,ARTIM,ARTIN".split(',');
const chunk3 = "ARTIŞ,ARTMA,ASABE,ASABİ,ASALI,ASENA,ASGAR,ASILİ,ASILI,ASİDE,ASİMET,ASİST,ASKER,ASLAN,ASMAK,ASORT,ASPAR,ASRİN,ASTAR,ASTAT,ASTIM,AŞAĞI,AŞAMA,AŞARİ,AŞEON,AŞEVİ,AŞICI,AŞILI,AŞIRI,AŞİNA,AŞKAR,AŞKİN,AŞMAK,ATAŞE,ATFEN,ATICI,ATILI,ATKİL,ATLAS,ATLET,ATMAK,ATMIŞ,ATOLL,ATOM,ATONL,ATTAR,AVANE,AVANS,AVARA,AVARE,AVAZİ,AVELL,AVRET,AVŞAR,AVUCA,AVUNÇ,AVURT,AYAZİ,AYBE,AYDIN,AYGIR,AYGIT,AYIPL,AYIRI,AYLAK,AYLIK,AYMAK,AYNEN,AYRAÇ,AYRAN,AYRIM,AYRIT,AZADE,AZAMİ,AZERİ".split(',');
const chunk4 = "AZGIN,AZILI,AZİZE,AZMAN,AZNİF,AZOİK,BABAİ,BABAM,BACA,BACAK,BAÇÇI,BADAK,BADAŞ,BADEM,BADIÇ,BADİK,BADYA,BAFİT,BAGAJ,BAĞAN,BAĞCI,BAĞDA,BAĞIL,BAĞIM,BAĞIR,BAĞIŞ,BAĞIT,BAĞLI,BAĞRI,BAHA,BAHAR,BAHÇE,BAHİR,BAHİS,BAHRİ,BAHŞİ,BAKÇI,BAKIM,BAKIR,BAKIŞ,BAKİR,BAKLA,BAKMA,BAKŞİ,BALAR,BALAT,BALCI,BALDO,BALET,BALIK,BALİĞ,BALKI,BALON,BALOT,BALTA,BALYA,BAMBU,BAMYA,BANAK,BANAL,BANDO,BANKA,BANMA,BANYO,BARAJ,BARAK".split(',');
const chunk5 = "ÇABUK,ÇADIR,ÇAĞAN,ÇAĞLA,ÇAĞRI,ÇAKAL,ÇAKIL,ÇAKIM,ÇAKIN,ÇAKIR,ÇAKMA,ÇALAK,ÇALGI,ÇALIK,ÇALIM,ÇALTI,ÇAMAŞ,ÇAMUR,ÇANAK,ÇANTA,ÇAPAK,ÇAPAR,ÇAPLA,ÇAPMA,ÇAPUT,ÇARIK,ÇARKA,ÇARPI,ÇARŞI,ÇASAR,ÇATAK,ÇATAL,ÇATIK,ÇATIŞ,ÇATKI,ÇATMA,ÇAVUN,ÇAVUŞ,ÇAYCI,ÇAYIR,ÇEÇEN,ÇEDİK,ÇEKEL,ÇEKİÇ,ÇEKİK,ÇEKİM,ÇEKİŞ,ÇEKME,ÇELEN,ÇELİK,ÇELİM,ÇELLO,ÇELME,ÇEMEN,ÇEMİÇ,ÇEMİŞ,ÇENEK,ÇENGİ,ÇEPEL,ÇEPER,ÇEPEZ,ÇEPNİ,ÇERAĞ,ÇERÇİ,ÇEREZ,ÇERGE,ÇEŞİT,ÇEŞME,ÇESNİ,ÇETİN,ÇEVİK,ÇEVRE,ÇEVRİ,ÇEYİZ,ÇIBAN,ÇIDAM,ÇIĞIR,ÇIĞLIK,ÇIKAN,ÇIKAR,ÇIKIK,ÇIKIN,ÇIKIŞ,ÇIKIT,ÇIKMA".split(',');
const chunk6 = "ÇIKTI,ÇINAR,ÇINGI,ÇIPIR,ÇIRAK,ÇIRPI,ÇITIR,ÇIZIK,ÇİÇEK,ÇİFTE,ÇİĞDE,ÇİĞİL,ÇİĞİN,ÇİĞLİ,ÇİLER,ÇİLEK,ÇİLLİ,ÇİMEK,ÇİMEN,ÇİMİŞ,ÇİNKO,ÇİNLİ,ÇİNTİ,ÇİRİŞ,ÇİRKİ,ÇİROS,ÇİSEN,ÇİVİT,ÇİZER,ÇİZGE,ÇİZGİ,ÇİZİK,ÇİZİM,ÇİZİŞ,ÇİZME,ÇOBAN,ÇOCUK,ÇOĞUL,ÇOĞUN,ÇOKAL,ÇOKÇA,ÇOKLU,ÇOLAK,ÇOMAK,ÇOMAR,ÇOPRA,ÇOPUR,ÇORAP,ÇORBA,ÇORLU,ÇORUM,ÇOTRA,ÇÖĞÜR,ÇÖKEK,ÇÖKEL,ÇÖLDE,ÇÖMEZ,ÇÖMÜÇ,ÇÖPÇÜ,ÇÖPLÜ,ÇÖREK,ÇÖRKÜ,ÇÖRTÜ,ÇÖVEN,ÇÖZÜM,ÇÖZÜŞ,ÇUBUK,ÇUKUR,ÇULLU,ÇUVAL,ÇÜKÜR,ÇÜNKÜ".split(',');

const additionalRoots = ["KARA","SARI","MAVİ","YEŞİL","BEYAZ","SİYAH","PEMBE","MOR","TURUN","GÜMÜŞ","BAKIR","DEMİR","ÇELİK","ALTIN","ODUN","KÖMÜR","AKIL","FİKİR","DÜŞÜN","HAYAL","UMUT","BİLGİ","BİLİM","TARİH","COĞRA","KİMYA","FİZİK","KİTAP","DEFTER","KALEM","SİLGİ","MASA","KAPI","PENCE","DUVAR","TAVAN","TABAN","ZEMİN","TOPRAK","KUM","TAŞ","KAYA","DENİZ","GÖL","NEHİR","IRMAK","DERE","PINAR","YAĞMU","KAR","DOLU","AYAZ","RÜZGA","FIRTı","HORTU","BİBER","SOĞAN","SARIM","PİRİN","BULGU","MERCİ","MEYVE","ELMA","ARMUT","KİRAZ","ERİK","ÇİLEK","KAVUN","KARPU","ÜZÜM","İNCİR","ZEYTİ","CEVİZ","BADEM","FINDI","FISTI","HİNDİ","TAVUK","KAZ","ÖRDEK","KOYUN","KUZU","İNEK","ÖKÜZ","MANDA","DEVE","EŞEK","KATIR","ASLAN","KAPLA","LEOPA","PUMA","VAŞAK","KEDİ","KÖPEK","KURT","TİLKİ","DOMUZ","TAVŞA","FARE","YILAN","AKREP","BÖCEK","ASYA","AVRUP","OYNAR","ALICI","VERİC","YAZAR","ÇİZER","KOSAR","ATLAR","ZİPLA","YÜZER","DALAR","BAKAR","GÖRÜR","DUYAR","İŞİTİR","ANLAR","BİLİR","SEVER","SAYAR","ÜZÜLÜ","AĞLAR","GÜLER","COŞAR","KOŞAR"];
const suffixes = ["LIK", "LUK", "LÜK", "CIL", "CUL", "CÜL", "SIZ", "SUZ", "SÜZ", "DAŞ", "DEŞ", "TAŞ", "TEŞ", "MAN", "MEN", "GAN", "GEN", "GIÇ", "GİÇ", "GI", "Gİ", "GU", "GÜ", "TI", "Tİ", "TU", "TÜ"];

let words = [...chunk1, ...chunk2, ...chunk3, ...chunk4, ...chunk5, ...chunk6];
let existingWords = new Set();
const srcDir = path.join(__dirname, '../../src/data');
const EXISTING_FILE = path.join(srcDir, 'questions_db.json');

if(fs.existsSync(EXISTING_FILE)){
    JSON.parse(fs.readFileSync(EXISTING_FILE, 'utf-8')).forEach(q => q.correctAnswer && existingWords.add(q.correctAnswer.toUpperCase('tr-TR')));
}

words.forEach(w => existingWords.add(w.toLocaleUpperCase('tr-TR')));

let target = 1000;
let generatedWords = [];

for (let i = 0; i < words.length; i++) {
    if (generatedWords.length >= target) break;
    const word = words[i].toLocaleUpperCase('tr-TR');
    if (word.length >= 5 && word.length <= 7) {
        generatedWords.push(word);
    }
}

while (generatedWords.length < target) {
    let r1 = additionalRoots[Math.floor(Math.random() * additionalRoots.length)];
    let s1 = suffixes[Math.floor(Math.random() * suffixes.length)];
    let combined = (r1 + s1).toLocaleUpperCase('tr-TR');
    if (combined.length >= 5 && combined.length <= 7 && !existingWords.has(combined) && /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/.test(combined)) {
        existingWords.add(combined);
        generatedWords.push(combined);
    }
}

let questions = [];
generatedWords.forEach((word, index) => {
    questions.push({
        id: `gen-bulk-1000-${index}-${Date.now()}`,
        type: 'crossword',
        difficulty: 'hard',
        level: Math.floor(Math.random() * 3) + 7,
        prompt: `Şifreli ipucu: "${word.toLowerCase()}" kelimesinin eşanlamlısı, kök veya ek almış hali. (Zor seviye kelime).`,
        correctAnswer: word,
        tags: [`${word.length}-harf`, 'zor', 'genel', 'batch-1000']
    });
});

const outPath = path.join(srcDir, 'seeds/hard_words_batch_1000.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf-8');
console.log(`Saved exactly ${questions.length} questions into src/data/seeds/hard_words_batch_1000.json!`);


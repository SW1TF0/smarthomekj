import type { LegalDocs } from "./types";

// Turkish translation for convenience. In case of differences the Bulgarian version prevails.
const tr: LegalDocs = (s) => ({
  privacy: [
    {
      h: "1. Biz kimiz",
      p: [
        `Kişisel verilerinizin sorumlusu ${s.legalName}, UIC ${s.eik}, merkez adresi ${s.address}, ${s.city}, ${s.country} ("SmartHomeKJ", "biz"). İletişim: ${s.email}, ${s.phone}. Gizlilik soruları için ${s.dpoEmail} adresine yazın.`,
      ],
    },
    {
      h: "2. Hangi verileri neden işliyoruz",
      p: [
        "Siparişler: ad, e-posta, telefon, teslimat ve fatura bilgileri, sipariş içeriği ve ödeme durumu. Hukuki dayanak: sözleşmenin ifası (GDPR md. 6(1)(b)) ve muhasebe ve vergi mevzuatından doğan yasal yükümlülüklerimiz (md. 6(1)(c)).",
        "Danışmanlık ve teklif talepleri: iletişim formu aracılığıyla gönderdiğiniz bilgiler. Hukuki dayanak: talebiniz üzerine sözleşme öncesi adımlar (md. 6(1)(b)).",
        "Destek sohbeti: yazdığınız mesajlar, sayfa dili ve tarayıcınızda saklanan rastgele bir ziyaretçi kimliği. Hukuki dayanak: sorularınızı yanıtlamaktaki meşru menfaatimiz (md. 6(1)(f)) ve bir siparişle ilgiliyse sözleşmenin ifası.",
        "Çerez onayı: onayı kanıtlayabilmemiz için seçiminizin, tarihin ve tarayıcı türünüzün kaydı (md. 7(1)).",
        "Site güvenliği: siteyi kötüye kullanıma karşı korumak için kısa süre saklanan IP adresi gibi teknik kayıtlar (md. 6(1)(f)).",
      ],
    },
    {
      h: "3. Yapay zeka destekli destek",
      p: [
        "Sohbet asistanımız size yanıt vermek için bir yapay zeka dil modeli (Anthropic'in Claude modeli) kullanabilir. Sohbet her zaman bir yapay zekayla konuştuğunuzu belirtir ve ekibimizden biri istediği zaman devralabilir. Mesajlar sağlayıcıya yalnızca yanıt oluşturmak için gönderilir. Lütfen sohbette kart numarası, şifre veya sağlık verisi paylaşmayın.",
      ],
    },
    {
      h: "4. Verilerinizi kimler alır",
      p: [
        "Verileri yalnızca mağazayı işletmemize yardımcı olan işleyicilerle paylaşırız: barındırma sağlayıcısı, kartlı ödemeler için ödeme kuruluşu (Stripe Payments Europe, Ltd.), teslimat için kargo şirketleri, muhasebecimiz, e-posta sağlayıcısı ve sohbet için Anthropic PBC. Her işleyici bir veri işleme sözleşmesiyle bağlıdır.",
        "Bazı sağlayıcılar verileri AEA dışında (örneğin ABD'de) işleyebilir. Bu durumlarda aktarımlar bir yeterlilik kararına (AB–ABD Veri Gizliliği Çerçevesi) veya Standart Sözleşme Maddelerine dayanır.",
      ],
    },
    {
      h: "5. Ne kadar süre saklıyoruz",
      p: [
        "Sipariş ve fatura verileri: Bulgaristan Muhasebe Kanunu gereği 10 yıl. Talepler: son iletişimimizden sonra 2 yıla kadar. Sohbetler: 12 aya kadar. Onay kayıtları: onay geçerli olduğu sürece artı 3 yıl.",
      ],
    },
    {
      h: "6. Haklarınız",
      p: [
        "Verilerinize erişme, düzeltme ve silme, işlemeyi kısıtlama veya itiraz etme, veri taşınabilirliği ve önceki işlemeyi etkilemeden onayınızı istediğiniz zaman geri çekme haklarına sahipsiniz. Sitedeki 'Veri haklarınız' formunu kullanın veya bize yazın. Bir ay içinde yanıt veririz.",
        "Ayrıca Bulgaristan Kişisel Verileri Koruma Komisyonu'na (cpdp.bg, 2 Prof. Tsvetan Lazarov Blvd., Sofya 1592) veya AB ülkenizdeki denetim makamına şikayette bulunabilirsiniz.",
      ],
    },
    {
      h: "7. Güvenlik",
      p: [
        "Site şifreli HTTPS bağlantıları kullanır. Kart bilgileri doğrudan Stripe'a girilir ve sunucularımıza asla ulaşmaz. Yönetim sistemine erişim yetkili personelle sınırlıdır ve şifreler ve imzalı oturumlarla korunur.",
      ],
    },
  ],
  cookies: [
    {
      h: "Çerez nedir",
      p: ["Çerezler tarayıcınızda saklanan küçük metin dosyalarıdır. Yerel depolama gibi benzer teknolojiler de bu politikanın kapsamındadır."],
    },
    {
      h: "Zorunlu (her zaman açık)",
      p: [
        "NEXT_LOCALE: dilinizi hatırlar, 1 yıl.",
        "shkj_consent: çerez seçiminizi saklar, 6 ay.",
        "shkj_cart (yerel depolama): siz temizleyene kadar sepetinizin içeriğini tutar.",
        "shkj_visitor (yerel depolama): destek sohbetinin konuşmanızı göstermesini sağlayan rastgele bir kimlik.",
        "shkj_admin: yönetim paneline giriş yapan personel için oturum, 12 saat.",
        "Stripe, dolandırıcılığı önlemek için ödeme sayfasında kendi zorunlu çerezlerini kullanır.",
      ],
    },
    {
      h: "Analiz ve pazarlama (yalnızca onayla)",
      p: [
        "Bunlar varsayılan olarak kapalıdır. Yalnızca çerez bandında izin verirseniz etkinleştiririz. Şu anda site herhangi bir analiz veya pazarlama aracı yüklemiyor; eklersek, kullanmaya başlamadan önce burada listelenecektir.",
      ],
    },
    {
      h: "Seçiminizi değiştirme",
      p: ["Onayınızı istediğiniz zaman değiştirmek veya geri çekmek için her sayfanın altındaki 'Çerez ayarları' bağlantısını kullanın. Reddetmek, kabul etmek kadar kolaydır."],
    },
  ],
  terms: [
    {
      h: "1. Satıcı",
      p: [
        `Bu koşullar ${s.legalName}, UIC ${s.eik}, KDV ${s.vatNumber}, ${s.address}, ${s.city}, ${s.country}, e-posta ${s.email}, telefon ${s.phone} online mağazasından yapılan alışverişleri düzenler.`,
      ],
    },
    {
      h: "2. Ürünler ve fiyatlar",
      p: ["Ürün açıklamaları her ürünün temel özelliklerini gösterir. Fiyatlar avro (EUR) cinsindendir ve %20 KDV içerir. Teslimat ücreti sipariş öncesinde sepette gösterilir."],
    },
    {
      h: "3. Sözleşmenin kurulması",
      p: [
        "Ürünleri sepete ekler, bilgilerinizi girer, bir ödeme yöntemi seçer ve 'Ödeme yükümlülüğü ile sipariş ver' düğmesine tıklarsınız. Sözleşme, siparişinizi e-postayla onayladığımızda kurulur. Sipariş vermeden önce her adımda giriş hatalarını düzeltebilirsiniz. Sözleşme dili Bulgarca, İngilizce veya Türkçe olabilir. Sözleşmeyi saklarız ve size e-postayla iletilir.",
      ],
    },
    { h: "4. Ödeme", p: ["Kartla (Stripe üzerinden), kapıda ödeme veya banka havalesi. Havalede ödeme ulaştıktan sonra kargolarız."] },
    {
      h: "5. Teslimat",
      p: ["Bulgaristan içinde kargoyla, genellikle 1–3 iş günü içinde ve en geç 30 gün içinde teslim ederiz. Risk, siz veya belirttiğiniz kişi ürünü teslim aldığında size geçer."],
    },
    {
      h: "6. Cayma hakkı",
      p: [
        "Tüketiciler 14 gün içinde gerekçe göstermeden sözleşmeden cayabilir. Ayrıntılar ve cayma formu Cayma ve İade politikamızdadır; ayrıca sitenin alt kısmındaki 'Sözleşmeden cayma' işleviyle online olarak cayabilirsiniz.",
      ],
    },
    {
      h: "7. Yasal garanti ve şikayetler",
      p: [
        "Tüm ürünler, Bulgaristan mevzuatı uyarınca teslimattan itibaren 2 yıllık yasal uygunluk garantisine sahiptir. Şikayetlerinizi sipariş numaranızla birlikte e-posta adresimize gönderin; 14 gün içinde çözüme kavuştururuz. Üreticinin ticari garantisi yasal haklarınıza ek olarak geçerlidir.",
      ],
    },
    {
      h: "8. Kurulum hizmetleri",
      p: ["Kurulumlar ayrı bir yazılı teklifle kararlaştırılır. Cayma süresi içinde işe başlamamızı ister ve hizmet tamamen ifa edilirse, o hizmet için cayma hakkınızı kaybedersiniz."],
    },
    {
      h: "9. Uyuşmazlıklar",
      p: [
        "Her sorunu doğrudan çözmeye çalışırız. Mahkeme dışı çözüm için Tüketiciyi Koruma Komisyonu'na (kzp.bg, 4A Slaveykov Meydanı, Sofya) veya bir uzlaştırma komisyonuna da başvurabilirsiniz. Bulgar hukuku uygulanır; bu, yaşadığınız ülkenin emredici kurallarının size sağladığı korumayı ortadan kaldırmaz.",
      ],
    },
  ],
  returns: [
    {
      h: "Cayma hakkı",
      p: [
        "Bu sözleşmeden herhangi bir gerekçe göstermeden 14 gün içinde cayma hakkınız vardır. Süre, sizin veya taşıyıcı dışında belirttiğiniz üçüncü bir kişinin ürünü teslim aldığı günden itibaren 14 gün sonra sona erer.",
        `Bu hakkı kullanmak için kararınızı açık bir beyanla bize (${s.legalName}, ${s.address}, ${s.city}, ${s.email}, ${s.phone}) bildirin. Sitedeki ve e-postayla onayladığımız online 'Sözleşmeden cayma' formunu veya aşağıdaki örnek formu kullanabilirsiniz, ancak zorunlu değildir. Bildiriminizi süre dolmadan göndermeniz yeterlidir.`,
      ],
    },
    {
      h: "Caymanın sonuçları",
      p: [
        "Standart teslimat ücreti dahil sizden aldığımız tüm ödemeleri, bildiriminizi aldığımız tarihten itibaren gecikmeksizin ve en geç 14 gün içinde iade ederiz. Aksini kabul etmediğiniz sürece kullandığınız ödeme yöntemini kullanırız; iade için ücret ödemezsiniz. Ürünleri geri alana veya gönderdiğinize dair kanıt sunana kadar iadeyi bekletebiliriz.",
        `Lütfen ürünleri bize bildirdikten sonra 14 gün içinde ${s.address}, ${s.city} adresine geri gönderin. İadenin doğrudan maliyeti size aittir. Yalnızca ürünün niteliğini, özelliklerini ve işleyişini belirlemek için gerekenin ötesindeki kullanımdan kaynaklanan değer kaybından sorumlusunuz.`,
      ],
    },
    {
      h: "İstisnalar",
      p: ["Cayma hakkı; sizin özelliklerinize göre yapılan ürünler, ambalajı açıldıktan sonra hijyen nedeniyle iadeye uygun olmayan mühürlü ürünler ve açık onayınızla tamamen ifa edilmiş hizmetler için geçerli değildir."],
    },
    {
      h: "Örnek cayma formu",
      p: [
        `Kime: ${s.legalName}, ${s.address}, ${s.city}, ${s.email}`,
        "Aşağıdaki ürünlerin satışına ilişkin sözleşmemden cayduğumu bildiririm: ____",
        "Sipariş tarihi / teslim tarihi: ____ · Sipariş numarası: ____",
        "Tüketicinin adı: ____ · Tüketicinin adresi: ____",
        "Tüketicinin imzası (yalnızca kağıt üzerinde bildiriliyorsa) · Tarih: ____",
      ],
    },
  ],
  imprint: [
    {
      h: "Şirket",
      p: [
        s.legalName,
        `UIC (EIK): ${s.eik}`,
        `KDV numarası: ${s.vatNumber}`,
        `Genel müdür: ${s.manager}`,
        `Merkez adresi: ${s.address}, ${s.city}, ${s.country}`,
        "Bulgaristan Tescil Ajansı Ticaret Sicili'ne kayıtlıdır.",
      ],
    },
    { h: "İletişim", p: [`E-posta: ${s.email}`, `Telefon: ${s.phone}`, `Çalışma saatleri: ${s.workingHours}`] },
    {
      h: "Denetim makamları",
      p: ["Tüketiciyi Koruma Komisyonu, kzp.bg", "Kişisel Verileri Koruma Komisyonu, cpdp.bg", "Ulusal Gelir İdaresi, nra.bg"],
    },
  ],
  accessibility: [
    {
      h: "Taahhüdümüz",
      p: ["Avrupa Erişilebilirlik Yasası (Direktif (AB) 2019/882) ve WCAG 2.1 AA yönergeleri doğrultusunda herkesin sitemizi ve mağazamızı kullanabilmesini istiyoruz."],
    },
    {
      h: "Neler yapıyoruz",
      p: [
        "Anlamsal sayfa yapısı ve başlıklar, görünür odakla tam klavye gezintisi, görseller için metin alternatifleri, yeterli renk kontrastı, 'hareketi azalt' ayarına saygı ve net etiketli, açık hata mesajlı formlar.",
      ],
    },
    {
      h: "Geri bildirim",
      p: [`Kullanımı zor bir şey varsa ${s.email} veya ${s.phone} üzerinden bize bildirin. 5 iş günü içinde yanıt verir, gerekirse siparişinizi başka bir yolla tamamlamanıza yardımcı oluruz.`],
    },
  ],
});

export default tr;

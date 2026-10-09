/*
 * Muyassir knowledge base — shared by the browser (window.MUYASSIR_KB) and the server (require).
 * DEMO DATA: every checklist item must be replaced with the official Balady requirements guide,
 * with its exact source, before any real use.
 */
(function (root) {
  "use strict";

  const SRC = "بيانات تجريبية — تُستبدل بدليل الاشتراطات الرسمي";

  const SLOTS = [
    { id: "facade", name: "الواجهة واللوحة", hint: "صورة أمامية كاملة للمحل", en: "full front view of the shop", req: true },
    { id: "entrance", name: "المدخل", hint: "الباب والرصيف أمامه", en: "the door and the sidewalk in front of it" },
    { id: "interior", name: "الداخل", hint: "منطقة العمل أو التحضير", en: "the work or preparation area inside" },
    { id: "documents", name: "مستند", hint: "عقد الإيجار أو السجل التجاري", en: "lease contract or commercial registration" }
  ];

  const COMMON = [
    { k: "SIGN-FIT", slot: "facade", sev: "high", t: "اللوحة التجارية داخل إطار الواجهة ولا تتجاوز حدودها", c: "The shop signboard sits within the facade frame, not protruding beyond the shopfront edges or covering upper floors." },
    { k: "SIGN-AR", slot: "facade", sev: "medium", t: "اسم المحل مكتوب بالعربية بوضوح على اللوحة", c: "The shop name appears in Arabic on the signboard and is clearly legible." },
    { k: "FAC-CLEAN", slot: "facade", sev: "medium", t: "الواجهة نظيفة وسليمة بلا تكسير أو ملصقات عشوائية", c: "Facade cladding is intact and clean: no broken panels, peeling paint, graffiti or random stickers/posters." },
    { k: "FAC-GLASS", slot: "facade", sev: "low", t: "الواجهة الزجاجية شفافة وغير مغطاة بالكامل", c: "Glass shopfront is not fully covered with film, posters or paint; the inside is partly visible." },
    { k: "ENT-ACCESS", slot: "entrance", sev: "high", t: "مدخل بلا درج أو معه منحدر لذوي الإعاقة", c: "Entrance is step-free, or has a visible ramp suitable for wheelchairs." },
    { k: "ENT-CLEAR", slot: "entrance", sev: "medium", t: "الرصيف أمام المحل خالٍ من البضائع والمعدات", c: "No goods, fridges, tables or equipment are placed on the sidewalk in front of the shop." }
  ];
  const SAFETY = { k: "SAF-EXT", slot: "interior", sev: "high", t: "طفاية حريق ظاهرة ويسهل الوصول إليها", c: "A fire extinguisher is visible, mounted or placed in an accessible spot, not blocked." };
  const DOC = { k: "DOC-READ", slot: "documents", sev: "medium", t: "صورة المستند (عقد الإيجار أو السجل التجاري) واضحة ومقروءة", c: "The document photo is a lease contract or commercial registration, fully in frame, sharp and readable." };

  const ACTS = {
    cafe: { name: "مقهى", en: "café", items: [...COMMON, SAFETY,
      { k: "CAFE-SINK", slot: "interior", sev: "high", t: "مغسلة أيدٍ مستقلة في منطقة التحضير", c: "A dedicated handwashing sink is visible in or next to the drink preparation area." },
      { k: "CAFE-SURF", slot: "interior", sev: "medium", t: "أسطح التحضير سليمة وسهلة التنظيف", c: "Preparation counters are smooth, intact and easy to clean (stainless steel, stone or similar), without visible damage or dirt." },
      DOC] },
    grocery: { name: "بقالة", en: "grocery store", items: [...COMMON, SAFETY,
      { k: "GRO-AISLE", slot: "interior", sev: "medium", t: "الممرات بين الرفوف مفتوحة وغير مسدودة", c: "Aisles between shelves are clear; boxes or goods do not block the walkway." },
      { k: "GRO-FRIDGE", slot: "interior", sev: "medium", t: "ثلاجات العرض نظيفة وأبوابها سليمة", c: "Display fridges look clean, closed properly and are not visibly damaged." },
      DOC] },
    restaurant: { name: "مطعم", en: "restaurant", items: [...COMMON, SAFETY,
      { k: "RES-HOOD", slot: "interior", sev: "high", t: "شفاط أو مظلة تهوية فوق منطقة الطهي", c: "An exhaust hood / ventilation canopy is installed above the cooking equipment." },
      { k: "RES-SINK", slot: "interior", sev: "high", t: "مغسلة أيدٍ مستقلة في المطبخ", c: "A dedicated handwashing sink is visible in the kitchen area." },
      { k: "RES-SURF", slot: "interior", sev: "medium", t: "الجدران والأرضيات في المطبخ قابلة للتنظيف", c: "Kitchen walls and floors are tiled or finished with washable, intact surfaces." },
      DOC] },
    barber: { name: "صالون حلاقة", en: "barbershop", items: [...COMMON, SAFETY,
      { k: "BAR-STER", slot: "interior", sev: "high", t: "وسيلة تعقيم الأدوات ظاهرة", c: "A tool sterilizer device or visible disinfection containers for tools are present at the workstations." },
      { k: "BAR-CLEAN", slot: "interior", sev: "medium", t: "مقاعد الحلاقة ومنطقة العمل نظيفة ومرتبة", c: "Barber chairs and workstations look clean and tidy, with no hair piles or clutter." },
      DOC] }
  };
  Object.values(ACTS).forEach(a => { a.items = a.items.map(i => ({ ...i, code: i.k, source: SRC })); });

  const ROADMAP = [
    "استخراج السجل التجاري من وزارة التجارة للنشاط المطلوب.",
    "توثيق عقد الإيجار إلكترونياً عبر منصة إيجار.",
    "التقديم على الرخصة التجارية البلدية عبر منصة بلدي، ورفع المستندات المطلوبة.",
    "استيفاء اشتراطات السلامة من الدفاع المدني حسب النشاط والمساحة.",
    "للأنشطة الغذائية وصالونات الحلاقة: شهادات صحية للعاملين حسب الاشتراطات.",
    "الكشف الميداني عند الحاجة، ثم إصدار الرخصة وتجديدها قبل انتهائها."
  ];

  const DISTRICTS = ["العزيزية", "الشوقية", "الزاهر", "العوالي", "النسيم", "الشرائع", "الرصيفة", "العتيبية"];

  const LANGS = {
    ar: { name: "Arabic", v: "ar-SA" }, en: { name: "English", v: "en-US" }, ur: { name: "Urdu", v: "ur-PK" },
    id: { name: "Indonesian (Bahasa Indonesia)", v: "id-ID" }, bn: { name: "Bengali", v: "bn-BD" }
  };
  const NOPHOTO = { ar: "لم تُرفع صورة لهذا الجزء، فلم يُفحص.", en: "No photo was uploaded for this part, so it was not checked.", ur: "اس حصے کی تصویر اپ لوڈ نہیں ہوئی، اس لیے جانچ نہیں ہوئی۔", id: "Tidak ada foto untuk bagian ini, jadi belum diperiksa.", bn: "এই অংশের ছবি আপলোড করা হয়নি, তাই যাচাই করা হয়নি।" };
  const NOPHOTO_FIX = { ar: "ارفع صورة واضحة لهذا الجزء وأعد الفحص.", en: "Upload a clear photo of this part and run the check again.", ur: "اس حصے کی واضح تصویر اپ لوڈ کریں اور دوبارہ جانچیں۔", id: "Unggah foto yang jelas untuk bagian ini lalu periksa ulang.", bn: "এই অংশের একটি পরিষ্কার ছবি আপলোড করে আবার যাচাই করুন।" };
  const W = { high: 3, medium: 2, low: 1 };

  const KB = { SRC, SLOTS, ACTS, ROADMAP, DISTRICTS, LANGS, NOPHOTO, NOPHOTO_FIX, W };
  if (typeof module !== "undefined" && module.exports) module.exports = KB;
  else root.MUYASSIR_KB = KB;
})(typeof window !== "undefined" ? window : globalThis);

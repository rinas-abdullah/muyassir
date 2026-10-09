# مُيسّر (Muyassir)

**صوّر محلك… واعرف جاهزيتك قبل ما تقدّم.**
منصة ويب يرفع فيها صاحب المحل صور محله، فيطابقها الذكاء الاصطناعي مع اشتراطات نشاطه، ويعطيه تقرير جاهزية بلغته. ومعها مساعد متعدد اللغات، ولوحة للأمانة.

> الاشتراطات الموجودة حالياً في `public/kb.js` **تجريبية**، ولازم تُستبدل بدليل الاشتراطات الرسمي من بلدي قبل أي استخدام حقيقي.

الشرح التقني الكامل في [TECHNICAL.md](TECHNICAL.md).

---

## التشغيل على جهازك (5 دقائق)

تحتاج Node.js 18 أو أحدث، وما تحتاج تثبيت أي مكتبة.

```bash
cd muyassir-platform
cp .env.example .env          # ثم اكتب مفتاحك في ANTHROPIC_API_KEY
npm start                     # افتح http://localhost:3000
```

**بدون مفتاح؟** شغّل الوضع التجريبي: `npm run demo`. المنصة تشتغل كاملة، والنتائج نموذجية ومكتوب عليها «وضع تجريبي». ينفع كخطة بديلة إذا انقطع الإنترنت وقت العرض.

## النشر برابط عام على Vercel (10 دقائق)

1. ارفع مجلد `muyassir-platform` على GitHub في مستودع خاص.
2. ادخل [vercel.com](https://vercel.com)، واختر **Add New → Project**، ثم اختر المستودع.
3. في **Environment Variables** أضف:
   - `ANTHROPIC_API_KEY` = مفتاحك من [console.anthropic.com](https://console.anthropic.com)
   - `ADMIN_PIN` = رمز دخول لوحة الأمانة (مثلاً 4 أرقام)
4. اضغط **Deploy**، ويطلع لك رابط مثل `muyassir.vercel.app`.

**تخزين دائم للوحة الأمانة (اختياري):** بدونه تنمسح بيانات اللوحة كل ما يعيد Vercel تشغيل الخادم. للتخزين الدائم، أنشئ قاعدة مجانية في [upstash.com](https://upstash.com) (Redis)، وأضف `UPSTASH_REDIS_REST_URL` و`UPSTASH_REDIS_REST_TOKEN`.

## الاختبار

```bash
npm test        # 14 اختبار: منطق الفحص + الـ API (بدون مفتاح وبدون إنترنت)
npm run eval    # اختبار الدقة على صور حقيقية (يحتاج مفتاح)
```

### اختبار الدقة خطوة بخطوة

1. حطّوا صور محلات حقيقية في `eval/photos/`. الأفضل من 6 إلى 10 محلات، بعضها مطابق وبعضها لا.
2. انسخوا `eval/cases.example.json` إلى `eval/cases.json`، واكتبوا لكل محل حكم الخبير على كل بند (`pass` أو `fail`).
3. شغّلوا `npm run eval`. التقرير يطلع في `eval/results/report.md`، وفيه نسبة الدقة اللي تعرضونها على اللجنة.

## هيكل المشروع

```
ui/app.html         مصدر الواجهة (عدّل هنا ثم شغّل: node tools/build-ui.js)
public/index.html   واجهة المنصة (تُولَّد من ui/app.html)
public/kb.js        قاعدة الاشتراطات (مشتركة بين الواجهة والخادم)
lib/core.js         منطق الفحص والمساعد والتخزين
lib/http.js         معالجة الطلبات
api/                analyze · ask · stats · health
server.js           خادم محلي
tests/              اختبارات الوحدة والـ API
eval/               اختبار الدقة
```

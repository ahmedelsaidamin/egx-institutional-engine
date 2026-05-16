# EGX Institutional Decision Engine — Split Files

## التشغيل
1. فك الضغط.
2. افتح Terminal داخل الفولدر.
3. شغّل:
```bash
npm install
npm run dev
```

## الملفات
- `src/App.jsx`: الملف الرئيسي الذي يربط كل شيء.
- `src/data.js`: بيانات الأسهم، القاموس، ولون الشرح العام الأخضر.
- `src/calculations.js`: دوال الحساب والمنطق.
- `src/ui.jsx`: مكونات الواجهة والتقرير.
- `src/main.jsx`: تشغيل React.

تم تقسيم المشروع حتى لا يتجاوز حد طول ملف canvas.

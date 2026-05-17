import { average, clamp } from "./calculations.js";

export const GENERAL_EXPLANATION_CLASS = "bg-emerald-50 text-emerald-950 border-emerald-300";

export const glossary = [
  { term: "القرار المؤسسي", meaning: "هو الخلاصة العملية للتقرير: هل الأفضل الشراء، البيع، أم الانتظار؟ كلمة مؤسسي تعني أن القرار لا ينظر للسعر فقط، بل ينظر أيضًا إلى السيولة، حجم التنفيذ، المخاطر، وهل يمكن الدخول بدون رفع السعر ضدنا." },
  { term: "تقييم السهم", meaning: "رقم من 0 إلى 100 يلخص جودة قراءة السهم. الرقم العالي يعني أن المؤشرات الداخلية تميل للإيجابية. الرقم المنخفض يعني أن السهم لا يعطي إشارات كافية أو يعطي إشارات سلبية." },
  { term: "اتفاق الأدلة", meaning: "يقيس هل المؤشرات تؤكد بعضها أم تتعارض. مثال بسيط: إذا كان هناك شراء منظم، وضغط البيع ضعيف، والسيولة تتحسن، فالأدلة متفقة. أما إذا كان السعر يصعد لكن السيولة ضعيفة أو المخاطر عالية، فالأدلة متعارضة." },
  { term: "مستوى المخاطرة", meaning: "يقيس احتمالية أن يكون الدخول غير آمن. المخاطرة ترتفع إذا كان السهم صعد كثيرًا بسرعة، أو الحركة مرهقة، أو التذبذب عالي، أو السيولة ضعيفة." },
  { term: "قابلية بناء مركز", meaning: "تعني هل يستطيع مستثمر كبير شراء كمية مناسبة على عدة جلسات بدون أن يرفع السعر على نفسه. كلما كانت السيولة أعلى وحجم الأمر أقل مقارنة بالتداول، كان بناء المركز أسهل." },
  { term: "خطر كشف الدخول", meaning: "يعني احتمال أن يلاحظ السوق وجود مشتري كبير. لو انكشف الدخول، قد يرتفع السعر بسرعة قبل أن تكمل المؤسسة الشراء، فتدفع سعرًا أعلى من المخطط." },
  { term: "الشراء المنظم", meaning: "يعني أن الطلب على السهم يبدو هادئًا ومتكررًا وليس مجرد قفزة عشوائية. هذا قد يشير إلى دخول تدريجي من مستثمرين جادين، لكنه ليس ضمانًا للربح." },
  { term: "ضعف ضغط البيع", meaning: "يعني أن البائعين لا يضغطون بقوة على السعر. عندما يقل ضغط البيع، يصبح صعود السهم أسهل إذا ظهر طلب جديد." },
  { term: "ضغط قبل الحركة", meaning: "يعني أن السهم قد يكون في مرحلة استعداد قبل حركة أكبر. مثل هدوء السعر مع تحسن تدريجي في الطلب أو السيولة. هذه إشارة تحتاج تأكيدًا ولا تكفي وحدها للشراء." },
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"' && inQuotes && next === '"') {
      field += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((x) => x !== "")) rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows.map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

function toNum(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function getSymbols(columns) {
  return columns
    .filter((c) => c.endsWith("_Close"))
    .map((c) => c.replace("_Close", ""))
    .filter(Boolean)
    .sort();
}

function latestValidRow(rows, symbol) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const close = toNum(rows[i][`${symbol}_Close`]);
    if (close !== null && close > 0) return rows[i];
  }
  return rows[rows.length - 1];
}

function recentValidRows(rows, symbol, count = 30) {
  const out = [];
  for (let i = rows.length - 1; i >= 0 && out.length < count; i--) {
    const close = toNum(rows[i][`${symbol}_Close`]);
    if (close !== null && close > 0) out.push(rows[i]);
  }
  return out.reverse();
}

function scoreFromRSI(rsi) {
  if (!Number.isFinite(rsi)) return 50;
  if (rsi < 30) return 35;
  if (rsi <= 55) return 55 + (rsi - 30) * 0.8;
  if (rsi <= 70) return 75;
  return 55;
}

function volatilityFromReturns(values) {
  const nums = values.filter(Number.isFinite);
  if (nums.length < 5) return 50;
  const mean = average(nums);
  const variance = average(nums.map((x) => (x - mean) ** 2));
  const sd = Math.sqrt(variance);
  return clamp(sd * 900);
}

function computeTimeline(recentRows, symbol) {
  const sample = recentRows.slice(-5);
  return sample.map((row) => {
    const close = toNum(row[`${symbol}_Close`]);
    const sma = toNum(row[`${symbol}_SMA_50`]);
    const rsi = toNum(row[`${symbol}_RSI`]);
    const macd = toNum(row[`${symbol}_MACD`]);
    const volume = toNum(row[`${symbol}_Volume`]) || 0;
    const stockScore = clamp(scoreFromRSI(rsi) + (macd > 0 ? 8 : -4) + (close && sma && close > sma ? 7 : -5));
    const liquidity = clamp(45 + Math.log10(Math.max(volume, 1)) * 7);
    const evidence = clamp((stockScore + liquidity + (close && sma && close > sma ? 70 : 45)) / 3);
    return {
      session: row.date || "",
      stockScore,
      liquidity,
      evidence,
    };
  });
}

function buildExternalFactors(latest) {
  const mood = toNum(latest.mood_general);
  const financial = toNum(latest.mood_financial);
  const uncertainty = toNum(latest.uncertainty);
  const crisis = toNum(latest.crisis_density) ?? toNum(latest.crisis_total);
  const shock = toNum(latest.sentiment_shock);

  const moodScore = clamp(50 + (Number.isFinite(mood) ? mood * 50 : 0));
  const financialScore = clamp(50 + (Number.isFinite(financial) ? financial * 50 : 0));
  const uncertaintyScore = clamp(Number.isFinite(uncertainty) ? uncertainty * 100 : 50);
  const crisisScore = clamp(Number.isFinite(crisis) ? crisis * 100 : 40);
  const shockScore = clamp(Number.isFinite(shock) ? shock * 100 : 40);

  return [
    {
      name: "مزاج السوق العام",
      score: moodScore,
      relation: "World State Vector",
      impact: moodScore >= 55 ? "داعم" : moodScore <= 45 ? "ضاغط" : "مختلط",
      explanation: "يقيس المزاج العام المستخرج من الأخبار. القراءة الأعلى تعني بيئة نفسية أكثر دعمًا للسوق، لكنها ليست سببًا كافيًا وحدها للشراء.",
    },
    {
      name: "المزاج المالي",
      score: financialScore,
      relation: "أخبار مالية",
      impact: financialScore >= 55 ? "داعم" : financialScore <= 45 ? "ضاغط" : "مختلط",
      explanation: "يقيس نبرة الأخبار المالية تحديدًا. إذا كان داعمًا فهو يقوي القرار، وإذا كان ضاغطًا فهو يضعف شهية المخاطرة.",
    },
    {
      name: "عدم اليقين",
      score: uncertaintyScore,
      relation: "مخاطر أخبار",
      impact: uncertaintyScore >= 55 ? "ضاغط" : "داعم محدود",
      explanation: "ارتفاع عدم اليقين يعني أن السوق يتعامل مع أخبار متضاربة أو بيئة أقل وضوحًا، وهذا يرفع الحذر في القرار.",
    },
    {
      name: "كثافة الأزمات",
      score: Math.max(crisisScore, shockScore),
      relation: "أخبار وأزمات",
      impact: Math.max(crisisScore, shockScore) >= 55 ? "ضاغط" : "محايد",
      explanation: "يرصد كثافة كلمات الأزمات أو صدمات المشاعر في الأخبار. ارتفاعه لا يعني بيعًا تلقائيًا، لكنه يرفع مستوى الحذر.",
    },
  ];
}

function stockFromRows(rows, symbol) {
  const latest = latestValidRow(rows, symbol);
  const recent = recentValidRows(rows, symbol, 60);

  const close = toNum(latest[`${symbol}_Close`]) || 0;
  const open = toNum(latest[`${symbol}_Open`]) || close;
  const high = toNum(latest[`${symbol}_High`]) || close;
  const low = toNum(latest[`${symbol}_Low`]) || close;
  const volume = toNum(latest[`${symbol}_Volume`]) || 0;
  const rsi = toNum(latest[`${symbol}_RSI`]);
  const macd = toNum(latest[`${symbol}_MACD`]);
  const sma = toNum(latest[`${symbol}_SMA_50`]);
  const returns = recent.map((r) => toNum(r[`${symbol}_Log_Return`])).filter((x) => x !== null);
  const volumes = recent.map((r) => toNum(r[`${symbol}_Volume`])).filter((x) => x !== null);
  const avgVolume = average(volumes);
  const avgVolume20 = average(volumes.slice(-20));
  const prevRow = recent.length >= 2 ? recent[recent.length - 2] : null;
  const prevMacd = prevRow ? toNum(prevRow[`${symbol}_MACD`]) : null;
  const recent20 = recent.slice(-20);
  const high20 = Math.max(...recent20.map((r) => toNum(r[`${symbol}_Close`]) || 0));
  const low20 = Math.min(...recent20.map((r) => toNum(r[`${symbol}_Close`]) || Infinity));
  const logReturn = toNum(latest[`${symbol}_Log_Return`]) || 0;
  const avgDailyValueM = Math.max(1, (average(recent.map((r) => (toNum(r[`${symbol}_Volume`]) || 0) * (toNum(r[`${symbol}_Close`]) || close))) || close * volume) / 1000000);

  const priceAboveSMA = close && sma ? close > sma : false;
  const dailyRange = close > 0 ? ((high - low) / close) * 100 : 0;
  const volumeBoost = avgVolume > 0 ? volume / avgVolume : 1;

  const organizedBuying = clamp(scoreFromRSI(rsi) + (macd > 0 ? 10 : -5) + (priceAboveSMA ? 8 : -6) + (close > open ? 5 : -3));
  const sellingPressureWeakness = clamp(60 + (close > open ? 12 : -8) + (low > open * 0.98 ? 6 : -4) - dailyRange * 2);
  const preMovePressure = clamp(50 + (volumeBoost > 1.2 ? 12 : 0) + (macd > 0 ? 8 : -4) + (priceAboveSMA ? 6 : -3));
  const liquidityQuality = clamp(45 + Math.log10(Math.max(avgDailyValueM, 1)) * 18 + Math.min(volumeBoost, 2) * 8);
  const overExtensionRisk = clamp((Number.isFinite(rsi) ? Math.max(0, rsi - 60) * 2.2 : 35) + (priceAboveSMA && sma ? Math.max(0, ((close - sma) / sma) * 100) * 3 : 0));
  const exhaustionRisk = clamp((Number.isFinite(rsi) && rsi > 70 ? 65 : 35) + Math.max(0, volumeBoost - 1.4) * 20);
  const volatilityRisk = clamp(25 + volatilityFromReturns(returns) + dailyRange * 3);

  return {
    symbol,
    name: symbol,
    sector: "EGX30 / Kaggle WSV",
    price: close,
    avgDailyValueM: Number(avgDailyValueM.toFixed(2)),
    institutionalOrderM: Math.max(1, Number((avgDailyValueM * 0.18).toFixed(2))),
    internal: {
      organizedBuying,
      sellingPressureWeakness,
      preMovePressure,
      liquidityQuality,
      overExtensionRisk,
      exhaustionRisk,
      volatilityRisk,
    },
    market: {
      open,
      high,
      low,
      close,
      volume,
      avgVolume20,
      rsi,
      macd,
      prevMacd,
      sma50: sma,
      logReturn,
      high20,
      low20: Number.isFinite(low20) ? low20 : low,
    },
    external: buildExternalFactors(latest),
    timeline: computeTimeline(recent, symbol),
    sourceDate: latest.date,
  };
}

export async function loadKaggleStocks() {
  const response = await fetch("/data/EGX30_with_WSV.csv");
  if (!response.ok) {
    throw new Error("لم أستطع تحميل ملف EGX30_with_WSV.csv من داخل المشروع.");
  }
  const text = await response.text();
  const rows = parseCSV(text);
  const columns = Object.keys(rows[0] || {});
  const symbols = getSymbols(columns);
  const stocks = {};
  for (const symbol of symbols) {
    stocks[symbol] = stockFromRows(rows, symbol);
  }
  return {
    stocks,
    rowCount: rows.length,
    symbolCount: symbols.length,
    dateFrom: rows[0]?.date,
    dateTo: rows[rows.length - 1]?.date,
  };
}

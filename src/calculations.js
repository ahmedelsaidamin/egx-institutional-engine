export function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

export function average(values) {
  const arr = (values || []).filter((v) => Number.isFinite(v));
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function calculateStock(stock) {
  const i = stock.internal;

  const stockScore = clamp(
    i.organizedBuying * 0.34 +
      i.sellingPressureWeakness * 0.22 +
      i.preMovePressure * 0.18 +
      i.liquidityQuality * 0.16 -
      i.overExtensionRisk * 0.06 -
      i.exhaustionRisk * 0.04
  );

  const positiveEvidence = [i.organizedBuying, i.sellingPressureWeakness, i.preMovePressure, i.liquidityQuality];
  const riskEvidence = [i.overExtensionRisk, i.exhaustionRisk, i.volatilityRisk];

  const evidenceAgreement = clamp(
    average(positiveEvidence) * 0.72 +
      (100 - average(riskEvidence)) * 0.28 -
      Math.abs(i.organizedBuying - i.liquidityQuality) * 0.12
  );

  const riskLevel = clamp(
    i.overExtensionRisk * 0.34 +
      i.exhaustionRisk * 0.28 +
      i.volatilityRisk * 0.22 +
      (100 - i.liquidityQuality) * 0.16
  );

  const orderToLiquidityRatio = stock.institutionalOrderM / Math.max(stock.avgDailyValueM, 1);

  const buildPositionScore = clamp(
    i.liquidityQuality * 0.58 +
      evidenceAgreement * 0.18 +
      (100 - riskLevel) * 0.14 +
      (100 - Math.min(orderToLiquidityRatio * 100, 100)) * 0.1
  );

  const entryExposureRisk = clamp(
    orderToLiquidityRatio * 72 +
      i.overExtensionRisk * 0.28 +
      (100 - i.liquidityQuality) * 0.22 +
      i.volatilityRisk * 0.18
  );

  const externalSupport = clamp(
    average(
      stock.external.map((x) => {
        if (x.impact.includes("داعم")) return x.score;
        if (x.impact.includes("ضاغط")) return 100 - x.score;
        return 50;
      })
    )
  );

  const institutionalScore = clamp(
    stockScore * 0.33 +
      evidenceAgreement * 0.22 +
      buildPositionScore * 0.2 +
      externalSupport * 0.1 +
      (100 - riskLevel) * 0.08 +
      (100 - entryExposureRisk) * 0.07
  );

  let decision = "انتظار";
  if (
    institutionalScore >= 68 &&
    stockScore >= 65 &&
    evidenceAgreement >= 68 &&
    riskLevel <= 55 &&
    buildPositionScore >= 60 &&
    entryExposureRisk <= 58
  ) {
    decision = "شراء";
  }

  if (
    institutionalScore <= 48 ||
    riskLevel >= 68 ||
    evidenceAgreement <= 45 ||
    (stockScore <= 48 && entryExposureRisk >= 55)
  ) {
    decision = "بيع";
  }

  const suggestedSessions = Math.max(1, Math.ceil(stock.institutionalOrderM / Math.max(stock.avgDailyValueM * 0.18, 1)));

  const result = {
    stockScore,
    evidenceAgreement,
    riskLevel,
    buildPositionScore,
    entryExposureRisk,
    externalSupport,
    institutionalScore,
    decision,
    suggestedSessions,
    orderToLiquidityRatio,
  };

  const technical = calculateTechnicalConfirmation(stock, result);

  return { ...result, technical, reasons: buildReasons(stock, result) };
}

export function buildReasons(stock, r) {
  const i = stock.internal;
  const bestExternal = [...stock.external].sort((a, b) => b.score - a.score)[0];
  const pressureExternal = [...stock.external]
    .filter((x) => x.impact.includes("ضاغط") && x.name !== bestExternal?.name)
    .sort((a, b) => b.score - a.score)[0];

  return {
    decision: {
      main:
        r.decision === "شراء"
          ? "القرار الخاص بهذا السهم يميل إلى الشراء التدريجي، لأن أكثر من عنصر مهم يسير في اتجاه إيجابي: تقييم السهم جيد، الأدلة متفقة، والسيولة تسمح بالتنفيذ دون ضغط كبير على السعر."
          : r.decision === "بيع"
          ? "القرار الخاص بهذا السهم يميل إلى البيع أو تجنب الدخول، لأن عناصر الخطر أو ضعف الأدلة أقوى من عناصر الدعم."
          : "القرار الخاص بهذا السهم هو الانتظار، لأن الصورة لم تكتمل بعد. توجد بعض الإشارات، لكنها ليست قوية أو متفقة بما يكفي لاتخاذ قرار شراء أو بيع حاسم.",
      supports: [
        r.stockScore >= 65 ? "تقييم السهم الخاص بهذه القراءة إيجابي ويدعم فكرة التحسن." : "تقييم السهم الخاص بهذه القراءة غير قوي بما يكفي.",
        r.evidenceAgreement >= 65 ? "الأدلة في هذه القراءة متفقة نسبيًا، وهذا يقوي القرار." : "الأدلة في هذه القراءة غير متفقة بما يكفي، لذلك القرار يحتاج حذرًا.",
        r.buildPositionScore >= 60 ? "قابلية بناء المركز في هذا السهم مقبولة مقارنة بالسيولة." : "قابلية بناء المركز في هذا السهم ضعيفة أو غير مريحة لمؤسسة كبيرة.",
      ],
      weakness:
        r.entryExposureRisk > 58
          ? "أضعف نقطة في هذا السهم الآن هي خطر كشف الدخول؛ لأن حجم الأمر قد يظهر أثره على السعر."
          : r.riskLevel > 55
          ? "أضعف نقطة في هذا السهم الآن هي مستوى المخاطرة، خصوصًا مع وجود حركة مرهقة أو تذبذب."
          : "نقطة الضعف الحالية في هذا السهم محدودة، لكن يجب متابعة السيولة واتفاق الأدلة.",
      condition:
        r.decision === "شراء"
          ? "شرط استمرار قرار الشراء في هذا السهم: بقاء السيولة جيدة، واستمرار اتفاق الأدلة، وعدم ارتفاع خطر كشف الدخول."
          : r.decision === "بيع"
          ? "شرط تغيير قرار البيع في هذا السهم: تحسن واضح في اتفاق الأدلة، انخفاض المخاطرة، وظهور سيولة تسمح بتنفيذ آمن."
          : "ما ننتظره في هذا السهم: تحسن اتفاق الأدلة، زيادة السيولة، انخفاض المخاطرة، أو ظهور شراء منظم واضح.",
      external: bestExternal ? `${bestExternal.name}: ${bestExternal.impact} — ${bestExternal.explanation}` : "لا يوجد عامل خارجي حاسم.",
      externalRisk: pressureExternal ? `${pressureExternal.name}: ${pressureExternal.impact} — ${pressureExternal.explanation}` : "لا يوجد ضغط خارجي إضافي مختلف عن العامل الرئيسي.",
    },
    stockScore: {
      meaning: `تقييم السهم هو ${r.stockScore} من 100. هذا الرقم يلخص جودة السهم من الداخل: هل يوجد طلب واضح؟ هل البيع ضعيف؟ هل السيولة تساعد؟ وهل المخاطر ليست مبالغًا فيها؟`,
      raised: [
        i.organizedBuying >= 65 ? "الشراء المنظم قوي: يظهر أن هناك طلبًا متكررًا أو هادئًا على السهم، وليس مجرد ارتفاع عابر في جلسة واحدة." : "الشراء المنظم ليس قويًا: لا يظهر حتى الآن وجود طلب كافٍ يمكن الاعتماد عليه.",
        i.sellingPressureWeakness >= 60 ? "ضغط البيع ضعيف: البائعون لا يضغطون بقوة على السعر، وهذا يجعل أي طلب جديد أكثر تأثيرًا." : "ضغط البيع ما زال حاضرًا: وجود بائعين نشطين يقلل جودة القراءة الإيجابية.",
        i.preMovePressure >= 60 ? "ضغط ما قبل الحركة واضح: توجد علامات استعداد لحركة، مثل تحسن تدريجي أو تماسك مع طلب، لكنه يحتاج تأكيدًا." : "ضغط ما قبل الحركة غير واضح: لا توجد علامة كافية على أن السهم يستعد لحركة قوية.",
      ],
      lowered: [
        i.liquidityQuality < 65 ? "السيولة ليست مثالية: حتى لو كان السهم جيدًا، ضعف السيولة يجعل الشراء أو البيع بكميات كبيرة أصعب." : "السيولة تساعد التقييم: وجود تداول مناسب يجعل قراءة السهم أكثر قابلية للتنفيذ.",
        i.overExtensionRisk > 55 ? "خطر الصعود المبالغ فيه موجود: السهم ربما صعد بسرعة أو لمسافة كبيرة، وهذا يجعل الدخول المتأخر أكثر خطورة." : "خطر الصعود المبالغ فيه محدود: لا توجد علامة قوية على أن السهم مرهق من الصعود.",
      ],
    },
    evidenceAgreement: {
      meaning: `اتفاق الأدلة هو ${r.evidenceAgreement} من 100. الرقم العالي يعني أن المؤشرات تؤكد بعضها. الرقم المنخفض يعني أن التقرير يرى تناقضًا بين المؤشرات، مثل صعود بدون سيولة أو شراء مع مخاطرة عالية.`,
      raised: [
        i.organizedBuying >= 60 && i.sellingPressureWeakness >= 55 ? "الشراء المنظم يتوافق مع ضعف البيع: عندما يزيد الطلب ويضعف البيع في نفس الوقت، تصبح القراءة أقوى." : "الشراء وضعف البيع لا يؤكدان بعضهما بقوة.",
        i.preMovePressure >= 60 && i.liquidityQuality >= 55 ? "ضغط ما قبل الحركة مدعوم بسيولة: الإشارة ليست نظرية فقط، لأن هناك تداولًا يساعد على التنفيذ." : "ضغط الحركة أو السيولة غير كافيين للتأكيد.",
        r.externalSupport >= 55 ? "العوامل الخارجية لا تعارض القراءة: البيئة المحيطة بالسهم لا تقف ضد القرار بشكل واضح." : "العوامل الخارجية لا تقدم دعمًا كافيًا.",
      ],
      lowered: [
        i.overExtensionRisk > 60 ? "الصعود المبالغ فيه يخفض اتفاق الأدلة: لأن ارتفاع السعر بسرعة قد يعني أن فرصة الدخول الآمن فاتت أو أصبحت أضعف." : "لا يوجد صعود مبالغ فيه بدرجة خطيرة.",
        i.exhaustionRisk > 60 ? "إرهاق الحركة يخفض الاتفاق: لأن السهم قد يكون تحرك كثيرًا ويحتاج راحة قبل استمرار الاتجاه." : "إرهاق الحركة محدود.",
      ],
    },
    riskLevel: {
      meaning: `مستوى المخاطرة هو ${r.riskLevel} من 100. في هذا المقياس، الرقم الأعلى أسوأ. إذا ارتفعت المخاطرة، لا يكفي أن يكون السهم جيدًا؛ لأن توقيت الدخول قد يكون غير مناسب.`,
      why: [
        i.overExtensionRisk > 60 ? "خطر الصعود المبالغ فيه مرتفع: السهم قد يكون صعد أكثر من اللازم في وقت قصير، وهذا يزيد احتمال التراجع أو التذبذب." : "خطر الصعود المبالغ فيه ليس مرتفعًا.",
        i.exhaustionRisk > 60 ? "الحركة مرهقة: السهم قد يحتاج فترة هدوء قبل استمرار أي صعود." : "الحركة ليست مرهقة بشكل خطر.",
        i.volatilityRisk > 60 ? "التذبذب مرتفع: الحركة السريعة صعودًا وهبوطًا تجعل تنفيذ القرار أصعب وتزيد احتمالية الخطأ في التوقيت." : "التذبذب تحت السيطرة نسبيًا.",
        i.liquidityQuality < 50 ? "ضعف السيولة يرفع المخاطرة: لأن البيع أو الشراء قد يصبح صعبًا عند الحاجة." : "السيولة لا ترفع المخاطرة بشكل كبير.",
      ],
    },
    execution: {
      buildMeaning: `قابلية بناء مركز هي ${r.buildPositionScore} من 100. هذا الرقم لا يقول إن السهم جيد أو سيئ فقط، بل يقول هل يمكن لمستثمر كبير شراء كمية على مراحل بدون أن يرفع السعر ضد نفسه.`,
      exposureMeaning: `خطر كشف الدخول هو ${r.entryExposureRisk} من 100. في هذا المقياس، الرقم الأعلى أسوأ. الخطر العالي يعني أن تنفيذ أمر كبير قد يكون ظاهرًا للسوق، فيتحرك السعر قبل اكتمال التنفيذ.`,
      build: [
        stock.avgDailyValueM >= 50 ? "متوسط التداول اليومي جيد: يوجد حجم تداول يساعد على تنفيذ أوامر أكبر دون أثر حاد على السعر." : "متوسط التداول اليومي محدود: يجب تنفيذ أي أمر كبير ببطء وعلى عدة جلسات حتى لا يتحرك السعر ضدنا.",
        stock.institutionalOrderM / Math.max(stock.avgDailyValueM, 1) <= 0.25 ? "حجم الأمر مناسب مقارنة بالسيولة: الأمر الافتراضي لا يمثل نسبة ضخمة من تداول اليوم المعتاد." : "حجم الأمر كبير مقارنة بالسيولة: تنفيذ الأمر دفعة واحدة قد يكون خطرًا أو مكلفًا.",
        r.suggestedSessions <= 3 ? "عدد الجلسات المقترح محدود: يمكن توزيع الأمر على فترة قصيرة نسبيًا مع مراقبة السوق." : "الأمر يحتاج توزيعًا أطول: التنفيذ المتسرع قد يكشف الدخول أو يرفع تكلفة الشراء.",
      ],
      exposure: [
        r.entryExposureRisk <= 45 ? "خطر كشف الدخول منخفض: يمكن تنفيذ الأمر غالبًا دون أن يلاحظ السوق أثرًا كبيرًا." : r.entryExposureRisk <= 60 ? "خطر كشف الدخول متوسط: يمكن التنفيذ، لكن الأفضل تقسيم الأمر ومراقبة رد فعل السعر." : "خطر كشف الدخول مرتفع: دخول كمية كبيرة قد يلفت نظر السوق ويرفع السعر قبل اكتمال الشراء.",
        i.liquidityQuality >= 65 ? "السيولة تساعد على إخفاء التنفيذ: وجود تداول كافٍ يجعل أوامر الشراء أو البيع أقل ظهورًا." : "السيولة لا تكفي لإخفاء التنفيذ بالكامل: أي أمر كبير قد يظهر بسرعة في حركة السعر أو حجم التداول.",
      ],
    },
  };
}


export function decisionToValue(decision) {
  if (decision === "شراء") return 1;
  if (decision === "بيع") return -1;
  return 0;
}

export function technicalValue(summary) {
  if (summary === "Buy") return 1;
  if (summary === "Weak Buy") return 0.5;
  if (summary === "Weak Sell") return -0.5;
  if (summary === "Sell") return -1;
  return 0;
}

export function technicalSummaryFromScore(score) {
  if (score >= 70) return "Buy";
  if (score >= 55) return "Weak Buy";
  if (score >= 45) return "Neutral";
  if (score >= 30) return "Weak Sell";
  return "Sell";
}

export function confirmationLabel(adjustment) {
  if (adjustment >= 8) return "تأكيد فني قوي";
  if (adjustment >= 3) return "تأكيد فني متوسط";
  if (adjustment > -3) return "محايد";
  if (adjustment > -8) return "تعارض فني متوسط";
  return "تعارض فني قوي";
}

function adjustedDecisionFromScore(score) {
  if (score >= 70) return "شراء";
  if (score < 49) return "بيع";
  return "انتظار";
}

function signalLabel(value) {
  if (value >= 1) return "Buy";
  if (value > 0) return "Weak Buy";
  if (value === 0) return "Neutral";
  if (value <= -1) return "Sell";
  return "Weak Sell";
}

export function calculateTechnicalConfirmation(stock, institutionalResult) {
  const m = stock.market || {};
  const close = Number(m.close ?? stock.price ?? 0);
  const open = Number(m.open ?? close);
  const high = Number(m.high ?? close);
  const low = Number(m.low ?? close);
  const volume = Number(m.volume ?? 0);
  const avgVolume20 = Number(m.avgVolume20 ?? volume ?? 0);
  const rsi = Number(m.rsi);
  const macd = Number(m.macd);
  const prevMacd = Number(m.prevMacd);
  const sma50 = Number(m.sma50);
  const logReturn = Number(m.logReturn ?? 0);
  const high20 = Number(m.high20 ?? high);
  const low20 = Number(m.low20 ?? low);

  let rsiSignal = 0;
  if (Number.isFinite(rsi)) {
    if (rsi < 30) rsiSignal = 1;
    else if (rsi < 45) rsiSignal = 0.5;
    else if (rsi <= 55) rsiSignal = 0;
    else if (rsi <= 70) rsiSignal = 0.5;
    else rsiSignal = -0.5;
  }

  const macdSignal = Number.isFinite(macd) ? (macd > 0 ? 1 : macd < 0 ? -1 : 0) : 0;
  const macdMomentum = Number.isFinite(macd) && Number.isFinite(prevMacd) ? (macd > prevMacd ? 0.5 : macd < prevMacd ? -0.5 : 0) : 0;
  const macdTotal = Math.max(-1, Math.min(1, macdSignal + macdMomentum));

  const priceVsSma = close && sma50 ? ((close - sma50) / sma50) * 100 : 0;
  let smaSignal = 0;
  if (priceVsSma > 3) smaSignal = 1;
  else if (priceVsSma > 0) smaSignal = 0.5;
  else if (priceVsSma >= -1 && priceVsSma <= 1) smaSignal = 0;
  else if (priceVsSma >= -3) smaSignal = -0.5;
  else smaSignal = -1;

  let returnSignal = 0;
  if (logReturn > 0.01) returnSignal = 1;
  else if (logReturn > 0) returnSignal = 0.5;
  else if (logReturn >= -0.01) returnSignal = 0;
  else returnSignal = -1;

  const volumeRatio = avgVolume20 > 0 ? volume / avgVolume20 : 1;
  let volumeSignal = 0;
  if (volumeRatio >= 1.5 && close > open) volumeSignal = 1;
  else if (volumeRatio >= 1.2 && close > open) volumeSignal = 0.5;
  else if (volumeRatio >= 1.5 && close < open) volumeSignal = -1;
  else if (volumeRatio >= 1.2 && close < open) volumeSignal = -0.5;

  const distanceFromHigh = high20 ? ((high20 - close) / high20) * 100 : 999;
  const distanceFromLow = low20 ? ((close - low20) / low20) * 100 : 999;
  let breakoutSignal = 0;
  if (distanceFromHigh <= 2 && volumeRatio > 1.2) breakoutSignal = 1;
  else if (distanceFromLow <= 2 && volumeRatio > 1.2) breakoutSignal = -1;

  const technicalRaw =
    rsiSignal * 20 +
    macdTotal * 25 +
    smaSignal * 25 +
    returnSignal * 10 +
    volumeSignal * 10 +
    breakoutSignal * 10;

  const technicalScore = clamp(50 + technicalRaw / 2);
  const summary = technicalSummaryFromScore(technicalScore);
  const ourValue = decisionToValue(institutionalResult.decision);
  const techValue = technicalValue(summary);

  let externalConfirmationScore = 0;
  if (ourValue === 1) {
    if (summary === "Buy") externalConfirmationScore = 10;
    else if (summary === "Weak Buy") externalConfirmationScore = 6;
    else if (summary === "Neutral") externalConfirmationScore = 2;
    else if (summary === "Weak Sell") externalConfirmationScore = -6;
    else externalConfirmationScore = -10;
  } else if (ourValue === -1) {
    if (summary === "Sell") externalConfirmationScore = 10;
    else if (summary === "Weak Sell") externalConfirmationScore = 6;
    else if (summary === "Neutral") externalConfirmationScore = 2;
    else if (summary === "Weak Buy") externalConfirmationScore = -6;
    else externalConfirmationScore = -10;
  } else {
    if (summary === "Neutral") externalConfirmationScore = 6;
    else externalConfirmationScore = 0;
  }

  const adjustedInstitutionalScore = clamp(institutionalResult.institutionalScore + externalConfirmationScore);
  const adjustedDecision = adjustedDecisionFromScore(adjustedInstitutionalScore);

  let finalDecision = adjustedDecision;
  let executionGateNote = "لا توجد بوابة تنفيذ تمنع القرار بعد التأكيد الفني.";
  if (adjustedDecision === "شراء" && institutionalResult.entryExposureRisk >= 70) {
    finalDecision = "انتظار تنفيذ";
    executionGateNote = "تم منع الشراء المباشر لأن خطر كشف الدخول مرتفع جدًا.";
  } else if (adjustedDecision === "شراء" && institutionalResult.riskLevel >= 70) {
    finalDecision = "انتظار";
    executionGateNote = "تم تحويل الشراء إلى انتظار لأن مستوى المخاطرة مرتفع جدًا.";
  } else if (adjustedDecision === "شراء" && institutionalResult.buildPositionScore < 45) {
    finalDecision = "انتظار";
    executionGateNote = "تم تحويل الشراء إلى انتظار لأن قابلية بناء مركز ضعيفة.";
  }

  let conflictPenalty = 0;
  if (externalConfirmationScore <= -8) conflictPenalty = 10;
  else if (externalConfirmationScore <= -3) conflictPenalty = 5;

  const confidenceLevel = clamp(
    institutionalResult.institutionalScore * 0.7 +
      technicalScore * 0.2 +
      institutionalResult.evidenceAgreement * 0.1 -
      conflictPenalty
  );

  return {
    rsiSignal,
    macdTotal,
    smaSignal,
    returnSignal,
    volumeSignal,
    breakoutSignal,
    technicalRaw: Math.round(technicalRaw),
    technicalScore,
    summary,
    ourDecisionValue: ourValue,
    technicalValue: techValue,
    confirmationDifference: Number((ourValue - techValue).toFixed(2)),
    externalConfirmationScore,
    confirmationLabel: confirmationLabel(externalConfirmationScore),
    adjustedInstitutionalScore,
    adjustedDecision,
    finalDecision,
    executionGateNote,
    confidenceLevel,
    conflictPenalty,
    details: {
      rsi,
      macd,
      prevMacd,
      sma50,
      priceVsSma: Number(priceVsSma.toFixed(2)),
      logReturn: Number(logReturn.toFixed(4)),
      volumeRatio: Number(volumeRatio.toFixed(2)),
      distanceFromHigh: Number(distanceFromHigh.toFixed(2)),
      distanceFromLow: Number(distanceFromLow.toFixed(2)),
    },
    signals: [
      { name: "RSI", value: rsiSignal, label: signalLabel(rsiSignal), explanation: "يقيس التشبع والضعف النسبي. أعلى من 70 يعني حذر، وليس بيعًا تلقائيًا." },
      { name: "MACD", value: macdTotal, label: signalLabel(macdTotal), explanation: "يقيس الزخم. فوق الصفر أو في تحسن يعطي دعمًا فنيًا." },
      { name: "السعر مقابل SMA_50", value: smaSignal, label: signalLabel(smaSignal), explanation: "السعر فوق متوسط 50 يوم يعني أن الاتجاه الفني أقوى." },
      { name: "عائد آخر جلسة", value: returnSignal, label: signalLabel(returnSignal), explanation: "يعكس هل آخر حركة سعرية إيجابية أم سلبية." },
      { name: "حجم التداول", value: volumeSignal, label: signalLabel(volumeSignal), explanation: "الصعود مع حجم تداول مرتفع أقوى من الصعود الضعيف." },
      { name: "اختراق/ضعف قصير الأجل", value: breakoutSignal, label: signalLabel(breakoutSignal), explanation: "يفحص قرب السعر من أعلى/أدنى 20 جلسة مع نشاط تداول." },
    ],
  };
}

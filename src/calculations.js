export function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

export function average(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function lastItem(arr) {
  return arr[arr.length - 1];
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
  ) decision = "شراء";

  if (
    institutionalScore <= 48 ||
    riskLevel >= 68 ||
    evidenceAgreement <= 45 ||
    (stockScore <= 48 && entryExposureRisk >= 55)
  ) decision = "بيع";

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

  return { ...result, reasons: buildReasons(stock, result) };
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
          ? "القرار يميل إلى الشراء التدريجي، لأن أكثر من عنصر مهم يسير في اتجاه إيجابي: تقييم السهم جيد، الأدلة متفقة، والسيولة تسمح بالتنفيذ دون ضغط كبير على السعر."
          : r.decision === "بيع"
          ? "القرار يميل إلى البيع أو تجنب الدخول، لأن عناصر الخطر أو ضعف الأدلة أقوى من عناصر الدعم. بمعنى أبسط: التقرير لا يرى أن العائد المتوقع يستحق المخاطرة الحالية."
          : "القرار انتظار، لأن الصورة لم تكتمل بعد. توجد بعض الإشارات، لكنها ليست قوية أو متفقة بما يكفي لاتخاذ قرار شراء أو بيع حاسم.",
      supports: [
        r.stockScore >= 65 ? "تقييم السهم إيجابي: هذا يعني أن قراءة السهم الداخلية تميل للصعود أو للتحسن، وليس مجرد حركة عشوائية." : "تقييم السهم غير قوي: هذا يعني أن السهم لا يعطي حتى الآن إشارات داخلية كافية تبرر قرارًا هجوميًا.",
        r.evidenceAgreement >= 65 ? "الأدلة متفقة: أكثر من مؤشر يقول نفس المعنى تقريبًا، وهذا يجعل القرار أكثر ثباتًا." : "الأدلة غير متفقة بما يكفي: بعض المؤشرات تقول شيئًا، ومؤشرات أخرى لا تؤكدها، لذلك القرار يحتاج حذرًا.",
        r.buildPositionScore >= 60 ? "قابلية بناء المركز مقبولة: يمكن تنفيذ الشراء على مراحل دون أن يظهر أثره بسرعة كبيرة على السعر." : "قابلية بناء المركز ضعيفة: دخول كمية كبيرة قد يكون صعبًا أو مكلفًا لأن السيولة لا تساعد بما يكفي.",
      ],
      weakness:
        r.entryExposureRisk > 58
          ? "أضعف نقطة هي خطر كشف الدخول. المقصود أن السوق قد يلاحظ وجود مشتري كبير، فيرتفع السعر قبل اكتمال الشراء، فتضطر المؤسسة للشراء بسعر أعلى."
          : r.riskLevel > 55
          ? "أضعف نقطة هي مستوى المخاطرة. المقصود أن الحركة قد تكون سريعة أو مرهقة أو متذبذبة، وبالتالي الدخول الآن يحتاج حذرًا أكبر."
          : "نقطة الضعف الحالية ليست خطيرة، لكن يجب مراقبة السيولة واتفاق الأدلة حتى لا يتحول القرار إلى إشارة متأخرة.",
      condition:
        r.decision === "شراء"
          ? "شرط استمرار قرار الشراء: أن تبقى السيولة جيدة، وأن تظل الأدلة متفقة، وألا يرتفع خطر كشف الدخول. إذا اختل شرط من هذه الشروط، يتحول القرار غالبًا إلى انتظار بدل شراء."
          : r.decision === "بيع"
          ? "شرط تغيير قرار البيع: تحسن واضح في اتفاق الأدلة، انخفاض مستوى المخاطرة، وظهور سيولة تسمح بتنفيذ آمن. بدون ذلك، يظل تجنب الدخول أفضل."
          : "ما ننتظره قبل اتخاذ قرار: تحسن اتفاق الأدلة، زيادة السيولة، انخفاض المخاطرة، أو ظهور شراء منظم واضح. الانتظار هنا ليس ترددًا، بل انتظار دليل أقوى.",
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
        i.organizedBuying >= 60 && i.sellingPressureWeakness >= 55 ? "الشراء المنظم يتوافق مع ضعف البيع: عندما يزيد الطلب ويضعف البيع في نفس الوقت، تصبح القراءة أقوى." : "الشراء وضعف البيع لا يؤكدان بعضهما بقوة: قد يكون هناك طلب، لكن البيع أو ضعف الطلب يجعل الإشارة أقل وضوحًا.",
        i.preMovePressure >= 60 && i.liquidityQuality >= 55 ? "ضغط ما قبل الحركة مدعوم بسيولة: الإشارة ليست نظرية فقط، لأن هناك تداولًا يساعد على التنفيذ." : "ضغط الحركة أو السيولة غير كافيين: قد توجد إشارة، لكنها غير مدعومة بتداول كافٍ.",
        r.externalSupport >= 55 ? "العوامل الخارجية لا تعارض القراءة: البيئة المحيطة بالسهم لا تقف ضد القرار بشكل واضح." : "العوامل الخارجية لا تقدم دعمًا كافيًا: حتى لو كانت القراءة الداخلية جيدة، البيئة الخارجية لا تساعد بما يكفي.",
      ],
      lowered: [
        i.overExtensionRisk > 60 ? "الصعود المبالغ فيه يخفض اتفاق الأدلة: لأن ارتفاع السعر بسرعة قد يعني أن فرصة الدخول الآمن فاتت أو أصبحت أضعف." : "لا يوجد صعود مبالغ فيه بدرجة خطيرة: هذا يجعل الأدلة أكثر قابلية للتصديق.",
        i.exhaustionRisk > 60 ? "إرهاق الحركة يخفض الاتفاق: لأن السهم قد يكون تحرك كثيرًا ويحتاج راحة قبل استمرار الاتجاه." : "إرهاق الحركة محدود: الحركة لا تبدو مستهلكة بشكل واضح.",
      ],
    },
    riskLevel: {
      meaning: `مستوى المخاطرة هو ${r.riskLevel} من 100. في هذا المقياس، الرقم الأعلى أسوأ. إذا ارتفعت المخاطرة، لا يكفي أن يكون السهم جيدًا؛ لأن توقيت الدخول قد يكون غير مناسب.`,
      why: [
        i.overExtensionRisk > 60 ? "خطر الصعود المبالغ فيه مرتفع: السهم قد يكون صعد أكثر من اللازم في وقت قصير، وهذا يزيد احتمال التراجع أو التذبذب." : "خطر الصعود المبالغ فيه ليس مرتفعًا: السعر لا يبدو مبالغًا فيه بدرجة تمنع القرار وحدها.",
        i.exhaustionRisk > 60 ? "الحركة مرهقة: السهم قد يحتاج فترة هدوء قبل استمرار أي صعود." : "الحركة ليست مرهقة بشكل خطر: لا توجد علامة واضحة على أن السهم استهلك قوته.",
        i.volatilityRisk > 60 ? "التذبذب مرتفع: الحركة السريعة صعودًا وهبوطًا تجعل تنفيذ القرار أصعب وتزيد احتمالية الخطأ في التوقيت." : "التذبذب تحت السيطرة نسبيًا: الحركة ليست عشوائية بدرجة عالية.",
        i.liquidityQuality < 50 ? "ضعف السيولة يرفع المخاطرة: لأن البيع أو الشراء قد يصبح صعبًا عند الحاجة." : "السيولة لا ترفع المخاطرة بشكل كبير: التداول كافٍ نسبيًا ولا يمثل خطرًا رئيسيًا وحده.",
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

export function trendSummary(timeline) {
  const first = timeline[0];
  const last = timeline[timeline.length - 1];
  const diffStock = last.stockScore - first.stockScore;
  const diffLiquidity = last.liquidity - first.liquidity;
  const diffEvidence = last.evidence - first.evidence;
  const aligned = [diffStock, diffLiquidity, diffEvidence].filter((x) => x > 0).length;
  const falling = [diffStock, diffLiquidity, diffEvidence].filter((x) => x < 0).length;

  let conclusion = "القراءة مختلطة: بعض العناصر تتحسن وبعضها لا يؤكد ذلك. في هذه الحالة لا نندفع، بل ننتظر دليلًا أوضح.";
  if (aligned === 3) conclusion = "القراءة تتحسن بوضوح: تقييم السهم والسيولة واتفاق الأدلة يتحركون في نفس الاتجاه. هذا يجعل القرار أقوى لأن التحسن ليس في رقم واحد فقط.";
  if (falling === 3) conclusion = "القراءة تتدهور بوضوح: تقييم السهم والسيولة واتفاق الأدلة ينخفضون معًا. هذا يعني أن الخروج أو تجنب الدخول يصبح أكثر منطقية.";

  return { diffStock, diffLiquidity, diffEvidence, conclusion };
}

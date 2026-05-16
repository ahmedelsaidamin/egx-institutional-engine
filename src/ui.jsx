import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldAlert,
  Building2,
  TrendingUp,
  Activity,
  Layers,
  Gauge,
  Link2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Target,
  Eye,
  Users,
  Calculator,
  BookOpen,
  Info,
} from "lucide-react";
import { GENERAL_EXPLANATION_CLASS, stocks, glossary } from "./data.js";
import { clamp, trendSummary } from "./calculations.js";

export function toneClasses(tone) {
  const map = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return map[tone] || map.neutral;
}

export function generalExplanationClasses() {
  return GENERAL_EXPLANATION_CLASS;
}

export function classifyScore(score, type = "positive") {
  if (type === "risk") {
    if (score >= 70) return { label: "مرتفع", plain: "شرح عام: الرقم المرتفع في مقاييس الخطر يعني أن القرار يحتاج حذرًا شديدًا.", tone: "danger" };
    if (score >= 45) return { label: "متوسط", plain: "شرح عام: الخطر المتوسط لا يمنع القرار دائمًا، لكنه يحتاج متابعة وشروطًا واضحة.", tone: "warning" };
    return { label: "منخفض", plain: "شرح عام: الخطر المنخفض يعني أن عنصر المخاطرة ليس العائق الأكبر حاليًا.", tone: "success" };
  }
  if (score >= 70) return { label: "قوي", plain: "شرح عام: الرقم القوي يعني أن القراءة إيجابية وواضحة نسبيًا.", tone: "success" };
  if (score >= 50) return { label: "متوسط", plain: "شرح عام: الرقم المتوسط يعني أن القراءة مقبولة لكنها تحتاج تأكيدًا.", tone: "warning" };
  return { label: "ضعيف", plain: "شرح عام: الرقم الضعيف يعني أن القراءة غير كافية لاتخاذ قرار قوي.", tone: "danger" };
}

export function decisionClasses(decision) {
  if (decision === "شراء") return "bg-emerald-600 text-white";
  if (decision === "بيع") return "bg-rose-600 text-white";
  return "bg-amber-500 text-white";
}

export function decisionPlainMeaning(decision) {
  if (decision === "شراء") return "شرح عام: كلمة شراء هنا لا تعني شراء كل الكمية فورًا. المقصود أن السهم مناسب لبناء مركز تدريجي بشرط استمرار السيولة وعدم ارتفاع المخاطر.";
  if (decision === "بيع") return "شرح عام: كلمة بيع لا تعني بيعًا عشوائيًا. المقصود أن المخاطر أو ضعف الأدلة أقوى من مبررات الدخول أو الاحتفاظ، لذلك الأفضل تخفيف التعرض أو تجنب دخول جديد حتى تتحسن القراءة.";
  return "شرح عام: كلمة انتظار لا تعني التردد. المقصود أن التقرير يحتاج دليلًا أقوى قبل الشراء أو البيع، مع مراقبة شروط محددة.";
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-3xl bg-white shadow-sm border border-slate-200 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function PageShell({ children }) {
  return <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8">{children}</div>;
}

export function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-2xl bg-white p-2 shadow-sm border border-slate-200">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle ? <div className={`mt-2 inline-block rounded-2xl border px-3 py-2 text-sm leading-6 ${generalExplanationClasses()}`}>{subtitle}</div> : null}
      </div>
    </div>
  );
}

export function GeneralExplanation({ title, children }) {
  return (
    <div className={`rounded-2xl border p-3 text-sm leading-7 ${generalExplanationClasses()}`}>
      <div className="flex items-center gap-2 font-black mb-1">
        <Info className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function ScoreBar({ value, left, right, type = "positive" }) {
  const cls = classifyScore(value, type);
  const fill = type === "risk" ? "bg-gradient-to-l from-rose-500 via-amber-400 to-emerald-500" : "bg-gradient-to-l from-emerald-500 via-amber-400 to-rose-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
        <span>{right}</span>
        <span>{left}</span>
      </div>
      <div dir="ltr" className="relative h-3 rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${clamp(value)}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs px-2 py-1 rounded-full border ${toneClasses(cls.tone)}`}>{cls.label}</span>
        <span className="font-bold text-lg">{value}</span>
      </div>
      <div className={`mt-2 rounded-xl border px-2 py-1 text-xs leading-5 ${generalExplanationClasses()}`}>{cls.plain}</div>
    </div>
  );
}

export function ReasonList({ title, items, icon: Icon = CheckCircle2 }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
      <div className="flex items-center gap-2 mb-2 font-bold text-sm">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <ul className="space-y-2 text-sm text-slate-700 leading-7">
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ClientGlossary() {
  return (
    <section>
      <SectionTitle icon={BookOpen} title="قاموس التقرير قبل قراءة الأرقام" subtitle="كل الكروت في هذا القسم بلون أخضر موحّد لأنها شرح عام للمصطلحات، وليست تحليلًا خاصًا بالسهم المختار." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {glossary.map((item) => (
          <div key={item.term} className={`rounded-3xl border p-4 shadow-sm ${generalExplanationClasses()}`}>
            <h3 className="font-black text-lg mb-2">{item.term}</h3>
            <p className="text-sm leading-7">{item.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DecisionHeader({ stock, result, setSymbol }) {
  const Icon = result.decision === "شراء" ? ArrowUpRight : result.decision === "بيع" ? ArrowDownRight : Minus;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Building2 className="h-4 w-4" />
              <span>EGX Institutional Decision Engine</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">{stock.name}</h1>
            <p className="text-slate-500 mt-2">{stock.symbol} · {stock.sector} · السعر الحالي التجريبي: {stock.price}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select value={stock.symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full sm:w-60 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-slate-300">
              {Object.keys(stocks).map((s) => <option key={s} value={s}>{s} — {stocks[s].name}</option>)}
            </select>
            <div className={`rounded-3xl px-6 py-4 min-w-44 text-center shadow-sm ${decisionClasses(result.decision)}`}>
              <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                <Icon className="h-5 w-5" />
                القرار المؤسسي
              </div>
              <div className="text-3xl font-black mt-1">{result.decision}</div>
              <div className="text-xs mt-1 opacity-90">قوة القرار: {result.institutionalScore}/100</div>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-3xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <p className="text-lg font-bold leading-8">{result.reasons.decision.main}</p>
          <GeneralExplanation title="المعنى العام للقرار بلغة بسيطة">{decisionPlainMeaning(result.decision)}</GeneralExplanation>
          <p className="text-sm text-slate-600 leading-7">{result.reasons.decision.condition}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DecisionExplanation({ result }) {
  return (
    <section>
      <SectionTitle icon={Target} title="لماذا ظهر هذا القرار؟" subtitle="شرح عام: هنا نوضح ما الذي يدعم القرار، وما نقطة ضعفه، وما العامل الخارجي المؤثر." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReasonList title="ما الذي يدعم القرار؟" items={result.reasons.decision.supports} icon={CheckCircle2} />
        <ReasonList title="أهم نقطة ضعف يجب مراقبتها" items={[result.reasons.decision.weakness]} icon={AlertTriangle} />
        <ReasonList title="العامل الخارجي الأقرب للتأثير" items={[result.reasons.decision.external, result.reasons.decision.externalRisk]} icon={Link2} />
      </div>
    </section>
  );
}

export function SubScores({ result }) {
  const cards = [
    { title: "تقييم السهم", value: result.stockScore, left: "قراءة سلبية", right: "قراءة إيجابية", type: "positive", icon: TrendingUp, help: "شرح عام: هل السهم نفسه يعطي إشارات جيدة؟" },
    { title: "اتفاق الأدلة", value: result.evidenceAgreement, left: "أدلة متعارضة", right: "أدلة متفقة", type: "positive", icon: Layers, help: "شرح عام: هل المؤشرات تؤكد بعضها أم تتناقض؟" },
    { title: "مستوى المخاطرة", value: result.riskLevel, left: "منخفض", right: "مرتفع", type: "risk", icon: ShieldAlert, help: "شرح عام: كلما زاد الرقم زادت خطورة الدخول أو الاستمرار." },
    { title: "قابلية بناء مركز", value: result.buildPositionScore, left: "صعب", right: "سهل", type: "positive", icon: Building2, help: "شرح عام: هل يمكن شراء كمية كبيرة تدريجيًا بدون رفع السعر؟" },
    { title: "خطر كشف الدخول", value: result.entryExposureRisk, left: "منخفض", right: "مرتفع", type: "risk", icon: Eye, help: "شرح عام: كلما زاد الرقم زادت فرصة أن يلاحظ السوق دخول مشتري كبير." },
  ];

  return (
    <section>
      <SectionTitle icon={Gauge} title="التقييمات الفرعية المؤثرة" subtitle="شرح عام: في مقاييس الخطر، الرقم الأعلى أسوأ. في مقاييس الجودة، الرقم الأعلى أفضل." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-slate-600" />
                  <h3 className="font-bold">{card.title}</h3>
                </div>
                <div className={`mb-4 rounded-xl border px-2 py-1 text-xs leading-5 ${generalExplanationClasses()}`}>{card.help}</div>
                <ScoreBar value={card.value} left={card.left} right={card.right} type={card.type} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function ScoreBreakdowns({ result }) {
  return (
    <section>
      <SectionTitle icon={Calculator} title="مصدر كل تقييم" subtitle="الشروحات ذات الخلفية الخضراء عامة لتعريف المعنى. القوائم الرمادية تحتها هي تحليل خاص بالسهم المختار." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-4 space-y-3"><h3 className="font-black text-lg">تقييم السهم: {result.stockScore}</h3><GeneralExplanation title="المعنى العام لهذا الرقم">{result.reasons.stockScore.meaning}</GeneralExplanation><ReasonList title="ما الذي رفع التقييم؟" items={result.reasons.stockScore.raised} /><ReasonList title="ما الذي خفض التقييم؟" items={result.reasons.stockScore.lowered} icon={AlertTriangle} /></CardContent></Card>
        <Card><CardContent className="p-4 space-y-3"><h3 className="font-black text-lg">اتفاق الأدلة: {result.evidenceAgreement}</h3><GeneralExplanation title="المعنى العام لهذا الرقم">{result.reasons.evidenceAgreement.meaning}</GeneralExplanation><ReasonList title="أدلة رفعت الاتفاق" items={result.reasons.evidenceAgreement.raised} /><ReasonList title="أدلة خفضت الاتفاق" items={result.reasons.evidenceAgreement.lowered} icon={AlertTriangle} /></CardContent></Card>
        <Card><CardContent className="p-4 space-y-3"><h3 className="font-black text-lg">مستوى المخاطرة: {result.riskLevel}</h3><GeneralExplanation title="المعنى العام لهذا الرقم">{result.reasons.riskLevel.meaning}</GeneralExplanation><ReasonList title="لماذا هذه المخاطرة؟" items={result.reasons.riskLevel.why} icon={ShieldAlert} /></CardContent></Card>
        <Card><CardContent className="p-4 space-y-3"><h3 className="font-black text-lg">التنفيذ المؤسسي</h3><GeneralExplanation title="المعنى العام لقابلية بناء مركز">{result.reasons.execution.buildMeaning}</GeneralExplanation><ReasonList title={`لماذا قابلية بناء المركز = ${result.buildPositionScore}؟`} items={result.reasons.execution.build} icon={Building2} /><GeneralExplanation title="المعنى العام لخطر كشف الدخول">{result.reasons.execution.exposureMeaning}</GeneralExplanation><ReasonList title={`لماذا خطر كشف الدخول = ${result.entryExposureRisk}؟`} items={result.reasons.execution.exposure} icon={Eye} /></CardContent></Card>
      </div>
    </section>
  );
}

export function MetricBox({ title, value, explanation }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
      <div className="text-xs text-slate-500 mb-2">{title}</div>
      <div className="text-xl font-black">{value}</div>
      {explanation ? <div className={`mt-2 rounded-xl border px-2 py-1 text-xs leading-5 ${generalExplanationClasses()}`}>{explanation}</div> : null}
    </div>
  );
}

export function InstitutionalExecution({ stock, result }) {
  const decisionText = result.decision === "شراء" ? "الخطة الخاصة بهذا السهم هي بناء مركز تدريجي، أي تقسيم الشراء على أكثر من جلسة بدل شراء الكمية كلها مرة واحدة." : result.decision === "بيع" ? "الخطة الخاصة بهذا السهم هي تخفيف المركز أو تجنب دخول جديد، مع عدم البيع العشوائي إذا كانت السيولة ضعيفة." : "الخطة الخاصة بهذا السهم هي الانتظار ومراقبة الشروط المحددة قبل التحرك.";
  return (
    <section>
      <SectionTitle icon={Building2} title="التقييم المؤسسي للتنفيذ" subtitle="شرح عام: هذا القسم يحول التحليل إلى خطة تنفيذ، ويسأل هل السوق يسمح بالشراء أو البيع عمليًا؟" />
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricBox title="متوسط التداول اليومي" value={`${stock.avgDailyValueM} مليون جنيه`} explanation="شرح عام: حجم الأموال المتداولة تقريبًا على السهم في اليوم." />
            <MetricBox title="أمر مؤسسي افتراضي" value={`${stock.institutionalOrderM} مليون جنيه`} explanation="شرح عام: مثال لحجم أمر كبير نختبر به قدرة السهم على تحمل دخول مؤسسة." />
            <MetricBox title="نسبة الأمر للسيولة" value={`${Math.round(result.orderToLiquidityRatio * 100)}%`} explanation="شرح عام: كلما زادت النسبة، زاد احتمال تأثير الأمر على السعر." />
            <MetricBox title="خطة التنفيذ" value={`${result.suggestedSessions} جلسة تقريبًا`} explanation="شرح عام: عدد الجلسات المقترح لتوزيع الأمر وتقليل أثره." />
          </div>
          <div className="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-4 text-sm leading-7 text-slate-700">{decisionText}</div>
        </CardContent>
      </Card>
    </section>
  );
}

export function TimelineSection({ stock }) {
  const summary = trendSummary(stock.timeline);
  const first = stock.timeline[0];
  const last = stock.timeline[stock.timeline.length - 1];
  return (
    <section>
      <SectionTitle icon={Activity} title="هل القراءة تتحسن أم تتدهور؟" subtitle="شرح عام: الرقم الحالي وحده قد يخدع، لذلك نراجع اتجاه الأرقام خلال آخر جلسات." />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricBox title="تقييم السهم" value={`${first.stockScore} ← ${last.stockScore}`} explanation="شرح عام: هل جودة السهم تتحسن أم تضعف؟" />
            <MetricBox title="السيولة" value={`${first.liquidity} ← ${last.liquidity}`} explanation="شرح عام: هل التداول يساعد على تنفيذ القرار أم يقل؟" />
            <MetricBox title="اتفاق الأدلة" value={`${first.evidence} ← ${last.evidence}`} explanation="شرح عام: هل المؤشرات أصبحت أكثر اتفاقًا أم أكثر تناقضًا؟" />
          </CardContent>
        </Card>
        <Card><CardContent className="p-5"><div className="rounded-3xl bg-slate-50 border border-slate-200 p-4 text-sm leading-7 font-bold">{summary.conclusion}</div></CardContent></Card>
      </div>
    </section>
  );
}

export function ExternalFactors({ stock }) {
  return (
    <section>
      <SectionTitle icon={Link2} title="العوامل الخارجية وربطها بالقرار" subtitle="شرح عام: العامل الخارجي لا يشتري ولا يبيع وحده، لكنه يوضح هل البيئة حول السهم تساعد القرار أم تضغط عليه." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stock.external.map((factor) => (
          <Card key={factor.name}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-lg">{factor.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{factor.relation}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${factor.impact.includes("ضاغط") ? toneClasses("danger") : factor.impact.includes("داعم") ? toneClasses("success") : toneClasses("warning")}`}>{factor.impact}</span>
              </div>
              <div className="mt-4"><ScoreBar value={factor.score} left="ضعيف" right="قوي" /></div>
              <p className="text-sm text-slate-600 leading-7 mt-4">{factor.explanation}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function RelationshipCard({ title, tone, items, conclusion }) {
  return (
    <Card className={toneClasses(tone)}>
      <CardContent className="p-5">
        <h3 className="font-black text-lg mb-3">{title}</h3>
        <ul className="space-y-2 text-sm leading-7">{items.map((item) => <li key={item}>• {item}</li>)}</ul>
        <div className="mt-4 rounded-2xl bg-white/70 p-3 font-bold text-sm leading-7">{conclusion}</div>
      </CardContent>
    </Card>
  );
}

export function RelationshipMap({ result }) {
  const internalTone = result.evidenceAgreement >= 65 ? "success" : result.evidenceAgreement >= 50 ? "warning" : "danger";
  const externalTone = result.externalSupport >= 60 ? "success" : result.externalSupport >= 45 ? "warning" : "danger";
  const executionTone = result.buildPositionScore >= 60 && result.entryExposureRisk <= 58 ? "success" : "warning";
  return (
    <section>
      <SectionTitle icon={BarChart3} title="خريطة علاقات السهم" subtitle="شرح عام: هذه الخريطة تلخص هل داخل السهم جيد، وهل التنفيذ ممكن، وهل العوامل الخارجية تساعد." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RelationshipCard title="العلاقات الداخلية" tone={internalTone} items={["شراء منظم يدعم السهم.", "ضعف ضغط البيع يجعل الصعود أسهل.", "ارتفاع المخاطر يخصم من القرار."]} conclusion={result.evidenceAgreement >= 65 ? "العلاقات الداخلية في هذه القراءة متوافقة." : "العلاقات الداخلية في هذه القراءة غير كافية أو مختلطة."} />
        <RelationshipCard title="علاقات التنفيذ" tone={executionTone} items={["السيولة تحدد هل يمكن تنفيذ القرار.", "حجم الأمر الكبير قد يكشف دخول المؤسسة.", "التنفيذ التدريجي يقلل الأثر على السعر."]} conclusion={executionTone === "success" ? "التنفيذ في هذه القراءة قابل للإدارة." : "التنفيذ في هذه القراءة يحتاج حذرًا أكبر."} />
        <RelationshipCard title="العلاقات الخارجية" tone={externalTone} items={["الدولار أو الفائدة أو المؤشر قد يدعمون أو يضغطون.", "العامل الخارجي يفسر البيئة المحيطة بالسهم.", "العامل الخارجي لا يكفي وحده لإصدار القرار."]} conclusion={result.externalSupport >= 60 ? "البيئة الخارجية في هذه القراءة تساعد." : "البيئة الخارجية في هذه القراءة لا تعطي دعمًا حاسمًا."} />
      </div>
    </section>
  );
}

export function InvestorFit({ result }) {
  const rows = [
    { type: "مضارب قصير الأجل", verdict: result.riskLevel <= 55 && result.stockScore >= 60 ? "مناسب بحذر" : "غير مثالي", reason: result.riskLevel <= 55 ? "في هذه القراءة، المخاطرة قابلة للإدارة نسبيًا، لكن يلزم توقيت وخطة خروج." : "في هذه القراءة، المخاطرة أو التذبذب مرتفعان نسبيًا." },
    { type: "مستثمر متوسط الأجل", verdict: result.stockScore >= 60 && result.evidenceAgreement >= 55 ? "مناسب للمراقبة" : "انتظار أفضل", reason: "في هذه القراءة، المستثمر المتوسط يحتاج استمرار التحسن وليس إشارة يوم واحد فقط." },
    { type: "مؤسسة أو صندوق", verdict: result.decision === "شراء" ? "مناسب لبناء تدريجي" : result.decision === "بيع" ? "غير مناسب حاليًا" : "تحت المراقبة", reason: result.buildPositionScore >= 60 ? "في هذه القراءة، قابلية بناء المركز مقبولة نسبيًا." : "في هذه القراءة، بناء مركز كبير قد يؤثر على السعر." },
    { type: "مدير محفظة", verdict: result.decision, reason: "في هذه القراءة، القرار يترجم إلى وزن نسبي داخل المحفظة وليس دخولًا كاملًا دفعة واحدة." },
  ];
  return (
    <section>
      <SectionTitle icon={Users} title="مناسب لمن؟" subtitle="شرح عام: نفس السهم قد يناسب شخصًا ولا يناسب آخر حسب حجم المال ومدة الاستثمار وتحمل المخاطرة." />
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4 text-right">نوع المستخدم</th><th className="p-4 text-right">الحكم</th><th className="p-4 text-right">السبب الخاص بهذه القراءة</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.type} className="border-b border-slate-100 last:border-0"><td className="p-4 font-bold">{row.type}</td><td className="p-4"><span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{row.verdict}</span></td><td className="p-4 text-slate-600 leading-7">{row.reason}</td></tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function LogicTests({ stock, result }) {
  const scores = [result.stockScore, result.evidenceAgreement, result.riskLevel, result.buildPositionScore, result.entryExposureRisk, result.externalSupport, result.institutionalScore];
  const tests = [
    { label: "كل التقييمات بين 0 و100", pass: scores.every((x) => x >= 0 && x <= 100), explanation: "حتى لا يظهر رقم غير منطقي للعميل." },
    { label: "كل الأرقام صالحة وليست NaN", pass: scores.every((x) => Number.isFinite(x)), explanation: "حتى لا تظهر نتيجة فنية مكسورة بدل التقرير." },
    { label: "كل رقم رئيسي له تفسير مباشر", pass: Boolean(result.reasons.stockScore && result.reasons.evidenceAgreement && result.reasons.riskLevel && result.reasons.execution), explanation: "أي رقم بدون تفسير يعتبر نقطة ضعف في التقرير." },
    { label: "الخطر يخصم من القرار ولا يضيف إليه", pass: result.riskLevel < 70 || result.decision !== "شراء", explanation: "لا يصح أن يظهر شراء قوي مع مخاطرة مرتفعة جدًا." },
    { label: "خطر كشف الدخول العالي يمنع الشراء", pass: result.entryExposureRisk < 65 || result.decision !== "شراء", explanation: "لا يصح أن نشتري مؤسسيًا إذا كان دخولنا سيظهر بسهولة للسوق." },
    { label: "ضعف اتفاق الأدلة يمنع الشراء", pass: result.evidenceAgreement > 55 || result.decision !== "شراء", explanation: "لا يصح أن نعتمد على إشارة واحدة متناقضة." },
    { label: "القرار المؤسسي واضح لكل سهم", pass: ["شراء", "بيع", "انتظار"].includes(result.decision), explanation: "العميل يجب أن يرى قرارًا عمليًا لا كلامًا عامًا." },
    { label: "العوامل الخارجية مربوطة بالقرار", pass: stock.external.length >= 3 && result.externalSupport >= 0, explanation: "العوامل الخارجية يجب أن تفسر القرار لا أن تكون كروت منفصلة." },
    { label: "خطة التنفيذ لا تقل عن جلسة واحدة", pass: result.suggestedSessions >= 1, explanation: "أي قرار مؤسسي يحتاج خطة زمنية للتنفيذ." },
    { label: "بيانات الزمن تحتوي على خمس جلسات أو أكثر", pass: stock.timeline.length >= 5, explanation: "نحتاج أكثر من نقطة حتى لا نحكم من لقطة واحدة." },
    { label: "الشروحات العامة لها لون أخضر موحد", pass: GENERAL_EXPLANATION_CLASS.includes("emerald"), explanation: "حتى يعرف العميل أن هذا شرح عام وليس تحليلًا خاصًا بالسهم." },
    { label: "كل سهم لديه عوامل خارجية", pass: stock.external.every((x) => x.name && x.explanation), explanation: "حتى لا تظهر عوامل بلا تفسير." },
    { label: "خريطة العلاقات مكتملة بثلاثة محاور", pass: Boolean(result.evidenceAgreement >= 0 && result.externalSupport >= 0 && result.buildPositionScore >= 0), explanation: "حتى لا ينقطع التقرير عند العلاقات الداخلية أو الخارجية." },
  ];
  return (
    <section>
      <SectionTitle icon={CheckCircle2} title="اختبارات منطق الحساب" subtitle="شرح عام: هذه الاختبارات تمنع تناقضات مثل شراء مع خطر مرتفع جدًا أو رقم بلا تفسير." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {tests.map((test) => (
          <div key={test.label} className={`rounded-2xl border p-3 flex gap-2 ${test.pass ? toneClasses("success") : toneClasses("danger")}`}>
            <div className="pt-1">{test.pass ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}</div>
            <div><div className="font-bold text-sm">{test.label}</div><div className="text-xs leading-5 mt-1 opacity-80">{test.explanation}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

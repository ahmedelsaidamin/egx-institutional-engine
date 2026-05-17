import React, { useEffect, useMemo, useState } from "react";
import { calculateStock } from "./calculations.js";
import { loadKaggleStocks, GENERAL_EXPLANATION_CLASS } from "./dataLoader.js";
import {
  PageShell,
  DataStatus,
  DecisionHeader,
  ClientGlossary,
  DecisionExplanation,
  SubScores,
  ScoreBreakdowns,
  InstitutionalExecution,
  TimelineSection,
  ExternalFactors,
  RelationshipMap,
  InvestorFit,
  LogicTests,
  Card,
  CardContent,
  ScoreBar,
  toneClasses,
} from "./ui.jsx";

function decisionBadgeClass(decision) {
  if (decision === "شراء") return "bg-emerald-600 text-white";
  if (decision === "بيع") return "bg-rose-600 text-white";
  return "bg-amber-500 text-white";
}

function Tabs({ activeView, setActiveView }) {
  const tabs = [
    { id: "report", label: "تقرير السهم" },
    { id: "radar", label: "Pulse Radar" },
    { id: "compare", label: "Compare" },
  ];
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-bold border transition ${
                activeView === tab.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RadarMetric({ title, value, tone = "neutral" }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${toneClasses(tone)}`}>
      <div className="text-xs opacity-80">{title}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  );
}

function MiniScore({ title, value, risk = false }) {
  const bad = risk ? value >= 60 : value < 50;
  const good = risk ? value < 45 : value >= 65;
  const cls = good ? toneClasses("success") : bad ? toneClasses("danger") : toneClasses("warning");
  return (
    <div className={`rounded-2xl border p-2 ${cls}`}>
      <div className="text-xs opacity-80">{title}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}

function PulseRadar({ stocks, results, setSymbol, setActiveView }) {
  const [sortBy, setSortBy] = useState("institutionalScore");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toUpperCase();
    return Object.values(stocks)
      .map((stock) => ({ stock, result: results[stock.symbol] }))
      .filter((row) => row.result)
      .filter((row) => filter === "all" || row.result.decision === filter)
      .filter((row) => !q || row.stock.symbol.includes(q))
      .sort((a, b) => (b.result[sortBy] ?? 0) - (a.result[sortBy] ?? 0));
  }, [stocks, results, sortBy, filter, search]);

  const summary = useMemo(() => {
    const all = Object.values(results);
    return {
      total: all.length,
      buy: all.filter((r) => r.decision === "شراء").length,
      wait: all.filter((r) => r.decision === "انتظار").length,
      sell: all.filter((r) => r.decision === "بيع").length,
      avgInstitutional: Math.round(all.reduce((s, r) => s + r.institutionalScore, 0) / Math.max(all.length, 1)),
      avgRisk: Math.round(all.reduce((s, r) => s + r.riskLevel, 0) / Math.max(all.length, 1)),
    };
  }, [results]);

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h2 className="text-2xl font-black mb-2">Pulse Radar لكل الأسهم</h2>
          <div className={`rounded-2xl border p-3 text-sm leading-7 ${GENERAL_EXPLANATION_CLASS}`}>
            شرح عام: هذه الشاشة تمسح كل الأسهم المتاحة في ملف Kaggle وتحوّلها إلى رادار قرار سريع: شراء، انتظار، بيع، مع المخاطرة والسيولة واتفاق الأدلة.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <RadarMetric title="عدد الأسهم" value={summary.total} />
            <RadarMetric title="شراء" value={summary.buy} tone="success" />
            <RadarMetric title="انتظار" value={summary.wait} tone="warning" />
            <RadarMetric title="بيع" value={summary.sell} tone="danger" />
            <RadarMetric title="متوسط القوة" value={summary.avgInstitutional} />
            <RadarMetric title="متوسط الخطر" value={summary.avgRisk} tone={summary.avgRisk >= 60 ? "danger" : "neutral"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بكود السهم..."
              className="rounded-xl border border-slate-300 px-3 py-2 bg-white font-bold"
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 bg-white font-bold">
              <option value="institutionalScore">ترتيب حسب قوة القرار</option>
              <option value="stockScore">ترتيب حسب تقييم السهم</option>
              <option value="evidenceAgreement">ترتيب حسب اتفاق الأدلة</option>
              <option value="buildPositionScore">ترتيب حسب قابلية بناء مركز</option>
              <option value="riskLevel">ترتيب حسب المخاطرة</option>
              <option value="entryExposureRisk">ترتيب حسب خطر كشف الدخول</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilter("all")} className={`px-3 py-2 rounded-xl text-sm font-bold border ${filter === "all" ? "bg-slate-900 text-white" : "bg-white"}`}>الكل</button>
              <button onClick={() => setFilter("شراء")} className={`px-3 py-2 rounded-xl text-sm font-bold border ${filter === "شراء" ? "bg-emerald-600 text-white" : "bg-white"}`}>شراء</button>
              <button onClick={() => setFilter("انتظار")} className={`px-3 py-2 rounded-xl text-sm font-bold border ${filter === "انتظار" ? "bg-amber-500 text-white" : "bg-white"}`}>انتظار</button>
              <button onClick={() => setFilter("بيع")} className={`px-3 py-2 rounded-xl text-sm font-bold border ${filter === "بيع" ? "bg-rose-600 text-white" : "bg-white"}`}>بيع</button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map(({ stock, result }) => (
          <Card key={stock.symbol}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{stock.symbol}</h3>
                  <p className="text-xs text-slate-500 mt-1">{stock.sourceDate} · السعر {stock.price}</p>
                </div>
                <span className={`rounded-2xl px-3 py-1 text-sm font-black ${decisionBadgeClass(result.decision)}`}>{result.decision}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MiniScore title="قوة القرار" value={result.institutionalScore} />
                <MiniScore title="تقييم السهم" value={result.stockScore} />
                <MiniScore title="اتفاق الأدلة" value={result.evidenceAgreement} />
                <MiniScore title="المخاطرة" value={result.riskLevel} risk />
              </div>
              <div className="text-sm leading-7 text-slate-600">{result.reasons.decision.weakness}</div>
              <button
                onClick={() => {
                  setSymbol(stock.symbol);
                  setActiveView("report");
                }}
                className="w-full rounded-2xl bg-slate-900 text-white px-4 py-2 font-bold"
              >
                افتح التقرير الكامل
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function renderCompareValue(value, kind) {
  if (kind === "text") {
    return <span className={`rounded-2xl px-3 py-1 font-bold ${decisionBadgeClass(value)}`}>{value}</span>;
  }
  return <span className="font-black">{value}</span>;
}

function compareComment(label, a, b, kind, left, right) {
  if (kind === "text") {
    if (a === b) return "القرار النهائي متشابه، لذلك نحتاج النظر إلى القوة والمخاطر.";
    return `${left}: ${a} / ${right}: ${b}`;
  }
  if (a === b) return "القراءتان متساويتان تقريبًا.";
  const higherIsBad = kind === "risk" || label.includes("خطر");
  const better = higherIsBad ? (a < b ? left : right) : (a > b ? left : right);
  if (higherIsBad) return `${better} أفضل هنا لأن الرقم الأقل يعني مخاطرة أو كشف دخول أقل.`;
  return `${better} أقوى هنا لأن الرقم الأعلى أفضل في هذا المعيار.`;
}

function CompareView({ stocks, results, symbol, setSymbol }) {
  const symbols = Object.keys(stocks);
  const [left, setLeft] = useState(symbol || symbols[0] || "");
  const [right, setRight] = useState(symbols.find((s) => s !== left) || symbols[1] || left || "");

  useEffect(() => {
    if (symbol && !left) setLeft(symbol);
  }, [symbol, left]);

  const leftStock = stocks[left];
  const rightStock = stocks[right];
  const leftResult = results[left];
  const rightResult = results[right];

  if (!leftStock || !rightStock || !leftResult || !rightResult) {
    return <Card><CardContent className="p-5">اختر سهمين للمقارنة.</CardContent></Card>;
  }

  const metrics = [
    ["القرار", leftResult.decision, rightResult.decision, "text"],
    ["قوة القرار", leftResult.institutionalScore, rightResult.institutionalScore],
    ["تقييم السهم", leftResult.stockScore, rightResult.stockScore],
    ["اتفاق الأدلة", leftResult.evidenceAgreement, rightResult.evidenceAgreement],
    ["المخاطرة", leftResult.riskLevel, rightResult.riskLevel, "risk"],
    ["قابلية بناء مركز", leftResult.buildPositionScore, rightResult.buildPositionScore],
    ["خطر كشف الدخول", leftResult.entryExposureRisk, rightResult.entryExposureRisk, "risk"],
    ["الدعم الخارجي", leftResult.externalSupport, rightResult.externalSupport],
  ];

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h2 className="text-2xl font-black mb-2">Compare — مقارنة سهمين</h2>
          <div className={`rounded-2xl border p-3 text-sm leading-7 ${GENERAL_EXPLANATION_CLASS}`}>
            شرح عام: المقارنة لا تقول إن سهمًا أفضل دائمًا، لكنها توضّح أي سهم أقوى في القرار المؤسسي، وأيهما أخطر، وأيهما أسهل في التنفيذ.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <select value={left} onChange={(e) => { setLeft(e.target.value); setSymbol(e.target.value); }} className="rounded-2xl border px-4 py-3 bg-white font-bold">
              {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={right} onChange={(e) => setRight(e.target.value)} className="rounded-2xl border px-4 py-3 bg-white font-bold">
              {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 text-right">المعيار</th>
                  <th className="p-4 text-right">{left}</th>
                  <th className="p-4 text-right">{right}</th>
                  <th className="p-4 text-right">قراءة سريعة</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(([label, a, b, kind]) => (
                  <tr key={label} className="border-b last:border-0">
                    <td className="p-4 font-bold">{label}</td>
                    <td className="p-4">{renderCompareValue(a, kind)}</td>
                    <td className="p-4">{renderCompareValue(b, kind)}</td>
                    <td className="p-4 text-slate-600 leading-7">{compareComment(label, a, b, kind, left, right)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-4 space-y-3"><h3 className="font-black text-xl">{left}</h3><ScoreBar value={leftResult.institutionalScore} left="ضعيف" right="قوي" /><div className="text-sm leading-7 text-slate-600">{leftResult.reasons.decision.main}</div></CardContent></Card>
        <Card><CardContent className="p-4 space-y-3"><h3 className="font-black text-xl">{right}</h3><ScoreBar value={rightResult.institutionalScore} left="ضعيف" right="قوي" /><div className="text-sm leading-7 text-slate-600">{rightResult.reasons.decision.main}</div></CardContent></Card>
      </div>
    </section>
  );
}

function ReportView({ stocks, stock, result, setSymbol }) {
  return (
    <>
      <DecisionHeader stocks={stocks} stock={stock} result={result} setSymbol={setSymbol} />
      <ClientGlossary />
      <DecisionExplanation result={result} />
      <SubScores result={result} />
      <ScoreBreakdowns result={result} />
      <InstitutionalExecution stock={stock} result={result} />
      <TimelineSection stock={stock} />
      <ExternalFactors stock={stock} />
      <RelationshipMap result={result} />
      <InvestorFit result={result} />
      <LogicTests stock={stock} result={result} />
    </>
  );
}

export default function EGXInstitutionalDecisionEngine() {
  const [stocks, setStocks] = useState({});
  const [symbol, setSymbol] = useState("");
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("report");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const loaded = await loadKaggleStocks();
        if (cancelled) return;
        setStocks(loaded.stocks);
        setMeta(loaded);
        const first = Object.keys(loaded.stocks)[0] || "";
        setSymbol(first);
        setError("");
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "فشل تحميل البيانات.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stock = stocks[symbol] || Object.values(stocks)[0];
  const result = useMemo(() => (stock ? calculateStock(stock) : null), [stock]);
  const results = useMemo(() => {
    const out = {};
    for (const s of Object.values(stocks)) {
      out[s.symbol] = calculateStock(s);
    }
    return out;
  }, [stocks]);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <DataStatus meta={meta} loading={loading} error={error} />
        {!stock || !result ? (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 text-slate-600">لا توجد بيانات جاهزة للعرض بعد.</div>
        ) : (
          <>
            <Tabs activeView={activeView} setActiveView={setActiveView} />
            {activeView === "report" && <ReportView stocks={stocks} stock={stock} result={result} setSymbol={setSymbol} />}
            {activeView === "radar" && <PulseRadar stocks={stocks} results={results} setSymbol={setSymbol} setActiveView={setActiveView} />}
            {activeView === "compare" && <CompareView stocks={stocks} results={results} symbol={symbol} setSymbol={setSymbol} />}
            <div className="pb-8 text-center text-xs text-slate-500 leading-6">
              نسخة Upload Ready + Features: تقرأ ملف EGX30_with_WSV.csv مباشرة، وتضيف Pulse Radar و Compare بدون Supabase أو SQL.
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

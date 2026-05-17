import React, { useEffect, useMemo, useState } from "react";
import { calculateStock } from "./calculations.js";
import { loadKaggleStocks } from "./dataLoader.js";
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
} from "./ui.jsx";

export default function EGXInstitutionalDecisionEngine() {
  const [stocks, setStocks] = useState({});
  const [symbol, setSymbol] = useState("");
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <DataStatus meta={meta} loading={loading} error={error} />

        {!stock || !result ? (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 text-slate-600">
            لا توجد بيانات جاهزة للعرض بعد.
          </div>
        ) : (
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
            <div className="pb-8 text-center text-xs text-slate-500 leading-6">
              نسخة Upload Ready: تقرأ ملف EGX30_with_WSV.csv مباشرة من داخل المشروع. لا تحتاج Supabase ولا Python ولا SQL.
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { stocks as fallbackStocks } from "./data.js";
import { calculateStock } from "./calculations.js";
import { supabase, hasSupabaseConfig } from "./supabaseClient.js";
import {
  PageShell,
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
} from "./ui.jsx";

function dbRowToStock(row) {
  return {
    symbol: row.symbol,
    name: row.name,
    sector: row.sector,
    price: Number(row.price),
    avgDailyValueM: Number(row.avg_daily_value_m),
    institutionalOrderM: Number(row.institutional_order_m),
    internal: {
      organizedBuying: Number(row.organized_buying),
      sellingPressureWeakness: Number(row.selling_pressure_weakness),
      preMovePressure: Number(row.pre_move_pressure),
      liquidityQuality: Number(row.liquidity_quality),
      overExtensionRisk: Number(row.over_extension_risk),
      exhaustionRisk: Number(row.exhaustion_risk),
      volatilityRisk: Number(row.volatility_risk),
    },
    external: Array.isArray(row.external_factors) ? row.external_factors : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
  };
}

function rowsToStockMap(rows) {
  const map = {};
  for (const row of rows || []) {
    if (!row?.symbol) continue;
    map[row.symbol] = dbRowToStock(row);
  }
  return map;
}

function StatusNotice({ loading, error, usingDatabase, stockCount }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm leading-7 text-slate-700">
          جاري تحميل البيانات من Supabase...
        </CardContent>
      </Card>
    );
  }

  if (!hasSupabaseConfig) {
    return (
      <Card>
        <CardContent className="p-4 text-sm leading-7 text-amber-700 bg-amber-50 rounded-3xl border border-amber-200">
          لم يتم العثور على مفاتيح Supabase في Vercel. الموقع يعمل الآن بالبيانات التجريبية داخل الكود.
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-sm leading-7 text-rose-700 bg-rose-50 rounded-3xl border border-rose-200">
          فشل تحميل البيانات من Supabase. الموقع يعرض البيانات التجريبية مؤقتًا. سبب الخطأ: {error}
        </CardContent>
      </Card>
    );
  }

  if (usingDatabase) {
    return (
      <Card>
        <CardContent className="p-4 text-sm leading-7 text-emerald-800 bg-emerald-50 rounded-3xl border border-emerald-200">
          البيانات الحالية قادمة من Supabase. عدد الأسهم المحملة: {stockCount}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 text-sm leading-7 text-amber-700 bg-amber-50 rounded-3xl border border-amber-200">
        لم يتم العثور على أسهم داخل Supabase، لذلك يتم عرض البيانات التجريبية.
      </CardContent>
    </Card>
  );
}

export default function EGXInstitutionalDecisionEngine() {
  const [symbol, setSymbol] = useState("ABUK");
  const [databaseStocks, setDatabaseStocks] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStocks() {
      if (!hasSupabaseConfig || !supabase) return;

      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("stock_readings")
        .select("*")
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (loadError) {
        setError(loadError.message || "Unknown error");
        setDatabaseStocks(null);
      } else {
        setDatabaseStocks(rowsToStockMap(data));
      }

      setLoading(false);
    }

    loadStocks();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeStocks = databaseStocks && Object.keys(databaseStocks).length > 0 ? databaseStocks : fallbackStocks;
  const usingDatabase = Boolean(databaseStocks && Object.keys(databaseStocks).length > 0);

  const stock = activeStocks[symbol] || Object.values(activeStocks)[0] || fallbackStocks.ABUK;
  const result = useMemo(() => calculateStock(stock), [stock]);

  function handleSymbolChange(nextSymbol) {
    setSymbol(nextSymbol);
  }

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <StatusNotice
          loading={loading}
          error={error}
          usingDatabase={usingDatabase}
          stockCount={Object.keys(activeStocks).length}
        />

        <DecisionHeader stock={stock} result={result} setSymbol={handleSymbolChange} />

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
          نسخة Demo تعليمية منظمة. عند توافر بيانات Supabase، يتم استخدامها بدل البيانات التجريبية داخل الكود.
        </div>
      </div>
    </PageShell>
  );
}

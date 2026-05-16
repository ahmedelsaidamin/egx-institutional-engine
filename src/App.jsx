import React, { useMemo, useState } from "react";
import { stocks } from "./data.js";
import { calculateStock } from "./calculations.js";
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
} from "./ui.jsx";

export default function EGXInstitutionalDecisionEngine() {
  const [symbol, setSymbol] = useState("ABUK");
  const stock = stocks[symbol] || stocks.ABUK;
  const result = useMemo(() => calculateStock(stock), [stock]);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <DecisionHeader stock={stock} result={result} setSymbol={setSymbol} />
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
          نسخة Demo تعليمية منظمة. البيانات تجريبية وليست توصية استثمارية. الهدف الحالي اختبار منطق التقرير ولغته وترتيبه قبل ربطه ببيانات سوق حقيقية.
        </div>
      </div>
    </PageShell>
  );
}

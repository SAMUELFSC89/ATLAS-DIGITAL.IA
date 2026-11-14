import { CheckCircle2, CircleDashed, CircleSlash, MinusCircle } from 'lucide-react';
import type { AtlasAudit, AtlasCheck, AtlasCheckStatus } from '../types';

const STATUS_STYLE: Record<AtlasCheckStatus, { icon: typeof CheckCircle2; className: string; label: string }> = {
  ok: { icon: CheckCircle2, className: 'text-emerald-400', label: 'Atendido' },
  partial: { icon: MinusCircle, className: 'text-amber-400', label: 'Parcial' },
  fail: { icon: CircleSlash, className: 'text-red-400', label: 'Não atendido' },
  unmeasured: { icon: CircleDashed, className: 'text-zinc-500', label: 'Não medido' },
};

function points(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function scoreColor(score: number): string {
  return score >= 70 ? 'text-emerald-400' : score >= 45 ? 'text-amber-400' : 'text-red-400';
}

function checkRow(check: AtlasCheck) {
  const style = STATUS_STYLE[check.status];
  const Icon = style.icon;
  return (
    <li key={check.id} className="flex items-start gap-3 py-2">
      <Icon aria-label={style.label} className={`mt-0.5 h-4 w-4 shrink-0 ${style.className}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-100">{check.label}</p>
        <p className="text-xs text-zinc-400">{check.evidence}</p>
      </div>
      <span className="shrink-0 font-mono text-xs text-zinc-400">
        {check.status === 'unmeasured' ? 'fora do cálculo' : `${points(check.points)}/${points(check.maxPoints)}`}
      </span>
    </li>
  );
}

export default function AtlasAuditPanel({ audit }: { audit: AtlasAudit }) {
  const { competitors } = audit;
  return (
    <div className="space-y-5 border-t border-zinc-800 pt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-black p-4 sm:col-span-1">
          <p className="text-sm text-zinc-400">Atlas Score</p>
          <p className={`mt-1 font-display text-4xl font-black ${audit.overallScore === null ? 'text-zinc-500' : scoreColor(audit.overallScore)}`}>
            {audit.overallScore === null ? '—' : audit.overallScore}
            <span className="text-base font-semibold text-zinc-500">/100</span>
          </p>
        </div>
        <div className="rounded-xl bg-black p-4 text-sm text-zinc-300 sm:col-span-2">
          <p>
            <strong className="text-white">{audit.coverage}% do índice foi medido</strong> nesta consulta. A nota considera só os itens
            medidos; o que não pôde ser conferido fica fora do cálculo, em vez de ser estimado.
          </p>
          {competitors.compared >= 3 && competitors.medianRating !== null && competitors.medianReviews !== null && (
            <p className="mt-2 text-xs text-zinc-400">
              Comparação com {competitors.compared} concorrentes da mesma busca: mediana de nota{' '}
              {competitors.medianRating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} e de{' '}
              {Math.round(competitors.medianReviews)} avaliações.
            </p>
          )}
        </div>
      </div>

      {audit.recommendations.length > 0 && (
        <section className="rounded-xl border border-[#E2B755]/30 bg-[#E2B755]/5 p-4">
          <h4 className="text-sm font-bold text-white">O que mais aumenta a nota</h4>
          <ol className="mt-2 space-y-2">
            {audit.recommendations.map((item, index) => (
              <li key={item.id} className="flex items-start gap-3 text-sm text-zinc-200">
                <span className="mt-0.5 font-mono text-xs text-[#E2B755]">{index + 1}.</span>
                <span className="flex-1">{item.action}</span>
                <span className="shrink-0 font-mono text-xs text-emerald-400">+{points(item.maxPoints - item.points)} pts</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {audit.pillars.map((pillar) => {
        const ratio = pillar.measuredMaxPoints > 0 ? pillar.points / pillar.measuredMaxPoints : 0;
        return (
          <section key={pillar.id}>
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="text-sm font-bold text-white">{pillar.label}</h4>
              <span className="font-mono text-xs text-zinc-400">
                {pillar.measuredMaxPoints > 0
                  ? `${points(pillar.points)} de ${points(pillar.measuredMaxPoints)} pontos medidos`
                  : 'não medido'}
                {pillar.measuredMaxPoints < pillar.maxPoints && pillar.measuredMaxPoints > 0 && ` (peso total ${points(pillar.maxPoints)})`}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
              <div className={`h-full rounded-full ${ratio >= 0.7 ? 'bg-emerald-400' : ratio >= 0.45 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
            <ul className="mt-1 divide-y divide-zinc-900">
              {pillar.checks.map(checkRow)}
            </ul>
          </section>
        );
      })}

      <p className="text-xs text-zinc-500">
        Fontes: perfil e resultados do Google Maps (via Google Places) e a página inicial do site da empresa, lidos no momento
        da consulta. O tempo de resposta mede o servidor do site, não o carregamento completo da página.
      </p>
    </div>
  );
}

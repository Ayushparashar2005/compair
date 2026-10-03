import { ScaleBar } from '../ui/ScaleBar';

interface ScaleComparisonProps {
  statName: string;
  statUnit: string;
  entityValue: number;
  entityName: string;
  humanValue: number;
}

export function ScaleComparison({ statName, statUnit, entityValue, entityName, humanValue }: ScaleComparisonProps) {
  const maxValue = Math.max(entityValue, humanValue);
  const ratio = Math.max(entityValue, humanValue) / Math.min(entityValue, humanValue);
  const isLarger = entityValue > humanValue;
  
  return (
    <div className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] p-6 rounded-2xl mb-6">
      <h3 className="text-xl font-bold font-display mb-4 flex items-center justify-between">
        <span>Vs Human: <span className="text-[var(--color-brand-accent)]">{statName}</span></span>
        <span className="text-sm font-mono text-[var(--color-brand-text-secondary)]">
          {ratio.toFixed(1)}× {isLarger ? 'larger' : 'smaller'}
        </span>
      </h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-2 font-mono text-[var(--color-brand-text-secondary)]">
            <span>{entityName}</span>
            <span className="font-bold text-[var(--color-brand-text-primary)]">{entityValue.toLocaleString()} {statUnit}</span>
          </div>
          <ScaleBar value={entityValue} maxValue={maxValue} colorClass="bg-[var(--color-brand-accent)]" delayMs={100} />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2 font-mono text-[var(--color-brand-text-secondary)]">
            <span>Human (avg)</span>
            <span className="font-bold text-[var(--color-brand-text-primary)]">{humanValue.toLocaleString()} {statUnit}</span>
          </div>
          <ScaleBar value={humanValue} maxValue={maxValue} colorClass="bg-[var(--color-brand-border)]" delayMs={200} />
        </div>
      </div>
    </div>
  );
}

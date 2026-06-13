interface Goal {
  label: string;
  current: number;
  target: number;
  unit: string;
  /** Tailwind bg-* class for the progress bar fill. */
  color: string;
}

export interface NutritionGoalsProps {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

export function NutritionGoals(props: NutritionGoalsProps) {
  const goals: Goal[] = [
    { label: 'Calories', ...props.calories, unit: '', color: 'bg-emerald-700' },
    { label: 'Protein', ...props.protein, unit: 'g', color: 'bg-orange-400' },
    { label: 'Carbs', ...props.carbs, unit: 'g', color: 'bg-emerald-400' },
    { label: 'Fat', ...props.fat, unit: 'g', color: 'bg-zinc-500' },
  ];

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 md:p-6">
      <h3 className="mb-5 text-lg font-bold text-zinc-900">Today&apos;s Nutrition Goals</h3>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {goals.map((g) => (
          <GoalCell key={g.label} {...g} />
        ))}
      </div>
    </section>
  );
}

function GoalCell({ label, current, target, unit, color }: Goal) {
  const pct = target === 0 ? 0 : Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className={`absolute inset-y-0 left-0 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xl font-bold text-zinc-900">
        {current.toLocaleString()}
        {unit}
        <span className="ml-1 text-sm font-normal text-zinc-500">
          / {target.toLocaleString()}
          {unit}
        </span>
      </p>
    </div>
  );
}

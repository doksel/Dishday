import { IconBulb } from '../Icons';

export interface AiTipCardProps {
  /** Body of the tip — typically a single sentence. */
  body: string;
  /** Heading label, defaults to "Dishday AI Tip". */
  label?: string;
}

export function AiTipCard({ body, label = 'Dishday AI Tip' }: AiTipCardProps) {
  return (
    <section className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
        <IconBulb width={22} height={22} />
      </div>
      <div className="min-w-0">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          {label}
        </h4>
        <p className="text-sm text-zinc-700">{body}</p>
      </div>
    </section>
  );
}

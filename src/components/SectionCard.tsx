import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

export default function SectionCard({ title, description, headerRight, children }: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      {(title || description || headerRight) && (
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            {title && <h2 className="text-base font-medium text-slate-900">{title}</h2>}
            {description && <p className="text-sm text-slate-600">{description}</p>}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}



import type { ReactNode } from "react";

type TopbarProps = {
  title: string;
  right?: ReactNode;
};

export default function Topbar({ title, right }: TopbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl">
        {title}
      </h1>
      {right}
    </div>
  );
}



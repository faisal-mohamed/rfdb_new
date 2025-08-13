import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  color?: "green" | "slate";
};

export default function Badge({ children, color = "slate" }: BadgeProps) {
  const colorClasses =
    color === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colorClasses}`}>
      {children}
    </span>
  );
}



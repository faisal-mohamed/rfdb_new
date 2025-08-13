import type { ReactNode } from "react";

type RolePillProps = {
  children: ReactNode;
};

export default function RolePill({ children }: RolePillProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      {children}
    </span>
  );
}



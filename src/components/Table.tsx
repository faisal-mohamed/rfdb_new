import type { ReactNode, HTMLAttributes } from "react";

type TableProps = {
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default function Table({ children, className = "", ...rest }: TableProps) {
  return (
    <div className={`relative overflow-x-auto ${className}`} {...rest}>
      <table className="min-w-full text-left text-sm text-slate-700">
        {children}
      </table>
    </div>
  );
}



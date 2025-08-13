"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
};

export function NavItem({ href, icon, label, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <div className="relative group">
      {/* Glow effect for active/hover states */}
      <div className={`absolute -inset-0.5 rounded-xl blur transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-400/40 via-indigo-400/40 to-purple-400/40' 
          : 'bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-400/30 group-hover:via-indigo-400/30 group-hover:to-purple-400/30'
      }`}></div>
      
      <Link
        href={href}
        onClick={onClick}
        className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group-hover:scale-[1.02] active:scale-[0.98] ${
          isActive
            ? "bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-white shadow-lg border border-blue-400/30 backdrop-blur-sm"
            : "text-slate-300 hover:bg-slate-800/60 hover:text-white hover:shadow-md backdrop-blur-sm border border-transparent hover:border-slate-600/40"
        }`}
      >
        {/* Icon container */}
        <div className={`flex items-center justify-center transition-all duration-200 ${
          isActive 
            ? "text-blue-300 scale-110" 
            : "text-slate-400 group-hover:text-blue-300 group-hover:scale-110"
        }`}>
          {icon}
        </div>
        
        {/* Label */}
        <span className="font-medium tracking-wide">{label}</span>
        
        {/* Active indicator */}
        {isActive && (
          <div className="ml-auto">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full shadow-sm"></div>
          </div>
        )}
        
        {/* Hover arrow */}
        {!isActive && (
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </Link>
    </div>
  );
}

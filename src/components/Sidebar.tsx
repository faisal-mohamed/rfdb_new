"use client";

import { NavItem } from "./NavItem";
import { signOut, useSession } from "next-auth/react";
import { useCallback } from "react";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const isAdmin = session?.user?.userType === 'ADMIN';

  return (
    <>
      {/* Enhanced Overlay for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Enhanced Dark Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-all duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        {/* Sidebar glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500/30 via-indigo-500/30 to-purple-500/30 blur-xl"></div>
        
        {/* Main dark sidebar container */}
        <div className="relative h-full bg-slate-900/95 backdrop-blur-2xl border-r border-slate-700/50 shadow-2xl">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="flex h-full flex-col gap-6 p-6">
            {/* Enhanced Logo Section */}
            <div className="flex items-center gap-4 px-2">
              <div className="relative">
                {/* Logo glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/40 to-indigo-500/40 rounded-2xl blur"></div>
                <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-xl flex items-center justify-center group hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {/* Inner glow */}
                  <div className="absolute inset-2 bg-white/10 rounded-xl"></div>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent tracking-tight">
                  RFP Dashboard
                </span>
                <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
              </div>
            </div>

            {/* Enhanced Navigation */}
            <nav className="flex-1 space-y-2">
              <div className="px-2 mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</h3>
              </div>
              
              <NavItem 
                href="/dashboard" 
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                } 
                label="Dashboard" 
                onClick={onClose} 
              />
              
              {isAdmin && (
                <NavItem 
                  href="/users" 
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  } 
                  label="Users" 
                  onClick={onClose} 
                />
              )}
            </nav>

            {/* Enhanced Logout Button */}
            <div className="mt-auto space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/0 to-pink-500/0 hover:from-red-500/30 hover:to-pink-500/30 rounded-xl blur transition-all duration-300 group-hover:opacity-100"></div>
                <button
                  onClick={handleLogout}
                  className="relative w-full group rounded-xl border border-slate-600/60 bg-slate-800/80 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-slate-300 shadow-lg transition-all duration-200 hover:bg-red-900/20 hover:border-red-500/40 hover:text-red-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}




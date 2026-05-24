'use client';

import Link from 'next/link';
import { LayoutDashboard, ScrollText, PieChart, User } from 'lucide-react';

interface SidebarProps {
  userName: string;
  currentPage: 'dashboard' | 'transactions' | 'analytics';
}

export default function Sidebar({ userName, currentPage }: SidebarProps) {
  const getNavLinkClass = (page: string, isCurrent: boolean) => {
    const baseClass = 'flex items-center gap-3 px-4 py-3 font-medium transition-colors rounded-xl';
    if (isCurrent) {
      return `${baseClass} text-blue-500 bg-blue-500/10`;
    }
    return `${baseClass} text-slate-400 hover:text-slate-200`;
  };

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 p-6 flex flex-col z-10 relative">
      {/* USER PROFILE SECTION */}
      <div className="flex flex-col mb-10 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-[2px]">
            <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center">
              <User size={18} className="text-slate-300" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase">
              {userName} Workspace
            </h1>
            <p className="text-xs text-emerald-500 flex items-center gap-1.5 mt-0.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Online
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION MENU */}
      <nav className="flex flex-col gap-4">
        <Link
          href="/"
          className={getNavLinkClass('dashboard', currentPage === 'dashboard')}
        >
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link
          href="/transactions"
          className={getNavLinkClass('transactions', currentPage === 'transactions')}
        >
          <ScrollText size={20} /> Transactions
        </Link>
        <Link
          href="/analytics"
          className={getNavLinkClass('analytics', currentPage === 'analytics')}
        >
          <PieChart size={20} /> Analytics
        </Link>
      </nav>

      {/* FOOTER SPACER */}
      <div className="flex-1" />
      <div className="pt-6 border-t border-slate-800/60">
        <p className="text-xs text-slate-500 text-center">AI-Finance v0.1.0</p>
      </div>
    </aside>
  );
}

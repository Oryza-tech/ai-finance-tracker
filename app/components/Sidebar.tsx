'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ScrollText, PieChart, User, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface SidebarProps {
  userName: string;
  currentPage: 'dashboard' | 'transactions' | 'analytics';
}

export default function Sidebar({ userName, currentPage }: SidebarProps) {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', page: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/transactions', page: 'transactions', icon: <ScrollText size={20} />, label: 'Transactions' },
    { href: '/analytics', page: 'analytics', icon: <PieChart size={20} />, label: 'Analytics' },
  ];

  const linkClass = (page: string) =>
    `flex items-center gap-3 px-4 py-3 font-medium transition-colors rounded-xl ${
      currentPage === page
        ? 'text-blue-500 bg-blue-500/10'
        : 'text-slate-400 hover:text-slate-200'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* USER PROFILE */}
      <div className="flex flex-col mb-10 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-[2px]">
            <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center">
              <User size={18} className="text-slate-300" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase">{userName} Workspace</h1>
            <p className="text-xs text-emerald-500 flex items-center gap-1.5 mt-0.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </p>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex flex-col gap-4">
        {navLinks.map(({ href, page, icon, label }) => (
          <Link key={page} href={href} className={linkClass(page)} onClick={() => setMobileOpen(false)}>
            {icon} {label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* FOOTER */}
      <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between">
        <p className="text-xs text-slate-500">AI-Finance v0.1.0</p>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0f172a] border border-slate-800 text-slate-300"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-[#0f172a] border-r border-slate-800 p-6 z-50 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0f172a] border-r border-slate-800 p-6 flex-col z-10 relative">
        {sidebarContent}
      </aside>
    </>
  );
}

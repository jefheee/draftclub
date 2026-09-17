'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, LayoutGrid, Home, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Torneios', href: '/tournaments', icon: Trophy },
    { label: 'Jogadores', href: '/players', icon: Users },
    { label: 'Squad Builder', href: '/tournaments/11111111-1111-1111-1111-111111111111/teams/t1111111-1111-1111-1111-111111111111/builder', icon: LayoutGrid },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-zinc-100 leading-none">
                Draft<span className="text-emerald-400">Club</span>
              </span>
              <span className="text-[9px] font-semibold text-zinc-500 tracking-widest uppercase">
                EA FC Pro Clubs
              </span>
            </div>
          </Link>

          {/* Nav Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href) ||
                    (item.label === 'Squad Builder' && pathname.includes('/builder'));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors',
                    isActive
                      ? 'bg-zinc-800/80 text-emerald-400 border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section Action */}
        <div className="flex items-center gap-3">
          <Link
            href="/evaluate"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Avaliar Jogador</span>
            <span className="sm:hidden">Avaliar</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-900 py-2 bg-zinc-950 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href) ||
                (item.label === 'Squad Builder' && pathname.includes('/builder'));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors p-1',
                isActive ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-200'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

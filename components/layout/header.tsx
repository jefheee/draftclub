'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, LayoutGrid, Home, Shield, Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Torneios', href: '/tournaments', icon: Trophy },
    { label: 'Jogadores', href: '/players', icon: Users },
    { label: 'Squad Builder', href: '/tournaments/11111111-1111-1111-1111-111111111111/teams/b1111111-1111-1111-1111-111111111111/builder', icon: LayoutGrid },
    { label: 'Admin', href: '/admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-100 leading-none">
                Draft<span className="text-emerald-400">Club</span>
              </span>
              <span className="text-[9px] font-medium text-zinc-500 tracking-wider uppercase">
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
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section Action */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/evaluate"
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Avaliar Jogador</span>
            <span className="sm:hidden">Avaliar</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-900 py-1.5 bg-zinc-950 px-2">
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
                'flex flex-col items-center gap-0.5 text-[10px] transition-colors p-1',
                isActive ? 'text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

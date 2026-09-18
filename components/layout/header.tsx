'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Users, 
  LayoutGrid, 
  Home, 
  Shield, 
  Settings, 
  UserCheck, 
  LogIn, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-context';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Torneios', href: '/tournaments', icon: Trophy },
    { label: 'Jogadores', href: '/players', icon: Users },
    { label: 'Squad Builder', href: '/tournaments/11111111-1111-1111-1111-111111111111/teams/b1111111-1111-1111-1111-111111111111/builder', icon: LayoutGrid },
    { label: 'Capitão', href: '/captain', icon: UserCheck },
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

        {/* Right Section Auth / Actions */}
        <div className="flex items-center gap-2.5">
          {session ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300 font-medium">{session.name}</span>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">
                  [{session.role}]
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-300 transition-colors"
                title="Desconectar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-900 py-1.5 bg-zinc-950 px-2 overflow-x-auto">
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
                'flex flex-col items-center gap-0.5 text-[10px] transition-colors p-1 whitespace-nowrap',
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

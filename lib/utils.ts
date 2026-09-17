import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Tier } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateTier(score: number): Tier {
  if (score === 0) return 'UNRATED';
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function calculateOverall(mechanic: number, iq: number, teamplay: number): number {
  return Math.round(((mechanic + iq + teamplay) / 3) * 10) / 10;
}

export interface TierConfig {
  label: string;
  badgeClass: string;
  glowClass: string;
  textClass: string;
  borderClass: string;
  hex: string;
  description: string;
}

export const TIER_MAP: Record<Tier, TierConfig> = {
  S: {
    label: "TIER S",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    glowClass: "shadow-amber-500/20",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    hex: "#f59e0b",
    description: "Elite Pro / Decisivo (90-99)",
  },
  A: {
    label: "TIER A",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    glowClass: "shadow-emerald-500/20",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    hex: "#10b981",
    description: "Titular Absoluto (80-89)",
  },
  B: {
    label: "TIER B",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.2)]",
    glowClass: "shadow-sky-500/20",
    textClass: "text-sky-400",
    borderClass: "border-sky-500/30",
    hex: "#0ea5e9",
    description: "Sólido / Competitivo (70-79)",
  },
  C: {
    label: "TIER C",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    glowClass: "shadow-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/30",
    hex: "#f97316",
    description: "Compositor de Elenco (60-69)",
  },
  D: {
    label: "TIER D",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    glowClass: "shadow-rose-500/10",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    hex: "#f43f5e",
    description: "Necessita Desenvolvimento (<60)",
  },
  UNRATED: {
    label: "SEM TIER",
    badgeClass: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
    glowClass: "shadow-transparent",
    textClass: "text-zinc-400",
    borderClass: "border-zinc-800",
    hex: "#71717a",
    description: "Aguardando Avaliações",
  },
};

export function getPositionBadgeClass(position: string): string {
  const pos = position.toUpperCase().trim();
  if (['ATA', 'CA', 'PE', 'PD'].includes(pos)) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }
  if (['MEI', 'MC', 'ME', 'MD'].includes(pos)) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  if (['VOL', 'ALA'].includes(pos)) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
  if (['ZAG', 'LE', 'LD'].includes(pos)) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (pos === 'GK') {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
  return 'bg-zinc-800 text-zinc-300 border-zinc-700';
}

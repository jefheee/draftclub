import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Tier, FormationKey, FormationPreset } from "@/types/database";

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

/**
 * Padrão EA Sports de Cores para Atributos:
 * 80+ : Verde Neon / Esmeralda
 * 70-79: Amarelo / Âmbar
 * <70 : Vermelho / Rosa
 */
export function getEAStatColor(stat: number): {
  text: string;
  bg: string;
  border: string;
  badge: string;
} {
  if (stat >= 80) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  }
  if (stat >= 70) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    };
  }
  return {
    text: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };
}

export interface TierConfig {
  label: string;
  badgeClass: string;
  textClass: string;
  borderClass: string;
  hex: string;
  description: string;
}

export const TIER_MAP: Record<Tier, TierConfig> = {
  S: {
    label: "TIER S",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    hex: "#f59e0b",
    description: "Elite Pro / Decisivo (90-99)",
  },
  A: {
    label: "TIER A",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    hex: "#10b981",
    description: "Titular Absoluto (80-89)",
  },
  B: {
    label: "TIER B",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.2)]",
    textClass: "text-sky-400",
    borderClass: "border-sky-500/30",
    hex: "#0ea5e9",
    description: "Sólido / Competitivo (70-79)",
  },
  C: {
    label: "TIER C",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/30",
    hex: "#f97316",
    description: "Compositor de Elenco (60-69)",
  },
  D: {
    label: "TIER D",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/30",
    hex: "#f43f5e",
    description: "Necessita Treino (<60)",
  },
  UNRATED: {
    label: "SEM TIER",
    badgeClass: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
    textClass: "text-zinc-400",
    borderClass: "border-zinc-800",
    hex: "#71717a",
    description: "Aguardando Avaliações",
  },
};

export function getPositionBadgeClass(position: string): string {
  const pos = position.toUpperCase().trim();
  if (['ATA', 'CA', 'PE', 'PD'].includes(pos)) {
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  }
  if (['MEI', 'MC', 'ME', 'MD'].includes(pos)) {
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }
  if (['VOL', 'ALA'].includes(pos)) {
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  }
  if (['ZAG', 'LE', 'LD'].includes(pos)) {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
  if (pos === 'GK') {
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  }
  return 'bg-zinc-800 text-zinc-300 border-zinc-700';
}

// =========================================================================
// PRESETS TÁTICOS PARA O SQUAD BUILDER (Coordenadas xPercent / yPercent)
// Topo = Ataque (y ~15%), Base = Goleiro (y ~88%)
// =========================================================================

export const FORMATION_PRESETS: Record<FormationKey, FormationPreset> = {
  '1-2-1': {
    key: '1-2-1',
    label: '1-2-1 Losango (5x5)',
    format: '5x5',
    slots: [
      { slotId: '5x5_gk', positionCode: 'GK', displayName: 'Goleiro', xPercent: 50, yPercent: 88 },
      { slotId: '5x5_fix', positionCode: 'FIX', displayName: 'Fixo', xPercent: 50, yPercent: 68 },
      { slotId: '5x5_ale', positionCode: 'ALE', displayName: 'Ala Esquerda', xPercent: 22, yPercent: 46 },
      { slotId: '5x5_ald', positionCode: 'ALD', displayName: 'Ala Direita', xPercent: 78, yPercent: 46 },
      { slotId: '5x5_piv', positionCode: 'PIV', displayName: 'Pivô', xPercent: 50, yPercent: 20 },
    ],
  },
  '2-2': {
    key: '2-2',
    label: '2-2 Quadrado (5x5)',
    format: '5x5',
    slots: [
      { slotId: '5x5_22_gk', positionCode: 'GK', displayName: 'Goleiro', xPercent: 50, yPercent: 88 },
      { slotId: '5x5_22_de', positionCode: 'DEF', displayName: 'Defesa Esq', xPercent: 30, yPercent: 65 },
      { slotId: '5x5_22_dd', positionCode: 'DEF', displayName: 'Defesa Dir', xPercent: 70, yPercent: 65 },
      { slotId: '5x5_22_ae', positionCode: 'ATA', displayName: 'Ataque Esq', xPercent: 30, yPercent: 25 },
      { slotId: '5x5_22_ad', positionCode: 'ATA', displayName: 'Ataque Dir', xPercent: 70, yPercent: 25 },
    ],
  },
  '4-3-3': {
    key: '4-3-3',
    label: '4-3-3 Clássico (11x11)',
    format: '11x11',
    slots: [
      { slotId: '11_gk', positionCode: 'GK', displayName: 'Goleiro', xPercent: 50, yPercent: 90 },
      { slotId: '11_le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 74 },
      { slotId: '11_zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: '11_zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: '11_ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 74 },
      { slotId: '11_vol', positionCode: 'VOL', displayName: 'Volante', xPercent: 50, yPercent: 58 },
      { slotId: '11_mce', positionCode: 'MC', displayName: 'Meia Esq', xPercent: 30, yPercent: 44 },
      { slotId: '11_mcd', positionCode: 'MC', displayName: 'Meia Dir', xPercent: 70, yPercent: 44 },
      { slotId: '11_pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 18, yPercent: 20 },
      { slotId: '11_ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
      { slotId: '11_pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 82, yPercent: 20 },
    ],
  },
  '4-2-3-1': {
    key: '4-2-3-1',
    label: '4-2-3-1 Moderno (11x11)',
    format: '11x11',
    slots: [
      { slotId: '4231_gk', positionCode: 'GK', displayName: 'Goleiro', xPercent: 50, yPercent: 90 },
      { slotId: '4231_le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: '4231_zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: '4231_zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: '4231_ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: '4231_vole', positionCode: 'VOL', displayName: 'Volante 1', xPercent: 35, yPercent: 60 },
      { slotId: '4231_vold', positionCode: 'VOL', displayName: 'Volante 2', xPercent: 65, yPercent: 60 },
      { slotId: '4231_me', positionCode: 'ME', displayName: 'Meia Aberto E', xPercent: 18, yPercent: 36 },
      { slotId: '4231_mei', positionCode: 'MEI', displayName: 'Armador', xPercent: 50, yPercent: 34 },
      { slotId: '4231_md', positionCode: 'MD', displayName: 'Meia Aberto D', xPercent: 82, yPercent: 36 },
      { slotId: '4231_ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 16 },
    ],
  },
  '3-5-2': {
    key: '3-5-2',
    label: '3-5-2 Ofensivo (11x11)',
    format: '11x11',
    slots: [
      { slotId: '352_gk', positionCode: 'GK', displayName: 'Goleiro', xPercent: 50, yPercent: 90 },
      { slotId: '352_zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 26, yPercent: 76 },
      { slotId: '352_zagc', positionCode: 'ZAG', displayName: 'Líbero / Zagueiro', xPercent: 50, yPercent: 78 },
      { slotId: '352_zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 74, yPercent: 76 },
      { slotId: '352_alae', positionCode: 'ALA', displayName: 'Ala Esquerdo', xPercent: 12, yPercent: 50 },
      { slotId: '352_vol', positionCode: 'VOL', displayName: 'Primeiro Volante', xPercent: 50, yPercent: 58 },
      { slotId: '352_mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 34, yPercent: 44 },
      { slotId: '352_mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 66, yPercent: 44 },
      { slotId: '352_alad', positionCode: 'ALA', displayName: 'Ala Direito', xPercent: 88, yPercent: 50 },
      { slotId: '352_atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 18 },
      { slotId: '352_atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 18 },
    ],
  },
};

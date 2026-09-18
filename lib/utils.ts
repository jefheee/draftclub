import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Tier, FormationPreset, PitchPositionSlot } from "@/types/database";

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
 * Padrão EA Sports - Estilo Minimalista e Fosco (sem neons saturados)
 */
export function getEAStatColor(stat: number) {
  if (stat >= 80) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/40',
      badge: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
    };
  }
  if (stat >= 70) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/40',
      badge: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
    };
  }
  return {
    text: 'text-zinc-400',
    bg: 'bg-zinc-900',
    border: 'border-zinc-800',
    badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };
}

export const TIER_MAP: Record<Tier, { label: string; badgeClass: string; textClass: string; borderClass: string; description: string }> = {
  S: {
    label: "TIER S",
    badgeClass: "bg-amber-950/30 text-amber-300 border-amber-800/60",
    textClass: "text-amber-400",
    borderClass: "border-amber-800/50",
    description: "Nível Elite (90+)",
  },
  A: {
    label: "TIER A",
    badgeClass: "bg-emerald-950/30 text-emerald-300 border-emerald-800/60",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-800/50",
    description: "Titular Sólido (80-89)",
  },
  B: {
    label: "TIER B",
    badgeClass: "bg-sky-950/30 text-sky-300 border-sky-800/60",
    textClass: "text-sky-400",
    borderClass: "border-sky-800/50",
    description: "Competitivo (70-79)",
  },
  C: {
    label: "TIER C",
    badgeClass: "bg-zinc-900 text-zinc-300 border-zinc-800",
    textClass: "text-zinc-400",
    borderClass: "border-zinc-800",
    description: "Composição (60-69)",
  },
  D: {
    label: "TIER D",
    badgeClass: "bg-zinc-900 text-zinc-400 border-zinc-800",
    textClass: "text-zinc-500",
    borderClass: "border-zinc-800",
    description: "Desenvolvimento (<60)",
  },
  UNRATED: {
    label: "SEM TIER",
    badgeClass: "bg-zinc-900/50 text-zinc-500 border-zinc-800",
    textClass: "text-zinc-500",
    borderClass: "border-zinc-800",
    description: "Aguardando votos",
  },
};

export function getPositionBadgeClass(position: string): string {
  const pos = position.toUpperCase().trim();
  if (['ATA', 'CA', 'PE', 'PD'].includes(pos)) return 'bg-zinc-900 text-rose-300 border-zinc-800';
  if (['MEI', 'MC', 'ME', 'MD'].includes(pos)) return 'bg-zinc-900 text-amber-300 border-zinc-800';
  if (['VOL', 'ALA'].includes(pos)) return 'bg-zinc-900 text-sky-300 border-zinc-800';
  if (['ZAG', 'LE', 'LD'].includes(pos)) return 'bg-zinc-900 text-emerald-300 border-zinc-800';
  if (pos === 'GK') return 'bg-zinc-900 text-purple-300 border-zinc-800';
  return 'bg-zinc-900 text-zinc-400 border-zinc-800';
}

/**
 * Lista Oficial de Arquétipos do EA FC 26
 */
export const EA_FC_26_ARCHETYPES = {
  attackers: ['Mágico', 'Finalizador', 'Alvo'],
  midfielders: ['Maestro', 'Criador', 'Reciclador', 'Faísca', 'Comandante'],
  defenders: ['Chefia', 'Destruidor', 'Progressor', 'Ala Ofensivo'],
  goalkeepers: ['Muralha', 'GL-Linha'],
} as const;

export const ALL_ARCHETYPES: string[] = [
  'Mágico', 'Finalizador', 'Alvo',
  'Maestro', 'Criador', 'Reciclador', 'Faísca', 'Comandante',
  'Chefia', 'Destruidor', 'Progressor', 'Ala Ofensivo',
  'Muralha', 'GL-Linha'
];

export function getArchetypeBadgeClass(archetype: string): string {
  if (EA_FC_26_ARCHETYPES.attackers.includes(archetype as any)) {
    return 'bg-rose-950/40 text-rose-300 border-rose-800/40';
  }
  if (EA_FC_26_ARCHETYPES.midfielders.includes(archetype as any)) {
    return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
  }
  if (EA_FC_26_ARCHETYPES.defenders.includes(archetype as any)) {
    return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
  }
  if (EA_FC_26_ARCHETYPES.goalkeepers.includes(archetype as any)) {
    return 'bg-purple-950/40 text-purple-300 border-purple-800/40';
  }
  return 'bg-zinc-900 text-zinc-300 border-zinc-800';
}

// Helpers de slots táticos padronizados 11v11 (y: 90 = GK, 75 = Linha defensiva, 55 = Volantes, 38 = Meias, 16 = Atacantes)
const GK_SLOT: PitchPositionSlot = { slotId: 'gk', positionCode: 'GK', displayName: 'Goleiro', xPercent: 50, yPercent: 90 };

export const ALL_11V11_FORMATIONS: Record<string, FormationPreset> = {
  // ==========================================
  // 4 DEFENSORES
  // ==========================================
  '4-3-3': {
    key: '4-3-3',
    label: '4-3-3 (Padrão)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vol', positionCode: 'VOL', displayName: 'Volante', xPercent: 50, yPercent: 58 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Esq', xPercent: 32, yPercent: 44 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Dir', xPercent: 68, yPercent: 44 },
      { slotId: 'pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 18, yPercent: 20 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
      { slotId: 'pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 82, yPercent: 20 },
    ],
  },
  '4-3-3-false9': {
    key: '4-3-3-false9',
    label: '4-3-3 (Falso 9)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vol', positionCode: 'VOL', displayName: 'Volante', xPercent: 50, yPercent: 58 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Esq', xPercent: 32, yPercent: 44 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Dir', xPercent: 68, yPercent: 44 },
      { slotId: 'pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 20, yPercent: 18 },
      { slotId: 'cf', positionCode: 'SA', displayName: 'Falso 9 (SA)', xPercent: 50, yPercent: 26 },
      { slotId: 'pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 80, yPercent: 18 },
    ],
  },
  '4-3-3-attack': {
    key: '4-3-3-attack',
    label: '4-3-3 (Ofensivo / com MEI)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Recuado E', xPercent: 35, yPercent: 54 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Recuado D', xPercent: 65, yPercent: 54 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Meia Armador', xPercent: 50, yPercent: 35 },
      { slotId: 'pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 18, yPercent: 20 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
      { slotId: 'pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 82, yPercent: 20 },
    ],
  },
  '4-3-3-defend': {
    key: '4-3-3-defend',
    label: '4-3-3 (Defensivo / 2 Volantes)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vole', positionCode: 'VOL', displayName: 'Volante Esq', xPercent: 36, yPercent: 60 },
      { slotId: 'vold', positionCode: 'VOL', displayName: 'Volante Dir', xPercent: 64, yPercent: 60 },
      { slotId: 'mc', positionCode: 'MC', displayName: 'Meia Central', xPercent: 50, yPercent: 42 },
      { slotId: 'pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 18, yPercent: 20 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
      { slotId: 'pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 82, yPercent: 20 },
    ],
  },
  '4-2-3-1': {
    key: '4-2-3-1',
    label: '4-2-3-1 (Padrão / Fechada)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vole', positionCode: 'VOL', displayName: 'Primeiro Volante', xPercent: 35, yPercent: 60 },
      { slotId: 'vold', positionCode: 'VOL', displayName: 'Segundo Volante', xPercent: 65, yPercent: 60 },
      { slotId: 'meie', positionCode: 'MEI', displayName: 'Meia Esq', xPercent: 24, yPercent: 36 },
      { slotId: 'meic', positionCode: 'MEI', displayName: 'Armador Central', xPercent: 50, yPercent: 33 },
      { slotId: 'meid', positionCode: 'MEI', displayName: 'Meia Dir', xPercent: 76, yPercent: 36 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '4-2-3-1-wide': {
    key: '4-2-3-1-wide',
    label: '4-2-3-1 (Aberta / com ME e MD)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vole', positionCode: 'VOL', displayName: 'Volante 1', xPercent: 36, yPercent: 60 },
      { slotId: 'vold', positionCode: 'VOL', displayName: 'Volante 2', xPercent: 64, yPercent: 60 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 16, yPercent: 38 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Armador', xPercent: 50, yPercent: 34 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 84, yPercent: 38 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '4-4-2': {
    key: '4-4-2',
    label: '4-4-2 (Flat)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 16, yPercent: 46 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 50 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 50 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 84, yPercent: 46 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 18 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 18 },
    ],
  },
  '4-4-2-holding': {
    key: '4-4-2-holding',
    label: '4-4-2 (Segura / com Volantes)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 16, yPercent: 44 },
      { slotId: 'vole', positionCode: 'VOL', displayName: 'Volante Esq', xPercent: 36, yPercent: 60 },
      { slotId: 'vold', positionCode: 'VOL', displayName: 'Volante Dir', xPercent: 64, yPercent: 60 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 84, yPercent: 44 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 18 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 18 },
    ],
  },
  '4-1-2-1-2': {
    key: '4-1-2-1-2',
    label: '4-1-2-1-2 (Estreito / Losango Fechado)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vol', positionCode: 'VOL', displayName: 'Primeiro Volante', xPercent: 50, yPercent: 62 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Esq', xPercent: 32, yPercent: 48 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Dir', xPercent: 68, yPercent: 48 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Meia Armador', xPercent: 50, yPercent: 34 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
  '4-1-2-1-2-wide': {
    key: '4-1-2-1-2-wide',
    label: '4-1-2-1-2 (Aberto / com ME e MD)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vol', positionCode: 'VOL', displayName: 'Volante Central', xPercent: 50, yPercent: 62 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 16, yPercent: 44 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 84, yPercent: 44 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Armador', xPercent: 50, yPercent: 34 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
  '4-2-1-3': {
    key: '4-2-1-3',
    label: '4-2-1-3',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vole', positionCode: 'VOL', displayName: 'Volante Esq', xPercent: 36, yPercent: 60 },
      { slotId: 'vold', positionCode: 'VOL', displayName: 'Volante Dir', xPercent: 64, yPercent: 60 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Meia Armador', xPercent: 50, yPercent: 40 },
      { slotId: 'pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 18, yPercent: 18 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
      { slotId: 'pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 82, yPercent: 18 },
    ],
  },
  '4-4-1-1': {
    key: '4-4-1-1',
    label: '4-4-1-1',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 16, yPercent: 46 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 52 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 52 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 84, yPercent: 46 },
      { slotId: 'sa', positionCode: 'SA', displayName: 'Segundo Atacante', xPercent: 50, yPercent: 28 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '4-3-1-2': {
    key: '4-3-1-2',
    label: '4-3-1-2',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Esq', xPercent: 28, yPercent: 54 },
      { slotId: 'mcc', positionCode: 'MC', displayName: 'Meia Central', xPercent: 50, yPercent: 58 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Dir', xPercent: 72, yPercent: 54 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Armador', xPercent: 50, yPercent: 36 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
  '4-3-2-1': {
    key: '4-3-2-1',
    label: '4-3-2-1 (Árvore de Natal)',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Esq', xPercent: 28, yPercent: 56 },
      { slotId: 'mcc', positionCode: 'MC', displayName: 'Meia Central', xPercent: 50, yPercent: 60 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Dir', xPercent: 72, yPercent: 56 },
      { slotId: 'sae', positionCode: 'SA', displayName: 'Pontra-de-Lança E', xPercent: 34, yPercent: 32 },
      { slotId: 'sad', positionCode: 'SA', displayName: 'Pontra-de-Lança D', xPercent: 66, yPercent: 32 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '4-5-1': {
    key: '4-5-1',
    label: '4-5-1',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 16, yPercent: 44 },
      { slotId: 'mc', positionCode: 'MC', displayName: 'Meia Recuado', xPercent: 50, yPercent: 58 },
      { slotId: 'meie', positionCode: 'MEI', displayName: 'Armador 1', xPercent: 35, yPercent: 38 },
      { slotId: 'meid', positionCode: 'MEI', displayName: 'Armador 2', xPercent: 65, yPercent: 38 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 84, yPercent: 44 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '4-1-4-1': {
    key: '4-1-4-1',
    label: '4-1-4-1',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vol', positionCode: 'VOL', displayName: 'Primeiro Volante', xPercent: 50, yPercent: 62 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 16, yPercent: 42 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 44 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 44 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 84, yPercent: 42 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '4-2-4': {
    key: '4-2-4',
    label: '4-2-4 Ultra-Ofensivo',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 54 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 54 },
      { slotId: 'pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 16, yPercent: 18 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Centroavante E', xPercent: 38, yPercent: 15 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Centroavante D', xPercent: 62, yPercent: 15 },
      { slotId: 'pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 84, yPercent: 18 },
    ],
  },
  '4-1-3-2': {
    key: '4-1-3-2',
    label: '4-1-3-2',
    category: '4-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'le', positionCode: 'LE', displayName: 'Lat. Esquerdo', xPercent: 15, yPercent: 75 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 38, yPercent: 77 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 62, yPercent: 77 },
      { slotId: 'ld', positionCode: 'LD', displayName: 'Lat. Direito', xPercent: 85, yPercent: 75 },
      { slotId: 'vol', positionCode: 'VOL', displayName: 'Volante Central', xPercent: 50, yPercent: 62 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 18, yPercent: 42 },
      { slotId: 'mc', positionCode: 'MC', displayName: 'Meia Central', xPercent: 50, yPercent: 44 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 82, yPercent: 42 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },

  // ==========================================
  // 5 DEFENSORES
  // ==========================================
  '5-2-1-2': {
    key: '5-2-1-2',
    label: '5-2-1-2',
    category: '5-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'alae', positionCode: 'ALA', displayName: 'Ala Esquerdo', xPercent: 12, yPercent: 68 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 32, yPercent: 78 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero', xPercent: 50, yPercent: 80 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 68, yPercent: 78 },
      { slotId: 'alad', positionCode: 'ALA', displayName: 'Ala Direito', xPercent: 88, yPercent: 68 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 36, yPercent: 52 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 64, yPercent: 52 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Armador', xPercent: 50, yPercent: 35 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
  '5-3-2': {
    key: '5-3-2',
    label: '5-3-2',
    category: '5-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'alae', positionCode: 'ALA', displayName: 'Ala Esquerdo', xPercent: 12, yPercent: 68 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 32, yPercent: 78 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero', xPercent: 50, yPercent: 80 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 68, yPercent: 78 },
      { slotId: 'alad', positionCode: 'ALA', displayName: 'Ala Direito', xPercent: 88, yPercent: 68 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Esq', xPercent: 30, yPercent: 50 },
      { slotId: 'mcc', positionCode: 'MC', displayName: 'Meia Central', xPercent: 50, yPercent: 54 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Dir', xPercent: 70, yPercent: 50 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
  '5-2-2-1': {
    key: '5-2-2-1',
    label: '5-2-2-1',
    category: '5-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'alae', positionCode: 'ALA', displayName: 'Ala Esquerdo', xPercent: 12, yPercent: 68 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 32, yPercent: 78 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero', xPercent: 50, yPercent: 80 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 68, yPercent: 78 },
      { slotId: 'alad', positionCode: 'ALA', displayName: 'Ala Direito', xPercent: 88, yPercent: 68 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 36, yPercent: 54 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 64, yPercent: 54 },
      { slotId: 'sae', positionCode: 'SA', displayName: 'Ponta de Lança E', xPercent: 30, yPercent: 30 },
      { slotId: 'sad', positionCode: 'SA', displayName: 'Ponta de Lança D', xPercent: 70, yPercent: 30 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '5-4-1': {
    key: '5-4-1',
    label: '5-4-1',
    category: '5-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'alae', positionCode: 'ALA', displayName: 'Ala Esquerdo', xPercent: 12, yPercent: 68 },
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 32, yPercent: 78 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero', xPercent: 50, yPercent: 80 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 68, yPercent: 78 },
      { slotId: 'alad', positionCode: 'ALA', displayName: 'Ala Direito', xPercent: 88, yPercent: 68 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 18, yPercent: 44 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 52 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 52 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 82, yPercent: 44 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 16 },
    ],
  },

  // ==========================================
  // 3 DEFENSORES
  // ==========================================
  '3-5-2': {
    key: '3-5-2',
    label: '3-5-2',
    category: '3-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 26, yPercent: 76 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero Central', xPercent: 50, yPercent: 78 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 74, yPercent: 76 },
      { slotId: 'alae', positionCode: 'ALA', displayName: 'Ala Esquerdo', xPercent: 12, yPercent: 50 },
      { slotId: 'vole', positionCode: 'VOL', displayName: 'Volante 1', xPercent: 36, yPercent: 58 },
      { slotId: 'vold', positionCode: 'VOL', displayName: 'Volante 2', xPercent: 64, yPercent: 58 },
      { slotId: 'alad', positionCode: 'ALA', displayName: 'Ala Direito', xPercent: 88, yPercent: 50 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Armador', xPercent: 50, yPercent: 36 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
  '3-4-3': {
    key: '3-4-3',
    label: '3-4-3',
    category: '3-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 26, yPercent: 76 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero Central', xPercent: 50, yPercent: 78 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 74, yPercent: 76 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 14, yPercent: 48 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 52 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 52 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 86, yPercent: 48 },
      { slotId: 'pe', positionCode: 'PE', displayName: 'Ponta Esquerda', xPercent: 18, yPercent: 20 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
      { slotId: 'pd', positionCode: 'PD', displayName: 'Ponta Direita', xPercent: 82, yPercent: 20 },
    ],
  },
  '3-4-2-1': {
    key: '3-4-2-1',
    label: '3-4-2-1',
    category: '3-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 26, yPercent: 76 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero Central', xPercent: 50, yPercent: 78 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 74, yPercent: 76 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 14, yPercent: 48 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 54 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 54 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 86, yPercent: 48 },
      { slotId: 'sae', positionCode: 'SA', displayName: 'Ponta de Lança E', xPercent: 32, yPercent: 28 },
      { slotId: 'sad', positionCode: 'SA', displayName: 'Ponta de Lança D', xPercent: 68, yPercent: 28 },
      { slotId: 'ata', positionCode: 'ATA', displayName: 'Centroavante', xPercent: 50, yPercent: 15 },
    ],
  },
  '3-1-4-2': {
    key: '3-1-4-2',
    label: '3-1-4-2',
    category: '3-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 26, yPercent: 76 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero Central', xPercent: 50, yPercent: 78 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 74, yPercent: 76 },
      { slotId: 'vol', positionCode: 'VOL', displayName: 'Primeiro Volante', xPercent: 50, yPercent: 62 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 14, yPercent: 44 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 36, yPercent: 46 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 64, yPercent: 46 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 86, yPercent: 44 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
  '3-4-1-2': {
    key: '3-4-1-2',
    label: '3-4-1-2',
    category: '3-defenders',
    slots: [
      GK_SLOT,
      { slotId: 'zage', positionCode: 'ZAG', displayName: 'Zagueiro Esq', xPercent: 26, yPercent: 76 },
      { slotId: 'zagc', positionCode: 'ZAG', displayName: 'Líbero Central', xPercent: 50, yPercent: 78 },
      { slotId: 'zagd', positionCode: 'ZAG', displayName: 'Zagueiro Dir', xPercent: 74, yPercent: 76 },
      { slotId: 'me', positionCode: 'ME', displayName: 'Meia Esquerda', xPercent: 14, yPercent: 48 },
      { slotId: 'mce', positionCode: 'MC', displayName: 'Meia Central E', xPercent: 38, yPercent: 54 },
      { slotId: 'mcd', positionCode: 'MC', displayName: 'Meia Central D', xPercent: 62, yPercent: 54 },
      { slotId: 'md', positionCode: 'MD', displayName: 'Meia Direita', xPercent: 86, yPercent: 48 },
      { slotId: 'mei', positionCode: 'MEI', displayName: 'Meia Armador', xPercent: 50, yPercent: 34 },
      { slotId: 'atae', positionCode: 'ATA', displayName: 'Atacante Esq', xPercent: 36, yPercent: 16 },
      { slotId: 'atad', positionCode: 'ATA', displayName: 'Atacante Dir', xPercent: 64, yPercent: 16 },
    ],
  },
};

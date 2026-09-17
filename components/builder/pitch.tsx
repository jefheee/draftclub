'use client';

import React from 'react';
import { useSquad } from '@/components/builder/squad-context';
import { TournamentPlayerStats } from '@/types/database';
import { getEAStatColor, getPositionBadgeClass, cn } from '@/lib/utils';
import { X, UserPlus, Shield, Sparkles } from 'lucide-react';

interface PitchProps {
  onSlotClick?: (slotId: string) => void;
}

export function Pitch({ onSlotClick }: PitchProps) {
  const {
    slots,
    assignments,
    selectedBenchPlayer,
    assignPlayerToSlot,
    removePlayerFromSlot,
  } = useSquad();

  const handleSlotClick = (slotId: string) => {
    if (selectedBenchPlayer) {
      assignPlayerToSlot(slotId, selectedBenchPlayer);
    } else if (onSlotClick) {
      onSlotClick(slotId);
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] max-w-[540px] mx-auto bg-[#071d0e] rounded-3xl p-4 sm:p-6 shadow-2xl border-4 border-zinc-800/80 overflow-hidden select-none">
      {/* Lawn Stripes Background */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,#082010,#082010_48px,#0a2613_48px,#0a2613_96px)] opacity-95 pointer-events-none" />

      {/* Outer Glow & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />

      {/* Pitch Lines (Linhas Táticas Opacas em Branco/Verde) */}
      <div className="relative w-full h-full border-2 border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between">
        {/* Top Goal Area & Penalty Box */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[16%] border-b-2 border-x-2 border-white/20 rounded-b-lg">
          {/* Small Box */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-b-2 border-x-2 border-white/20" />
          {/* Penalty Spot */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/40" />
          {/* Top Arc */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-6 border-b-2 border-white/20 rounded-b-full" />
        </div>

        {/* Halfway Line & Center Circle */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/20 -translate-y-1/2 flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-white/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Bottom Goal Area & Penalty Box */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[16%] border-t-2 border-x-2 border-white/20 rounded-t-lg">
          {/* Small Box */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-t-2 border-x-2 border-white/20" />
          {/* Penalty Spot */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/40" />
          {/* Bottom Arc */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-6 border-t-2 border-white/20 rounded-t-full" />
        </div>

        {/* Corner Arcs */}
        <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-full" />
        <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-full" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-full" />
      </div>

      {/* Posicionamento dos Slots Interativos */}
      <div className="absolute inset-0 p-4 sm:p-6 pointer-events-auto">
        {slots.map((slot) => {
          const assigned = assignments[slot.slotId];
          const isSlotActive = !!selectedBenchPlayer;
          const statColor = assigned ? getEAStatColor(assigned.overall_score || 75) : null;

          return (
            <div
              key={slot.slotId}
              style={{
                left: `${slot.xPercent}%`,
                top: `${slot.yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => handleSlotClick(slot.slotId)}
              className={cn(
                'absolute flex flex-col items-center group cursor-pointer transition-all duration-200',
                isSlotActive && !assigned && 'scale-110 animate-bounce'
              )}
            >
              {assigned ? (
                /* Card do Jogador Posicionado no Campo */
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      'w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex flex-col items-center justify-center border-2 bg-zinc-900/90 shadow-xl backdrop-blur transition-transform group-hover:scale-110',
                      statColor?.border || 'border-emerald-500'
                    )}
                  >
                    <span className={cn('text-xs sm:text-sm font-black font-mono leading-none', statColor?.text)}>
                      {assigned.overall_score > 0 ? assigned.overall_score : '75'}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-0.5">
                      {slot.positionCode}
                    </span>

                    {/* Botão Remover do Slot */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlayerFromSlot(slot.slotId);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Nome e Posição */}
                  <div className="mt-1 px-2 py-0.5 rounded-md bg-zinc-950/90 border border-zinc-800 text-[10px] font-bold text-zinc-100 whitespace-nowrap shadow-md max-w-[80px] sm:max-w-[95px] truncate">
                    {assigned.name}
                  </div>
                </div>
              ) : (
                /* Slot Vazio / Placeholder */
                <div
                  className={cn(
                    'flex flex-col items-center justify-center transition-all',
                    isSlotActive
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
                      : 'border-white/20 bg-black/40 text-zinc-300 hover:border-emerald-400 hover:bg-emerald-950/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-dashed flex flex-col items-center justify-center shadow-lg transition-transform group-hover:scale-105',
                      isSlotActive
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/30 bg-black/50 text-white/80'
                    )}
                  >
                    <span className="text-[10px] sm:text-xs font-black tracking-wider">
                      {slot.positionCode}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-950/70 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
                    {slot.displayName}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

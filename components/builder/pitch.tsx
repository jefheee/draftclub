'use client';

import React from 'react';
import { useSquad } from '@/components/builder/squad-context';
import { getEAStatColor, cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Pitch() {
  const { slots, assignments, selectedBenchPlayer, assignPlayerToSlot, removePlayerFromSlot } = useSquad();

  return (
    <div className="relative w-full aspect-[3/4] max-w-[560px] mx-auto bg-[#08190d] rounded-2xl p-4 sm:p-6 shadow-xl border border-zinc-800 select-none overflow-hidden">
      {/* Subtle Matte Turf Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#0c2313_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Field Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

      {/* Linhas Táticas Minimalistas (Branco Fosco com Opacidade Suave) */}
      <div className="relative w-full h-full border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between">
        {/* Grande e Pequena Área Superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[16%] border-b border-x border-white/20 rounded-b-sm">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-b border-x border-white/20" />
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/30" />
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-5 border-b border-white/20 rounded-b-full" />
        </div>

        {/* Linha Central e Círculo do Meio de Campo */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 -translate-y-1/2 flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>

        {/* Grande e Pequena Área Inferior */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[16%] border-t border-x border-white/20 rounded-t-sm">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-t border-x border-white/20" />
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/30" />
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-5 border-t border-white/20 rounded-t-full" />
        </div>

        {/* Cantos */}
        <div className="absolute top-0 left-0 w-3 h-3 border-b border-r border-white/20 rounded-br-full" />
        <div className="absolute top-0 right-0 w-3 h-3 border-b border-l border-white/20 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-t border-r border-white/20 rounded-tr-full" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-t border-l border-white/20 rounded-tl-full" />
      </div>

      {/* Slots dos 11 Atletas */}
      <div className="absolute inset-0 p-3 sm:p-5 pointer-events-auto">
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
              onClick={() => selectedBenchPlayer && assignPlayerToSlot(slot.slotId, selectedBenchPlayer)}
              className={cn(
                'absolute flex flex-col items-center group cursor-pointer transition-all duration-150',
                isSlotActive && !assigned && 'scale-105'
              )}
            >
              {assigned ? (
                /* Card do Atleta Escalado */
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center border bg-zinc-950/90 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105',
                      statColor?.border || 'border-zinc-700'
                    )}
                  >
                    <span className={cn('text-xs font-bold font-mono leading-none', statColor?.text)}>
                      {assigned.overall_score > 0 ? assigned.overall_score : '75'}
                    </span>
                    <span className="text-[8px] font-semibold text-zinc-400 uppercase tracking-tight mt-0.5">
                      {slot.positionCode}
                    </span>

                    {/* Botão Remover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlayerFromSlot(slot.slotId);
                      }}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-800 hover:bg-rose-900 border border-zinc-700 text-zinc-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </div>

                  {/* Nome do Atleta */}
                  <div className="mt-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800 text-[9px] font-medium text-zinc-200 whitespace-nowrap shadow max-w-[75px] sm:max-w-[85px] truncate">
                    {assigned.name}
                  </div>
                </div>
              ) : (
                /* Slot Vazio */
                <div className="flex flex-col items-center justify-center">
                  <div
                    className={cn(
                      'w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-dashed flex items-center justify-center transition-all',
                      isSlotActive
                        ? 'border-emerald-500/70 bg-emerald-950/30 text-emerald-300'
                        : 'border-white/20 bg-black/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    )}
                  >
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-wider">
                      {slot.positionCode}
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-400 bg-zinc-950/80 px-1 py-0.5 rounded mt-0.5 whitespace-nowrap border border-zinc-900">
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

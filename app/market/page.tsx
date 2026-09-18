'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FreeAgent, PlayerProfile } from '@/types/database';
import { BackButton } from '@/components/ui/back-button';
import { 
  Users, 
  Search, 
  Plus, 
  MessageSquare, 
  Phone, 
  Gamepad2, 
  Shield, 
  ExternalLink,
  Check,
  Award
} from 'lucide-react';
import { 
  getArchetypeBadgeClass, 
  getPositionBadgeClass, 
  cn 
} from '@/lib/utils';

export default function MarketPage() {
  const [agents, setAgents] = useState<(FreeAgent & { player: PlayerProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadFreeAgents();
  }, []);

  async function loadFreeAgents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('free_agents')
        .select('*, player:player_profiles(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAgents(data as any);
      }
    } catch (e) {
      console.warn('Erro ao carregar mercadão:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleCopyDiscord = (discordTag: string, agentId: string) => {
    navigator.clipboard.writeText(discordTag);
    setCopiedId(agentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((ag) => {
      const p = ag.player;
      if (!p) return false;

      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.primary_position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.secondary_positions?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.archetypes?.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPlatform =
        selectedPlatform === 'ALL' || ag.platform === selectedPlatform;

      return matchesSearch && matchesPlatform;
    });
  }, [agents, searchTerm, selectedPlatform]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" label="Início" />
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Mercadão de Free Agents
              </span>
            </div>
          </div>

          <Link
            href="/player"
            className="px-3.5 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quero me Anunciar no Mercadão</span>
          </Link>
        </div>

        {/* Banner Informativo */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Mercadão de Transferências Pro Clubs
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 uppercase font-mono">
                EA FC 26
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Área pública para capitães de equipes encontrarem atletas livres no mercado. Filtre por posição, plataforma e múltiplos arquétipos.
            </p>
          </div>

          <div className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center shrink-0">
            <span className="text-lg font-bold font-mono text-cyan-400">{filteredAgents.length}</span>
            <span className="text-[10px] text-slate-500 uppercase block">Atletas Livres</span>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por gamertag, posição ou arquétipo..."
              className="w-full pl-9 pr-4 py-2 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['ALL', 'PS5', 'Xbox Series', 'PC', 'OldGen'].map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border',
                  selectedPlatform === plat
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                )}
              >
                {plat === 'ALL' ? 'Todas Plataformas' : plat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Atletas Livres */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Carregando mercadão de jogadores...
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <p>Nenhum atleta livre encontrado com os filtros selecionados.</p>
            <Link href="/player" className="text-cyan-400 hover:underline inline-block mt-2 font-semibold">
              Seja o primeiro a se anunciar no Mercadão →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((ag) => {
              const p = ag.player;
              const archList = p.archetypes && p.archetypes.length > 0 ? p.archetypes : [p.archetype || 'Mágico'];

              return (
                <div
                  key={ag.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{p.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {ag.platform}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Livre para Testes
                        </span>
                      </div>

                      {/* Posição Principal */}
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', getPositionBadgeClass(ag.primary_position))}>
                        {ag.primary_position}
                      </span>
                    </div>

                    {/* Posições Secundárias */}
                    {ag.secondary_positions && ag.secondary_positions.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <span className="text-slate-500 text-[10px]">Secundárias:</span>
                        <div className="flex flex-wrap gap-1">
                          {ag.secondary_positions.map((s) => (
                            <span key={s} className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 text-[10px] font-medium border border-slate-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Múltiplos Arquétipos */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {archList.map((a) => (
                        <span
                          key={a}
                          className={cn('text-[10px] font-medium px-2 py-0.5 rounded border', getArchetypeBadgeClass(a))}
                        >
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Bio / Descrição */}
                    {ag.description && (
                      <p className="text-xs text-slate-400 italic bg-slate-950/60 p-2 rounded-md border border-slate-800/80 line-clamp-3">
                        "{ag.description}"
                      </p>
                    )}
                  </div>

                  {/* Ações de Contato do Capitão */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-2">
                      {ag.contact_discord && (
                        <button
                          type="button"
                          onClick={() => handleCopyDiscord(ag.contact_discord!, ag.id)}
                          className="flex-1 py-1.5 px-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors flex items-center justify-center gap-1"
                        >
                          {copiedId === ag.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3 text-cyan-400" />
                              <span>Discord</span>
                            </>
                          )}
                        </button>
                      )}

                      {ag.contact_whatsapp && (
                        <a
                          href={`https://wa.me/55${ag.contact_whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(p.name)}%2C%20vi%20seu%20perfil%20no%20Mercad%C3%A3o%20do%20DraftClub!`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 px-2 rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-[11px] text-emerald-300 font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <Link
                        href={`/players/${p.id}`}
                        className="p-1.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                        title="Ver Perfil Completo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

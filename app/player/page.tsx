'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-context';
import { BackButton } from '@/components/ui/back-button';
import {
  User,
  Shield,
  Gamepad2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  MessageSquare,
  Phone,
  ExternalLink,
  Users
} from 'lucide-react';
import {
  ALL_ARCHETYPES,
  EA_FC_26_ARCHETYPES,
  getArchetypeBadgeClass,
  getPositionBadgeClass,
  cn
} from '@/lib/utils';
import Link from 'next/link';

export default function PlayerRegistrationPage() {
  const { session } = useAuth();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'PS5' | 'Xbox Series' | 'PC' | 'OldGen'>('PS5');
  const [primaryPosition, setPrimaryPosition] = useState('MEI');
  const [secondaryPositions, setSecondaryPositions] = useState<string[]>(['MC']);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>(['Mágico']);
  const [isLookingForTeam, setIsLookingForTeam] = useState(true);
  const [description, setDescription] = useState('');
  const [contactDiscord, setContactDiscord] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedPlayerId, setSavedPlayerId] = useState<string | null>(null);

  // Lista de posições
  const POSITIONS_LIST = ['ATA', 'CA', 'PE', 'PD', 'MEI', 'MC', 'ME', 'MD', 'VOL', 'ALA', 'LE', 'LD', 'ZAG', 'GK'];

  // Toggle posição secundária
  const toggleSecondaryPosition = (pos: string) => {
    if (pos === primaryPosition) return;
    if (secondaryPositions.includes(pos)) {
      setSecondaryPositions(secondaryPositions.filter(p => p !== pos));
    } else {
      setSecondaryPositions([...secondaryPositions, pos]);
    }
  };

  // Toggle arquétipos
  const toggleArchetype = (arch: string) => {
    if (selectedArchetypes.includes(arch)) {
      if (selectedArchetypes.length === 1) return; // Mínimo 1
      setSelectedArchetypes(selectedArchetypes.filter(a => a !== arch));
    } else {
      setSelectedArchetypes([...selectedArchetypes, arch]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor insira sua Gamertag / Nickname do EA FC.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const positionsDeclared = Array.from(new Set([primaryPosition, ...secondaryPositions]));

      // 1. Inserir ou atualizar em player_profiles
      const { data: profile, error: profileErr } = await supabase
        .from('player_profiles')
        .upsert(
          {
            name: name.trim(),
            positions_declared: positionsDeclared,
            archetype: selectedArchetypes[0] || 'Mágico',
            archetypes: selectedArchetypes,
            platform,
            primary_position: primaryPosition,
            secondary_positions: secondaryPositions,
            contact_discord: contactDiscord.trim() || null,
            contact_whatsapp: contactWhatsapp.trim() || null,
            is_looking_for_team: isLookingForTeam,
            bio: description.trim() || null,
          },
          { onConflict: 'name' }
        )
        .select()
        .single();

      if (profileErr) throw profileErr;

      // 2. Se estiver buscando time, salvar no Mercadão (free_agents)
      if (profile) {
        setSavedPlayerId(profile.id);

        if (isLookingForTeam) {
          const { error: faErr } = await supabase
            .from('free_agents')
            .upsert(
              {
                player_id: profile.id,
                platform,
                primary_position: primaryPosition,
                secondary_positions: secondaryPositions,
                description: description.trim() || null,
                contact_discord: contactDiscord.trim() || null,
                contact_whatsapp: contactWhatsapp.trim() || null,
                is_active: true,
              },
              { onConflict: 'player_id' }
            );

          if (faErr) console.warn('Aviso free_agents:', faErr);
        } else {
          // Desativa do mercadão
          await supabase
            .from('free_agents')
            .update({ is_active: false })
            .eq('player_id', profile.id);
        }

        // Criar stats padrão se não existir
        await supabase
          .from('player_stats')
          .insert({
            player_id: profile.id,
            pace: 80,
            shooting: 75,
            passing: 78,
            dribbling: 82,
            defending: 65,
            physical: 74,
          })
          .select()
          .maybeSingle();
      }

      setSuccessMsg(
        isLookingForTeam
          ? 'Perfil de atleta cadastrado! Seu nome agora está ativo no Mercadão de Free Agents para os capitães recrutarem.'
          : 'Perfil de atleta atualizado com sucesso!'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar perfil de atleta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Superior */}
        <div className="flex items-center justify-between">
          <BackButton fallbackHref="/" label="Início" />
          <div className="flex items-center gap-2">
            <Link
              href="/market"
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-400 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ver Mercadão de Jogadores</span>
            </Link>
          </div>
        </div>

        {/* Título & Descrição */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Passaporte do Atleta <span className="text-cyan-400">EA FC 26</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Cadastre seu perfil de Pro Clubs, combine múltiplos arquétipos oficiais e anuncie sua disponibilidade no Mercadão para os capitães de equipe.
          </p>
        </div>

        {/* Notificações */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            {savedPlayerId && (
              <Link
                href={`/players/${savedPlayerId}`}
                className="font-bold underline text-emerald-300 ml-4 hover:text-emerald-200"
              >
                Ver Perfil →
              </Link>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
          {/* Dados Pessoais e Plataforma */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gamertag / Nickname Oficial EA
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Buzz_ProClubs"
                className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Plataforma de Jogo
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="PS5">PlayStation 5 (Nova Geração)</option>
                <option value="Xbox Series">Xbox Series X|S (Nova Geração)</option>
                <option value="PC">PC (Nova Geração)</option>
                <option value="OldGen">PS4 / Xbox One (Geração Anterior)</option>
              </select>
            </div>
          </div>

          {/* Posições */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Posição Primária (Principal)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POSITIONS_LIST.map((pos) => (
                  <button
                    type="button"
                    key={pos}
                    onClick={() => {
                      setPrimaryPosition(pos);
                      setSecondaryPositions(secondaryPositions.filter(p => p !== pos));
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-bold border transition-colors',
                      primaryPosition === pos
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    )}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Posições Secundárias (Onde você também rende)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POSITIONS_LIST.map((pos) => {
                  const isPrimary = primaryPosition === pos;
                  const isSec = secondaryPositions.includes(pos);
                  return (
                    <button
                      type="button"
                      key={pos}
                      disabled={isPrimary}
                      onClick={() => toggleSecondaryPosition(pos)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                        isPrimary && 'opacity-30 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600',
                        isSec && 'bg-slate-800 text-cyan-300 border-cyan-700/60 font-semibold',
                        !isPrimary && !isSec && 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      )}
                    >
                      {pos} {isSec && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 14 Arquétipos Oficiais do EA FC 26 */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Arquétipos Oficiais EA FC 26 (Múltiplos Estilos)
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedArchetypes.length} selecionado(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Selecione os estilos que definem sua build no EA FC 26:
              </p>
            </div>

            <div className="space-y-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
              {Object.entries(EA_FC_26_ARCHETYPES).map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
                    {category === 'attackers' && 'Atacantes'}
                    {category === 'midfielders' && 'Meias'}
                    {category === 'defenders' && 'Defensores'}
                    {category === 'goalkeepers' && 'Goleiros'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {items.map((item) => {
                      const active = selectedArchetypes.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => toggleArchetype(item)}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-md border transition-all',
                            active
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          )}
                        >
                          {item} {active && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mercadão: Status "Buscando Time" & Contatos */}
          <div className="space-y-3.5 pt-3 border-t border-slate-800/80">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isLookingForTeam}
                onChange={(e) => setIsLookingForTeam(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Anunciar no Mercadão de Jogadores ("Buscando Clube")
                </span>
                <span className="text-[11px] text-slate-500">
                  Capitães de equipes poderão visualizar seu perfil e entrar em contato direto para testes.
                </span>
              </div>
            </label>

            {isLookingForTeam && (
              <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-cyan-400" />
                    Usuário Discord
                  </label>
                  <input
                    type="text"
                    value={contactDiscord}
                    onChange={(e) => setContactDiscord(e.target.value)}
                    placeholder="Ex: seunome#1234"
                    className="w-full px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    WhatsApp (com DDD)
                  </label>
                  <input
                    type="text"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    placeholder="Ex: 11999998888"
                    className="w-full px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bio / Resumo do seu Estilo de Jogo (Opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Atuo como segundo volante ou meia organizador. Boa visão de jogo, cadência de passe e marcação agressiva. Disponível terças e quintas à noite."
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando passaporte do atleta...' : 'Salvar Passaporte & Publicar no Mercadão'}
          </button>
        </form>
      </div>
    </div>
  );
}

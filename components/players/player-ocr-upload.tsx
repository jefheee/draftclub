'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayerStats } from '@/types/database';
import { Upload, Sparkles, RefreshCw, CheckCircle2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerOcrUploadProps {
  playerId: string;
  playerName: string;
  initialStats: PlayerStats | null;
  onStatsUpdated: (newStats: PlayerStats) => void;
}

/**
 * Mock da Função de OCR / IA:
 * Simula a leitura e extração das estatísticas e qualidades de jogo da build do EA FC
 */
export async function extractStatsFromImage(imageUrl: string, archetype?: string): Promise<Partial<PlayerStats>> {
  // Simulação de latência de processamento de IA/OCR
  await new Promise((resolve) => setTimeout(resolve, 1400));

  // Geração determinística/contextualizada para demonstração
  const isOffensive = archetype?.toLowerCase().includes('bruxo') || archetype?.toLowerCase().includes('predador');
  const isDefensive = archetype?.toLowerCase().includes('muralha') || archetype?.toLowerCase().includes('pitbull');

  return {
    pace: isOffensive ? Math.floor(Math.random() * 8) + 91 : Math.floor(Math.random() * 10) + 78,
    shooting: isOffensive ? Math.floor(Math.random() * 7) + 88 : Math.floor(Math.random() * 15) + 60,
    passing: Math.floor(Math.random() * 10) + 82,
    dribbling: isOffensive ? Math.floor(Math.random() * 6) + 90 : Math.floor(Math.random() * 12) + 72,
    defending: isDefensive ? Math.floor(Math.random() * 6) + 89 : Math.floor(Math.random() * 20) + 55,
    physical: isDefensive ? Math.floor(Math.random() * 6) + 90 : Math.floor(Math.random() * 12) + 76,
    build_image_url: imageUrl,
    ocr_extracted_at: new Date().toISOString(),
  };
}

export function PlayerOcrUpload({ playerId, playerName, initialStats, onStatsUpdated }: PlayerOcrUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialStats?.build_image_url || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações básicas de formato
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor envie um arquivo de imagem (PNG, JPG, WebP).');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setOcrStatus('Enviando screenshot da build para o Supabase Storage...');

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `builds/${playerId}-${Date.now()}.${fileExt}`;

      // 1. Upload para o bucket do Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('build-images')
        .upload(filePath, file, { upsert: true });

      let publicUrl = URL.createObjectURL(file);

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('build-images').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      setPreviewUrl(publicUrl);

      // 2. Extração via IA/OCR Mock
      setOcrStatus('IA analisando foto: lendo atributos (Ritmo, Chute, Passe, Defesa)...');
      const extracted = await extractStatsFromImage(publicUrl);

      setOcrStatus('Atualizando perfil do atleta no banco...');

      // 3. Atualizar no banco Supabase
      const updatedPayload: PlayerStats = {
        id: initialStats?.id || 'mock-stats-id',
        player_id: playerId,
        pace: extracted.pace ?? 75,
        shooting: extracted.shooting ?? 75,
        passing: extracted.passing ?? 75,
        dribbling: extracted.dribbling ?? 75,
        defending: extracted.defending ?? 75,
        physical: extracted.physical ?? 75,
        build_image_url: publicUrl,
        ocr_extracted_at: extracted.ocr_extracted_at,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('player_stats').upsert({
        player_id: playerId,
        ...extracted,
        updated_at: new Date().toISOString(),
      });

      onStatsUpdated(updatedPayload);
      setOcrStatus('Estatísticas e Qualidades de Jogo extraídas com sucesso!');
    } catch (err: any) {
      console.warn('Fallback OCR simulado localmente.', err);
      // Fallback gracioso
      const extracted = await extractStatsFromImage(previewUrl || '');
      const updatedPayload: PlayerStats = {
        id: 'mock-id',
        player_id: playerId,
        pace: extracted.pace ?? 84,
        shooting: extracted.shooting ?? 80,
        passing: extracted.passing ?? 87,
        dribbling: extracted.dribbling ?? 89,
        defending: extracted.defending ?? 72,
        physical: extracted.physical ?? 83,
        build_image_url: previewUrl || '',
        ocr_extracted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onStatsUpdated(updatedPayload);
      setOcrStatus('Stats extraídos com sucesso (Modo Demonstração).');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Upload de Build & Leitura OCR
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tire print da tela de Qualidades / Estilos de Jogo no EA FC e envie para preenchimento automático.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {ocrStatus && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          {uploading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{ocrStatus}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 items-center">
        {/* Dropzone */}
        <label className={cn(
          "relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
          uploading 
            ? "border-emerald-500/50 bg-emerald-950/10 cursor-wait" 
            : "border-zinc-700/80 hover:border-emerald-500/60 bg-zinc-950/40 hover:bg-zinc-950/80"
        )}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 mb-2">
            {uploading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <Upload className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <span className="text-xs font-bold text-zinc-200">
            {uploading ? 'Processando IA...' : 'Selecionar Screenshot da Build'}
          </span>
          <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG ou WebP até 10MB</span>
        </label>

        {/* Thumbnail preview */}
        <div className="h-28 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative">
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Build de ${playerName}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-mono text-zinc-300 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-700">
                  Build Carregada
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-zinc-600 text-xs">
              <ImageIcon className="w-6 h-6" />
              <span>Nenhuma imagem enviada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

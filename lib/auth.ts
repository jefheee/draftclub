import { supabase } from './supabase';
import { ParticipantRole } from '@/types/database';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: ParticipantRole;
  teamId?: string | null;
  teamName?: string | null;
  tournamentId?: string;
}

export const DEMO_USERS: Record<string, AuthSession> = {
  admin: {
    userId: 'u0000000-0000-0000-0000-000000000001',
    email: 'admin@draftclub.gg',
    name: 'Admin Master',
    role: 'admin',
    tournamentId: '11111111-1111-1111-1111-111111111111',
  },
  captain_boca: {
    userId: 'u0000000-0000-0000-0000-000000000002',
    email: 'buzz@bocajuniors.gg',
    name: 'buzz (Capitão)',
    role: 'captain',
    teamId: 'b1111111-1111-1111-1111-111111111111',
    teamName: 'Boca Juniors FC',
    tournamentId: '11111111-1111-1111-1111-111111111111',
  },
  captain_river: {
    userId: 'u0000000-0000-0000-0000-000000000003',
    email: 'deivy@riverplate.gg',
    name: 'Deivy (Capitão)',
    role: 'captain',
    teamId: 'b2222222-2222-2222-2222-222222222222',
    teamName: 'River Plate eSports',
    tournamentId: '11111111-1111-1111-1111-111111111111',
  },
  captain_racing: {
    userId: 'u0000000-0000-0000-0000-000000000004',
    email: 'andrei@racingclub.gg',
    name: 'Andrei (Capitão)',
    role: 'captain',
    teamId: 'b3333333-3333-3333-3333-333333333333',
    teamName: 'Racing Club Digital',
    tournamentId: '11111111-1111-1111-1111-111111111111',
  },
};

const STORAGE_KEY = 'draftclub_auth_session';

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    // Set cookies for Next.js middleware protection
    document.cookie = `draftclub_role=${session.role}; path=/; max-age=604800; SameSite=Lax`;
    if (session.teamId) {
      document.cookie = `draftclub_team=${session.teamId}; path=/; max-age=604800; SameSite=Lax`;
    }
  } catch (err) {
    console.warn('Erro ao salvar sessão local:', err);
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = 'draftclub_role=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'draftclub_team=; path=/; max-age=0; SameSite=Lax';
  } catch (err) {
    console.warn('Erro ao limpar sessão:', err);
  }
}

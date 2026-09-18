/**
 * Serviço de Integração com a API Oficial do EA FC 26 Pro Clubs
 * Mapeia os endpoints oficiais da Electronic Arts para sincronização de clubes,
 * partidas e estatísticas individuais de atletas.
 */

export interface EAPlayerMatchStats {
  eaPlayerId: string;
  name: string;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  passesMade: number;
  passSuccess: number;
  tacklesMade: number;
  tackleSuccess: number;
  redCards: number;
  yellowCards: number;
  mom: boolean; // Man of the match
  cleansheets: number;
}

export interface EAMatchRecord {
  matchId: string;
  timestamp: number;
  timeAgo: string;
  clubs: {
    [clubId: string]: {
      id: string;
      name: string;
      goals: number;
      goalsAgainst: number;
      result: 'wins' | 'losses' | 'ties';
      teamLogo: number;
    };
  };
  players: {
    [clubId: string]: {
      [playerId: string]: {
        playername: string;
        rating: string | number;
        goals: string | number;
        assists: string | number;
        redcards: string | number;
        yellowcards: string | number;
        cleansheetsany: string | number;
        cleansheetsgk: string | number;
        mom: string | number;
      };
    };
  };
}

export interface EAClubMember {
  name: string;
  proName: string;
  proPos: string;
  proOverall: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
  manOfTheMatch: number;
  ratingAve: number;
  favoritePosition: string;
}

const EA_BASE_URL = 'https://proclubs.ea.com/api/fc';

const EA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://www.ea.com/',
  'Origin': 'https://www.ea.com',
};

/**
 * Busca histórico recente de partidas de um clube na API da EA
 */
export async function fetchClubMatches(
  platform: 'common-gen5' | 'common-gen4' | 'ps5' | 'xbox-series-xs' | 'pc' = 'common-gen5',
  clubId: string
): Promise<EAMatchRecord[]> {
  try {
    const url = `${EA_BASE_URL}/clubs/matches?matchType=gameType9&platform=${platform}&clubIds=${clubId}`;
    const res = await fetch(url, {
      headers: EA_HEADERS,
      next: { revalidate: 120 }, // cache 2 min
    });

    if (!res.ok) {
      console.warn(`EA API matches response status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Falha ao consultar API do EA FC Pro Clubs (matches):', error);
    return [];
  }
}

/**
 * Busca membros e estatísticas acumuladas de um clube
 */
export async function fetchClubMembers(
  platform: 'common-gen5' | 'common-gen4' | 'ps5' | 'xbox-series-xs' | 'pc' = 'common-gen5',
  clubId: string
): Promise<EAClubMember[]> {
  try {
    const url = `${EA_BASE_URL}/members/stats?platform=${platform}&clubId=${clubId}`;
    const res = await fetch(url, {
      headers: EA_HEADERS,
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (data?.members && Array.isArray(data.members)) {
      return data.members.map((m: any) => ({
        name: m.name,
        proName: m.proName || m.name,
        proPos: m.proPos || 'MEI',
        proOverall: Number(m.proOverall) || 80,
        gamesPlayed: Number(m.gamesPlayed) || 0,
        goals: Number(m.goals) || 0,
        assists: Number(m.assists) || 0,
        manOfTheMatch: Number(m.manOfTheMatch) || 0,
        ratingAve: Number(m.ratingAve) || 6.0,
        favoritePosition: m.favoritePosition || 'MEI',
      }));
    }
    return [];
  } catch (error) {
    console.error('Falha ao consultar API do EA FC Pro Clubs (members):', error);
    return [];
  }
}

/**
 * Parser para converter a estrutura bruta de partidas da EA em formato compatível com o DraftClub
 */
export function parseEAMatchToDraftClub(
  eaMatch: EAMatchRecord,
  tournamentId: string,
  homeTeamId: string,
  awayTeamId: string
) {
  const clubIds = Object.keys(eaMatch.clubs);
  const homeEa = eaMatch.clubs[clubIds[0]];
  const awayEa = eaMatch.clubs[clubIds[1]];

  const homeScore = Number(homeEa?.goals || 0);
  const awayScore = Number(awayEa?.goals || 0);

  // Extrair eventos de jogadores
  const events: {
    playerName: string;
    teamId: string;
    goals: number;
    assists: number;
    redCards: number;
    yellowCards: number;
    rating: number;
  }[] = [];

  if (eaMatch.players) {
    for (const [cId, playersMap] of Object.entries(eaMatch.players)) {
      const targetTeamId = cId === clubIds[0] ? homeTeamId : awayTeamId;
      for (const [, pData] of Object.entries(playersMap)) {
        events.push({
          playerName: pData.playername,
          teamId: targetTeamId,
          goals: Number(pData.goals) || 0,
          assists: Number(pData.assists) || 0,
          redCards: Number(pData.redcards) || 0,
          yellowCards: Number(pData.yellowcards) || 0,
          rating: Number(pData.rating) || 6.0,
        });
      }
    }
  }

  return {
    tournament_id: tournamentId,
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_score: homeScore,
    away_score: awayScore,
    status: 'approved' as const,
    notes: `Sincronizado automaticamente via EA FC Clubs API (Match ID: ${eaMatch.matchId})`,
    events,
  };
}

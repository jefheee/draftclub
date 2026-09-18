import { NextResponse } from 'next/server';
import { fetchClubMatches, fetchClubMembers, parseEAMatchToDraftClub } from '@/lib/ea-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clubId, platform = 'common-gen5', tournamentId, homeTeamId, awayTeamId } = body;

    if (!clubId) {
      return NextResponse.json(
        { error: 'ID do Clube da EA é obrigatório.' },
        { status: 400 }
      );
    }

    const [matches, members] = await Promise.all([
      fetchClubMatches(platform, clubId),
      fetchClubMembers(platform, clubId),
    ]);

    // Formatar partidas recentes se houver contexto de torneio
    const parsedMatches = tournamentId && homeTeamId && awayTeamId && matches.length > 0
      ? matches.slice(0, 5).map(m => parseEAMatchToDraftClub(m, tournamentId, homeTeamId, awayTeamId))
      : [];

    return NextResponse.json({
      success: true,
      clubId,
      platform,
      totalMatchesFound: matches.length,
      membersCount: members.length,
      members: members.slice(0, 15),
      recentMatches: matches.slice(0, 5),
      parsedMatches,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/ea-sync:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao sincronizar dados com a EA.' },
      { status: 500 }
    );
  }
}

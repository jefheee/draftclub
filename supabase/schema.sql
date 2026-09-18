-- =========================================================================
-- DRAFTCLUB SAAS - RBAC, LINEUPS & COMPLETE 11V11 ARCHITECTURE
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP VIEW IF EXISTS vw_tournament_player_stats CASCADE;
DROP VIEW IF EXISTS vw_community_positions CASCADE;
DROP TABLE IF EXISTS squad_lineups CASCADE;
DROP TABLE IF EXISTS draft_picks CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS position_votes CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS tournament_participants CASCADE;
DROP TABLE IF EXISTS player_profiles CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- 1. TORNEIOS
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT '11v11',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('REGISTRATION', 'SCOUTING', 'DRAFT', 'ACTIVE', 'FINISHED')),
    rules JSONB NOT NULL DEFAULT '{"crossplay_gen": "current_gen", "min_human_players": 11, "any_allowed": false, "gk_required": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERFIS DE JOGADORES (PLAYER PROFILES)
CREATE TABLE player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL UNIQUE,
    positions_declared TEXT[] NOT NULL DEFAULT '{}',
    archetype TEXT NOT NULL DEFAULT 'Mágico',
    archetypes TEXT[] NOT NULL DEFAULT '{"Mágico"}'::text[],
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PARTICIPANTES E ROLES DINÂMICOS POR TORNEIO (RBAC: Admin, Captain, Player)
CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    user_id UUID,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'captain', 'player')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- 4. ATRIBUTOS EA SPORTS E BUILD OCR
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL UNIQUE REFERENCES player_profiles(id) ON DELETE CASCADE,
    pace INTEGER NOT NULL DEFAULT 75 CHECK (pace BETWEEN 1 AND 99),
    shooting INTEGER NOT NULL DEFAULT 75 CHECK (shooting BETWEEN 1 AND 99),
    passing INTEGER NOT NULL DEFAULT 75 CHECK (passing BETWEEN 1 AND 99),
    dribbling INTEGER NOT NULL DEFAULT 75 CHECK (dribbling BETWEEN 1 AND 99),
    defending INTEGER NOT NULL DEFAULT 75 CHECK (defending BETWEEN 1 AND 99),
    physical INTEGER NOT NULL DEFAULT 75 CHECK (physical BETWEEN 1 AND 99),
    build_image_url TEXT,
    ocr_extracted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. VOTAÇÃO DE POSIÇÃO REAL PELA COMUNIDADE
CREATE TABLE position_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL DEFAULT gen_random_uuid(),
    voted_position TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, voter_id)
);

-- 6. AVALIAÇÕES POR TORNEIO (PEER REVIEW EGO-SAFE)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL DEFAULT gen_random_uuid(),
    mechanic_score INTEGER NOT NULL CHECK (mechanic_score BETWEEN 1 AND 99),
    iq_score INTEGER NOT NULL CHECK (iq_score BETWEEN 1 AND 99),
    teamplay_score INTEGER NOT NULL CHECK (teamplay_score BETWEEN 1 AND 99),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TIMES DO CAMPEONATO
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    captain_id UUID REFERENCES player_profiles(id) ON DELETE SET NULL,
    active_formation TEXT NOT NULL DEFAULT '4-3-3',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PICKS DO DRAFT
CREATE TABLE draft_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, player_id),
    UNIQUE(tournament_id, round, pick_number)
);

-- 9. ESCALAÇÃO TÁTICA PERSISTIDA (SQUAD LINEUPS)
CREATE TABLE squad_lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    slot_id TEXT NOT NULL,
    position_code TEXT NOT NULL,
    player_id UUID REFERENCES player_profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, slot_id)
);

-- 10. PARTIDAS E RESULTADOS (COM PROVAS DE SCREENSHOT EA SPORTS)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    proof_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reported_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- 11. ESTATÍSTICAS INDIVIDUAIS DA PARTIDA (GOLS, ASSISTÊNCIAS, CARTÕES)
CREATE TABLE match_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    red_cards INTEGER NOT NULL DEFAULT 0,
    yellow_cards INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC(3, 1) DEFAULT 6.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_tp_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tp_role ON tournament_participants(role);
CREATE INDEX idx_eval_tourn ON evaluations(tournament_id, player_id);
CREATE INDEX idx_pv_player ON position_votes(player_id);
CREATE INDEX idx_dp_team ON draft_picks(tournament_id, team_id);
CREATE INDEX idx_sl_team ON squad_lineups(team_id);
CREATE INDEX idx_matches_tourn ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_mps_match ON match_player_stats(match_id);

-- VIEWS
CREATE OR REPLACE VIEW vw_community_positions AS
WITH vote_counts AS (
    SELECT 
        player_id,
        voted_position,
        COUNT(*)::INT AS votes_for_pos,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER (PARTITION BY player_id) * 100, 1) AS vote_percentage,
        ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY COUNT(*) DESC) AS rank
    FROM position_votes
    GROUP BY player_id, voted_position
)
SELECT 
    p.id AS player_id,
    COALESCE(vc.voted_position, (p.positions_declared)[1]) AS top_voted_position,
    COALESCE(vc.vote_percentage, 100.0) AS top_position_confidence,
    COALESCE(total_v.total_votes, 0) AS total_position_votes
FROM player_profiles p
LEFT JOIN vote_counts vc ON p.id = vc.player_id AND vc.rank = 1
LEFT JOIN (
    SELECT player_id, COUNT(*)::INT AS total_votes 
    FROM position_votes 
    GROUP BY player_id
) total_v ON p.id = total_v.player_id;

ALTER VIEW vw_community_positions SET (security_invoker = on);

CREATE OR REPLACE VIEW vw_tournament_player_stats AS
SELECT 
    tp.tournament_id,
    p.id AS player_id,
    p.name,
    p.archetype,
    p.positions_declared,
    COALESCE(cp.top_voted_position, (p.positions_declared)[1]) AS community_position,
    COALESCE(cp.top_position_confidence, 0.0) AS community_confidence,
    cp.total_position_votes,
    tp.role AS participant_role,
    (tp.role = 'captain') AS is_captain,
    COUNT(e.id)::INT AS evaluation_count,
    COALESCE(ROUND(AVG(e.mechanic_score), 1), 0.0) AS avg_mechanic,
    COALESCE(ROUND(AVG(e.iq_score), 1), 0.0) AS avg_iq,
    COALESCE(ROUND(AVG(e.teamplay_score), 1), 0.0) AS avg_teamplay,
    COALESCE(ROUND(AVG((e.mechanic_score + e.iq_score + e.teamplay_score) / 3.0), 1), 0.0) AS overall_score,
    CASE 
        WHEN COUNT(e.id) = 0 THEN 'UNRATED'
        WHEN ROUND(AVG((e.mechanic_score + e.iq_score + e.teamplay_score) / 3.0), 1) >= 90.0 THEN 'S'
        WHEN ROUND(AVG((e.mechanic_score + e.iq_score + e.teamplay_score) / 3.0), 1) >= 80.0 THEN 'A'
        WHEN ROUND(AVG((e.mechanic_score + e.iq_score + e.teamplay_score) / 3.0), 1) >= 70.0 THEN 'B'
        WHEN ROUND(AVG((e.mechanic_score + e.iq_score + e.teamplay_score) / 3.0), 1) >= 60.0 THEN 'C'
        ELSE 'D'
    END AS tier,
    dp.team_id AS drafted_team_id,
    t.name AS drafted_team_name,
    dp.round AS draft_round,
    dp.pick_number AS draft_pick_number
FROM tournament_participants tp
JOIN player_profiles p ON tp.player_id = p.id
LEFT JOIN vw_community_positions cp ON p.id = cp.player_id
LEFT JOIN evaluations e ON tp.player_id = e.player_id AND tp.tournament_id = e.tournament_id
LEFT JOIN draft_picks dp ON tp.tournament_id = dp.tournament_id AND tp.player_id = dp.player_id
LEFT JOIN teams t ON dp.team_id = t.id
GROUP BY 
    tp.tournament_id, p.id, p.name, p.archetype, p.positions_declared,
    cp.top_voted_position, cp.top_position_confidence, cp.total_position_votes,
    tp.role, dp.team_id, t.name, dp.round, dp.pick_number;

ALTER VIEW vw_tournament_player_stats SET (security_invoker = on);

-- TABELA DE CLASSIFICAÇÃO EM TEMPO REAL (STANDINGS)
CREATE OR REPLACE VIEW vw_tournament_standings AS
WITH team_matches AS (
    SELECT 
        m.tournament_id,
        m.home_team_id AS team_id,
        1 AS played,
        CASE WHEN m.home_score > m.away_score THEN 1 ELSE 0 END AS won,
        CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END AS drawn,
        CASE WHEN m.home_score < m.away_score THEN 1 ELSE 0 END AS lost,
        m.home_score AS goals_for,
        m.away_score AS goals_against,
        CASE 
            WHEN m.home_score > m.away_score THEN 3
            WHEN m.home_score = m.away_score THEN 1
            ELSE 0 
        END AS points
    FROM matches m
    WHERE m.status = 'approved'
    
    UNION ALL
    
    SELECT 
        m.tournament_id,
        m.away_team_id AS team_id,
        1 AS played,
        CASE WHEN m.away_score > m.home_score THEN 1 ELSE 0 END AS won,
        CASE WHEN m.away_score = m.home_score THEN 1 ELSE 0 END AS drawn,
        CASE WHEN m.away_score < m.home_score THEN 1 ELSE 0 END AS lost,
        m.away_score AS goals_for,
        m.home_score AS goals_against,
        CASE 
            WHEN m.away_score > m.home_score THEN 3
            WHEN m.away_score = m.home_score THEN 1
            ELSE 0 
        END AS points
    FROM matches m
    WHERE m.status = 'approved'
),
aggregated AS (
    SELECT 
        t.id AS team_id,
        t.tournament_id,
        t.name AS team_name,
        t.logo_url,
        t.captain_id,
        COALESCE(SUM(tm.played), 0)::INT AS played,
        COALESCE(SUM(tm.won), 0)::INT AS won,
        COALESCE(SUM(tm.drawn), 0)::INT AS drawn,
        COALESCE(SUM(tm.lost), 0)::INT AS lost,
        COALESCE(SUM(tm.goals_for), 0)::INT AS goals_for,
        COALESCE(SUM(tm.goals_against), 0)::INT AS goals_against,
        COALESCE(SUM(tm.goals_for - tm.goals_against), 0)::INT AS goal_difference,
        COALESCE(SUM(tm.points), 0)::INT AS points
    FROM teams t
    LEFT JOIN team_matches tm ON t.id = tm.team_id AND t.tournament_id = tm.tournament_id
    GROUP BY t.id, t.tournament_id, t.name, t.logo_url, t.captain_id
)
SELECT 
    a.*,
    ROW_NUMBER() OVER (
        PARTITION BY a.tournament_id 
        ORDER BY a.points DESC, a.goal_difference DESC, a.goals_for DESC, a.won DESC
    )::INT AS position
FROM aggregated a;

ALTER VIEW vw_tournament_standings SET (security_invoker = on);

-- RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read tournaments" ON tournaments FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage tournaments" ON tournaments FOR ALL TO public USING (true);
CREATE POLICY "Public Read player_profiles" ON player_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage player_profiles" ON player_profiles FOR ALL TO public USING (true);
CREATE POLICY "Public Read participants" ON tournament_participants FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage participants" ON tournament_participants FOR ALL TO public USING (true);
CREATE POLICY "Public Read player_stats" ON player_stats FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage player_stats" ON player_stats FOR ALL TO public USING (true);
CREATE POLICY "Public Read position_votes" ON position_votes FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert position_votes" ON position_votes FOR ALL TO public USING (true);
CREATE POLICY "Public Read evaluations" ON evaluations FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert evaluations" ON evaluations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Read teams" ON teams FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage teams" ON teams FOR ALL TO public USING (true);
CREATE POLICY "Public Read draft_picks" ON draft_picks FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage draft_picks" ON draft_picks FOR ALL TO public USING (true);
CREATE POLICY "Public Read squad_lineups" ON squad_lineups FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage squad_lineups" ON squad_lineups FOR ALL TO public USING (true);
CREATE POLICY "Public Read matches" ON matches FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage matches" ON matches FOR ALL TO public USING (true);
CREATE POLICY "Public Read match_player_stats" ON match_player_stats FOR SELECT TO public USING (true);
CREATE POLICY "Public Manage match_player_stats" ON match_player_stats FOR ALL TO public USING (true);

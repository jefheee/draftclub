-- =========================================================================
-- DRAFTCLUB 2.0 - MULTI-TOURNAMENT EA FC PRO CLUBS PLATFORM SCHEMA
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpeza de views e tabelas prévias se existirem
DROP VIEW IF EXISTS vw_tournament_player_stats CASCADE;
DROP VIEW IF EXISTS vw_community_positions CASCADE;
DROP TABLE IF EXISTS draft_picks CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS position_votes CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS tournament_registrations CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- 1. TORNEIOS (MULTI-TENANT)
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('5x5', '11x11', '7x7')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('REGISTRATION', 'SCOUTING', 'DRAFT', 'ACTIVE', 'FINISHED')),
    max_teams INTEGER NOT NULL DEFAULT 8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. JOGADORES GLOBAIS
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL UNIQUE,
    declared_positions TEXT[] NOT NULL DEFAULT '{}',
    archetype TEXT NOT NULL DEFAULT 'Polivalente',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inscrição de Jogadores em Torneios
CREATE TABLE tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    is_captain BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- 3. ESTATÍSTICAS BASE & BUILD OCR (EA FC STYLE)
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
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

-- 4. VOTAÇÃO DE POSIÇÃO REAL PELA COMUNIDADE (COMMUNITY POSITION CHECK)
CREATE TABLE position_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL DEFAULT gen_random_uuid(),
    voted_position TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, voter_id)
);

-- 5. AVALIAÇÕES POR TORNEIO (EGO-SAFE PEER REVIEW)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL DEFAULT gen_random_uuid(),
    mechanic_score INTEGER NOT NULL CHECK (mechanic_score BETWEEN 1 AND 99),
    iq_score INTEGER NOT NULL CHECK (iq_score BETWEEN 1 AND 99),
    teamplay_score INTEGER NOT NULL CHECK (teamplay_score BETWEEN 1 AND 99),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TIMES PARTICIPANTES DO TORNEIO
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    captain_id UUID REFERENCES players(id) ON DELETE SET NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PICKS DO DRAFT
CREATE TABLE draft_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, player_id),
    UNIQUE(tournament_id, round, pick_number)
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX idx_reg_tourn ON tournament_registrations(tournament_id);
CREATE INDEX idx_eval_tourn_player ON evaluations(tournament_id, player_id);
CREATE INDEX idx_pos_votes_player ON position_votes(player_id);
CREATE INDEX idx_draft_picks_team ON draft_picks(tournament_id, team_id);

-- =========================================================================
-- VIEWS CONSOLIDADAS
-- =========================================================================

-- View 1: Posição Votada pela Comunidade (Community Position Consensus)
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
    COALESCE(vc.voted_position, (p.declared_positions)[1]) AS top_voted_position,
    COALESCE(vc.vote_percentage, 100.0) AS top_position_confidence,
    COALESCE(total_v.total_votes, 0) AS total_position_votes
FROM players p
LEFT JOIN vote_counts vc ON p.id = vc.player_id AND vc.rank = 1
LEFT JOIN (
    SELECT player_id, COUNT(*)::INT AS total_votes 
    FROM position_votes 
    GROUP BY player_id
) total_v ON p.id = total_v.player_id;

-- View 2: Estatísticas de Jogadores por Torneio com Tier List e Posições
CREATE OR REPLACE VIEW vw_tournament_player_stats AS
SELECT 
    tr.tournament_id,
    p.id AS player_id,
    p.name,
    p.archetype,
    p.declared_positions,
    COALESCE(cp.top_voted_position, (p.declared_positions)[1]) AS community_position,
    COALESCE(cp.top_position_confidence, 0.0) AS community_confidence,
    cp.total_position_votes,
    tr.is_captain,
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
FROM tournament_registrations tr
JOIN players p ON tr.player_id = p.id
LEFT JOIN vw_community_positions cp ON p.id = cp.player_id
LEFT JOIN evaluations e ON tr.player_id = e.player_id AND tr.tournament_id = e.tournament_id
LEFT JOIN draft_picks dp ON tr.tournament_id = dp.tournament_id AND tr.player_id = dp.player_id
LEFT JOIN teams t ON dp.team_id = t.id
GROUP BY 
    tr.tournament_id, p.id, p.name, p.archetype, p.declared_positions,
    cp.top_voted_position, cp.top_position_confidence, cp.total_position_votes,
    tr.is_captain, dp.team_id, t.name, dp.round, dp.pick_number;

-- =========================================================================
-- RLS (ROW LEVEL SECURITY)
-- =========================================================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura geral pública" ON tournaments FOR SELECT TO public USING (true);
CREATE POLICY "Permitir leitura geral de players" ON players FOR SELECT TO public USING (true);
CREATE POLICY "Permitir leitura geral de stats" ON player_stats FOR SELECT TO public USING (true);
CREATE POLICY "Permitir atualizar stats de player" ON player_stats FOR ALL TO public USING (true);
CREATE POLICY "Permitir votos de posição" ON position_votes FOR ALL TO public USING (true);
CREATE POLICY "Permitir envio de avaliações" ON evaluations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Permitir leitura de avaliações" ON evaluations FOR SELECT TO public USING (true);
CREATE POLICY "Permitir leitura de times" ON teams FOR SELECT TO public USING (true);
CREATE POLICY "Permitir gerenciar draft picks" ON draft_picks FOR ALL TO public USING (true);

-- =========================================================================
-- STORAGE BUCKET CONFIGURATION (BUILD IMAGES)
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('build-images', 'build-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir upload público de fotos de build" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'build-images');

CREATE POLICY "Permitir visualização pública de fotos de build" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'build-images');

-- =========================================================================
-- SEED DATA: TORNEIOS, JOGADORES, STATS EA, VOTOS E TIMES
-- =========================================================================

-- Torneio Inicial: Liga Argentina Pro Clubs 5x5
INSERT INTO tournaments (id, name, format, status, max_teams) VALUES
('11111111-1111-1111-1111-111111111111', 'Liga Argentina Pro Clubs', '5x5', 'DRAFT', 8),
('22222222-2222-2222-2222-222222222222', 'Copa dos Libertadores Pro', '11x11', 'SCOUTING', 16);

-- Jogadores
INSERT INTO players (id, name, declared_positions, archetype) VALUES
('a0000000-0000-0000-0000-000000000001', 'Jefhe', ARRAY['PE', 'ME', 'ATA', 'MEI', 'VOL'], 'Comandante'),
('a0000000-0000-0000-0000-000000000002', 'buzz', ARRAY['ATA', 'PE'], 'O Bruxo'),
('a0000000-0000-0000-0000-000000000003', 'JV', ARRAY['ATA'], 'Predador de Área'),
('a0000000-0000-0000-0000-000000000004', 'J4PA', ARRAY['MEI'], 'Maestro'),
('a0000000-0000-0000-0000-000000000005', 'gustavin171', ARRAY['CA', 'ALA'], 'Velocista'),
('a0000000-0000-0000-0000-000000000006', 'julião', ARRAY['VOL', 'MEI'], 'Pitbull'),
('a0000000-0000-0000-0000-000000000007', 'teteu', ARRAY['ATA'], 'Finalizador'),
('a0000000-0000-0000-0000-000000000008', 'Juan', ARRAY['MEI', 'ME'], 'Motorzinho'),
('a0000000-0000-0000-0000-000000000009', 'Rayan', ARRAY['PE', 'ME', 'MEI'], 'Driblador'),
('a0000000-0000-0000-0000-000000000010', 'DVD', ARRAY['TODAS'], 'Curinga'),
('a0000000-0000-0000-0000-000000000011', 'Deivy', ARRAY['MEI', 'VOL'], 'Organizador'),
('a0000000-0000-0000-0000-000000000012', 'Andrei', ARRAY['ZAG', 'VOL'], 'Muralha'),
('a0000000-0000-0000-0000-000000000013', 'Bueno', ARRAY['MEI', 'MC'], 'Regente'),
('a0000000-0000-0000-0000-000000000014', 'Poli', ARRAY['ATA', 'PD'], 'Flecha'),
('a0000000-0000-0000-0000-000000000015', 'Maicon', ARRAY['VOL', 'MC'], 'Trinco'),
('a0000000-0000-0000-0000-000000000016', 'Miguel', ARRAY['GK'], 'Paredão'),
('a0000000-0000-0000-0000-000000000017', 'Pdro', ARRAY['PE', 'ATA'], 'Artilheiro'),
('a0000000-0000-0000-0000-000000000018', 'Morges', ARRAY['ATA', 'PE', 'PD', 'MEI', 'ME', 'MD'], 'Mágico'),
('a0000000-0000-0000-0000-000000000019', 'Ribeiro', ARRAY['ZAG', 'VOL', 'MC'], 'Torre');

-- Inscrições na Liga Argentina
INSERT INTO tournament_registrations (tournament_id, player_id, is_captain)
SELECT '11111111-1111-1111-1111-111111111111', id, 
  CASE WHEN name IN ('Deivy', 'buzz', 'Andrei', 'Bueno', 'Poli', 'Maicon', 'Miguel', 'Pdro') THEN TRUE ELSE FALSE END
FROM players;

-- Stats Base EA Sports
INSERT INTO player_stats (player_id, pace, shooting, passing, dribbling, defending, physical) VALUES
('a0000000-0000-0000-0000-000000000001', 92, 88, 91, 94, 76, 85),
('a0000000-0000-0000-0000-000000000002', 95, 93, 84, 95, 45, 78),
('a0000000-0000-0000-0000-000000000003', 88, 86, 78, 85, 42, 82),
('a0000000-0000-0000-0000-000000000004', 80, 82, 93, 89, 65, 74),
('a0000000-0000-0000-0000-000000000006', 74, 68, 82, 79, 87, 91),
('a0000000-0000-0000-0000-000000000012', 78, 50, 72, 70, 92, 93),
('a0000000-0000-0000-0000-000000000018', 93, 90, 88, 91, 58, 80);

-- Votação Comunitária de Posição (Ex: Jefhe declarou PE/ME/ATA/MEI/VOL, comunidade votou VOL)
INSERT INTO position_votes (player_id, voted_position) VALUES
('a0000000-0000-0000-0000-000000000001', 'VOL'),
('a0000000-0000-0000-0000-000000000001', 'VOL'),
('a0000000-0000-0000-0000-000000000001', 'VOL'),
('a0000000-0000-0000-0000-000000000001', 'MEI'),
('a0000000-0000-0000-0000-000000000002', 'ATA'),
('a0000000-0000-0000-0000-000000000002', 'ATA'),
('a0000000-0000-0000-0000-000000000006', 'VOL'),
('a0000000-0000-0000-0000-000000000006', 'VOL'),
('a0000000-0000-0000-0000-000000000012', 'ZAG'),
('a0000000-0000-0000-0000-000000000012', 'ZAG');

-- Times da Liga
INSERT INTO teams (id, tournament_id, name, captain_id) VALUES
('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Boca Juniors FC', 'a0000000-0000-0000-0000-000000000002'),
('t2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'River Plate eSports', 'a0000000-0000-0000-0000-000000000011'),
('t3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Racing Club Digital', 'a0000000-0000-0000-0000-000000000012');

-- Avaliações de Amostra
INSERT INTO evaluations (player_id, tournament_id, mechanic_score, iq_score, teamplay_score) VALUES
('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 94, 92, 90),
('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 90, 93, 89),
('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 96, 91, 88),
('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 84, 82, 85),
('a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 88, 92, 89),
('a0000000-0000-0000-0000-000000000018', '11111111-1111-1111-1111-111111111111', 91, 90, 90);

-- Picks Iniciais do Draft
INSERT INTO draft_picks (tournament_id, team_id, player_id, round, pick_number) VALUES
('11111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 1, 1),
('11111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 2, 6),
('11111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000006', 3, 7);

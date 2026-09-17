-- ========================================================
-- DRAFTCLUB - SCHEMA & SEED (EA FC PRO CLUBS SCOUTING)
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE JOGADORES
DROP VIEW IF EXISTS vw_player_stats CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS players CASCADE;

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    positions TEXT[] NOT NULL,
    is_captain BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE AVALIAÇÕES (ANÔNIMAS / EGO-SAFE)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    mechanic_score INTEGER NOT NULL CHECK (mechanic_score >= 1 AND mechanic_score <= 99),
    iq_score INTEGER NOT NULL CHECK (iq_score >= 1 AND iq_score <= 99),
    teamplay_score INTEGER NOT NULL CHECK (teamplay_score >= 1 AND teamplay_score <= 99),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_evaluations_player_id ON evaluations(player_id);
CREATE INDEX idx_players_is_captain ON players(is_captain);

-- 4. VIEW AGREGADA: vw_player_stats
CREATE OR REPLACE VIEW vw_player_stats AS
SELECT 
    p.id AS player_id,
    p.name,
    p.positions,
    p.is_captain,
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
    END AS tier
FROM players p
LEFT JOIN evaluations e ON p.id = e.player_id
GROUP BY p.id, p.name, p.positions, p.is_captain;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Players: Leitura pública
CREATE POLICY "Permitir leitura pública de jogadores"
ON players FOR SELECT
TO public
USING (true);

-- Evaluations: Leitura pública das estatísticas e inserção anônima irrestrita
CREATE POLICY "Permitir inserção anônima de avaliações"
ON evaluations FOR INSERT
TO public
WITH CHECK (
    mechanic_score BETWEEN 1 AND 99 AND
    iq_score BETWEEN 1 AND 99 AND
    teamplay_score BETWEEN 1 AND 99
);

CREATE POLICY "Permitir leitura de avaliações"
ON evaluations FOR SELECT
TO public
USING (true);

-- 6. SEED INICIAL: CAPITÃES E JOGADORES INSCRITOS
INSERT INTO players (name, positions, is_captain) VALUES
-- Capitães (8)
('Deivy', ARRAY['MEI', 'VOL'], TRUE),
('buzz', ARRAY['ATA', 'PE'], TRUE),
('Andrei', ARRAY['ZAG', 'VOL'], TRUE),
('Bueno', ARRAY['MEI', 'MC'], TRUE),
('Poli', ARRAY['ATA', 'PD'], TRUE),
('Maicon', ARRAY['VOL', 'MC'], TRUE),
('Miguel', ARRAY['GK'], TRUE),
('Pdro', ARRAY['PE', 'ATA'], TRUE),

-- Jogadores para Draft (29)
('JV', ARRAY['ATA'], FALSE),
('J4PA', ARRAY['MEI'], FALSE),
('gustavin171', ARRAY['CA', 'ALA'], FALSE),
('julião', ARRAY['VOL', 'MEI'], FALSE),
('teteu', ARRAY['ATA'], FALSE),
('Juan', ARRAY['MEI', 'ME'], FALSE),
('Jefhe', ARRAY['PE', 'ME', 'ATA', 'MEI', 'VOL'], FALSE),
('Rayan', ARRAY['PE', 'ME', 'MEI'], FALSE),
('DVD', ARRAY['TODAS'], FALSE),
('Oliso', ARRAY['ATA'], FALSE),
('Daniel Pogba', ARRAY['ATA'], FALSE),
('Davi', ARRAY['MEI', 'VOL', 'Gandula'], FALSE),
('caio', ARRAY['MEI', 'ATA', 'PE', 'PD'], FALSE),
('Marcão', ARRAY['VOL'], FALSE),
('Rafa', ARRAY['PE', 'PD'], FALSE),
('Ítalo Pogba 2', ARRAY['VOL'], FALSE),
('Ribeiro', ARRAY['ZAG', 'VOL', 'MC'], FALSE),
('Antunes', ARRAY['PE', 'PD', 'LE', 'LD'], FALSE),
('Morges', ARRAY['ATA', 'PE', 'PD', 'MEI', 'ME', 'MD'], FALSE),
('Raul', ARRAY['ZAG', 'VOL'], FALSE),
('Flash', ARRAY['ATA', 'MEI'], FALSE),
('Gomes', ARRAY['GK'], FALSE),
('Tadashi', ARRAY['GK', 'MEI'], FALSE),
('Carvalho', ARRAY['MEI'], FALSE),
('Jota', ARRAY['PE', 'PD', 'ATA'], FALSE),
('Careca', ARRAY['MC'], FALSE),
('Joao Viny', ARRAY['MEI', 'MC'], FALSE),
('Lucas pcx', ARRAY['PD', 'MEI', 'MD'], FALSE),
('Vitin', ARRAY['MEI', 'PD', 'PE', 'ATA', 'VOL'], FALSE);

-- 7. SEED DE AVALIAÇÕES INICIAIS DE DEMONSTRAÇÃO (MOCK REVIEWS)
INSERT INTO evaluations (player_id, mechanic_score, iq_score, teamplay_score)
SELECT id, 92, 94, 91 FROM players WHERE name = 'Jefhe'
UNION ALL
SELECT id, 88, 85, 90 FROM players WHERE name = 'Jefhe'
UNION ALL
SELECT id, 95, 93, 89 FROM players WHERE name = 'buzz'
UNION ALL
SELECT id, 84, 86, 82 FROM players WHERE name = 'JV'
UNION ALL
SELECT id, 80, 82, 85 FROM players WHERE name = 'JV'
UNION ALL
SELECT id, 78, 75, 79 FROM players WHERE name = 'julião'
UNION ALL
SELECT id, 89, 90, 88 FROM players WHERE name = 'J4PA'
UNION ALL
SELECT id, 91, 89, 92 FROM players WHERE name = 'J4PA'
UNION ALL
SELECT id, 72, 70, 68 FROM players WHERE name = 'Marcão'
UNION ALL
SELECT id, 65, 60, 62 FROM players WHERE name = 'Careca'
UNION ALL
SELECT id, 85, 87, 88 FROM players WHERE name = 'Deivy'
UNION ALL
SELECT id, 88, 91, 87 FROM players WHERE name = 'Ribeiro'
UNION ALL
SELECT id, 90, 89, 91 FROM players WHERE name = 'Morges';

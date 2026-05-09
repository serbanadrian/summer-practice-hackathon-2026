INSERT INTO sports (name, min_players, max_players)
VALUES
('Football', 10, 14),
('Tennis', 2, 4),
('Basketball', 6, 10),
('Running', 2, 20),
('Volleyball', 6, 12)
ON CONFLICT (name) DO NOTHING;
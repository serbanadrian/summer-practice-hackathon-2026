INSERT INTO sports (name, min_players, max_players)
VALUES
('Football', 10, 14),
('Tennis', 2, 4),
('Basketball', 6, 10),
('Running', 2, 20),
('Volleyball', 6, 12)
ON CONFLICT (name) DO NOTHING;

INSERT INTO venues (name, city, sport_id, address, price_per_hour)
SELECT 'Baza Sportiva Timisoara - Football', 'Timisoara', id, 'Strada Stadionului 1', 150
FROM sports
WHERE name = 'Football'
ON CONFLICT DO NOTHING;

INSERT INTO venues (name, city, sport_id, address, price_per_hour)
SELECT 'Teren Sintetic Central', 'Timisoara', id, 'Bulevardul Sportului 10', 120
FROM sports
WHERE name = 'Football'
ON CONFLICT DO NOTHING;

INSERT INTO venues (name, city, sport_id, address, price_per_hour)
SELECT 'Tennis Club Timisoara', 'Timisoara', id, 'Strada Rachetei 5', 80
FROM sports
WHERE name = 'Tennis'
ON CONFLICT DO NOTHING;

INSERT INTO venues (name, city, sport_id, address, price_per_hour)
SELECT 'Court Arena Tennis', 'Timisoara', id, 'Calea Aradului 22', 100
FROM sports
WHERE name = 'Tennis'
ON CONFLICT DO NOTHING;

INSERT INTO venues (name, city, sport_id, address, price_per_hour)
SELECT 'Basketball Hall Timisoara', 'Timisoara', id, 'Strada Baschetului 7', 130
FROM sports
WHERE name = 'Basketball'
ON CONFLICT DO NOTHING;

INSERT INTO venues (name, city, sport_id, address, price_per_hour)
SELECT 'Outdoor Basketball Court', 'Timisoara', id, 'Parcul Central', 0
FROM sports
WHERE name = 'Basketball'
ON CONFLICT DO NOTHING;
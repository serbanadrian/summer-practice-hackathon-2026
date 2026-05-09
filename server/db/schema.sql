CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  description TEXT,
  city VARCHAR(100),
  profile_photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  min_players INT NOT NULL,
  max_players INT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sports (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport_id INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  skill_level VARCHAR(50) DEFAULT 'beginner',
  UNIQUE(user_id, sport_id)
);

CREATE TABLE IF NOT EXISTS availabilities (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport_id INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, sport_id, availability_date, time_slot)
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  sport_id INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  captain_id INT REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
  event_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  city VARCHAR(100),
  location_name VARCHAR(150),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_participants (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  sport_id INT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  address TEXT,
  price_per_hour NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_location_suggestions (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  price_per_hour NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS location_suggestion_votes (
  id SERIAL PRIMARY KEY,
  suggestion_id INT NOT NULL REFERENCES event_location_suggestions(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(suggestion_id, user_id)
);
import pool from "../db.js";

function chooseRandomCaptain(users) {
  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex];
}

function chunkUsers(users, maxPlayers) {
  const groups = [];

  for (let i = 0; i < users.length; i += maxPlayers) {
    groups.push(users.slice(i, i + maxPlayers));
  }

  return groups;
}

export async function runMatchingService(client = pool) {
  const availabilityResult = await client.query(
    `
    SELECT
      a.id AS availability_id,
      a.user_id,
      a.sport_id,
      a.availability_date,
      a.time_slot,
      u.name AS user_name,
      u.city,
      s.name AS sport_name,
      s.min_players,
      s.max_players
    FROM availabilities a
    JOIN users u ON a.user_id = u.id
    JOIN sports s ON a.sport_id = s.id
    WHERE a.is_available = true
    ORDER BY a.sport_id, a.availability_date, a.time_slot, u.city
    `
  );

  const availabilities = availabilityResult.rows;
  const groupsMap = new Map();

  for (const item of availabilities) {
    const dateValue =
      item.availability_date instanceof Date
        ? item.availability_date.toISOString().split("T")[0]
        : String(item.availability_date);

    const key = [
      item.sport_id,
      dateValue,
      item.time_slot,
      item.city || "Unknown city",
    ].join("|");

    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }

    groupsMap.get(key).push(item);
  }

  const createdEvents = [];

  for (const [, users] of groupsMap.entries()) {
    const firstUser = users[0];

    const minPlayers = Number(firstUser.min_players);
    const maxPlayers = Number(firstUser.max_players);

    if (users.length < minPlayers) {
      continue;
    }

    const userChunks = chunkUsers(users, maxPlayers);

    for (const groupUsers of userChunks) {
      if (groupUsers.length < minPlayers) {
        continue;
      }

      const captain = chooseRandomCaptain(groupUsers);
      const eventTitle = `${firstUser.sport_name} - ${firstUser.time_slot}`;

      const existingEventResult = await client.query(
        `
        SELECT id
        FROM events
        WHERE sport_id = $1
          AND event_date = $2
          AND time_slot = $3
          AND COALESCE(city, '') = COALESCE($4, '')
        LIMIT 1
        `,
        [
          firstUser.sport_id,
          firstUser.availability_date,
          firstUser.time_slot,
          firstUser.city,
        ]
      );

      if (existingEventResult.rows.length > 0) {
        continue;
      }

      const eventResult = await client.query(
        `
        INSERT INTO events (
          sport_id,
          captain_id,
          title,
          event_date,
          time_slot,
          city,
          location_name,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
        RETURNING *
        `,
        [
          firstUser.sport_id,
          captain.user_id,
          eventTitle,
          firstUser.availability_date,
          firstUser.time_slot,
          firstUser.city,
          "Location to be decided",
        ]
      );

      const event = eventResult.rows[0];

      for (const groupUser of groupUsers) {
        await client.query(
          `
          INSERT INTO event_participants (event_id, user_id, status)
          VALUES ($1, $2, 'pending')
          ON CONFLICT (event_id, user_id) DO NOTHING
          `,
          [event.id, groupUser.user_id]
        );
      }

      createdEvents.push({
        ...event,
        sport_name: firstUser.sport_name,
        captain_name: captain.user_name,
        participants_count: groupUsers.length,
      });
    }
  }

  return createdEvents;
}
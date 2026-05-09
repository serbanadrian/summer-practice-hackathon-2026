import pool from "../db.js";
import { runMatchingService } from "../services/matchingService.js";

export async function runMatching(req, res) {
  try {
    const createdEvents = await runMatchingService();

    return res.json({
      message: "Matching completed successfully",
      createdEvents,
      createdCount: createdEvents.length,
    });
  } catch (error) {
    console.error("Run matching error:", error);

    return res.status(500).json({
      message: "Server error while running matching",
    });
  }
}

export async function previewMatching(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        a.sport_id,
        s.name AS sport_name,
        s.min_players,
        s.max_players,
        a.availability_date,
        a.time_slot,
        COALESCE(u.city, 'Unknown city') AS city,
        COUNT(a.user_id) AS available_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'user_id', u.id,
            'name', u.name,
            'city', u.city
          )
          ORDER BY u.name ASC
        ) AS users
      FROM availabilities a
      JOIN users u ON a.user_id = u.id
      JOIN sports s ON a.sport_id = s.id
      WHERE a.is_available = true
      GROUP BY
        a.sport_id,
        s.name,
        s.min_players,
        s.max_players,
        a.availability_date,
        a.time_slot,
        COALESCE(u.city, 'Unknown city')
      ORDER BY
        a.availability_date ASC,
        a.time_slot ASC,
        s.name ASC
      `
    );

    const groups = result.rows.map((group) => {
      const availableCount = Number(group.available_count);
      const minPlayers = Number(group.min_players);
      const maxPlayers = Number(group.max_players);

      return {
        sport_id: group.sport_id,
        sport_name: group.sport_name,
        min_players: minPlayers,
        max_players: maxPlayers,
        availability_date: group.availability_date,
        time_slot: group.time_slot,
        city: group.city,
        available_count: availableCount,
        missing_players: Math.max(minPlayers - availableCount, 0),
        is_ready: availableCount >= minPlayers,
        is_full: availableCount >= maxPlayers,
        users: group.users,
      };
    });

    return res.json({
      groups,
    });
  } catch (error) {
    console.error("Preview matching error:", error);

    return res.status(500).json({
      message: "Server error while previewing matching",
    });
  }
}
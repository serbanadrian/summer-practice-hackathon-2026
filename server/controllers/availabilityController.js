import pool from "../db.js";

export async function showUpToday(req, res) {
  try {
    const { sportId, availabilityDate, timeSlot, isAvailable } = req.body;

    if (!sportId || !availabilityDate || !timeSlot) {
      return res.status(400).json({
        message: "sportId, availabilityDate and timeSlot are required",
      });
    }

    const sportResult = await pool.query(
      "SELECT id, name FROM sports WHERE id = $1",
      [sportId]
    );

    if (sportResult.rows.length === 0) {
      return res.status(404).json({
        message: "Sport not found",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO availabilities (
        user_id,
        sport_id,
        availability_date,
        time_slot,
        is_available
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, sport_id, availability_date, time_slot)
      DO UPDATE SET
        is_available = EXCLUDED.is_available,
        created_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, sport_id, availability_date, time_slot, is_available, created_at
      `,
      [
        req.userId,
        sportId,
        availabilityDate,
        timeSlot,
        isAvailable !== false,
      ]
    );

    return res.status(201).json({
      message: "Availability saved successfully",
      availability: result.rows[0],
    });
  } catch (error) {
    console.error("Show up today error:", error);
    return res.status(500).json({
      message: "Server error while saving availability",
    });
  }
}

export async function getMyAvailabilities(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        a.id,
        a.availability_date,
        a.time_slot,
        a.is_available,
        a.created_at,
        s.id AS sport_id,
        s.name AS sport_name,
        s.min_players,
        s.max_players
      FROM availabilities a
      JOIN sports s ON a.sport_id = s.id
      WHERE a.user_id = $1
      ORDER BY a.availability_date DESC, a.created_at DESC
      `,
      [req.userId]
    );

    return res.json({
      availabilities: result.rows,
    });
  } catch (error) {
    console.error("Get my availabilities error:", error);
    return res.status(500).json({
      message: "Server error while fetching availabilities",
    });
  }
}
import pool from "../db.js";

export async function getMyEvents(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.event_date,
        e.time_slot,
        e.city,
        e.location_name,
        e.status,
        e.created_at,
        s.name AS sport_name,
        s.min_players,
        s.max_players,
        captain.name AS captain_name,
        ep.status AS my_status,
        COUNT(all_ep.id) AS participants_count
      FROM events e
      JOIN sports s ON e.sport_id = s.id
      LEFT JOIN users captain ON e.captain_id = captain.id
      JOIN event_participants ep ON e.id = ep.event_id
      LEFT JOIN event_participants all_ep ON e.id = all_ep.event_id
      WHERE ep.user_id = $1
      GROUP BY
        e.id,
        s.name,
        s.min_players,
        s.max_players,
        captain.name,
        ep.status
      ORDER BY e.event_date ASC, e.created_at DESC
      `,
      [req.userId]
    );

    return res.json({
      events: result.rows,
    });
  } catch (error) {
    console.error("Get my events error:", error);

    return res.status(500).json({
      message: "Server error while fetching events",
    });
  }
}

export async function getEventById(req, res) {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.event_date,
        e.time_slot,
        e.city,
        e.location_name,
        e.status,
        e.created_at,
        s.name AS sport_name,
        s.min_players,
        s.max_players,
        captain.name AS captain_name
      FROM events e
      JOIN sports s ON e.sport_id = s.id
      LEFT JOIN users captain ON e.captain_id = captain.id
      WHERE e.id = $1
      `,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const participantsResult = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.city,
        ep.status
      FROM event_participants ep
      JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = $1
      ORDER BY u.name ASC
      `,
      [id]
    );

    return res.json({
      event: eventResult.rows[0],
      participants: participantsResult.rows,
    });
  } catch (error) {
    console.error("Get event by id error:", error);

    return res.status(500).json({
      message: "Server error while fetching event",
    });
  }
}

export async function confirmParticipation(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["confirmed", "declined", "pending"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid participation status",
      });
    }

    const result = await pool.query(
      `
      UPDATE event_participants
      SET status = $1
      WHERE event_id = $2 AND user_id = $3
      RETURNING *
      `,
      [status, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "You are not part of this event",
      });
    }

    return res.json({
      message: "Participation status updated",
      participation: result.rows[0],
    });
  } catch (error) {
    console.error("Confirm participation error:", error);

    return res.status(500).json({
      message: "Server error while updating participation",
    });
  }
}
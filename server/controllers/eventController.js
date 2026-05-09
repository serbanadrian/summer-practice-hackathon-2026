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
        e.sport_id,
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

export async function createManualEvent(req, res) {
  try {
    const {
      sportId,
      title,
      eventDate,
      timeSlot,
      city,
      locationName,
    } = req.body;

    if (!sportId || !title || !eventDate || !timeSlot || !city) {
      return res.status(400).json({
        message: "sportId, title, eventDate, timeSlot and city are required",
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

    const eventResult = await pool.query(
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
        sportId,
        req.userId,
        title,
        eventDate,
        timeSlot,
        city,
        locationName || "Location to be decided",
      ]
    );

    const event = eventResult.rows[0];

    await pool.query(
      `
      INSERT INTO event_participants (event_id, user_id, status)
      VALUES ($1, $2, 'confirmed')
      ON CONFLICT (event_id, user_id) DO NOTHING
      `,
      [event.id, req.userId]
    );

    return res.status(201).json({
      message: "Manual event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create manual event error:", error);

    return res.status(500).json({
      message: "Server error while creating manual event",
    });
  }
}

export async function getPublicEvents(req, res) {
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
        s.name AS sport_name,
        s.min_players,
        s.max_players,
        captain.name AS captain_name,
        COUNT(ep.id) AS participants_count
      FROM events e
      JOIN sports s ON e.sport_id = s.id
      LEFT JOIN users captain ON e.captain_id = captain.id
      LEFT JOIN event_participants ep ON e.id = ep.event_id
      WHERE e.status = 'open'
      GROUP BY
        e.id,
        s.name,
        s.min_players,
        s.max_players,
        captain.name
      ORDER BY e.event_date ASC, e.created_at DESC
      `
    );

    return res.json({
      events: result.rows,
    });
  } catch (error) {
    console.error("Get public events error:", error);

    return res.status(500).json({
      message: "Server error while fetching public events",
    });
  }
}

export async function joinEvent(req, res) {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      "SELECT id FROM events WHERE id = $1",
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO event_participants (event_id, user_id, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET status = EXCLUDED.status
      RETURNING *
      `,
      [id, req.userId]
    );

    return res.json({
      message: "Joined event successfully",
      participation: result.rows[0],
    });
  } catch (error) {
    console.error("Join event error:", error);

    return res.status(500).json({
      message: "Server error while joining event",
    });
  }
}
export async function updateEventLocation(req, res) {
  try {
    const { id } = req.params;
    const { locationName } = req.body;

    if (!locationName || locationName.trim().length === 0) {
      return res.status(400).json({
        message: "locationName is required",
      });
    }

    const eventResult = await pool.query(
      `
      SELECT id, captain_id
      FROM events
      WHERE id = $1
      `,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const event = eventResult.rows[0];

    if (event.captain_id !== req.userId) {
      return res.status(403).json({
        message: "Only the captain can update the event location",
      });
    }

    const result = await pool.query(
      `
      UPDATE events
      SET location_name = $1
      WHERE id = $2
      RETURNING *
      `,
      [locationName.trim(), id]
    );

    return res.json({
      message: "Event location updated successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Update event location error:", error);

    return res.status(500).json({
      message: "Server error while updating event location",
    });
  }
}
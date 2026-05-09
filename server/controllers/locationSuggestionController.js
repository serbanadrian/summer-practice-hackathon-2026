import pool from "../db.js";

export async function getEventLocationSuggestions(req, res) {
  try {
    const { id } = req.params;

    const participantResult = await pool.query(
      `
      SELECT id
      FROM event_participants
      WHERE event_id = $1 AND user_id = $2
      `,
      [id, req.userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(403).json({
        message: "You are not part of this event",
      });
    }

    const result = await pool.query(
      `
      SELECT
        els.id,
        els.event_id,
        els.name,
        els.address,
        els.price_per_hour,
        els.created_at,
        u.id AS user_id,
        u.name AS suggested_by
      FROM event_location_suggestions els
      JOIN users u ON els.user_id = u.id
      WHERE els.event_id = $1
      ORDER BY els.created_at DESC
      `,
      [id]
    );

    return res.json({
      suggestions: result.rows,
    });
  } catch (error) {
    console.error("Get location suggestions error:", error);

    return res.status(500).json({
      message: "Server error while fetching location suggestions",
    });
  }
}

export async function createEventLocationSuggestion(req, res) {
  try {
    const { id } = req.params;
    const { name, address, pricePerHour } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        message: "Suggestion name is required",
      });
    }

    const participantResult = await pool.query(
      `
      SELECT id
      FROM event_participants
      WHERE event_id = $1 AND user_id = $2
      `,
      [id, req.userId]
    );

    if (participantResult.rows.length === 0) {
      return res.status(403).json({
        message: "You are not part of this event",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO event_location_suggestions (
        event_id,
        user_id,
        name,
        address,
        price_per_hour
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        id,
        req.userId,
        name.trim(),
        address?.trim() || null,
        pricePerHour === "" || pricePerHour === undefined
          ? null
          : Number(pricePerHour),
      ]
    );

    return res.status(201).json({
      message: "Location suggestion added successfully",
      suggestion: result.rows[0],
    });
  } catch (error) {
    console.error("Create location suggestion error:", error);

    return res.status(500).json({
      message: "Server error while creating location suggestion",
    });
  }
}

export async function chooseFinalEventLocation(req, res) {
  try {
    const { id, suggestionId } = req.params;

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
        message: "Only the captain can choose the final location",
      });
    }

    const suggestionResult = await pool.query(
      `
      SELECT id, name
      FROM event_location_suggestions
      WHERE id = $1 AND event_id = $2
      `,
      [suggestionId, id]
    );

    if (suggestionResult.rows.length === 0) {
      return res.status(404).json({
        message: "Suggestion not found",
      });
    }

    const suggestion = suggestionResult.rows[0];

    const updateResult = await pool.query(
      `
      UPDATE events
      SET location_name = $1
      WHERE id = $2
      RETURNING *
      `,
      [suggestion.name, id]
    );

    return res.json({
      message: "Final event location selected",
      event: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Choose final location error:", error);

    return res.status(500).json({
      message: "Server error while choosing final location",
    });
  }
}
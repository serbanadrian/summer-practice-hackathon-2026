import pool from "../db.js";

async function ensureUserIsParticipant(eventId, userId) {
  const participantResult = await pool.query(
    `
    SELECT id
    FROM event_participants
    WHERE event_id = $1 AND user_id = $2
    `,
    [eventId, userId]
  );

  return participantResult.rows.length > 0;
}

export async function getEventLocationSuggestions(req, res) {
  try {
    const { id } = req.params;

    const isParticipant = await ensureUserIsParticipant(id, req.userId);

    if (!isParticipant) {
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
        u.name AS suggested_by,
        COUNT(lsv.id) AS vote_count,
        BOOL_OR(lsv.user_id = $2) AS voted_by_me
      FROM event_location_suggestions els
      JOIN users u ON els.user_id = u.id
      LEFT JOIN location_suggestion_votes lsv
        ON els.id = lsv.suggestion_id
      WHERE els.event_id = $1
      GROUP BY
        els.id,
        els.event_id,
        els.name,
        els.address,
        els.price_per_hour,
        els.created_at,
        u.id,
        u.name
      ORDER BY
        COUNT(lsv.id) DESC,
        els.created_at DESC
      `,
      [id, req.userId]
    );

    return res.json({
      suggestions: result.rows.map((suggestion) => ({
        ...suggestion,
        vote_count: Number(suggestion.vote_count),
        voted_by_me: Boolean(suggestion.voted_by_me),
      })),
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

    const isParticipant = await ensureUserIsParticipant(id, req.userId);

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this event",
      });
    }

    const normalizedName = name.trim();
    const normalizedAddress = address?.trim() || null;
    const normalizedPrice =
      pricePerHour === "" || pricePerHour === undefined || pricePerHour === null
        ? null
        : Number(pricePerHour);

    const existingSuggestionResult = await pool.query(
      `
      SELECT *
      FROM event_location_suggestions
      WHERE event_id = $1
        AND LOWER(name) = LOWER($2)
      LIMIT 1
      `,
      [id, normalizedName]
    );

    if (existingSuggestionResult.rows.length > 0) {
      return res.status(200).json({
        message: "Location suggestion already exists",
        suggestion: existingSuggestionResult.rows[0],
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
        normalizedName,
        normalizedAddress,
        normalizedPrice,
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

export async function voteLocationSuggestion(req, res) {
  try {
    const { id, suggestionId } = req.params;

    const isParticipant = await ensureUserIsParticipant(id, req.userId);

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this event",
      });
    }

    const suggestionResult = await pool.query(
      `
      SELECT id
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

    const result = await pool.query(
      `
      INSERT INTO location_suggestion_votes (suggestion_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (suggestion_id, user_id) DO NOTHING
      RETURNING *
      `,
      [suggestionId, req.userId]
    );

    return res.status(201).json({
      message:
        result.rows.length === 0
          ? "You already voted for this suggestion"
          : "Vote added successfully",
      vote: result.rows[0] || null,
    });
  } catch (error) {
    console.error("Vote location suggestion error:", error);

    return res.status(500).json({
      message: "Server error while voting location suggestion",
    });
  }
}

export async function unvoteLocationSuggestion(req, res) {
  try {
    const { id, suggestionId } = req.params;

    const isParticipant = await ensureUserIsParticipant(id, req.userId);

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this event",
      });
    }

    const suggestionResult = await pool.query(
      `
      SELECT id
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

    await pool.query(
      `
      DELETE FROM location_suggestion_votes
      WHERE suggestion_id = $1 AND user_id = $2
      `,
      [suggestionId, req.userId]
    );

    return res.json({
      message: "Vote removed successfully",
    });
  } catch (error) {
    console.error("Unvote location suggestion error:", error);

    return res.status(500).json({
      message: "Server error while removing vote",
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
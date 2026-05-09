import pool from "../db.js";

export async function getEventMessages(req, res) {
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
        m.id,
        m.content,
        m.created_at,
        u.id AS user_id,
        u.name AS user_name
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.event_id = $1
      ORDER BY m.created_at ASC
      `,
      [id]
    );

    return res.json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("Get event messages error:", error);

    return res.status(500).json({
      message: "Server error while fetching messages",
    });
  }
}

export async function createEventMessage(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        message: "Message content is required",
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
      INSERT INTO messages (event_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, event_id, user_id, content, created_at
      `,
      [id, req.userId, content.trim()]
    );

    return res.status(201).json({
      message: "Message sent successfully",
      chatMessage: result.rows[0],
    });
  } catch (error) {
    console.error("Create event message error:", error);

    return res.status(500).json({
      message: "Server error while sending message",
    });
  }
}
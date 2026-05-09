import pool from "../db.js";

export async function getProfile(req, res) {
  try {
    const userResult = await pool.query(
      `
      SELECT id, name, email, description, city, profile_photo_url, created_at
      FROM users
      WHERE id = $1
      `,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const sportsResult = await pool.query(
      `
      SELECT 
        s.id,
        s.name,
        s.min_players,
        s.max_players,
        us.skill_level
      FROM user_sports us
      JOIN sports s ON us.sport_id = s.id
      WHERE us.user_id = $1
      ORDER BY s.name ASC
      `,
      [req.userId]
    );

    return res.json({
      user: userResult.rows[0],
      sports: sportsResult.rows,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      message: "Server error while fetching profile",
    });
  }
}

export async function updateProfile(req, res) {
  const client = await pool.connect();

  try {
    const { description, city, sports } = req.body;

    await client.query("BEGIN");

    const userResult = await client.query(
      `
      UPDATE users
      SET description = $1,
          city = $2
      WHERE id = $3
      RETURNING id, name, email, description, city, profile_photo_url, created_at
      `,
      [description || null, city || null, req.userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "User not found",
      });
    }

    await client.query(
      `
      DELETE FROM user_sports
      WHERE user_id = $1
      `,
      [req.userId]
    );

    if (Array.isArray(sports)) {
      for (const sport of sports) {
        await client.query(
          `
          INSERT INTO user_sports (user_id, sport_id, skill_level)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, sport_id)
          DO UPDATE SET skill_level = EXCLUDED.skill_level
          `,
          [
            req.userId,
            sport.sportId,
            sport.skillLevel || "beginner",
          ]
        );
      }
    }

    await client.query("COMMIT");

    return res.json({
      message: "Profile updated successfully",
      user: userResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Server error while updating profile",
    });
  } finally {
    client.release();
  }
}
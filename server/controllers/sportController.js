import pool from "../db.js";

export async function getSports(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT id, name, min_players, max_players
      FROM sports
      ORDER BY name ASC
      `
    );

    return res.json({
      sports: result.rows,
    });
  } catch (error) {
    console.error("Get sports error:", error);
    return res.status(500).json({
      message: "Server error while fetching sports",
    });
  }
}
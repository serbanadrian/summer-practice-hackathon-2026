import pool from "../db.js";

export async function getVenues(req, res) {
  try {
    const { sportId, city } = req.query;

    if (!sportId || !city) {
      return res.status(400).json({
        message: "sportId and city are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        v.id,
        v.name,
        v.city,
        v.sport_id,
        s.name AS sport_name,
        v.address,
        v.price_per_hour
      FROM venues v
      JOIN sports s ON v.sport_id = s.id
      WHERE v.sport_id = $1
        AND LOWER(v.city) = LOWER($2)
      ORDER BY v.price_per_hour ASC, v.name ASC
      `,
      [sportId, city]
    );

    return res.json({
      venues: result.rows,
    });
  } catch (error) {
    console.error("Get venues error:", error);

    return res.status(500).json({
      message: "Server error while fetching venues",
    });
  }
}
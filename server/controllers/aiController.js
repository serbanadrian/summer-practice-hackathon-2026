import pool from "../db.js";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "qwen2.5-coder:0.5b";

function extractJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No JSON object found in model response");
    }

    return JSON.parse(match[0]);
  }
}

function keywordFallback(description, sports) {
  const text = description.toLowerCase();

  const sportKeywords = {
    football: ["football", "soccer", "fotbal", "futsal"],
    tennis: ["tennis", "tenis", "racket", "racquet"],
    basketball: ["basketball", "baschet", "bball"],
    running: ["running", "run", "jogging", "alergare", "alerg"],
    volleyball: ["volleyball", "volei"],
  };

  return sports.filter((sport) => {
    const sportName = sport.name.toLowerCase();
    const keywords = sportKeywords[sportName] || [sportName];

    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });
}

export async function detectSports(req, res) {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Description is required",
      });
    }

    const sportsResult = await pool.query(
      `
      SELECT id, name, min_players, max_players
      FROM sports
      ORDER BY name ASC
      `
    );

    const sports = sportsResult.rows;
    const allowedSports = sports.map((sport) => sport.name);

    const prompt = `
You are part of a sports matching app.

Your task:
Extract the sports mentioned or strongly implied in the user's profile description.

Allowed sports:
${allowedSports.join(", ")}

Rules:
- Return ONLY valid JSON.
- Do not add explanations.
- Use only sports from the allowed list.
- If no sport is detected, return an empty array.
- Match Romanian and English words if possible.
- Example output:
{"sports":["Football","Tennis"]}

User description:
"${description}"
`;

    try {
      const ollamaResponse = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0,
          },
        }),
      });

      if (!ollamaResponse.ok) {
        throw new Error("Ollama request failed");
      }

      const ollamaData = await ollamaResponse.json();
      const parsed = extractJsonFromText(ollamaData.response || "");

      const detectedNames = Array.isArray(parsed.sports) ? parsed.sports : [];

      const detectedSports = sports.filter((sport) =>
        detectedNames.some(
          (name) => name.toLowerCase() === sport.name.toLowerCase()
        )
      );

      return res.json({
        source: "ollama",
        sports: detectedSports,
      });
    } catch (ollamaError) {
      console.error("Ollama detection failed, using fallback:", ollamaError.message);

      const fallbackSports = keywordFallback(description, sports);

      return res.json({
        source: "fallback",
        sports: fallbackSports,
      });
    }
  } catch (error) {
    console.error("Detect sports error:", error);

    return res.status(500).json({
      message: "Server error while detecting sports",
    });
  }
}
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `You are a senior product management copilot. Given a raw problem statement and a list of candidate features/ideas, produce a structured product brief.

Return ONLY valid JSON (no markdown fences, no preamble) matching this shape:
{
  "goal": "one-sentence product goal",
  "successMetrics": ["metric 1", "metric 2", "metric 3"],
  "userStories": ["As a <user>, I want <capability>, so that <outcome>", "..."],
  "prioritization": [
    {
      "feature": "feature name",
      "reach": 1-10,
      "impact": 1-10,
      "confidence": 1-10,
      "effort": 1-10,
      "riceScore": number (reach*impact*confidence/effort, rounded to 1 decimal),
      "rationale": "one-sentence justification"
    }
  ],
  "risks": ["risk / assumption 1", "risk / assumption 2"],
  "roadmap": [
    { "phase": "Phase 1 (0-4 weeks)", "focus": "what ships and why it's first" },
    { "phase": "Phase 2 (4-8 weeks)", "focus": "..." },
    { "phase": "Phase 3 (8-12 weeks)", "focus": "..." }
  ]
}

Sort "prioritization" by riceScore descending. Be specific and concise, grounded only in what the user provided — do not invent company names, metrics, or user segments not implied by the input.`;

app.post("/api/generate-prd", async (req, res) => {
  const { problemStatement, features } = req.body || {};

  if (!problemStatement || !problemStatement.trim()) {
    return res.status(400).json({ error: "problemStatement is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Set it in your environment." });
  }

  const userContent = [
    `Problem statement: ${problemStatement.trim()}`,
    features && features.trim()
      ? `Candidate features / ideas (one per line):\n${features.trim()}`
      : "No candidate features were provided — infer 4-6 reasonable ones from the problem statement.",
  ].join("\n\n");

  try {
    const model = "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          generationConfig: {
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${errText}` });
    }

    const data = await response.json();
    const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOut) {
      return res.status(502).json({ error: "No text content returned by the model." });
    }

    let parsed;
    try {
      const cleaned = textOut.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: "Model did not return valid JSON.", raw: textOut });
    }

    res.json(parsed);
  } catch (err) {
    console.error("generate-prd error:", err);
    res.status(500).json({ error: "Unexpected server error. Check server logs." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI Roadmap Prioritizer running on http://localhost:${PORT}`));

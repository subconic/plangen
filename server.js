// server.js — FRONTEND FRIENDLY VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "SUBCONIC API running" });
});

app.post("/api/generate-plan", async (req, res) => {
  try {
    const u = req.body;

    if (!u.goal) {
      return res.status(400).json({
        success: false,
        error: "Goal is required"
      });
    }

    const prompt = `
You are SUBCONIC AI.

Generate ONLY valid JSON.
No markdown.
No explanation.
No extra text.

Return JSON in EXACT structure below:

{
  "mainGoal": {
    "goal": "",
    "deadline": "",
    "committed": true
  },

  "planMeta": {
    "planGoal": "",
    "benefits": [],
    "whyThisWorks": []
  },

  "currentPlan": {
    "brainprogram": {
      "morning": "",
      "night": ""
    },
    "burningDesires": [],
    "affirmations": [],
    "dailyRoutine": {
      "guide": "",
      "implementation": ""
    }
  }
}

User Data:
Goal: ${u.goal}
Deadline: ${u.deadline}
Committed: ${u.isCommitted}
Knowledge: ${u.knowHow}
Weekly Goal: ${u.weeklyGoal}
Method: ${u.howToAchieve}
Daily Hours: ${u.dailyHours}
Time Window: ${u.startTime} to ${u.endTime}
`;

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500
          }
        })
      }
    );

    if (!aiRes.ok) {
      throw new Error("Gemini API failed");
    }

    const data = await aiRes.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Empty AI response");

    // 🧠 Safe JSON extraction
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    text = text.slice(start, end + 1);

    const parsed = JSON.parse(text);

    // 🔥 FRONTEND-FRIENDLY RESPONSE
    res.json({
      success: true,

      mainGoal: parsed.mainGoal,
      planMeta: parsed.planMeta,

      brainprogram: parsed.currentPlan.brainprogram,
      burningDesires: parsed.currentPlan.burningDesires,
      affirmations: parsed.currentPlan.affirmations,
      dailyRoutine: parsed.currentPlan.dailyRoutine
    });

  } catch (err) {
    console.error("❌ PLAN ERROR:", err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SUBCONIC Backend running on ${PORT}`);
});

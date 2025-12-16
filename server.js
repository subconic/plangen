
// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

    const prompt = `
You are SUBCONIC AI.

Generate ONLY valid JSON.
No markdown.
No explanation.
No extra text.

Return JSON in EXACT structure below.

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
      "day1": [],
      "day2": [],
      "day3": [],
      "day4": [],
      "day5": [],
      "day6": [],
      "day7": []
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

Rules:
- brainprogram: emotional, subconscious programming
- burningDesires: exactly 7 powerful desire lines
- affirmations: exactly 5 identity based
- dailyRoutine: time based actionable tasks
- planMeta.benefits: 4–5 clear benefits
- planMeta.whyThisWorks: psychological + practical reasons
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Empty AI response");

    const parsed = JSON.parse(text);

    res.json({
      success: true,
      plan: parsed
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Plan generation failed"
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 SUBCONIC Backend running on ${PORT}`)
);

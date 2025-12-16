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
      "guide": "A comprehensive guide on how to use this plan daily. Include specific time-based instructions, actionable steps, and practical implementation methods. Structure it as a clear daily guide with time blocks and specific actions.",
      "implementation": "Point-wise implementation strategy covering how to execute each component of the plan effectively throughout the day."
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
- brainprogram: emotional, subconscious programming routines
- burningDesires: exactly 7 powerful desire lines
- affirmations: exactly 5 identity-based affirmations
- dailyRoutine.guide: detailed daily guide with time-based actionable instructions
- dailyRoutine.implementation: point-wise execution strategy
- planMeta.benefits: 4–5 clear benefits
- planMeta.whyThisWorks: psychological + practical reasons

Important Instructions for dailyRoutine:
1. Create a comprehensive daily guide that shows exactly how to use the plan throughout the day
2. Include specific time blocks based on user's time window (${u.startTime} to ${u.endTime})
3. Structure as a complete daily workflow with actionable steps
4. Add point-wise implementation strategy for effective execution
5. Focus on practical, time-based guidance rather than day-wise breakdown
6. Include morning routine, work blocks, breaks, evening routine, and night preparation
7. Make it specific to the user's daily hours (${u.dailyHours} hours per day)
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
            maxOutputTokens: 2500
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

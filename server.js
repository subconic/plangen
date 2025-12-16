// server.js — SUBCONIC Stable Plan Generator Backend

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.json({
    status: "SUBCONIC API running",
    version: "2.0",
    time: new Date().toISOString()
  });
});

// ---------------- PLAN GENERATOR ----------------
app.post("/api/generate-plan", async (req, res) => {
  try {
    const u = req.body || {};

    // 🔒 Minimal validation
    if (!u.goal || typeof u.goal !== "string") {
      return res.status(400).json({
        success: false,
        error: "Goal is required"
      });
    }

    // ---------------- AI PROMPT ----------------
    const prompt = `
You are SUBCONIC AI.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- No explanation
- No comments
- No extra text

Return JSON in EXACT structure below:

{
  "meta": {
    "createdAt": "",
    "planType": "subconscious-goal-plan"
  },

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

  "brainprogram": {
    "morning": "",
    "night": ""
  },

  "burningDesires": [],
  "affirmations": [],

  "dailyRoutine": {
    "guide": "",
    "implementation": []
  }
}

USER DATA:
Goal: ${u.goal}
Deadline: ${u.deadline || ""}
Committed: ${u.isCommitted}
Knowledge: ${u.knowHow || ""}
Weekly Goal: ${u.weeklyGoal || ""}
Method: ${u.howToAchieve || ""}
Daily Hours: ${u.dailyHours || ""}
Time Window: ${u.startTime || ""} to ${u.endTime || ""}

RULES:
- burningDesires: EXACTLY 7 lines
- affirmations: EXACTLY 5 identity-based lines
- planMeta.benefits: 4–5 points
- planMeta.whyThisWorks: psychological + practical
- dailyRoutine.guide: full daily workflow (time-based)
- dailyRoutine.implementation: point-wise execution steps
- brainprogram: emotional, subconscious tone
`;

    // ---------------- AI CALL ----------------
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

    if (!response.ok) {
      throw new Error("Gemini API failed");
    }

    const aiData = await response.json();
    const text =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty AI response");
    }

    // ---------------- SAFE JSON PARSE ----------------
    let plan;
    try {
      plan = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON PARSE ERROR:", text);
      throw new Error("Invalid AI JSON");
    }

    // ---------------- NORMALIZE OUTPUT ----------------
    const finalPlan = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),

      mainGoal: plan.mainGoal,
      planMeta: plan.planMeta,

      brainprogram: plan.brainprogram,
      burningDesires: plan.burningDesires,
      affirmations: plan.affirmations,

      dailyRoutine: plan.dailyRoutine
    };

    // ---------------- RESPONSE ----------------
    res.json({
      success: true,
      plan: finalPlan
    });

  } catch (err) {
    console.error("PLAN ERROR:", err.message);

    res.status(500).json({
      success: false,
      error: "Plan generation failed"
    });
  }
});

// ---------------- SERVER START ----------------
app.listen(PORT, () => {
  console.log(`🚀 SUBCONIC Backend running on port ${PORT}`);
});

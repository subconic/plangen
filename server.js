// server.js - Updated for tasks array
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

    "tasks": []
  }
}

IMPORTANT - tasks array structure for each task:
{
  "id": "generate unique timestamp id",
  "name": "Task name with time",
  "message": "Detailed instructions from AI on HOW to do this task",
  "time": "HH:MM format",
  "date": "daily",
  "completed": false,
  "category": "category name",
  "createdAt": "current ISO timestamp"
}

User Data:
Goal: ${u.goal}
Deadline: ${u.deadline}
Committed: ${u.isCommitted}
Knowledge: ${u.knowHow}
Weekly Goal: ${u.weeklyGoal}
Method: ${u.howToAchieve}
Language: ${u.language || 'en'}
Optional Details: ${u.optionalDetails || 'None'}

TASK GENERATION RULES:
1. Create 4-6 daily tasks based on user's goal
2. Tasks should be specific, actionable, and time-based
3. Each task must have detailed "message" explaining HOW to do it
4. Space tasks throughout the day (morning, afternoon, evening)
5. Include different categories: fitness, work, learning, review, etc.
6. All tasks repeat DAILY for 7 days
7. Make tasks personalized to user's goal: ${u.goal}

BRAINPROGRAM RULES:
- morning: emotional, inspiring, sets tone for day
- night: reflective, reinforces progress, prepares for next day

BURNING DESIRES RULES:
- exactly 7 powerful desire statements
- start with "I deeply desire..."
- related to user's goal

AFFIRMATIONS RULES:
- exactly 5 identity-based statements
- start with "I am..."
- present tense

PLANMETA RULES:
- benefits: 4–5 clear benefits user will experience
- whyThisWorks: 3-4 psychological + practical reasons

Generate tasks that directly help achieve: ${u.goal}
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
            maxOutputTokens: 3000
          }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Empty AI response");

    const parsed = JSON.parse(text);
    
    // Ensure tasks have proper IDs and timestamps
    const timestamp = Date.now();
    parsed.currentPlan.tasks = parsed.currentPlan.tasks.map((task, index) => ({
      ...task,
      id: `${timestamp}${index}`,
      date: "daily",
      completed: false,
      createdAt: new Date().toISOString()
    }));

    // Remove dailyRoutine since we're using tasks array
    delete parsed.currentPlan.dailyRoutine;

    res.json({
      success: true,
      plan: parsed
    });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({
      success: false,
      error: "Plan generation failed. Please try again."
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 SUBCONIC Backend running on port ${PORT}`)
);

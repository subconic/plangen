const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Gemini Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCzu8cHN3ckqPrd-oBsGag6ZdmeH4EDJRQ');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Optimized prompt template (250-300 words)
const PROMPT_TEMPLATE = (userDetails) => `
You are a subconscious behavior designer.

Create a 7-day desire-driven action framework that:
- Builds strong internal desire for the goal
- Aligns the subconscious mind so action feels natural, not forced
- Converts clarity + emotion into automatic execution

USER INPUT:
- Goal: ${userDetails.goal}
- Deadline: ${userDetails.deadline} (use only to create urgency, not planning)
- Daily Time: ${userDetails.dailyHours} hours
- Language Preference: ${userDetails.language} (Hindi / Hinglish / English)

LANGUAGE STYLE RULE:
- Hindi → Deep, emotional, simple Hindi (no heavy shuddh words)
- Hinglish → Conversational Hindi + English, natural inner self-talk
- English → Clear, grounded, calm (no hype or fake motivation)

OUTPUT:
Return ONLY valid JSON. No markdown, no explanations.

{
  "goalFit": "1–2 lines that clearly define what the user truly wants and why it emotionally matters",
  "brainProgram": {
    "morning": "20–40 words to align desire and identity before starting the day",
    "night": "20–40 words to reinforce belief and reduce resistance before sleep"
  },
  "affirmations": [
    "7 identity-based, believable affirmations that build self-belief and confidence"
  ],
  "burningDesires": [
    "7 emotionally honest desire statements that create immediate inner pull to act, using the deadline (${userDetails.deadline})"
  ],
  "actionFlow": [
    "5 HOW-based execution principles that guide action naturally (not daily schedule)"
  ]
}

CORE RULES:
1. No fake motivation, no hype, no pressure words
2. Language must feel like inner self-talk, not advice
3. BurningDesires = desire pull, not fear push
4. Affirmations must feel real and identity-shaping
5. All content in ${userDetails.language}
6. Output must be pure JSON only
`;



// Generate Plan API
app.post('/generate-plan', async (req, res) => {
  try {
    const userDetails = req.body;
    
    // Validate required fields
    if (!userDetails.goal || !userDetails.language) {
      return res.status(400).json({ error: "Goal and Language are required" });
    }

    console.log("🔵 Generating 7-day plan for:", userDetails.goal);

    const prompt = PROMPT_TEMPLATE(userDetails);
    
    // Call Gemini with timeout (90 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const result = await model.generateContent(prompt, { signal: controller.signal });
    clearTimeout(timeout);
    
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response not in JSON format");
    }
    
    let planData;
    try {
      planData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Clean the JSON string
      const cleanedText = jsonMatch[0]
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      planData = JSON.parse(cleanedText);
    }
    
    // Add metadata
    planData.id = Date.now();
    planData.generatedAt = new Date().toISOString();
    planData.userGoal = userDetails.goal;
    planData.planDuration = "7-day intensive plan";
    
    console.log("✅ 7-day plan generated successfully");
    res.json(planData);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.name === 'AbortError') {
      res.status(504).json({ error: "AI took too long to respond. Try again." });
    } else if (error.message.includes("JSON")) {
      res.status(500).json({ 
        error: "AI response format issue",
        fallback: generateFallbackPlan(req.body)
      });
    } else {
      res.status(500).json({ 
        error: "Internal server error",
        details: error.message 
      });
    }
  }
});

// Fallback plan if AI fails
function generateFallbackPlan(details) {
  return {
    planMeta: {
      planGoal: `Achieve "${details.goal}" in next 7 days`,
      benefits: [
        "Clear daily focus and direction",
        "Practical skill development",
        "Consistent progress tracking",
        "Increased confidence and momentum"
      ],
      actionSteps: [
        "Break goal into small daily actions",
        "Dedicate focused time each day",
        "Practice consistently without skipping",
        "Review progress every evening",
        "Adjust approach based on results"
      ]
    },
    brainprogram: {
      morning: "My mind is focused on today's actions.\nI have the energy and clarity to progress.\nToday brings me closer to my goal.",
      night: "I acknowledge today's efforts and learning.\nMy subconscious integrates today's progress.\nTomorrow I continue with renewed focus."
    },
    affirmation: [
      "I am committed to my 7-day transformation.",
      "Every day I become more capable.",
      "My actions create real progress.",
      "I overcome challenges with ease.",
      "I am disciplined and focused.",
      "I deserve to achieve this goal.",
      "My consistency brings results."
    ],
    burningDesires: [
      "I deeply desire to see real change in 7 days.",
      "I desire the feeling of accomplishment by week's end.",
      "I desire to prove my commitment to myself.",
      "I desire the confidence this achievement will bring.",
      "I desire to build momentum for bigger goals.",
      "I desire to transform my habits in this week.",
      "I desire to experience quick and tangible results."
    ],
    id: Date.now(),
    isFallback: true,
    planDuration: "7-day intensive plan"
  };
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: "✅ Server running",
    endpoint: "POST /generate-plan",
    timeout: "90 seconds",
    model: "gemini-2.5-flash-lite",
    planType: "7-day actionable plan"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoint: POST http://localhost:${PORT}/generate-plan`);
  console.log(`⏰ Plan Type: 7-day intensive action plan`);
});

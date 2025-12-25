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
You are a subconscious programming expert and behavioral architect.

Your task is to create a 7-day intensive mental + action framework that:
- Creates STRONG DESIRE for the goal
- Makes the goal feel emotionally inevitable
- Aligns the user's subconscious mind so action happens automatically, without force or fake motivation

USER CONTEXT:
- Goal: ${userDetails.goal}
- Deadline: ${userDetails.deadline} (use only to increase emotional urgency, not planning)
- Commitment Level: ${userDetails.commitment}
- Daily Available Time: ${userDetails.dailyHours} hours
- Additional Context: ${userDetails.additionalDetails || "None"}

IMPORTANT INTENT:
This is NOT a motivational speech.
This is subconscious conditioning.
The language must feel real, grounded, emotionally honest, and internally activating.

OUTPUT FORMAT:
Generate ONLY valid JSON. No markdown. No explanations.

{
  "planMeta": {
    "planGoal": "One emotionally clear sentence that defines WHAT the user truly wants and WHY it matters to them internally",
    "benefits": [
      "3–4 practical life-level benefits that the user will actually FEEL (confidence, freedom, control, relief, pride)"
    ],
    "actionSteps": [
      "5 HOW-based execution principles that guide action naturally (not daily schedule, not force-based)"
    ]
  },
  "brainprogram": {
    "morning": "25–50 words. A subconscious alignment routine that makes the goal feel desirable, reachable, and part of the user's identity",
    "night": "25–50 words. A reinforcement routine that settles belief, reduces resistance, and trains the mind to expect success"
  },
  "affirmation": [
    "7 first-person, identity-based affirmations that build self-belief, confidence, and a calm, positive mindset aligned with the goal"
  ],
  "burningDesires": [
    "7 emotionally charged, honest desire statements that make the user WANT to act immediately — not out of fear, but out of inner pull and urgency using the deadline (${userDetails.deadline})"
  ]
}

CRITICAL RULES:
1. BurningDesires must create emotional pull, not fake hype or aggressive motivation
2. Affirmations must feel believable, grounded, and identity-shaping
3. Language must speak directly to the subconscious (simple, emotional, present-focused)
4. No force, no pressure words like 'must', 'have to', or guilt-based language
5. All content must be written in ${userDetails.language}
6. Focus on creating desire + clarity that leads to automatic action
7. Total length between 500–1000 words
8. Output MUST be pure JSON only
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

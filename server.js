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
Generate a 7-day focused action plan in ${userDetails.language}.

User Details:
- Goal: ${userDetails.goal}
- Deadline: ${userDetails.deadline} (use for emotional intensity)
- Commitment: ${userDetails.commitment}
- Daily Time: ${userDetails.dailyHours} hours
- Additional: ${userDetails.additionalDetails || "None"}

Generate ONLY this structured JSON output:

{
  "planMeta": {
    "planGoal": "Clear one-line goal statement",
    "benefits": ["3-4 practical benefits"],
    "actionSteps": ["5 actionable steps on HOW to achieve"]
  },
  "brainprogram": {
    "morning": "25-50 word, morning routine to program mindset",
    "night": "25-50 word, night routine to reinforce learning"
  },
  "affirmation": ["7 identity-based affirmations in ${userDetails.language}"],
  "burningDesires": ["7 emotional desire lines using ${userDetails.deadline} for urgency"]
}

CRITICAL RULES:
1. actionSteps MUST be "how-to" instructions, NOT day-by-day schedule
2. Example for "web dev": "Practice coding daily", "Build small projects", etc.
3. Total output under 500-1000 words
4. All content in ${userDetails.language}
5. No markdown, only pure JSON
6. Focus on 7-day intensive plan regardless of mentioned deadline
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

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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyA9o1BeUJYKWgJu2JeWqrAs1_3sRsqhzi0');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Strict prompt template (≤150 words)
const PROMPT_TEMPLATE = (userDetails) => `
Generate a 30-day subconscious reprogramming plan in ${userDetails.language}.

User Details:
- Goal: ${userDetails.goal}
- Deadline: ${userDetails.deadline}
- Commitment: ${userDetails.commitment}
- Current Awareness: ${userDetails.awareness}
- Daily Time: ${userDetails.dailyHours} hours
- Additional: ${userDetails.additionalDetails || "None"}

Generate ONLY this structured JSON output:

{
  "planMeta": {
    "planGoal": "One line goal summary",
    "benefits": ["6 practical benefits"],
    "whyThisWorks": ["5 reasons why this works"]
  },
  "brainprogram": {
    "morning": "3-line morning program",
    "night": "3-line night program"
  },
  "affirmation": ["7 identity-based affirmations"],
  "burningDesires": ["7 emotional desire lines"]
}

Rules:
- Total output: 400-450 words max
- Benefits and whyThisWorks as arrays
- All content in ${userDetails.language}
- No markdown, only plain JSON
`;

// Generate Plan API
app.post('/generate-plan', async (req, res) => {
  try {
    const userDetails = req.body;
    
    // Validate required fields
    if (!userDetails.goal || !userDetails.deadline || !userDetails.language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🔵 Generating plan for:", userDetails.goal);

    const prompt = PROMPT_TEMPLATE(userDetails);
    
    // Call Gemini with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 90 seconds

    const result = await model.generateContent(prompt, { signal: controller.signal });
    clearTimeout(timeout);
    
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response not in JSON format");
    }
    
    const planData = JSON.parse(jsonMatch[0]);
    
    // Add timestamp and ID
    planData.id = Date.now();
    planData.generatedAt = new Date().toISOString();
    planData.userGoal = userDetails.goal;
    
    console.log("✅ Plan generated successfully");
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
      planGoal: `Achieve ${details.goal} within ${details.deadline}`,
      benefits: [
        "Daily progress tracking",
        "Clear action steps",
        "Subconscious alignment",
        "Improved consistency",
        "Better time management",
        "Increased motivation"
      ],
      whyThisWorks: [
        "Small daily actions compound",
        "Mindset shapes reality",
        "Consistency builds habits",
        "Clarity reduces overwhelm",
        "Emotional fuel drives action"
      ]
    },
    brainprogram: {
      morning: "Today, I take one step closer to my goal.\nMy mind is focused and ready.\nI have the energy to succeed.",
      night: "I review today's progress with gratitude.\nMy subconscious works on my goals.\nTomorrow brings new opportunities."
    },
    affirmation: [
      "I am capable of achieving my goals.",
      "Every day I make progress.",
      "I have the discipline needed.",
      "My actions align with my vision.",
      "I overcome challenges with ease.",
      "I am committed to my success.",
      "I deserve to achieve my dreams."
    ],
    burningDesires: [
      "I deeply desire to achieve my goal completely.",
      "I desire the feeling of success and accomplishment.",
      "I desire to prove to myself that I can do this.",
      "I desire the positive changes this will bring.",
      "I desire to inspire others with my journey.",
      "I desire to become the person who achieves this.",
      "I desire to experience the transformation fully."
    ],
    id: Date.now(),
    isFallback: true
  };
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: "Server running",
    endpoint: "POST /generate-plan",
    timeout: "90 seconds",
    model: "gemini-2.5-flash-lite"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoint: POST http://localhost:${PORT}/generate-plan`);
});

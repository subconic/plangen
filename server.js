// server.js - Backend Server (Updated with better prompting)
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'SUBCONIC Plan Generator API is running',
    version: '1.0.0'
  });
});

// Your secure endpoint for generating plans
app.post('/api/generate-plan', async (req, res) => {
  try {
    const userData = req.body; // Data sent from your React Native app

    // Construct the AI prompt using the user's data
    const prompt = `
# SUBCONIC TRANSFORMATION PLAN GENERATOR

## USER INFORMATION:
- **Primary Goal:** ${userData.goal}
- **Deadline:** ${userData.deadline}
- **Commitment Level:** ${userData.isCommitted}
- **Current Knowledge:** ${userData.knowHow || "Not sure yet"}
- **This Week's Goal:** ${userData.weeklyGoal || "Not specified"}
- **Approach/Method:** ${userData.howToAchieve || "Will figure out along the way"}
- **Daily Dedication:** ${userData.dailyHours} hours
- **Time Window:** ${userData.startTime} to ${userData.endTime}

## INSTRUCTIONS:
Create a powerful 7-day subconscious transformation plan specifically tailored for this user. The plan must be:

1. **ACTIONABLE** - Every item must be something the user can DO
2. **MENTAL PROGRAMMING** - Reprogram subconscious mind for success
3. **TIME-BASED** - Fit within their daily time window
4. **MOTIVATIONAL** - Keep them fired up for 7 days straight
5. **IDENTITY-SHIFTING** - Move from "wanting" to "being"

## FORMAT REQUIREMENTS:
Use EXACTLY this structure with these headings. Do not add any extra sections.

### 1. 🧠 SUBCONSCIOUS PROGRAM (Daily Rituals)
**Morning Ritual (5 minutes):**
[Write a powerful morning reading paragraph that programs the subconscious for success. Make it personal to their goal.]

**Night Ritual (5 minutes):**
[Write a reflective night reading paragraph that reinforces progress and prepares the subconscious for next day.]

### 2. 🔥 BURNING DESIRE (7 Motivational Quotes)
Create 7 short, powerful quotes that:
- Address their specific goal: ${userData.goal}
- Match their commitment: ${userData.isCommitted}
- Trigger IMMEDIATE action when read
- Are 1-2 lines maximum each

1. [Quote 1]
2. [Quote 2]
3. [Quote 3]
4. [Quote 4]
5. [Quote 5]
6. [Quote 6]
7. [Quote 7]

### 3. 💎 IDENTITY AFFIRMATIONS (5 Statements)
Create 5 identity-shifting affirmations that:
- Start with "I am..." or "I become..."
- Are present tense as if already true
- Focus on BEING the person who achieves ${userData.goal}
- Are 1 line maximum each

1. [Affirmation 1]
2. [Affirmation 2]
3. [Affirmation 3]
4. [Affirmation 4]
5. [Affirmation 5]

### 4. 📅 DAILY TASK ROUTINE (7-Day Schedule)
Create a time-blocked schedule for each day. Base it on ${userData.dailyHours} hours between ${userData.startTime} and ${userData.endTime}.

**Day 1 - Foundation Day:**
[Time-based tasks for Day 1]

**Day 2 - Momentum Day:**
[Time-based tasks for Day 2]

**Day 3 - Deep Work Day:**
[Time-based tasks for Day 3]

**Day 4 - Consistency Day:**
[Time-based tasks for Day 4]

**Day 5 - Breakthrough Day:**
[Time-based tasks for Day 5]

**Day 6 - Mastery Day:**
[Time-based tasks for Day 6]

**Day 7 - Integration Day:**
[Time-based tasks for Day 7]

### 5. 🎯 WHY THIS PLAN WORKS & BENEFITS
Explain in 4-5 points why this specific plan will work for THEIR goal (${userData.goal}) and what benefits they'll experience in 7 days:

1. **Subconscious Alignment:** [Explain how the morning/night rituals reprogram their mind]
2. **Identity Transformation:** [Explain how the affirmations change their self-image]
3. **Action Momentum:** [Explain how the daily tasks create unstoppable momentum]
4. **Mental Strength:** [Explain how this builds discipline and focus]
5. **7-Day Transformation:** [Specific results they can expect by Day 7]

---
END OF PLAN
Make every section personalized to their goal: ${userData.goal}
`;

    // Call the Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    const data = await geminiResponse.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      res.json({ 
        success: true, 
        plan: data.candidates[0].content.parts[0].text 
      });
    } else {
      console.error('Gemini API error:', data);
      res.status(500).json({ 
        success: false, 
        error: 'AI failed to generate plan. Please try again.'
      });
    }

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error. Please try again.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ SUBCONIC Backend server running on port ${PORT}`);
});

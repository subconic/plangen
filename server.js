// server.js - Backend Server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Your secure endpoint for generating plans
app.post('/api/generate-plan', async (req, res) => {
  try {
    const userData = req.body; // Data sent from your React Native app

    // Construct the AI prompt using the user's data
    const prompt = `
      Create a 7-day subconscious transformation plan based on:

      GOAL: ${userData.goal}
      DEADLINE: ${userData.deadline}
      COMMITMENT LEVEL: ${userData.isCommitted}

      USER'S KNOWLEDGE: ${userData.knowHow || "Not sure"}
      WEEKLY GOAL: ${userData.weeklyGoal || "Not specified"}
      HOW TO ACHIEVE: ${userData.howToAchieve || "Not specified"}

      DAILY CAPACITY: ${userData.dailyHours} hours
      TIME WINDOW: ${userData.startTime} to ${userData.endTime}

      Generate a structured plan with:

      1. SUBCONSCIOUS PROGRAM (Morning + Night Ritual)
      2. BURNING DESIRE (7 powerful quotes)
      3. IDENTITY AFFIRMATIONS (5 statements)
      4. DAILY TASK ROUTINE (7-day schedule)

      Format the response clearly with sections.
    `;

    // Call the Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
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
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate plan from AI.' 
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
  console.log(`✅ Backend server running on port ${PORT}`);
});

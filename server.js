require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Generate plan endpoint
app.post('/generate-plan', async (req, res) => {
    try {
        const userData = req.body;
        
        // Create structured prompt
        const prompt = createPrompt(userData);
        
        // Generate content using Gemini
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        // Parse the response into JSON structure
        const plan = parsePlanResponse(text);
        
        res.json({
            success: true,
            plan: plan,
            rawResponse: text
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Function to create structured prompt in English
function createPrompt(userData) {
    return `
Create a comprehensive 7-day success plan based on the following user data. Structure your response in this EXACT format:

===SUBCONSCIOUS PROGRAM (Morning & Night)===
[Create a powerful paragraph here that user will read morning and night to program their subconscious mind for success. Make it inspiring and belief-building.]

===BURNING DESIRE QUOTES (7)===
1. [Quote 1 - motivating and action-oriented]
2. [Quote 2 - specific to their goal]
3. [Quote 3 - mindset focused]
4. [Quote 4 - perseverance theme]
5. [Quote 5 - identity reinforcing]
6. [Quote 6 - urgency creating]
7. [Quote 7 - future vision]

===IDENTITY AFFIRMATIONS (5)===
1. [Affirmation 1 - identity statement]
2. [Affirmation 2 - capability statement]
3. [Affirmation 3 - transformation statement]
4. [Affirmation 4 - present tense achievement]
5. [Affirmation 5 - core identity shift]

===DAILY ROUTINE (Complete Day Structure)===
[Create a detailed daily routine that starts from morning wake-up to night sleep. Include specific times, activities, and mindset practices. Make it practical and tailored to their time commitment. Structure it in clear time blocks.]

===7-DAY ACTION PLAN===
Day 1: [Specific action for day 1]
Day 2: [Specific action for day 2]
Day 3: [Specific action for day 3]
Day 4: [Specific action for day 4]
Day 5: [Specific action for day 5]
Day 6: [Specific action for day 6]
Day 7: [Specific action for day 7]

Now, here is the user data to base the plan on:

GOAL: ${userData.goal}
DEADLINE: ${userData.deadline}
COMMITMENT LEVEL: ${userData.commitment}
ACTION PLAN: ${userData.actionPlan}
WEEKLY GOAL: ${userData.weeklyGoal}
DAILY HOURS: ${userData.dailyHours}
WORKING TIME: ${userData.workingTime}
ADDITIONAL INFO: ${userData.additionalInfo || 'None'}

Make the plan specific, actionable, and tailored exactly to this user's situation. Focus on creating a routine that they can follow for 7 days.`;
}

// Function to parse the response into structured object
function parsePlanResponse(text) {
    const sections = text.split('===');
    
    const plan = {
        subconsciousProgram: '',
        burningDesireQuotes: [],
        identityAffirmations: [],
        dailyRoutine: '',
        sevenDayPlan: []
    };
    
    sections.forEach(section => {
        if (section.includes('SUBCONSCIOUS PROGRAM')) {
            plan.subconsciousProgram = section.replace('SUBCONSCIOUS PROGRAM (Morning & Night)', '').trim();
        } else if (section.includes('BURNING DESIRE QUOTES')) {
            const quotesSection = section.replace('BURNING DESIRE QUOTES (7)', '');
            const quotes = quotesSection.split('\n').filter(line => line.match(/^\d\./));
            plan.burningDesireQuotes = quotes.map(q => q.replace(/^\d\.\s*/, '').trim());
        } else if (section.includes('IDENTITY AFFIRMATIONS')) {
            const affirmationsSection = section.replace('IDENTITY AFFIRMATIONS (5)', '');
            const affirmations = affirmationsSection.split('\n').filter(line => line.match(/^\d\./));
            plan.identityAffirmations = affirmations.map(a => a.replace(/^\d\.\s*/, '').trim());
        } else if (section.includes('DAILY ROUTINE')) {
            plan.dailyRoutine = section.replace('DAILY ROUTINE (Complete Day Structure)', '').trim();
        } else if (section.includes('7-DAY ACTION PLAN')) {
            const planSection = section.replace('7-DAY ACTION PLAN', '');
            const days = planSection.split('\n').filter(line => line.match(/^Day \d:/));
            plan.sevenDayPlan = days.map(day => day.trim());
        }
    });
    
    return plan;
}

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

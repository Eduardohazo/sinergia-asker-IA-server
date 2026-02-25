import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import Groq from "groq-sdk";

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000; // Use the port from .env or default to 3000

// Middleware
app.use(express.json());
// const allowedOrigins = ['http://127.0.0.1']; // On Development ***
const allowedOrigins = ['https://sinergiagdl.com']; // On Production ***

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],  // Add other methods if needed
  allowedHeaders: ['Content-Type', 'Authorization'], // Add headers if needed
};

// app.use(cors()); // On Development ***
app.use(cors(corsOptions)); // On production ***


// Environment variables
const GROQ_API_BASE_URL = process.env.GROQ_API_BASE_URL; // Set in .env
const GROQ_API_KEY = process.env.GROQ_API_KEY;           // Set in .env

const groq = new Groq({ apiKey: GROQ_API_KEY });

if (!GROQ_API_BASE_URL || !GROQ_API_KEY) {
  console.error("Error: GROQ_API_BASE_URL and GROQ_API_KEY must be set in the .env file.");
  process.exit(1);
}

// In-memory conversation storage
const conversations = {};

// Default context for the bot (Information about the person)
export const defaultContext = [
{
role: "system",
content: `
You are a SALES BOT STRESS TEST GENERATOR.

Your job is NOT to sell.
Your job is NOT to answer questions.
Your job is to generate realistic client questions that will test a sales assistant configured with:

- Structured sales phases (qualification → proposal → escalation)
- Strict pricing rules (cannot invent prices)
- Escalation tool called need_human
- Strategic qualification requirements
- No invented timelines
- Must rely strictly on knowledge base
- Must detect when to escalate
- Must sell outcomes (growth, efficiency), not technology

The company being tested:
Sinergia GDL — IA agents and digital solutions.

They offer:
- AI implementations (from 45,000 MXN + monthly packages)
- App development (15,000 MXN to 180,000 MXN+)
- CRM integrations
- Automation of sales and internal processes
- Scalable AI systems
- Security protocols
- Payment integrations
- Support and training

Your objective:

When the user writes exactly:
sales test

You must:

1. Analyze the business model and pricing structure.
2. Identify potential weak points in sales flow:
   - Missing information
   - Budget ambiguity
   - Timeline pressure
   - Integration complexity
   - Enterprise-level requirements
   - Customization edge cases
   - Escalation triggers
3. Generate 10 realistic, human-like, strategic test questions that:
   - Could challenge the sales bot
   - May require clarification
   - May push toward escalation
   - May test pricing integrity
   - May test integration limits
   - May test ROI claims
   - May test scalability
4. Write them in Spanish.
5. Number them 1–10.
6. Do NOT answer them.
7. No intro text.
8. No explanations.
9. No emojis.

Each execution must produce different question angles.

If the message is anything other than:
sales test

Respond exactly with:

This is for testing purposes only!

No additional words.
`
}
];

// Function to communicate with the GROQ API
async function getGroqChatCompletion(context) {
  return groq.chat.completions.create({
    messages: context,
    model: "llama-3.3-70b-versatile",
  });
}

app.post("/api/prompt", async (req, res) => {
  const { prompt, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required to track conversations." });
  }

  try {
    // Initialize or retrieve the user's conversation history
    if (!conversations[userId]) {
      conversations[userId] = [];
    }

    const userConversation = conversations[userId];
    userConversation.push({ role: "user", content: prompt });

    const context = [...defaultContext, ...userConversation];

    const chatCompletion = await getGroqChatCompletion(context);

    if (!chatCompletion) {
      return res.status(500).json({ error: "Failed to get a response from the GROQ API." });
    }

    const botResponse = chatCompletion.choices[0].message.content;
    userConversation.push({ role: "assistant", content: botResponse });

    res.json({ prompt, botResponse });
  } catch (error) {
    console.error("Error interacting with GROQ API:", error);
    res.status(500).json({ error: "An internal error occurred." });
  }
});

// WebSocket server for chat communication
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Web Sockets Conection
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");
  ws.on("message", async (message) => {
    const { userId, prompt } = JSON.parse(message);
    console.log(`Received message from user ${userId}: ${prompt}`);
    try {
      // const response = await fetch("http://localhost:" + PORT + "/api/prompt", {   // On development ***
        const response = await fetch("https://sinergia-asker-ia-server-1.onrender.com", {  // On Production ***
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userId }),
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      ws.send(JSON.stringify({ botResponse: data.botResponse }));
    } catch (error) {
      console.error(error);
      ws.send(JSON.stringify({ botResponse: `Error processing request` }));
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});      

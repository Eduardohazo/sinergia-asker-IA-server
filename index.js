import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import Groq from "groq-sdk";
import { personality } from "./context/personality.js";
import { stateInstructions } from "./context/stateInstructions.js";
import { knowledge } from "./context/knowledge.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// const allowedOrigins = ['http://127.0.0.1']; // On Development ***
const allowedOrigins = ["https://sinergiagdl.com"]; // On Production ***

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// app.use(cors()); // On Development ***
app.use(cors(corsOptions)); // On Production ***

// Environment variables
const GROQ_API_BASE_URL = process.env.GROQ_API_BASE_URL;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: GROQ_API_KEY });

if (!GROQ_API_BASE_URL || !GROQ_API_KEY) {
  console.error(
    "Error: GROQ_API_BASE_URL and GROQ_API_KEY must be set in the .env file.",
  );
  process.exit(1);
}

// In-memory conversation storage
const conversations = {};

// Default context assembled from modular files
// Order matters: personality → behavior rules → knowledge base
export const defaultContext = [
  personality,
  stateInstructions,
  knowledge,
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
    return res
      .status(400)
      .json({ error: "userId is required to track conversations." });
  }

  try {
    if (!conversations[userId]) {
      conversations[userId] = [];
    }

    const userConversation = conversations[userId];
    userConversation.push({ role: "user", content: prompt });

    const context = [...defaultContext, ...userConversation];

    const chatCompletion = await getGroqChatCompletion(context);

    if (!chatCompletion) {
      return res
        .status(500)
        .json({ error: "Failed to get a response from the GROQ API." });
    }

    const botResponse = chatCompletion.choices[0].message.content;
    userConversation.push({ role: "assistant", content: botResponse });

    res.json({ prompt, botResponse });
  } catch (error) {
    console.error("Error interacting with GROQ API:", error);
    res.status(500).json({ error: "An internal error occurred." });
  }
});

// WebSocket server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", async (message) => {
    const { userId, prompt } = JSON.parse(message);
    console.log(`Received message from user ${userId}: ${prompt}`);

    try {
      // const response = await fetch("http://localhost:" + PORT + "/api/prompt", { // On Development ***
      const response = await fetch(
        "https://sinergia-asker-ia-server-1.onrender.com/api/prompt", // On Production ***
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, userId }),
        },
      );

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
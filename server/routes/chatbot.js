import express from "express";
import jwt from "jsonwebtoken";
import { ApifyClient } from 'apify-client';
import Destination from "../models/destination.js";
import ChatHistory from "../models/ChatHistory.js";

const router = express.Router();

// Middleware to verify token (required for chatbot)
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Initialize Apify client
let apifyClient = null;
if (process.env.APIFY_API_TOKEN) {
  apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });
}

// Function to search Expedia using Apify
async function searchExpedia(location, checkIn, checkOut, maxItems = 5) {
  if (!apifyClient) {
    throw new Error('Apify API token not configured');
  }

  try {
    console.log(`Searching Expedia for: ${location}, ${checkIn} to ${checkOut}`);
    
    const input = {
      location: location,
      maxItems: maxItems,
    };

    // Add dates if provided
    if (checkIn) input.checkInDate = checkIn;
    if (checkOut) input.checkOutDate = checkOut;

    // Run the Expedia scraper actor
    const run = await apifyClient.actor('epctex/expedia-scraper').call(input);
    
    // Wait for the actor to finish and get results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    console.log(`Found ${items.length} items from Expedia`);
    return items;
  } catch (error) {
    console.error('Expedia search error:', error);
    throw new Error('Failed to search Expedia: ' + error.message);
  }
}

// Function to search our internal destinations
async function searchInternalDestinations(query) {
  try {
    const destinations = await Destination.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    return destinations;
  } catch (error) {
    console.error('Internal search error:', error);
    return [];
  }
}

// Function to call Gemini 2.5 Flash API
async function callGemini(prompt, conversationHistory = []) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  // Build the system instruction and context
  const systemContext = `You are a helpful travel assistant for "Voyage Évasion", a travel booking website. 

Your capabilities:
1. Answer questions about travel destinations, hotels, and trip planning
2. Search for hotels and travel information on Expedia when users ask about specific locations
3. Provide information about destinations available on our website
4. Help users plan their trips by asking clarifying questions when needed
5. Suggest destinations and travel plans based on user preferences

Important guidelines:
- **Be direct and concise.** Avoid unnecessary pleasantries or filler words. Get straight to the point.
- **Structure your answers.** Use bullet points, numbered lists, and bold text to make information easy to read.
- **Organize information logically.** Group related details together (e.g., "Hotels", "Activities", "Tips").
- **Creative Pivoting:** If the user asks about a non-travel topic (weather, mood, general chat), DO NOT refuse. Instead, find a creative link to travel. (e.g., "The weather is nice! Perfect for a trip to the Mediterranean.")
- When users ask about specific destinations or hotels, you can search Expedia for real-time data.
- Ask clarifying questions if you need more information (dates, budget, preferences, number of travelers, etc.)
- Be friendly, professional, and helpful
- Suggest relevant destinations from our website when appropriate
- Provide practical travel advice

Do not say "I can't help with that". Always find a way to connect the topic to travel. Be brief and direct.`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemContext }]
          },
          ...conversationHistory,
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Gemini API rate limit exceeded.");
        return "Je reçois actuellement un volume élevé de demandes. Veuillez réessayer dans quelques instants.";
      }
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Check for valid response structure
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      // Check if response was cut off due to token limit
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('Gemini response hit max tokens limit');
        // Return partial response if available
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text + "\n\n[Note: Réponse tronquée - veuillez poser des questions plus courtes]";
        } else {
          return "Désolé, ma réponse était trop longue. Pouvez-vous poser une question plus spécifique?";
        }
      }
      
      // Normal response
      if (candidate.content && 
          candidate.content.parts && 
          candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }
    
    // Check for API errors
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    console.error('Unexpected Gemini response:', JSON.stringify(data));
    throw new Error('No valid response from Gemini');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Main chatbot endpoint
router.post("/chat", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // console.log('Chatbot received message:', message);

    // Get or create user's chat history
    let chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, messages: [] });
    }

    // Build conversation history for Gemini from saved messages
    const conversationHistory = chatHistory.messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Detect if user is asking for Expedia search
    const expediaSearchPattern = /(?:search|find|look for|show me|hotels in|flights to|accommodations in)\s+(.+?)(?:\s+from\s+(.+?)\s+to\s+(.+?))?/i;
    const match = message.match(expediaSearchPattern);
    
    let expediaData = null;
    let internalDestinations = null;

    // Search our internal destinations
    const locationMatch = message.match(/(?:in|to|for)\s+([A-Za-z\s]+)/i);
    if (locationMatch) {
      const location = locationMatch[1].trim();
      internalDestinations = await searchInternalDestinations(location);
    }

    // If user is asking for specific hotel/flight search and we have Apify configured
    if (match && apifyClient) {
      const location = match[1];
      const checkIn = match[2] || null;
      const checkOut = match[3] || null;

      try {
        expediaData = await searchExpedia(location, checkIn, checkOut, 5);
      } catch (error) {
        console.error('Error fetching Expedia data:', error);
        // Continue without Expedia data
      }
    }

    // Build enhanced prompt with context
    let enhancedPrompt = message;
    
    if (internalDestinations && internalDestinations.length > 0) {
      enhancedPrompt += `\n\n[Internal destinations we offer: ${internalDestinations.map(d => `${d.name} (${d.category}): ${d.description?.substring(0, 100)}`).join('; ')}]`;
    }

    if (expediaData && expediaData.length > 0) {
      enhancedPrompt += `\n\n[Expedia search results: ${expediaData.map(item => 
        `${item.name || item.title}: ${item.price || 'Price not available'}, Rating: ${item.rating || 'N/A'}`
      ).join('; ')}]`;
    }

    // Call Gemini with the enhanced prompt
    const aiResponse = await callGemini(enhancedPrompt, conversationHistory);

    // Save user message and bot response to database
    chatHistory.messages.push({
      role: 'user',
      text: message,
      timestamp: new Date()
    });
    chatHistory.messages.push({
      role: 'model',
      text: aiResponse,
      timestamp: new Date()
    });
    
    // Keep only last 50 messages to avoid database bloat
    if (chatHistory.messages.length > 50) {
      chatHistory.messages = chatHistory.messages.slice(-50);
    }
    
    chatHistory.lastUpdated = new Date();
    await chatHistory.save();

    // Return response with any additional data
    res.json({
      response: aiResponse,
      expediaResults: expediaData,
      internalDestinations: internalDestinations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: 'ok',
    apifyConfigured: !!apifyClient,
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Get user's chat history
router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const chatHistory = await ChatHistory.findOne({ userId });
    
    if (!chatHistory) {
      return res.json({ messages: [] });
    }
    
    res.json({ messages: chatHistory.messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Clear user's chat history
router.delete("/history", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    await ChatHistory.findOneAndUpdate(
      { userId },
      { messages: [], lastUpdated: new Date() },
      { upsert: true }
    );
    
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export default router;

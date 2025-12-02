// server/server.js
// Load environment variables as early as possible so imported modules can use them
import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import favoriteRoutes from "./routes/favorites.js";
import destinationRoutes from "./routes/destinations.js";
import chatbotRoutes from "./routes/chatbot.js";
import tripPlanRoutes from "./routes/trip-plans.js";
const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/trip-plans", tripPlanRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

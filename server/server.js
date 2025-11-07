// server/server.js
// Load environment variables as early as possible so imported modules can use them
import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import favoriteRoutes from "./routes/favorites.js";
import destinationRoutes from "./routes/destinations.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:admin@cluster0.0run3vs.mongodb.net/?appName=Cluster0")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/destinations", destinationRoutes);

app.listen(3000, () => console.log("🚀 Server running on port 3000"));

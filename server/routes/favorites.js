import express from "express";
import jwt from "jsonwebtoken";
import Favorite from "../models/Favorite.js";

const router = express.Router();

// Middleware to verify token
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Add favorite
router.post("/:destinationId", auth, async (req, res) => {
  const { destinationId } = req.params;
  await Favorite.create({ userId: req.user.id, destinationId });
  res.json({ message: "Added to favorites" });
});

// Get all favorites for logged-in user
router.get("/", auth, async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user.id })
    .populate('destinationId', '_id name') // Only populate _id and name fields
    .lean(); // Convert to plain objects for better performance
  res.json(favorites);
});

// Remove favorite
router.delete("/:destinationId", auth, async (req, res) => {
  await Favorite.findOneAndDelete({ userId: req.user.id, destinationId: req.params.destinationId });
  res.json({ message: "Removed from favorites" });
});

export default router;

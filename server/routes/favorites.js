import express from "express";
import jwt from "jsonwebtoken";
import Favorite from "../models/Favorite.js";
import Destination from "../models/destination.js";

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
  // Validate destination exists
  const destExists = await Destination.findById(destinationId).select('_id');
  if (!destExists) return res.status(404).json({ error: 'Destination not found' });

  // Prevent duplicates
  const existing = await Favorite.findOne({ userId: req.user.id, destinationId });
  if (existing) {
    return res.status(200).json({ message: 'Already in favorites', favorite: existing });
  }

  const created = await Favorite.create({ userId: req.user.id, destinationId });
  res.status(201).json({ message: "Added to favorites", favorite: created });
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
  const removed = await Favorite.findOneAndDelete({ userId: req.user.id, destinationId: req.params.destinationId });
  if (!removed) return res.status(404).json({ message: 'Favorite not found' });
  res.json({ message: "Removed from favorites", favorite: removed });
});

export default router;

import express from "express";
import Destination from "../models/destination.js";  // Note: use lowercase 'destination.js' for consistency

const router = express.Router();

// ✅ Get all destinations
router.get("/", async (req, res) => {
  try {
    console.log("Fetching destinations...");
    const destinations = await Destination.find();
    console.log("Found destinations:", destinations);
    res.status(200).json(destinations);
  } catch (err) {
    console.error("Error fetching destinations:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get one destination by ID
router.get("/:id", async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) return res.status(404).json({ message: "Not found" });
    res.status(200).json(destination);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// ✅ Add a new destination
router.post("/", async (req, res) => {
  try {
    const newDestination = new Destination(req.body);
    const saved = await newDestination.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Invalid data", error: err.message });
  }
});

// ✅ Update a destination
router.put("/:id", async (req, res) => {
  try {
    const updated = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: "Update failed", error: err.message });
  }
});

// ✅ Delete a destination
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Destination.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});
export default router;

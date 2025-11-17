import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Destination from "../models/destination.js";
import { verifyAdmin } from "../middleware/adminAuth.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store in public/img folder
    cb(null, path.join(__dirname, '../../public/img'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  }
});

// Dedicated image upload endpoint (must be before /:id route)
router.post("/upload-image", verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const imagePath = '/img/' + req.file.filename;
    console.log('Image uploaded successfully:', imagePath);
    res.status(200).json({ imagePath, message: 'Image uploaded successfully' });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
});

// ✅ Get all destinations with optional category filter
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    console.log("Fetching destinations...", category ? `for category: ${category}` : 'all categories');
    const destinations = await Destination.find(query);
    console.log("Found destinations:", destinations.length);
    
    // Add cache control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.status(200).json(destinations);
  } catch (err) {
    console.error("Error fetching destinations:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Add a new destination (Admin only)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    console.log('Received POST request:', req.body);
    
    const newDestination = new Destination(req.body);
    const saved = await newDestination.save();
    console.log('Destination saved successfully:', saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating destination:', err.message);
    res.status(400).json({ message: "Invalid data", error: err.message });
  }
});

// ✅ Get one destination by ID (must be after specific routes like /upload-image)
router.get("/:id", async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) return res.status(404).json({ message: "Not found" });
    res.status(200).json(destination);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update a destination (Admin only)
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const updated = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating destination:', err);
    res.status(400).json({ message: "Update failed", error: err.message });
  }
});

// ✅ Delete a destination (Admin only)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const deleted = await Destination.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});
export default router;

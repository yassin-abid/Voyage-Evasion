import express from 'express';
import jwt from 'jsonwebtoken';
import TripPlan from '../models/TripPlan.js';

const router = express.Router();

// Middleware to verify token
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

// Save a new trip plan
router.post('/', auth, async (req, res) => {
  try {
    const { departure, destination, duration, startDate, budget, travelers, interests, generatedPlan } = req.body;
    const userId = req.user.userId || req.user.id;

    // Handle empty startDate to prevent CastError
    const validStartDate = startDate && startDate.trim() !== '' ? startDate : undefined;

    const newPlan = new TripPlan({
      userId,
      departure,
      destination,
      duration,
      startDate: validStartDate,
      budget,
      travelers,
      interests,
      generatedPlan
    });

    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    console.error('Error saving trip plan:', error);
    res.status(500).json({ error: 'Failed to save trip plan', details: error.message });
  }
});

// Get all trip plans for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const plans = await TripPlan.find({ userId }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching trip plans:', error);
    res.status(500).json({ error: 'Failed to fetch trip plans' });
  }
});

// Get a single trip plan by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const plan = await TripPlan.findOne({ _id: req.params.id, userId });
    
    if (!plan) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    console.error('Error fetching trip plan:', error);
    res.status(500).json({ error: 'Failed to fetch trip plan' });
  }
});

// Update a trip plan
router.put('/:id', auth, async (req, res) => {
  try {
    const { generatedPlan, budget, destination, startDate, duration, travelers, interests } = req.body;
    const userId = req.user.userId || req.user.id;

    // Handle empty startDate
    const validStartDate = startDate && startDate.trim() !== '' ? startDate : undefined;

    const updateData = {
      generatedPlan,
      budget,
      destination,
      duration,
      travelers,
      interests
    };

    if (validStartDate) {
      updateData.startDate = validStartDate;
    }

    const updatedPlan = await TripPlan.findOneAndUpdate(
      { _id: req.params.id, userId },
      updateData,
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating trip plan:', error);
    res.status(500).json({ error: 'Failed to update trip plan' });
  }
});

// Delete a trip plan
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const plan = await TripPlan.findOneAndDelete({ _id: req.params.id, userId });
    
    if (!plan) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }
    
    res.json({ message: 'Trip plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip plan:', error);
    res.status(500).json({ error: 'Failed to delete trip plan' });
  }
});

export default router;

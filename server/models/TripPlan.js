import mongoose from 'mongoose';

const tripPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departure: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  startDate: Date,
  budget: {
    type: Number,
    required: true
  },
  travelers: {
    type: Number,
    default: 1
  },
  interests: String,
  generatedPlan: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TripPlan = mongoose.model('TripPlan', tripPlanSchema);

export default TripPlan;

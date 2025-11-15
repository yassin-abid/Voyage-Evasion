// server/models/Destination.js
import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, min: 0, max: 5, default: 0 }
});

export default mongoose.model("Destination", destinationSchema);

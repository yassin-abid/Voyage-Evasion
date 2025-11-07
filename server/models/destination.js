// server/models/Destination.js
import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  category: String
});

export default mongoose.model("Destination", destinationSchema);

// server/models/Favorite.js
import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  destinationId: { type: mongoose.Schema.Types.ObjectId, ref: "Destination" }
});

export default mongoose.model("Favorite", favoriteSchema);

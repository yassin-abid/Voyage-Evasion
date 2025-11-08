// server/scripts/seedDestinations.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Destination from "../models/destination.js";

dotenv.config();

// Sample destinations data based on the frontend
const destinations = [
  {
    name: "Paris",
    description: "Découvrez la ville des lumières et ses merveilles.",
    image: "paris.jpeg",
    category: "Culture",
    __v: 0
  },
  {
    name: "Maldives",
    description: "Profitez des plages paradisiaques et des eaux cristallines.",
    image: "maldives.jpg",
    category: "Plage",
    __v: 0
  },
  {
    name: "Tokyo",
    description: "Plongez dans la culture unique et vibrante du Japon.",
    image: "tokyo.jpg",
    category: "Culture",

  },
  {
    name: "New York",
    description: "Découvrez la ville qui ne dort jamais avec ses immeubles emblématiques.",
    image: "newyork.jpg",
    category: "Culture",
    __v: 0
  },
  {
    name: "Sydney",
    description: "Explorez l'une des plus belles villes du monde et ses plages magnifiques.",
    image: "sydney.jpg",
    category: "Plage",
    __v: 0
  },
  {
    name: "Barcelone",
    description: "Venez découvrir les trésors architecturaux de la capitale catalane.",
    image: "barcelone.jpg",
    category: "Culture",
    __v: 0
  }
];

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:admin@cluster0.0run3vs.mongodb.net/?appName=Cluster0")
  .then(() => {
    console.log("✅ Connected to MongoDB");
    return Destination.deleteMany({}); // Clear existing destinations
  })
  .then(() => {
    return Destination.insertMany(destinations);
  })
  .then((docs) => {
    console.log(`✨ Successfully seeded ${docs.length} destinations`);
    mongoose.connection.close();
  })
  .catch((error) => {
    console.error("❌ Error seeding data:", error);
    mongoose.connection.close();
  });

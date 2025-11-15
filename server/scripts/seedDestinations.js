// server/scripts/seedDestinations.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Destination from "../models/destination.js";

dotenv.config();

// Sample destinations data based on the frontend
const destinations = [
  {
    name: "Paris",
    country: "France",
    description: "Découvrez la ville des lumières et ses merveilles.",
    image: "/img/paris.jpeg",
    category: "Culture",
    price: 1200,
    rating: 4.8
  },
  {
    name: "Maldives",
    country: "Maldives",
    description: "Profitez des plages paradisiaques et des eaux cristallines.",
    image: "/img/maldives.jpg",
    category: "Plage",
    price: 2500,
    rating: 4.9
  },
  {
    name: "Tokyo",
    country: "Japan",
    description: "Plongez dans la culture unique et vibrante du Japon.",
    image: "/img/tokyo.jpg",
    category: "Culture",
    price: 1800,
    rating: 4.7
  },
  {
    name: "New York",
    country: "USA",
    description: "Découvrez la ville qui ne dort jamais avec ses immeubles emblématiques.",
    image: "/img/newyork.jpg",
    category: "Aventure",
    price: 1500,
    rating: 4.6
  },
  {
    name: "Sydney",
    country: "Australia",
    description: "Explorez l'une des plus belles villes du monde et ses plages magnifiques.",
    image: "/img/sydney.jpg",
    category: "Plage",
    price: 2000,
    rating: 4.7
  },
  {
    name: "Barcelone",
    country: "Spain",
    description: "Venez découvrir les trésors architecturaux de la capitale catalane.",
    image: "/img/barcelone.jpg",
    category: "Histoire",
    price: 1100,
    rating: 4.5
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

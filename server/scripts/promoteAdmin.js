// Script to promote a user to admin
import mongoose from 'mongoose';
import User from '../models/User.js';
import 'dotenv/config';

const promoteUserToAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/voyage-evasion');
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    if (user.isAdmin) {
      console.log(`ℹ️  User "${user.username}" (${email}) is already an admin`);
      process.exit(0);
    }

    // Update user to admin
    user.isAdmin = true;
    await user.save();

    console.log(`✅ Successfully promoted "${user.username}" (${email}) to admin!`);
    console.log(`User details:`);
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Admin: ${user.isAdmin}`);
    console.log(`  - Confirmed: ${user.isConfirmed}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error promoting user:', err);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node promoteAdmin.js <email>');
  console.log('Example: node promoteAdmin.js user@example.com');
  process.exit(1);
}

promoteUserToAdmin(email);

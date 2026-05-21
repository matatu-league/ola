// File: models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // --- AUTHENTICATION IDENTIFIERS ---
    // Sparse allows multiple users to NOT have this field without triggering unique constraint errors
    tiktokId: { 
      type: String, 
      unique: true,
      sparse: true,
      index: true 
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    
    // Tracks which methods the user has linked
    authProviders: [{
      type: String,
      enum: ['tiktok', 'google', 'email']
    }],

    // --- TIKTOK SPECIFIC DATA (Optional) ---
    unionId: { type: String },
    profileWebLink: { type: String },
    profileDeepLink: { type: String },

    // --- CORE PROFILE DATA (Shared across providers) ---
    displayName: { 
      type: String, 
      required: true 
    },
    avatarUrl: { 
      type: String 
    },
    bioDescription: { 
      type: String 
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },

    // --- PLATFORM CONTACT DATA ---
    email: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    phone: { 
      type: String 
    },

    // --- PLATFORM MANAGEMENT ---
    role: { 
      type: String, 
      enum: ['buyer', 'seller', 'admin'],
      default: 'seller' 
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active'
    },
    
    // --- USER PREFERENCES ---
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      currency: { type: String, default: 'UGX' }
    }
  },
  { timestamps: true }
);

// Prevent mongoose from recompiling the model upon hot reloads in Next.js
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
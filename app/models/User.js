import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // --- AUTHENTICATION IDENTIFIERS ---
    // Made sparse so users can sign up via Google WITHOUT a TikTok account
    tiktokId: { 
      type: String, 
      unique: true,
      sparse: true,
      index: true 
    },
    // NEW: Allowance for Firebase / Google Login
    firebaseUid: {
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
    
    // Tracks which methods the user has linked (e.g., ['tiktok'], ['google'], or ['tiktok', 'google'])
    authProviders: [{
      type: String,
      enum: ['tiktok', 'google', 'firebase', 'email']
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
      sparse: true // Allows multiple users to have NO email, but enforces uniqueness if provided
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
    
    // --- OPTIONAL: USER PREFERENCES ---
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      currency: { type: String, default: 'UGX' }
    }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Prevent mongoose from recompiling the model upon hot reloads in Next.js
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
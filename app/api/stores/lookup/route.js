import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Store from '@/models/Store'; // Adjust to your actual model path
import { ProductGrid } from '@/models/Marketplace'; // Adjust path to where ProductGrid is exported

// Replace with your actual DB connection logic if different
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain parameter is required' }, 
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Query the database for the exact domain (e.g., 'gogo.ola.ug')
    // .lean() converts the Mongoose document to a plain Javascript object
    const store = await Store.findOne({ domain: domain }).lean();

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' }, 
        { status: 404 }
      );
    }

    // 2. Fetch all products where the product owner matches the store owner
    const products = await ProductGrid.find({ owner: store.owner }).lean();

    // 3. Overwrite the store's internal products array with the real fetched products
    store.products = products;

    return NextResponse.json({ success: true, data: store });

  } catch (error) {
    console.error("Store Lookup API Error:", error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
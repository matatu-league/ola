import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShippingMethod, PickupStation } from '@/lib/models';

/**
 * GET /api/shipping
 * Fetches shipping methods and pickup stations
 * Pass ?all=true to fetch inactive ones as well (for admin dashboards)
 */
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';

    // Only filter by active:true if we are NOT requesting all of them
    const query = fetchAll ? {} : { active: true };

    // Run both queries concurrently for faster response times
    const [methods, stations] = await Promise.all([
      ShippingMethod.find(query).sort({ price: 1 }).lean(),
      PickupStation.find(query).sort({ name: 1 }).lean()
    ]);

    // If the database is completely empty (e.g., brand new setup),
    // provide some sensible defaults so the checkout UI doesn't break.
    const fallbackMethods = [
      { code: 'standard', title: 'Standard Delivery', price: 5000, description: 'Delivery in 2-3 business days', iconName: 'Truck' },
      { code: 'express', title: 'Express Delivery', price: 15000, description: 'Same day delivery (Order before 2 PM)', iconName: 'Clock' },
      { code: 'pickup', title: 'Pickup Station', price: 2000, description: 'Collect from a nearby station', iconName: 'Store' }
    ];
    
    const fallbackStations = [
      { code: 'kla-hub', name: 'Kampala Central Hub', address: 'Plot 12, Kampala Road, Kampala', city: 'Kampala' },
      { code: 'hoima-main', name: 'Hoima City Hub', address: 'Main Street, Opposite Central Market', city: 'Hoima' }
    ];

    const finalMethods = methods.length > 0 ? methods : fallbackMethods;
    const finalStations = stations.length > 0 ? stations : fallbackStations;

    return NextResponse.json({
      success: true,
      data: {
        shippingMethods: finalMethods,
        pickupStations: finalStations
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching shipping data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shipping data', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping
 * Creates a new shipping method or pickup station
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { type, ...data } = body;

    // Type acts as a discriminator to know which collection to save to
    if (type === 'method') {
      const newMethod = await ShippingMethod.create(data);
      return NextResponse.json({ success: true, data: newMethod, message: 'Shipping method created' }, { status: 201 });
    } else if (type === 'station') {
      const newStation = await PickupStation.create(data);
      return NextResponse.json({ success: true, data: newStation, message: 'Pickup station created' }, { status: 201 });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid type specified. Use "method" or "station".' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating shipping data:', error);
    return NextResponse.json({ success: false, message: 'Failed to create shipping data', error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/shipping
 * Updates an existing shipping method or pickup station (e.g., changing prices, toggling active status)
 */
export async function PATCH(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { type, id, ...updateData } = body;

    if (!id || !type) {
      return NextResponse.json({ success: false, message: 'Missing type or id' }, { status: 400 });
    }

    let updatedDoc;
    if (type === 'method') {
      updatedDoc = await ShippingMethod.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    } else if (type === 'station') {
      updatedDoc = await PickupStation.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid type specified' }, { status: 400 });
    }

    if (!updatedDoc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedDoc, message: 'Updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating shipping data:', error);
    return NextResponse.json({ success: false, message: 'Failed to update shipping data', error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/shipping
 * Deletes a shipping method or pickup station from the database
 */
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id || !type) {
      return NextResponse.json({ success: false, message: 'Missing type or id parameters' }, { status: 400 });
    }

    let deletedDoc;
    if (type === 'method') {
      deletedDoc = await ShippingMethod.findByIdAndDelete(id);
    } else if (type === 'station') {
      deletedDoc = await PickupStation.findByIdAndDelete(id);
    } else {
      return NextResponse.json({ success: false, message: 'Invalid type specified. Use "method" or "station".' }, { status: 400 });
    }

    if (!deletedDoc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting shipping data:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete shipping data', error: error.message }, { status: 500 });
  }
}
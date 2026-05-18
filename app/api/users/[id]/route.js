import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(request, context) {
  try {
    await connectToDatabase();
    
    // Safely resolve params for Next.js 13, 14, and 15 compatibility
    const params = await context.params;
    const id = params.id;
    
    const body = await request.json();

    // Enforce strict security: only allow specific fields to be updated
    const allowedUpdates = ['role', 'status'];
    const updates = {};
    
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    });

    console.log(`[PATCH API] Updating User ${id} with:`, updates);

    if (Object.keys(updates).length === 0) {
       return NextResponse.json({ success: false, error: 'No valid fields provided to update' }, { status: 400 });
    }

    // runValidators ensures the new value matches Mongoose enum restrictions
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      console.log(`[PATCH API] Failed: User ${id} not found.`);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    console.log(`[PATCH API] Success: User ${id} updated.`);
    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('[PATCH API] Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    await connectToDatabase();
    
    // Safely resolve params for Next.js 13, 14, and 15
    const params = await context.params;
    const id = params.id;

    console.log(`[DELETE API] Attempting to delete User ${id}`);

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE API] Error deleting user:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
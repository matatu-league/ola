/**
 * ============================================================================
 * scripts/seed-service-fields.mjs
 * ----------------------------------------------------------------------------
 * Seed the per-industry booking/intake field definitions into the
 * `ServiceCategoryFields` collection (keyed by serviceType). These drive the
 * dynamic inputs a service store fills in (hotel check-in/out + amenities,
 * salon service menu + slots, clinic appointment slots, event tickets, venue
 * rentals, and a generic fallback).
 *
 * Idempotent upsert — safe to re-run. Mirrors scripts/seed-filters.mjs.
 *
 * Usage:
 *   MATATU_DB_URI="mongodb+srv://..." node scripts/seed-service-fields.mjs
 *   # or, with the URI in .env.local / .env:
 *   npm run seed:services
 * ============================================================================
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

if (!process.env.MATATU_DB_URI) {
  console.error('❌ MATATU_DB_URI is not set. Add it to .env.local or pass it inline.');
  process.exit(1);
}

const { connectToDatabase } = await import('../app/lib/mongodb.js');
const { ServiceCategoryFields } = await import('../app/models/Marketplace.js');

// ── Curated field sets ───────────────────────────────────────────────────────
// type: 'text' | 'number' | 'time' | 'date' | 'select' | 'multiselect' | 'amenities'
const SERVICE_FIELD_SETS = [
  {
    serviceType: 'hotel',
    label: 'Hotels & Accommodation',
    fields: [
      { key: 'roomTypes',    label: 'Room Types',     type: 'multiselect', group: 'rooms',   required: true,
        options: ['Single', 'Double', 'Twin', 'Suite', 'Family', 'Deluxe', 'Executive'] },
      { key: 'nightlyRate',  label: 'Nightly Rate',   type: 'number',      group: 'rooms',   required: true, unit: 'UGX' },
      { key: 'maxGuests',    label: 'Max Guests',     type: 'number',      group: 'rooms' },
      { key: 'checkInTime',  label: 'Check-in Time',  type: 'time',        group: 'stay',    required: true, default: '14:00' },
      { key: 'checkOutTime', label: 'Check-out Time', type: 'time',        group: 'stay',    required: true, default: '11:00' },
      { key: 'amenities',    label: 'Amenities',      type: 'amenities',   group: 'amenities',
        options: ['Free WiFi', 'Parking', 'Swimming Pool', 'Air Conditioning', 'Breakfast', 'Restaurant',
                  'Gym', 'Spa', 'Airport Shuttle', 'Room Service', 'Pet Friendly', 'Laundry', 'Bar', '24/7 Reception'] },
    ],
  },
  {
    serviceType: 'salon',
    label: 'Salon & Spa',
    fields: [
      { key: 'serviceMenu',  label: 'Service Menu',     type: 'multiselect', group: 'services', required: true,
        options: ['Haircut', 'Hair Coloring', 'Braiding', 'Manicure', 'Pedicure', 'Facial', 'Massage', 'Makeup', 'Waxing', 'Spa Treatment'] },
      { key: 'durationMins', label: 'Duration (mins)',  type: 'number',      group: 'services', required: true },
      { key: 'stylist',      label: 'Stylist / Specialist', type: 'text',    group: 'services' },
      { key: 'slotInterval', label: 'Booking Slot Interval', type: 'select', group: 'booking', default: '30',
        options: ['15', '30', '45', '60'] },
      { key: 'amenities',    label: 'Amenities',        type: 'amenities',   group: 'amenities',
        options: ['Free WiFi', 'Refreshments', 'Parking', 'Card Payment', 'Kids Area', 'Air Conditioning'] },
    ],
  },
  {
    serviceType: 'medical',
    label: 'Clinics & Doctor Appointments',
    fields: [
      { key: 'practitioner',     label: 'Practitioner Name', type: 'text',        group: 'provider', required: true },
      { key: 'specialties',      label: 'Specialties',       type: 'multiselect', group: 'provider', required: true,
        options: ['General Practice', 'Dental', 'Pediatrics', 'Dermatology', 'Cardiology', 'Gynecology', 'Optical', 'Orthopedics', 'ENT', 'Psychiatry'] },
      { key: 'consultationFee',  label: 'Consultation Fee',  type: 'number',      group: 'provider', unit: 'UGX' },
      { key: 'appointmentMins',  label: 'Appointment Length (mins)', type: 'number', group: 'booking', default: 30 },
      { key: 'teleconsult',      label: 'Tele-consultation',  type: 'select',     group: 'booking', default: 'no',
        options: ['yes', 'no'] },
      { key: 'reasonRequired',   label: 'Require Reason for Visit', type: 'select', group: 'booking', default: 'yes',
        options: ['yes', 'no'] },
    ],
  },
  {
    serviceType: 'tickets',
    label: 'Event Tickets',
    fields: [
      { key: 'eventDate',         label: 'Event Date',      type: 'date',        group: 'event', required: true },
      { key: 'eventTime',         label: 'Event Time',      type: 'time',        group: 'event', required: true },
      { key: 'venue',             label: 'Venue',           type: 'text',        group: 'event', required: true },
      { key: 'ticketTiers',       label: 'Ticket Tiers',    type: 'multiselect', group: 'tickets', required: true,
        options: ['Early Bird', 'Regular', 'VIP', 'VVIP', 'Group', 'Table'] },
      { key: 'quantityPerOrder',  label: 'Max Tickets / Order', type: 'number',  group: 'tickets', default: 10 },
    ],
  },
  {
    serviceType: 'venue',
    label: 'Venue & Event Rentals',
    fields: [
      { key: 'capacity',      label: 'Capacity (people)', type: 'number',    group: 'space', required: true },
      { key: 'hourlyRate',    label: 'Hourly Rate',       type: 'number',    group: 'space', required: true, unit: 'UGX' },
      { key: 'availableDates', label: 'Available Dates',  type: 'date',      group: 'booking' },
      { key: 'amenities',     label: 'Amenities',         type: 'amenities', group: 'amenities',
        options: ['Stage', 'Sound System', 'Parking', 'Catering', 'Projector', 'Air Conditioning', 'Decor', 'Security', 'Generator', 'Restrooms'] },
    ],
  },
  {
    serviceType: 'generic',
    label: 'General Services',
    fields: [
      { key: 'pricingType', label: 'Pricing Type', type: 'select', group: 'pricing', required: true, default: 'fixed',
        options: ['fixed', 'hourly', 'starting_at', 'contact'] },
      { key: 'rate',        label: 'Rate / Price', type: 'number', group: 'pricing', unit: 'UGX' },
      { key: 'duration',    label: 'Typical Duration', type: 'text', group: 'details' },
      { key: 'serviceArea', label: 'Service Area / Location', type: 'text', group: 'details' },
    ],
  },
];

async function main() {
  console.log('🚀 Seeding service category booking fields…');
  await connectToDatabase();

  let upserted = 0;
  for (const set of SERVICE_FIELD_SETS) {
    await ServiceCategoryFields.updateOne(
      { serviceType: set.serviceType },
      { $set: { serviceType: set.serviceType, label: set.label, fields: set.fields } },
      { upsert: true },
    );
    upserted += 1;
  }

  console.log(`✅ Done. Upserted ${upserted} service field sets.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Service field seed failed:', err);
  process.exit(1);
});

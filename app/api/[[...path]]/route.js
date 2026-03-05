import { MongoClient } from 'mongodb';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'turfhub';
const JWT_SECRET = process.env.JWT_SECRET || 'turfhub_secret_key_2025';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);
  cachedDb = db;
  return db;
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Mock turf data
const mockTurfs = [
  {
    id: 'turf-001',
    name: 'PlayGround Arena',
    city: 'Mumbai',
    location: 'Andheri West',
    pricePerHour: 1500,
    images: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
      'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800'
    ],
    amenities: ['Floodlights', 'Parking', 'Changing Room', 'Washroom'],
    rating: 4.5,
    surface: 'Artificial Grass'
  },
  {
    id: 'turf-002',
    name: 'Champions Turf',
    city: 'Mumbai',
    location: 'Bandra East',
    pricePerHour: 2000,
    images: [
      'https://images.unsplash.com/photo-1577223625816-7546f8977065?w=800',
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
      'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800'
    ],
    amenities: ['Floodlights', 'Parking', 'Changing Room', 'Cafeteria', 'First Aid'],
    rating: 4.8,
    surface: 'Natural Grass'
  },
  {
    id: 'turf-003',
    name: 'Sports Hub',
    city: 'Delhi',
    location: 'Dwarka',
    pricePerHour: 1200,
    images: [
      'https://images.unsplash.com/photo-1487466365202-1afdb86c764e?w=800',
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'
    ],
    amenities: ['Floodlights', 'Parking', 'Washroom'],
    rating: 4.3,
    surface: 'Artificial Grass'
  },
  {
    id: 'turf-004',
    name: 'Victory Ground',
    city: 'Bangalore',
    location: 'Koramangala',
    pricePerHour: 1800,
    images: [
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
      'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800',
      'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800'
    ],
    amenities: ['Floodlights', 'Parking', 'Changing Room', 'Washroom', 'Cafeteria'],
    rating: 4.6,
    surface: 'Hybrid Grass'
  },
  {
    id: 'turf-005',
    name: 'Elite Sports Arena',
    city: 'Bangalore',
    location: 'Whitefield',
    pricePerHour: 2200,
    images: [
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
      'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800'
    ],
    amenities: ['Floodlights', 'Parking', 'Changing Room', 'Washroom', 'Cafeteria', 'Pro Shop'],
    rating: 4.9,
    surface: 'Premium Artificial Grass'
  },
  {
    id: 'turf-006',
    name: 'Goal Kick Arena',
    city: 'Delhi',
    location: 'Rohini',
    pricePerHour: 1000,
    images: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
      'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800'
    ],
    amenities: ['Floodlights', 'Parking', 'Washroom'],
    rating: 4.1,
    surface: 'Artificial Grass'
  }
];

// Generate time slots
function generateSlots(date, currentTime = null) {
  const slots = [];
  const startHour = 6; // 6 AM
  const endHour = 23; // 11 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    const slotTime = `${hour.toString().padStart(2, '0')}:00`;
    const endSlotTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    // If it's today, filter out past slots
    if (currentTime) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, 0, 0, 0);
      
      if (slotDate <= currentTime) {
        continue;
      }
    }
    
    slots.push({
      id: `slot-${date}-${hour}`,
      time: slotTime,
      endTime: endSlotTime,
      available: true
    });
  }
  
  return slots;
}

// Helper to verify JWT token
function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Helper to verify vendor JWT token
function verifyVendorToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'vendor') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url);

  try {
    // GET /api/ - Test endpoint
    if (pathname === '/api/' || pathname === '/api') {
      return NextResponse.json({ message: 'TurfHub API is running!' });
    }

    // GET /api/turfs - Get all turfs with optional city filter
    if (pathname === '/api/turfs') {
      const city = searchParams.get('city');
      
      // Fetch approved turfs from database
      const db = await connectToDatabase();
      let dbTurfs = await db.collection('turfs')
        .find({ status: 'approved' })
        .toArray();
      
      // Convert database turfs to customer format
      const formattedDbTurfs = dbTurfs.map(turf => ({
        id: turf.turfId,
        name: turf.name,
        city: turf.city,
        location: turf.location,
        area: turf.area || turf.location,
        pricePerHour: turf.pricing?.basePrice || 0,
        images: turf.images || [],
        amenities: turf.amenities || [],
        rating: turf.rating || 4.5,
        surface: turf.surface || 'Artificial Grass',
        description: turf.description || '',
        capacity: turf.capacity || 0
      }));
      
      // Merge with mock turfs for backward compatibility
      let allTurfs = [...formattedDbTurfs, ...mockTurfs];
      
      // Filter by city if specified
      if (city && city !== 'All') {
        allTurfs = allTurfs.filter(turf => turf.city === city);
      }
      
      return NextResponse.json({ turfs: allTurfs });
    }

    // GET /api/turfs/:id - Get turf details
    if (pathname.startsWith('/api/turfs/') && !pathname.includes('slots')) {
      const turfId = pathname.split('/').pop();
      
      // Try to find in database first
      const db = await connectToDatabase();
      const dbTurf = await db.collection('turfs').findOne({ 
        $or: [
          { turfId: turfId },
          { turfId: turfId }
        ],
        status: 'approved'
      });
      
      if (dbTurf) {
        // Format database turf for customer view
        const formattedTurf = {
          id: dbTurf.turfId,
          name: dbTurf.name,
          city: dbTurf.city,
          location: dbTurf.location,
          area: dbTurf.area || dbTurf.location,
          pricePerHour: dbTurf.pricing?.basePrice || 0,
          images: dbTurf.images || [],
          amenities: dbTurf.amenities || [],
          rating: dbTurf.rating || 4.5,
          surface: dbTurf.surface || 'Artificial Grass',
          description: dbTurf.description || '',
          capacity: dbTurf.capacity || 0
        };
        return NextResponse.json({ turf: formattedTurf });
      }
      
      // Fallback to mock turfs
      const turf = mockTurfs.find(t => t.id === turfId);
      
      if (!turf) {
        return NextResponse.json({ error: 'Turf not found' }, { status: 404 });
      }
      
      return NextResponse.json({ turf });
    }

    // GET /api/slots/:turfId - Get available slots for a turf
    if (pathname.startsWith('/api/slots/')) {
      const turfId = pathname.split('/').pop();
      const date = searchParams.get('date');
      
      // Try to find in database first
      const db = await connectToDatabase();
      let turf = await db.collection('turfs').findOne({ 
        turfId: turfId,
        status: 'approved'
      });
      
      // Fallback to mock turfs
      if (!turf) {
        turf = mockTurfs.find(t => t.id === turfId);
      }
      
      if (!turf) {
        return NextResponse.json({ error: 'Turf not found' }, { status: 404 });
      }
      
      const currentDate = new Date();
      const requestedDate = date ? new Date(date + 'T00:00:00') : new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00');
      
      // Compare dates (ignoring time)
      const currentDateOnly = new Date(currentDate.toISOString().split('T')[0] + 'T00:00:00');
      const isToday = requestedDate.getTime() === currentDateOnly.getTime();
      
      const slots = generateSlots(
        requestedDate.toISOString().split('T')[0],
        isToday ? currentDate : null
      );
      
      // Get booked slots from database - use turfId for both mock and DB turfs
      const bookings = await db.collection('bookings')
        .find({
          turfId: turf.turfId || turf.id,
          date: requestedDate.toISOString().split('T')[0],
          status: { $in: ['confirmed', 'pending'] }
        })
        .toArray();
      
      const bookedSlotIds = bookings.map(b => b.slotId);
      
      // Mark booked slots as unavailable
      slots.forEach(slot => {
        if (bookedSlotIds.includes(slot.id)) {
          slot.available = false;
        }
      });
      
      return NextResponse.json({ slots, date: requestedDate.toISOString().split('T')[0] });
    }

    // GET /api/cities - Get list of cities
    if (pathname === '/api/cities') {
      // Get cities from database turfs
      const db = await connectToDatabase();
      const dbTurfs = await db.collection('turfs')
        .find({ status: 'approved' })
        .toArray();
      
      const dbCities = [...new Set(dbTurfs.map(t => t.city))];
      const mockCities = [...new Set(mockTurfs.map(t => t.city))];
      const allCities = ['All', ...new Set([...dbCities, ...mockCities])];
      
      return NextResponse.json({ cities: allCities });
    }

    // GET /api/bookings - Get user bookings
    if (pathname === '/api/bookings') {
      const user = verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const db = await connectToDatabase();
      const bookings = await db.collection('bookings')
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray();
      
      // Enrich bookings with turf details from database first, then mock
      const enrichedBookings = await Promise.all(bookings.map(async booking => {
        // Try database first
        let dbTurf = await db.collection('turfs').findOne({ 
          turfId: booking.turfId 
        });
        
        if (dbTurf) {
          return {
            ...booking,
            turfDetails: {
              name: dbTurf.name,
              location: dbTurf.location,
              city: dbTurf.city
            }
          };
        }
        
        // Fallback to mock turfs
        const mockTurf = mockTurfs.find(t => t.id === booking.turfId);
        return {
          ...booking,
          turfDetails: mockTurf ? {
            name: mockTurf.name,
            location: mockTurf.location,
            city: mockTurf.city
          } : null
        };
      }));
      
      return NextResponse.json({ bookings: enrichedBookings });
    }

    // GET /api/admin/vendors - Get all vendors (admin only)
    if (pathname === '/api/admin/vendors') {
      // Simple admin check (in production, use proper JWT)
      const db = await connectToDatabase();
      const vendors = await db.collection('vendors')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ vendors });
    }

    // GET /api/admin/turfs - Get all turfs (admin only)
    if (pathname === '/api/admin/turfs') {
      const db = await connectToDatabase();
      const turfs = await db.collection('turfs')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ turfs });
    }

    // GET /api/vendor/profile - Get vendor profile
    if (pathname === '/api/vendor/profile') {
      const vendor = verifyVendorToken(request);
      if (!vendor) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const db = await connectToDatabase();
      const vendorData = await db.collection('vendors').findOne({ vendorId: vendor.vendorId });
      
      if (!vendorData) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        vendor: {
          vendorId: vendorData.vendorId,
          businessName: vendorData.businessName,
          ownerName: vendorData.ownerName,
          mobile: vendorData.mobile,
          email: vendorData.email,
          gst: vendorData.gst,
          pan: vendorData.pan,
          status: vendorData.status,
          bankDetails: vendorData.bankDetails || {}
        }
      });
    }

    // GET /api/vendor/turfs - Get vendor's turfs
    if (pathname === '/api/vendor/turfs') {
      const vendor = verifyVendorToken(request);
      if (!vendor) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const db = await connectToDatabase();
      const turfs = await db.collection('turfs')
        .find({ vendorId: vendor.vendorId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ turfs });
    }

    // GET /api/vendor/turfs/:id - Get single turf details
    if (pathname.startsWith('/api/vendor/turfs/') && pathname.split('/').length === 5) {
      const vendor = verifyVendorToken(request);
      if (!vendor) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const turfId = pathname.split('/').pop();
      const db = await connectToDatabase();
      const turf = await db.collection('turfs').findOne({ turfId, vendorId: vendor.vendorId });
      
      if (!turf) {
        return NextResponse.json({ error: 'Turf not found' }, { status: 404 });
      }
      
      return NextResponse.json({ turf });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url);

  try {
    // POST /api/auth/send-otp - Send OTP (dummy implementation)
    if (pathname === '/api/auth/send-otp') {
      const body = await request.json();
      const { mobile } = body;
      
      if (!mobile || mobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
      }
      
      // Dummy OTP - always use 123456
      // In production, integrate with SMS gateway
      
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully',
        // For demo purposes, returning OTP
        otp: '123456'
      });
    }

    // POST /api/auth/verify-otp - Verify OTP and login
    if (pathname === '/api/auth/verify-otp') {
      const body = await request.json();
      const { mobile, otp } = body;
      
      // Dummy verification - accept any 10-digit mobile with OTP 123456
      if (!mobile || mobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
      }
      
      if (otp !== '123456') {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }
      
      // Create or get user
      const db = await connectToDatabase();
      let user = await db.collection('users').findOne({ mobile });
      
      if (!user) {
        const userId = uuidv4();
        user = {
          userId,
          mobile,
          name: '',
          email: '',
          dob: '',
          createdAt: new Date()
        };
        await db.collection('users').insertOne(user);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.userId, mobile: user.mobile },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return NextResponse.json({ 
        success: true,
        token,
        user: {
          userId: user.userId,
          mobile: user.mobile,
          name: user.name || '',
          email: user.email || '',
          dob: user.dob || ''
        }
      });
    }

    // POST /api/vendor/register - Vendor registration
    if (pathname === '/api/vendor/register') {
      const body = await request.json();
      const { businessName, ownerName, mobile, email, gst, pan } = body;
      
      if (!businessName || !ownerName || !mobile || !email) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const db = await connectToDatabase();
      const existingVendor = await db.collection('vendors').findOne({ mobile });
      
      if (existingVendor) {
        return NextResponse.json({ error: 'Vendor already registered with this mobile' }, { status: 400 });
      }
      
      const vendorId = uuidv4();
      const vendor = {
        vendorId,
        businessName,
        ownerName,
        mobile,
        email,
        gst: gst || '',
        pan: pan || '',
        status: 'pending', // pending, approved, rejected
        bankDetails: {},
        createdAt: new Date()
      };
      
      await db.collection('vendors').insertOne(vendor);
      
      return NextResponse.json({ 
        success: true,
        message: 'Registration successful! Please login with your mobile number.',
        vendorId
      });
    }

    // POST /api/vendor/send-otp - Send OTP for vendor login
    if (pathname === '/api/vendor/send-otp') {
      const body = await request.json();
      const { mobile } = body;
      
      if (!mobile || mobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
      }
      
      // Check if vendor exists
      const db = await connectToDatabase();
      const vendor = await db.collection('vendors').findOne({ mobile });
      
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not registered. Please register first.' }, { status: 404 });
      }
      
      // Dummy OTP - same as user OTP
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully',
        otp: '123456'
      });
    }

    // POST /api/vendor/verify-otp - Verify OTP and vendor login
    if (pathname === '/api/vendor/verify-otp') {
      const body = await request.json();
      const { mobile, otp } = body;
      
      if (!mobile || mobile.length !== 10) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
      }
      
      if (otp !== '123456') {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }
      
      const db = await connectToDatabase();
      const vendor = await db.collection('vendors').findOne({ mobile });
      
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
      
      // Generate JWT token with vendor role
      const token = jwt.sign(
        { vendorId: vendor.vendorId, mobile: vendor.mobile, role: 'vendor' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      return NextResponse.json({ 
        success: true,
        token,
        vendor: {
          vendorId: vendor.vendorId,
          businessName: vendor.businessName,
          ownerName: vendor.ownerName,
          mobile: vendor.mobile,
          email: vendor.email,
          status: vendor.status
        }
      });
    }

    // POST /api/vendor/turfs - Add new turf
    if (pathname === '/api/vendor/turfs') {
      const vendor = verifyVendorToken(request);
      if (!vendor) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const body = await request.json();
      const { 
        name, description, location, city, area, pincode, 
        sportTypes, turfType, surface, size, capacity,
        amenities, pricing, operatingHours, images,
        policies, googleMapsLink
      } = body;
      
      if (!name || !location || !city || !pricing) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const db = await connectToDatabase();
      const turfId = uuidv4();
      
      const turf = {
        turfId,
        vendorId: vendor.vendorId,
        name,
        description: description || '',
        location,
        city,
        area: area || '',
        pincode: pincode || '',
        sportTypes: sportTypes || [],
        turfType: turfType || 'outdoor',
        surface: surface || 'Artificial Grass',
        size: size || '',
        capacity: capacity || 0,
        amenities: amenities || [],
        pricing: pricing, // { basePrice, weekdayMorning, weekdayEvening, etc. }
        operatingHours: operatingHours || { opening: '06:00', closing: '23:00' },
        images: images || [],
        policies: policies || {},
        googleMapsLink: googleMapsLink || '',
        rating: 0,
        totalBookings: 0,
        status: 'pending', // pending, approved, rejected
        createdAt: new Date()
      };
      
      await db.collection('turfs').insertOne(turf);
      
      return NextResponse.json({ 
        success: true,
        message: 'Turf added successfully! It will be visible after admin approval.',
        turfId,
        turf
      });
    }

    // POST /api/admin/vendors/approve - Approve/Reject vendor
    if (pathname === '/api/admin/vendors/approve') {
      const body = await request.json();
      const { vendorId, action } = body;
      
      if (!vendorId || !action) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      const db = await connectToDatabase();
      await db.collection('vendors').updateOne(
        { vendorId },
        { $set: { status, updatedAt: new Date() } }
      );
      
      return NextResponse.json({ success: true, message: `Vendor ${status}` });
    }

    // POST /api/admin/turfs/approve - Approve/Reject turf
    if (pathname === '/api/admin/turfs/approve') {
      const body = await request.json();
      const { turfId, action } = body;
      
      if (!turfId || !action) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      const db = await connectToDatabase();
      await db.collection('turfs').updateOne(
        { turfId },
        { $set: { status, updatedAt: new Date() } }
      );
      
      return NextResponse.json({ success: true, message: `Turf ${status}` });
    }

    // POST /api/payment/create-order - Create Razorpay order
    if (pathname === '/api/payment/create-order') {
      const user = verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const body = await request.json();
      const { turfId, slots, amount } = body;
      
      if (!turfId || !slots || !Array.isArray(slots) || slots.length === 0 || !amount) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      // Create Razorpay order
      const options = {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          turfId,
          userId: user.userId,
          slotsCount: slots.length
        }
      };
      
      const order = await razorpay.orders.create(options);
      
      // Store bookings as pending for all slots
      const db = await connectToDatabase();
      const bookingIds = [];
      
      for (const slotInfo of slots) {
        const bookingId = uuidv4();
        bookingIds.push(bookingId);
        
        await db.collection('bookings').insertOne({
          bookingId,
          userId: user.userId,
          turfId,
          slotId: slotInfo.slotId,
          date: slotInfo.date,
          amount: amount / slots.length, // Divide amount evenly
          orderId: order.id,
          status: 'pending',
          createdAt: new Date()
        });
      }
      
      return NextResponse.json({ 
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingIds
      });
    }

    // POST /api/payment/verify - Verify payment
    if (pathname === '/api/payment/verify') {
      const user = verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const body = await request.json();
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingIds } = body;
      
      // Verify signature
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');
      
      if (razorpay_signature !== expectedSign) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
      
      // Update all booking statuses
      const db = await connectToDatabase();
      
      if (Array.isArray(bookingIds)) {
        // Multiple bookings
        await db.collection('bookings').updateMany(
          { bookingId: { $in: bookingIds }, userId: user.userId },
          { 
            $set: { 
              status: 'confirmed',
              paymentId: razorpay_payment_id,
              confirmedAt: new Date()
            } 
          }
        );
      } else {
        // Single booking (backward compatibility)
        await db.collection('bookings').updateOne(
          { bookingId: bookingIds, userId: user.userId },
          { 
            $set: { 
              status: 'confirmed',
              paymentId: razorpay_payment_id,
              confirmedAt: new Date()
            } 
          }
        );
      }
      
      const bookings = await db.collection('bookings')
        .find({ 
          bookingId: Array.isArray(bookingIds) ? { $in: bookingIds } : bookingIds 
        })
        .toArray();
      
      return NextResponse.json({ 
        success: true,
        bookings
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const { pathname } = new URL(request.url);

  try {
    // PUT /api/profile - Update user profile
    if (pathname === '/api/profile') {
      const user = verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const body = await request.json();
      const { name, email, dob } = body;
      
      const db = await connectToDatabase();
      await db.collection('users').updateOne(
        { userId: user.userId },
        { 
          $set: { 
            name: name || '',
            email: email || '',
            dob: dob || '',
            updatedAt: new Date()
          } 
        }
      );
      
      const updatedUser = await db.collection('users').findOne({ userId: user.userId });
      
      return NextResponse.json({ 
        success: true,
        user: {
          userId: updatedUser.userId,
          mobile: updatedUser.mobile,
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          dob: updatedUser.dob || ''
        }
      });
    }

    // PUT /api/vendor/profile - Update vendor profile
    if (pathname === '/api/vendor/profile') {
      const vendor = verifyVendorToken(request);
      if (!vendor) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const body = await request.json();
      const { businessName, ownerName, email, gst, pan, bankDetails } = body;
      
      const db = await connectToDatabase();
      const updateData = {};
      if (businessName) updateData.businessName = businessName;
      if (ownerName) updateData.ownerName = ownerName;
      if (email) updateData.email = email;
      if (gst) updateData.gst = gst;
      if (pan) updateData.pan = pan;
      if (bankDetails) updateData.bankDetails = bankDetails;
      updateData.updatedAt = new Date();
      
      await db.collection('vendors').updateOne(
        { vendorId: vendor.vendorId },
        { $set: updateData }
      );
      
      const updatedVendor = await db.collection('vendors').findOne({ vendorId: vendor.vendorId });
      
      return NextResponse.json({ 
        success: true,
        vendor: {
          vendorId: updatedVendor.vendorId,
          businessName: updatedVendor.businessName,
          ownerName: updatedVendor.ownerName,
          mobile: updatedVendor.mobile,
          email: updatedVendor.email,
          gst: updatedVendor.gst,
          pan: updatedVendor.pan,
          status: updatedVendor.status
        }
      });
    }

    // PUT /api/vendor/turfs/:id - Update turf
    if (pathname.startsWith('/api/vendor/turfs/')) {
      const vendor = verifyVendorToken(request);
      if (!vendor) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const turfId = pathname.split('/').pop();
      const body = await request.json();
      
      const db = await connectToDatabase();
      const turf = await db.collection('turfs').findOne({ turfId, vendorId: vendor.vendorId });
      
      if (!turf) {
        return NextResponse.json({ error: 'Turf not found' }, { status: 404 });
      }
      
      const updateData = { ...body, updatedAt: new Date() };
      delete updateData.vendorId; // Prevent changing vendor
      delete updateData.turfId; // Prevent changing ID
      delete updateData.status; // Prevent changing status directly
      
      await db.collection('turfs').updateOne(
        { turfId, vendorId: vendor.vendorId },
        { $set: updateData }
      );
      
      const updatedTurf = await db.collection('turfs').findOne({ turfId });
      
      return NextResponse.json({ 
        success: true,
        message: 'Turf updated successfully',
        turf: updatedTurf
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 });
}
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
      let turfs = mockTurfs;
      
      if (city && city !== 'All') {
        turfs = mockTurfs.filter(turf => turf.city === city);
      }
      
      return NextResponse.json({ turfs });
    }

    // GET /api/turfs/:id - Get turf details
    if (pathname.startsWith('/api/turfs/')) {
      const turfId = pathname.split('/').pop();
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
      
      const turf = mockTurfs.find(t => t.id === turfId);
      if (!turf) {
        return NextResponse.json({ error: 'Turf not found' }, { status: 404 });
      }
      
      const currentDate = new Date();
      const requestedDate = date ? new Date(date) : currentDate;
      
      // Check if it's today
      const isToday = requestedDate.toDateString() === currentDate.toDateString();
      
      const slots = generateSlots(
        requestedDate.toISOString().split('T')[0],
        isToday ? currentDate : null
      );
      
      // Get booked slots from database
      const db = await connectToDatabase();
      const bookings = await db.collection('bookings')
        .find({
          turfId,
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
      const cities = ['All', ...new Set(mockTurfs.map(t => t.city))];
      return NextResponse.json({ cities });
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
      
      // Enrich bookings with turf details
      const enrichedBookings = bookings.map(booking => {
        const turf = mockTurfs.find(t => t.id === booking.turfId);
        return {
          ...booking,
          turfDetails: turf ? {
            name: turf.name,
            location: turf.location,
            city: turf.city
          } : null
        };
      });
      
      return NextResponse.json({ bookings: enrichedBookings });
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

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 });
}
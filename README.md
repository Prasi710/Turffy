# TurfHub - Turf Booking Platform

A modern, full-stack turf booking platform built with Next.js 14, MongoDB, and Razorpay payment integration.

## 🎯 Features

- 🏟️ **Browse Turfs** - View available turfs with images, ratings, and amenities
- 📍 **City Filtering** - Filter turfs by city with auto-detection of user location
- 🔐 **Mobile Authentication** - Secure login with mobile number and OTP
- ⏰ **Smart Slot Booking** - Book time slots with real-time availability
- 📅 **Multi-day Booking** - View and book slots for the next 5 days
- ⚡ **Time-based Filtering** - Only shows available future slots
- 💳 **Razorpay Integration** - Secure payment processing
- 📱 **Responsive Design** - Beautiful UI that works on all devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance running
- Razorpay account (test or live credentials)
- yarn package manager

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Configure environment variables:
Create a `.env` file in the root directory:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=turfhub
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CORS_ORIGINS=*

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

3. Run the development server:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📱 Demo Credentials

For testing the application:
- **Mobile Number:** Any 10-digit number (e.g., 9999999999)
- **OTP:** 123456

## 🏗️ Project Structure

```
/app
├── app/
│   ├── api/[[...path]]/route.js  # All API routes (REST API)
│   ├── page.js                    # Main application UI
│   ├── layout.js                  # Root layout with Razorpay script
│   └── globals.css                # Global styles
├── components/
│   └── ui/                        # shadcn/ui components
└── lib/
    └── utils.js                   # Utility functions
```

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/turfs` - Get all turfs (with optional city filter)
- `GET /api/turfs/:id` - Get turf details
- `GET /api/cities` - Get list of cities
- `GET /api/slots/:turfId?date=YYYY-MM-DD` - Get available slots
- `POST /api/auth/send-otp` - Send OTP to mobile
- `POST /api/auth/verify-otp` - Verify OTP and login

### Protected Endpoints (Require JWT)
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `GET /api/bookings` - Get user bookings

## 💾 Database Collections

### users
```javascript
{
  userId: String (UUID),
  mobile: String,
  createdAt: Date
}
```

### bookings
```javascript
{
  bookingId: String (UUID),
  userId: String,
  turfId: String,
  slotId: String,
  date: String (YYYY-MM-DD),
  amount: Number,
  orderId: String (Razorpay),
  paymentId: String (Razorpay),
  status: String (pending/confirmed),
  createdAt: Date,
  confirmedAt: Date
}
```

## 🎨 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** MongoDB
- **Payment:** Razorpay
- **Authentication:** JWT
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Notifications:** Sonner (Toast)

## 🔐 Authentication Flow

1. User enters mobile number
2. System sends OTP (currently using dummy OTP: 123456)
3. User enters OTP
4. Backend verifies OTP and creates/retrieves user
5. JWT token is generated and sent to client
6. Token is stored in localStorage
7. Token is used for authenticated requests

## 💳 Payment Flow

1. User selects a turf and time slot
2. System checks if user is logged in (redirects to login if not)
3. Backend creates a Razorpay order
4. Razorpay checkout modal opens
5. User completes payment
6. Payment response is verified on backend
7. Booking is confirmed and stored in database

## ⏰ Slot Management

- Slots run from 6:00 AM to 11:00 PM (1-hour intervals)
- For current day: Only future slots are shown
- For next 5 days: All slots are shown
- Booked slots are marked as unavailable
- Each slot shows the price per hour

## 🌆 Cities & Turfs

The application currently supports turfs in:
- Mumbai (2 turfs)
- Delhi (2 turfs)
- Bangalore (2 turfs)

Each turf includes:
- Multiple images
- Location details
- Pricing (₹1000-₹2200/hour)
- Amenities (Floodlights, Parking, Changing Room, etc.)
- Rating
- Surface type

## 🔧 Customization

### Adding New Turfs
Edit the `mockTurfs` array in `/app/app/api/[[...path]]/route.js`:

```javascript
{
  id: 'turf-xxx',
  name: 'Your Turf Name',
  city: 'City Name',
  location: 'Area Name',
  pricePerHour: 1500,
  images: ['url1', 'url2', 'url3'],
  amenities: ['Amenity1', 'Amenity2'],
  rating: 4.5,
  surface: 'Artificial Grass'
}
```

### Changing Slot Times
Modify `startHour` and `endHour` in the `generateSlots` function in `/app/app/api/[[...path]]/route.js`.

## 🐛 Troubleshooting

### Razorpay not loading
- Ensure Razorpay script is loaded in `layout.js`
- Check browser console for errors
- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set

### Payment verification fails
- Check Razorpay key and secret are correct
- Verify signature generation matches Razorpay's algorithm
- Check network logs for API errors

### Slots not showing
- Verify MongoDB is running
- Check if turfs are loading correctly
- Ensure date format is correct (YYYY-MM-DD)

## 📝 License

MIT

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Built with ❤️ using Emergent AI Agent

# Vendor Portal - Backend APIs Complete! ✅

## 🎯 What's Built

Complete vendor portal backend with authentication, turf management, and profile APIs.

---

## 📋 Vendor Information Collected

### 1. **Business Information**
- Business Name
- Owner Name
- Mobile Number (login credential)
- Email Address
- GST Number
- PAN Number
- Bank Details (for payouts)

### 2. **Turf Details**
- **Basic**: Name, Description
- **Location**: Full address, City, Area, PIN Code, Google Maps link
- **Physical**: Sport types, Turf type (indoor/outdoor), Surface, Size, Capacity
- **Facilities**: Amenities array (Floodlights, Parking, etc.)
- **Pricing**: Base price, time-based pricing (weekday/weekend)
- **Operations**: Opening/closing hours, operating days
- **Media**: Images array
- **Policies**: Cancellation, refund rules

---

## 🔌 Backend APIs Created

### **Vendor Authentication**

#### 1. POST /api/vendor/register
Register new vendor
```json
Body: {
  "businessName": "Elite Sports Complex",
  "ownerName": "Rajesh Kumar",
  "mobile": "8888888888",
  "email": "rajesh@elitesports.com",
  "gst": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F"
}

Response: {
  "success": true,
  "message": "Registration successful! Please login with your mobile number.",
  "vendorId": "uuid"
}
```

#### 2. POST /api/vendor/send-otp
Send OTP for vendor login
```json
Body: {
  "mobile": "8888888888"
}

Response: {
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

#### 3. POST /api/vendor/verify-otp
Verify OTP and login
```json
Body: {
  "mobile": "8888888888",
  "otp": "123456"
}

Response: {
  "success": true,
  "token": "JWT_TOKEN",
  "vendor": {
    "vendorId": "uuid",
    "businessName": "Elite Sports Complex",
    "ownerName": "Rajesh Kumar",
    "mobile": "8888888888",
    "email": "rajesh@elitesports.com",
    "status": "pending"
  }
}
```

### **Vendor Profile Management**

#### 4. GET /api/vendor/profile
Get vendor profile (requires auth)
```
Headers: Authorization: Bearer <JWT_TOKEN>

Response: {
  "vendor": {
    "vendorId": "uuid",
    "businessName": "Elite Sports Complex",
    "ownerName": "Rajesh Kumar",
    "mobile": "8888888888",
    "email": "rajesh@elitesports.com",
    "gst": "29ABCDE1234F1Z5",
    "pan": "ABCDE1234F",
    "status": "pending",
    "bankDetails": {}
  }
}
```

#### 5. PUT /api/vendor/profile
Update vendor profile (requires auth)
```json
Headers: Authorization: Bearer <JWT_TOKEN>

Body: {
  "businessName": "Updated Name",
  "email": "newemail@example.com",
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifsc": "SBIN0001234",
    "accountHolder": "Rajesh Kumar"
  }
}

Response: {
  "success": true,
  "vendor": { ... }
}
```

### **Turf Management**

#### 6. POST /api/vendor/turfs
Add new turf (requires auth)
```json
Headers: Authorization: Bearer <JWT_TOKEN>

Body: {
  "name": "Elite Football Arena",
  "description": "Premium football turf with floodlights",
  "location": "123 MG Road",
  "city": "Mumbai",
  "area": "Andheri",
  "pincode": "400058",
  "sportTypes": ["Football", "Cricket"],
  "turfType": "outdoor",
  "surface": "Artificial Grass",
  "size": "50x30 meters",
  "capacity": 22,
  "amenities": ["Floodlights", "Parking", "Changing Room", "Washroom"],
  "pricing": {
    "basePrice": 2000,
    "weekdayMorning": 1500,
    "weekdayEvening": 2500,
    "weekendMorning": 2000,
    "weekendEvening": 3000
  },
  "operatingHours": {
    "opening": "06:00",
    "closing": "23:00"
  },
  "images": [
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg"
  ],
  "policies": {
    "cancellation": "24 hours before",
    "refund": "Full refund if cancelled 24 hours before"
  },
  "googleMapsLink": "https://maps.google.com/..."
}

Response: {
  "success": true,
  "message": "Turf added successfully! It will be visible after admin approval.",
  "turfId": "uuid",
  "turf": { ... }
}
```

#### 7. GET /api/vendor/turfs
Get all turfs for vendor (requires auth)
```
Headers: Authorization: Bearer <JWT_TOKEN>

Response: {
  "turfs": [
    {
      "turfId": "uuid",
      "vendorId": "uuid",
      "name": "Elite Football Arena",
      "status": "pending",
      ...
    }
  ]
}
```

#### 8. GET /api/vendor/turfs/:id
Get single turf details (requires auth)
```
Headers: Authorization: Bearer <JWT_TOKEN>

Response: {
  "turf": {
    "turfId": "uuid",
    "vendorId": "uuid",
    "name": "Elite Football Arena",
    ...
  }
}
```

#### 9. PUT /api/vendor/turfs/:id
Update turf (requires auth)
```json
Headers: Authorization: Bearer <JWT_TOKEN>

Body: {
  "name": "Updated Turf Name",
  "pricing": {
    "basePrice": 2500
  }
}

Response: {
  "success": true,
  "message": "Turf updated successfully",
  "turf": { ... }
}
```

---

## 💾 Database Schema

### **vendors** Collection
```javascript
{
  vendorId: String (UUID),
  businessName: String,
  ownerName: String,
  mobile: String,
  email: String,
  gst: String,
  pan: String,
  status: String, // "pending", "approved", "rejected"
  bankDetails: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### **turfs** Collection
```javascript
{
  turfId: String (UUID),
  vendorId: String, // Links to vendor
  name: String,
  description: String,
  location: String,
  city: String,
  area: String,
  pincode: String,
  sportTypes: Array,
  turfType: String, // "indoor" or "outdoor"
  surface: String,
  size: String,
  capacity: Number,
  amenities: Array,
  pricing: Object,
  operatingHours: Object,
  images: Array,
  policies: Object,
  googleMapsLink: String,
  rating: Number,
  totalBookings: Number,
  status: String, // "pending", "approved", "rejected"
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication

**JWT Token Structure:**
```javascript
{
  vendorId: "uuid",
  mobile: "8888888888",
  role: "vendor", // Important: Differentiates from regular users
  exp: timestamp
}
```

**Token Usage:**
- Include in header: `Authorization: Bearer <JWT_TOKEN>`
- Token valid for 30 days
- Separate from user tokens (has `role: "vendor"`)

---

## ✅ Backend Testing Complete

All APIs tested and working:
- ✅ Vendor registration
- ✅ Vendor OTP login
- ✅ JWT authentication with role validation
- ✅ Profile management (view/update)
- ✅ Turf CRUD operations
- ✅ Authorization checks (vendors can only access their own turfs)
- ✅ Database persistence (MongoDB)
- ✅ Status field defaults ("pending")

---

## 📊 Status Flow

### Vendor Status
1. **Pending**: After registration, awaiting admin approval
2. **Approved**: Can add turfs and manage account
3. **Rejected**: Cannot login or add turfs

### Turf Status
1. **Pending**: After creation, awaiting admin approval
2. **Approved**: Visible on platform to customers
3. **Rejected**: Not visible, vendor can edit and resubmit

---

## 🎯 Next Steps

To complete the vendor portal, we need to build:

### Frontend Components (Not Built Yet)
1. **Vendor Login/Register Page** (`/vendor`)
2. **Vendor Dashboard** (`/vendor/dashboard`)
3. **Add Turf Form** (`/vendor/add-turf`) - Multi-step form
4. **My Turfs Page** (`/vendor/turfs`) - List and manage turfs
5. **Edit Turf Page** (`/vendor/turfs/:id/edit`)
6. **Profile Settings** (`/vendor/profile`)

### Admin Panel (Not Built Yet)
1. **Admin Login**
2. **Vendor Approval System**
3. **Turf Approval System**
4. **View all vendors and turfs**

### Integration Needed
- Update main GET /api/turfs to fetch from database (currently using mockTurfs)
- Filter turfs by status="approved" for customers

---

## 🚀 How to Use (Demo)

**Test Vendor Registration:**
```bash
curl -X POST http://localhost:3000/api/vendor/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Sports Arena",
    "ownerName": "Test Owner",
    "mobile": "9876543210",
    "email": "test@arena.com",
    "gst": "29TEST1234F1Z5",
    "pan": "TEST1234F"
  }'
```

**Test Vendor Login:**
```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/vendor/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'

# 2. Verify OTP (use 123456)
curl -X POST http://localhost:3000/api/vendor/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "123456"}'
```

---

## 📝 Code Location

**File:** `/app/app/api/[[...path]]/route.js`

**New Functions Added:**
- `verifyVendorToken()` - JWT verification with role check
- Vendor auth endpoints (register, login)
- Vendor profile endpoints (get, update)
- Turf management endpoints (CRUD)

**Pushed to GitHub:** ✅  
**Repository:** https://github.com/Prasi710/Turffy

---

## 🎨 Frontend UI to Build Next

Would you like me to build the vendor frontend next? It will include:
1. Beautiful vendor dashboard
2. Multi-step turf addition form with all fields
3. Turf management interface
4. Profile management

**Or should I build the admin panel first?**

Let me know what you'd like to prioritize! 🚀

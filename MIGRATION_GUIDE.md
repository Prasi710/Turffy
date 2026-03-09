# Frontend Migration Guide: Next.js to Rails API Integration

## Overview
This guide documents the migration from the monolithic Next.js backend to the standalone Rails API backend.

---

## ✅ Completed Changes

### 1. **Backend Code Removed**
- ❌ Deleted `/app/api/[[...path]]/route.js` (1,151 lines)
- ❌ Removed backend dependencies: `mongodb`, `jsonwebtoken`, `razorpay`, `formidable`, `uuid`
- ❌ Cleaned legacy documentation files

### 2. **API Service Layer Created**
- ✅ Created `/lib/api.js` - centralized API client
- ✅ Automatic `camelCase` ↔ `snake_case` conversion
- ✅ JWT token management
- ✅ Type-safe API methods

### 3. **Environment Variables Updated**
```bash
# OLD (Removed)
MONGO_URL
DB_NAME
JWT_SECRET
RAZORPAY_KEY_SECRET

# NEW (Added)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000  # Rails API URL

# KEPT (Still needed)
NEXT_PUBLIC_RAZORPAY_KEY_ID  # For client-side Razorpay checkout
```

---

## 🔄 API Endpoint Mapping

### Customer Portal Endpoints

| Old Endpoint | New Rails Endpoint | Method | Auth |
|--------------|-------------------|--------|------|
| `/api/auth/send-otp` | `/api/v1/auth/send_otp` | POST | No |
| `/api/auth/verify-otp` | `/api/v1/auth/verify_otp` | POST | No |
| `/api/turfs` | `/api/v1/turfs` | GET | No |
| `/api/turfs/:id` | `/api/v1/turfs/:id` | GET | No |
| `/api/slots/:turfId` | `/api/v1/turfs/:turfId/slots` | GET | No |
| `/api/cities` | `/api/v1/cities` | GET | No |
| `/api/sports` | `/api/v1/sports` | GET | No |
| `/api/profile` | `/api/v1/profile` | GET/PUT | Yes |
| `/api/bookings` | `/api/v1/bookings` | GET/POST | Yes |
| `/api/payment/create-order` | `/api/v1/payments/create_order` | POST | Yes |
| `/api/payment/verify` | `/api/v1/payments/verify` | POST | Yes |

### Vendor Portal Endpoints

| Old Endpoint | New Rails Endpoint | Method | Auth |
|--------------|-------------------|--------|------|
| `/api/vendor/register` | `/api/v1/vendor_auth/register` | POST | No |
| `/api/vendor/send-otp` | `/api/v1/vendor_auth/send_otp` | POST | No |
| `/api/vendor/verify-otp` | `/api/v1/vendor_auth/verify_otp` | POST | No |
| `/api/vendor/profile` | `/api/v1/vendor/profile` | GET/PUT | Yes |
| `/api/vendor/turfs` | `/api/v1/vendor/turfs` | GET/POST | Yes |
| `/api/vendor/turfs/:id` | `/api/v1/vendor/turfs/:id` | PUT/DELETE | Yes |
| `/api/vendor/upload-image` | `/api/v1/vendor/upload_image` | POST | Yes |

### Admin Portal Endpoints

| Old Endpoint | New Rails Endpoint | Method | Auth |
|--------------|-------------------|--------|------|
| `/api/admin/login` | `/api/v1/admin_auth/login` | POST | No |
| `/api/admin/vendors` | `/api/v1/admin/vendors` | GET | Yes |
| `/api/admin/vendors/approve` | `/api/v1/admin/vendors/:id/approve` | PATCH | Yes |
| `/api/admin/vendors/reject` | `/api/v1/admin/vendors/:id/reject` | PATCH | Yes |
| `/api/admin/vendors/toggle-active` | `/api/v1/admin/vendors/:id/toggle_active` | PATCH | Yes |
| `/api/admin/turfs` | `/api/v1/admin/turfs` | GET | Yes |
| `/api/admin/turfs/approve` | `/api/v1/admin/turfs/:id/approve` | PATCH | Yes |
| `/api/admin/turfs/reject` | `/api/v1/admin/turfs/:id/reject` | PATCH | Yes |

---

## 📝 Migration Instructions Per File

### 1. Customer Portal (`/app/page.js`)

**Step 1: Import API Service**
```javascript
import api from '@/lib/api';
```

**Step 2: Replace Authentication Calls**
```javascript
// OLD
const response = await fetch('/api/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile })
});
const data = await response.json();

// NEW
const data = await api.auth.sendOtp(mobile);
```

```javascript
// OLD
const response = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile, otp })
});
const data = await response.json();

// NEW
const data = await api.auth.verifyOtp(mobile, otp);
```

**Step 3: Replace Data Fetching**
```javascript
// OLD
const response = await fetch('/api/turfs');
const data = await response.json();
setTurfs(data.turfs);

// NEW
const data = await api.turfs.getAll();
setTurfs(data.turfs);
```

```javascript
// OLD
const response = await fetch(`/api/slots/${turfId}?date=${date}`);
const data = await response.json();

// NEW
const data = await api.turfs.getSlots(turfId, date);
```

**Step 4: Replace Payment Calls**
```javascript
// OLD
const response = await fetch('/api/payment/create-order', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ turfId, slots, amount })
});

// NEW
const data = await api.payments.createOrder(turfId, slots, amount);
```

---

### 2. User Profile (`/app/profile/page.js`)

```javascript
// Import
import api from '@/lib/api';

// Fetch profile
const data = await api.profile.get();

// Update profile
const data = await api.profile.update({
  name: profileForm.name,
  email: profileForm.email,
  dob: profileForm.dob
});

// Fetch bookings
const data = await api.bookings.getAll();
```

---

### 3. Vendor Portal (`/app/vendor/page.js`)

```javascript
// Import
import api from '@/lib/api';

// Register
const data = await api.vendorAuth.register({
  mobile,
  email,
  businessName,
  ownerName,
  gst,
  pan
});

// Login
const data = await api.vendorAuth.verifyOtp(mobile, otp);
```

---

### 4. Vendor Add Turf (`/app/vendor/add-turf/page.js`)

**Important: Payload Structure Changed**

```javascript
// Import
import api from '@/lib/api';

// OLD payload structure
const payload = {
  name: formData.name,
  sportTypes: formData.sportTypes,  // Array of strings
  customSlots: formData.customSlots,
  operatingHours: {
    opening: '09:00',
    closing: '23:00'
  },
  amenities: formData.amenities,
  pricing: { basePrice: 2000 }
};

// NEW payload structure (handled by api.js automatically)
const payload = {
  name: formData.name,
  sportIds: [1, 2, 3],  // Array of IDs
  customSlots: formData.customSlots,
  openingTime: '09:00',  // Flattened
  closingTime: '23:00',
  amenityIds: [1, 2, 3],
  pricing: { basePrice: 2000 }
};

// Create turf
const data = await api.vendor.turfs.create(payload);
```

**Image Upload**
```javascript
// OLD
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/vendor/upload-image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// NEW
const data = await api.vendor.uploadImage(file);
const imageUrl = data.imageUrl;
```

---

### 5. Admin Dashboard (`/app/admin/dashboard/page.js`)

```javascript
// Import
import api from '@/lib/api';

// Fetch vendors
const data = await api.admin.vendors.getAll();

// Approve vendor
await api.admin.vendors.approve(vendorId);

// Reject vendor
await api.admin.vendors.reject(vendorId);

// Toggle active status
await api.admin.vendors.toggleActive(vendorId, isActive);

// Fetch turfs
const data = await api.admin.turfs.getAll();

// Approve turf
await api.admin.turfs.approve(turfId);
```

---

## ⚠️ Common Pitfalls & Solutions

### 1. **CORS Errors**
**Error:** `Access to fetch at 'http://localhost:4000/api/v1/turfs' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:** Ensure Rails CORS is configured:
```ruby
# Rails: config/initializers/cors.rb
allow do
  origins 'http://localhost:3000', 'https://turf-hub-1.preview.emergentagent.com'
  resource '*', headers: :any, methods: [:get, :post, :put, :patch, :delete, :options, :head]
end
```

### 2. **401 Unauthorized on Protected Routes**
**Error:** `Unauthorized`

**Solution:** Check JWT token:
```javascript
// Verify token exists
const token = localStorage.getItem('token');
console.log('Token:', token);

// If missing, redirect to login
if (!token) {
  router.push('/');
  return;
}
```

### 3. **422 Unprocessable Entity (Validation Errors)**
**Error:** `Validation failed: Mobile must be 10 digits`

**Solution:** Rails expects `snake_case`, the api.js handles conversion automatically:
```javascript
// This is handled automatically by api.js
const data = await api.profile.update({
  businessName: 'Test'  // Automatically converts to business_name
});
```

### 4. **Image Paths Not Loading**
**Error:** Images return 404

**Solution:** Rails returns full URLs or relative paths:
```javascript
// Rails response
{
  images: [
    "http://localhost:4000/uploads/turfs/image.jpg",  // Full URL
    "/uploads/turfs/image.jpg"  // Relative path
  ]
}

// In component
<img src={turf.images[0]} alt="Turf" />  // Works with both
```

### 5. **Slot ID Format Changed**
**Old:** `slot-2025-06-15-10`
**New:** Same format, but ensure date format matches: `YYYY-MM-DD`

---

## 🧪 Testing Checklist

### Customer Portal
- [ ] Browse turfs (no auth required)
- [ ] Filter by city and sport
- [ ] View turf details
- [ ] View available slots
- [ ] Login with OTP (mobile: any 10 digits, OTP: 123456)
- [ ] Select multiple slots
- [ ] Create Razorpay order
- [ ] Complete payment
- [ ] View booking history
- [ ] Update profile

### Vendor Portal
- [ ] Register new vendor
- [ ] Login with OTP
- [ ] View vendor dashboard
- [ ] Add new turf with custom slots
- [ ] Upload turf images
- [ ] Update vendor profile

### Admin Portal
- [ ] Admin login (mobile: 9999999999, OTP: 123456)
- [ ] View pending vendors
- [ ] Approve/reject vendors
- [ ] Toggle vendor active status
- [ ] View pending turfs
- [ ] Approve/reject turfs

---

## 🚀 Deployment Notes

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.turfie.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
```

### Rails Backend
```bash
# Must be running on the URL specified in NEXT_PUBLIC_API_BASE_URL
# Ensure CORS allows the frontend origin
```

---

## 📚 Additional Resources

- **API Documentation:** [Rails API Docs](http://localhost:4000/api-docs) (if Swagger configured)
- **API Service Source:** `/lib/api.js`
- **Rails Backend:** `turfie-api` repository
- **Environment Setup:** See `.env` file

---

## 🐛 Troubleshooting

**Frontend not connecting to Rails:**
1. Check `NEXT_PUBLIC_API_BASE_URL` in `.env`
2. Verify Rails server is running: `rails server -p 4000`
3. Check CORS configuration in Rails
4. Verify network connectivity

**Authentication issues:**
1. Clear localStorage: `localStorage.clear()`
2. Re-login to get fresh token
3. Check token in browser DevTools → Application → Local Storage

**Payload errors:**
1. Check request payload in Network tab
2. Verify `snake_case` conversion is working
3. Check Rails logs for validation errors: `tail -f log/development.log`

---

**Last Updated:** June 2025  
**Migration Status:** ✅ Backend Removed, 🔄 Frontend Integration In Progress

# Frontend Migration Summary

## ✅ Phase 1: Backend Cleanup - COMPLETE

### Files Deleted
- `/app/app/api/[[...path]]/route.js` (1,151 lines - monolithic API)
- `/app/MULTI_SLOT_FEATURE.md`
- `/app/PROFILE_FEATURE.md`
- `/app/VENDOR_PORTAL.md`
- `/app/VENDOR_FRONTEND.md`
- `/app/REMAINING_FEATURES.md`
- `/app/test_result.md`
- `/app/GIT_PUSH_GUIDE.md`

### Dependencies Removed
```bash
✅ mongodb (NoSQL driver)
✅ jsonwebtoken (JWT handling)
✅ razorpay (Server-side payment SDK)
✅ formidable (File upload handler)
✅ uuid (ID generation)
```

### Environment Variables
```bash
# REMOVED
MONGO_URL
DB_NAME
JWT_SECRET
RAZORPAY_KEY_SECRET

# ADDED
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# KEPT
NEXT_PUBLIC_RAZORPAY_KEY_ID (needed for client-side Razorpay)
NEXT_PUBLIC_BASE_URL (frontend URL)
```

---

## ✅ Phase 2: API Service Layer - COMPLETE

### Created Files
1. **`/lib/api.js`** - Centralized API client
   - Automatic `camelCase` ↔ `snake_case` conversion
   - JWT token management
   - Error handling
   - Type-safe methods for all endpoints

2. **`/MIGRATION_GUIDE.md`** - Complete migration documentation
   - Endpoint mappings
   - Migration instructions per file
   - Common pitfalls & solutions
   - Testing checklist

3. **`/examples/migrated-component-example.js`** - Reference implementation
   - Shows correct usage of new API service
   - Authentication flow
   - Booking flow
   - Error handling patterns

---

## 🔄 Phase 3: Frontend Integration - MANUAL ACTION REQUIRED

### Files Requiring Updates (8 files)

#### **Priority 1: Authentication & Core Features**
1. **`/app/app/page.js`** (Customer Portal - 936 lines)
   - Replace 10+ API calls
   - Update authentication flow
   - Update payment integration
   - Update slot booking

2. **`/app/app/profile/page.js`** (User Profile)
   - Replace profile fetch/update calls
   - Update booking history fetch

#### **Priority 2: Vendor Portal**
3. **`/app/app/vendor/page.js`** (Vendor Auth)
   - Replace vendor registration
   - Update vendor login

4. **`/app/app/vendor/dashboard/page.js`** (Vendor Dashboard)
   - Replace turf listing calls

5. **`/app/app/vendor/add-turf/page.js`** (Add Turf - Complex)
   - Replace turf creation
   - **Critical:** Update payload structure (sportTypes → sportIds)
   - Update image upload
   - Update custom slots structure

6. **`/app/app/vendor/profile/page.js`** (Vendor Profile)
   - Replace profile fetch/update
   - Update bank details handling

7. **`/app/app/vendor/turfs/page.js`** (Manage Turfs - if exists)
   - Replace turf management calls

#### **Priority 3: Admin Portal**
8. **`/app/app/admin/dashboard/page.js`** (Admin Dashboard)
   - Replace vendor/turf listing
   - Update approve/reject calls
   - Update toggle active status

---

## 📋 Manual Migration Steps

### For Each File:

#### **Step 1: Add Import**
```javascript
import api from '@/lib/api';
```

#### **Step 2: Replace Fetch Calls**

**Pattern to Find:**
```javascript
const response = await fetch('/api/something', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
const result = await response.json();
```

**Replace With:**
```javascript
const result = await api.something.method(data);
```

#### **Step 3: Test Each Change**
- Test in development
- Check browser console for errors
- Verify data flow
- Check Network tab for API calls

---

## 🎯 Quick Migration Script (Per File)

### Example: Customer Portal (`/app/page.js`)

```bash
# Find all fetch calls
grep -n "fetch(" /app/app/page.js

# Common patterns to replace:
1. fetch('/api/auth/send-otp')       → api.auth.sendOtp(mobile)
2. fetch('/api/auth/verify-otp')     → api.auth.verifyOtp(mobile, otp)
3. fetch('/api/turfs')               → api.turfs.getAll()
4. fetch(`/api/slots/${id}`)         → api.turfs.getSlots(id, date)
5. fetch('/api/payment/create-order') → api.payments.createOrder(...)
6. fetch('/api/bookings')            → api.bookings.getAll()
```

---

## ⚠️ Critical Changes to Watch

### 1. **Payload Structure (Most Important)**

**Old (Next.js):**
```javascript
{
  sportTypes: ['Cricket', 'Football'],  // Array of names
  customSlots: [...],
  operatingHours: { opening: '09:00', closing: '23:00' },
  amenities: ['Parking', 'Lights']
}
```

**New (Rails):**
```javascript
{
  sportIds: [1, 2],  // Array of IDs
  customSlots: [...],
  openingTime: '09:00',  // Flattened
  closingTime: '23:00',
  amenityIds: [1, 2]  // Array of IDs
}
```

**Solution:** The `api.js` handles `camelCase` ↔ `snake_case`, but you must:
- Change `sportTypes` to `sportIds`
- Flatten `operatingHours` to `openingTime` / `closingTime`
- Change `amenities` to `amenityIds`

### 2. **Image Upload**

**Old:**
```javascript
const formData = new FormData();
formData.append('file', file);
fetch('/api/vendor/upload-image', { method: 'POST', body: formData });
```

**New:**
```javascript
const data = await api.vendor.uploadImage(file);  // Handles FormData internally
const imageUrl = data.imageUrl;
```

### 3. **Admin Actions (HTTP Method Changed)**

**Old:**
```javascript
fetch('/api/admin/vendors/approve', {
  method: 'POST',
  body: JSON.stringify({ vendorId })
});
```

**New:**
```javascript
await api.admin.vendors.approve(vendorId);  // Now PATCH with ID in URL
```

---

## 🧪 Testing Strategy

### 1. Start Rails Backend
```bash
cd turfie-api
rails server -p 4000
```

### 2. Start Frontend
```bash
cd /app
yarn dev
```

### 3. Test Each Flow

**Customer Flow:**
1. ✅ Browse turfs (no login)
2. ✅ Login with OTP
3. ✅ Select slots
4. ✅ Complete payment
5. ✅ View bookings

**Vendor Flow:**
1. ✅ Register vendor
2. ✅ Login
3. ✅ Add turf
4. ✅ Upload images
5. ✅ View dashboard

**Admin Flow:**
1. ✅ Login as admin
2. ✅ Approve vendors
3. ✅ Approve turfs
4. ✅ Toggle vendor status

---

## 🚨 Common Errors & Fixes

### Error 1: "api is not defined"
```
ReferenceError: api is not defined
```
**Fix:** Add `import api from '@/lib/api';` at top of file

### Error 2: CORS Error
```
Access to fetch blocked by CORS policy
```
**Fix:** Check Rails CORS config allows frontend origin

### Error 3: 401 Unauthorized
```
{"error":"Unauthorized"}
```
**Fix:** Verify JWT token is stored and sent:
```javascript
console.log(localStorage.getItem('token'));
```

### Error 4: 422 Validation Error
```
{"error":"Validation failed"}
```
**Fix:** Check payload structure matches Rails expectations

---

## 📈 Migration Progress Tracker

### Completed ✅
- [x] Backend code removed
- [x] Dependencies cleaned
- [x] API service created
- [x] Environment configured
- [x] Documentation created

### In Progress 🔄
- [ ] Customer portal (`/app/page.js`)
- [ ] User profile page
- [ ] Vendor auth page
- [ ] Vendor dashboard
- [ ] Vendor add-turf page
- [ ] Vendor profile page
- [ ] Admin dashboard

### Testing 🧪
- [ ] End-to-end customer flow
- [ ] End-to-end vendor flow
- [ ] End-to-end admin flow
- [ ] Payment integration
- [ ] Image uploads
- [ ] Mobile responsive

### Production Ready 🚀
- [ ] All API calls migrated
- [ ] All tests passing
- [ ] Production env vars set
- [ ] CORS configured
- [ ] Performance tested

---

## 🎓 Learning Resources

**API Service Documentation:**
- See `/lib/api.js` for all available methods
- Each method has JSDoc comments explaining usage

**Example Component:**
- See `/examples/migrated-component-example.js`
- Copy-paste patterns from this file

**Migration Guide:**
- See `/MIGRATION_GUIDE.md` for detailed instructions
- Endpoint mappings and payload examples

---

## 🔧 Automated Migration Script (Optional)

You can create a script to help with bulk find-replace:

```bash
#!/bin/bash
# migrate-api-calls.sh

# Backup files first
cp /app/app/page.js /app/app/page.js.backup

# Replace common patterns (use with caution!)
sed -i "s|fetch('/api/auth/send-otp'|api.auth.sendOtp(|g" /app/app/page.js
sed -i "s|fetch('/api/turfs')|api.turfs.getAll()|g" /app/app/page.js

# Manual review required after running!
```

**⚠️ Warning:** Automated find-replace can break code. Always review changes manually.

---

## 📞 Support

If you encounter issues during migration:

1. **Check Browser Console** - Look for error messages
2. **Check Network Tab** - Verify API endpoints are correct
3. **Check Rails Logs** - `tail -f turfie-api/log/development.log`
4. **Review Migration Guide** - Common issues documented
5. **Test with curl** - Verify Rails API works standalone

---

**Last Updated:** June 2025  
**Status:** Backend Cleanup Complete, Frontend Integration Manual  
**Estimated Time:** 4-6 hours for full frontend migration

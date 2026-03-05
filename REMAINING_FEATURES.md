# Remaining Features Implementation Guide

## Status: All 4 features (A, B, C, D) require significant frontend rebuilds

### Current Progress:
- ✅ Backend ready for all features
- ✅ Sports categories working
- ✅ Active/Deactive working
- ✅ Date improvements working

### Remaining Features Need:

## A. Vendor Custom Slots (High Priority)
**Estimated Time:** 2-3 hours
**Complexity:** High

**What's needed:**
1. **Vendor Form Updates:**
   - Add sports type multi-select in Step 1
   - Add custom slot builder in Step 5 (replace simple pricing)
   - Slot builder interface:
     - Day type: Weekday/Weekend dropdown
     - Time range: Start time → End time
     - Price per hour input
     - Add/Remove slot buttons
     - Preview all added slots

2. **Customer Portal Updates:**
   - Fetch turf.customSlots from API
   - If customSlots exist, use them instead of generic slots
   - Apply weekend pricing based on current date
   - Show vendor-defined slot times only

## B. Vendor Single Section (Medium Priority)
**Estimated Time:** 1-2 hours
**Complexity:** Medium

**What's needed:**
1. Redesign `/vendor/dashboard/page.js`:
   - Remove tabs and navigation
   - Show everything on one scrollable page:
     - Top: Stats cards
     - Middle: All turfs (expandable cards)
     - Bottom: Profile info
   - Inline edit for turfs
   - No separate pages for add/manage

## C. Image Upload (Medium Priority)
**Estimated Time:** 2-3 hours
**Complexity:** High

**What's needed:**
1. **File Upload Component:**
   - Replace URL input with file picker
   - Accept: image/jpeg, image/png, image/webp
   - Mobile camera button: `<input accept="image/*" capture="camera">`
   - Image preview before upload
   - Multiple image support (3 images)

2. **Image Storage:**
   - Option 1: Base64 encode and store in MongoDB (simple but large)
   - Option 2: Upload to cloud (S3, Cloudinary) - recommended
   - Option 3: Store in /public folder (not scalable)

3. **Backend Updates:**
   - Accept base64 images or URLs
   - Validate image size (max 5MB per image)
   - Store in turf.images array

## D. Sports Type Selection
**Partially Done**
- ✅ Backend supports sportTypes array
- ❌ Frontend needs multi-select in vendor form
- Add to Step 1 of add turf form

---

## Implementation Priority:

### Phase 1 (Most Impactful):
1. Add sports multi-select to vendor form (30 mins)
2. Build custom slot UI for vendor (2 hours)
3. Integrate custom slots in customer portal (1 hour)

### Phase 2:
4. Vendor single section redesign (2 hours)

### Phase 3:
5. Image upload with camera (3 hours)

---

## Technical Notes:

### Custom Slots Data Structure:
```javascript
customSlots: [
  {
    day: "weekday", // or "weekend"
    time: "09:00",
    endTime: "10:00",
    price: 1200
  },
  {
    day: "weekend",
    time: "18:00",
    endTime: "19:00",
    price: 2000
  }
]
```

### Sports Type:
```javascript
sportTypes: ["Cricket", "Football", "Badminton"]
```

### Image Upload Flow:
```
User selects image → Preview → Convert to base64 OR upload to cloud → Store URL
```

---

## Recommendation:

Given the complexity and time required, I recommend:

**Option 1: Complete Priority Features (A + D)**
- Add sports selection to vendor form
- Build custom slot builder
- Integrate in customer portal
- **Time:** 3-4 hours total

**Option 2: All Remaining Features**
- All of A, B, C, D
- **Time:** 7-8 hours total
- Significant code rewriting needed

**Option 3: MVP Improvements**
- Focus on custom slots only (most impactful)
- Leave single section and image upload for later
- **Time:** 3 hours

Which would you prefer? Or should I continue implementing all features one by one?

Note: Due to the extensive frontend rebuilding required, these changes would be best done in a dedicated session with clear priority on which feature to complete first.

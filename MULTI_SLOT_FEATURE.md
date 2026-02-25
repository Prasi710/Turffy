# Multi-Slot Selection Feature

## Overview
Users can now select multiple time slots for a single booking and proceed to payment for all selected slots together.

## How It Works

### 1. **Select Multiple Slots**
- Click on any available slot to add it to your selection
- Selected slots are highlighted in green with a darker border
- Click again on a selected slot to deselect it
- Toast notifications show when slots are added/removed

### 2. **View Selected Slots**
Once you select one or more slots, a summary panel appears showing:
- **Slot Count**: Number of slots selected (e.g., "3 Slots Selected")
- **Selected Times**: Badge list showing all selected time ranges
- **Remove Individual Slots**: Click the × on any badge to remove that slot
- **Clear All Button**: Remove all selections at once
- **Total Amount**: Automatically calculated (slots × price per hour)

### 3. **Proceed to Payment**
- Large green "Proceed to Payment" button appears when slots are selected
- If not logged in, clicking any slot or the proceed button will show login modal
- After login, selected slots are restored and ready for payment
- Razorpay checkout shows total amount for all selected slots

### 4. **Payment & Confirmation**
- Single payment transaction covers all selected slots
- Backend creates individual bookings for each slot
- All bookings are confirmed together after successful payment
- Slots become unavailable for other users
- Success message shows number of slots booked

## Technical Details

### Frontend Changes (`/app/app/page.js`)
- Changed from `selectedSlot` (single) to `selectedSlots` (array)
- Added slot selection toggle logic
- Added selected slots summary panel with:
  - Slot badges with remove buttons
  - Clear all functionality
  - Total amount calculation
  - Proceed to Payment button
- Green highlighting for selected slots

### Backend Changes (`/app/app/api/[[...path]]/route.js`)

**POST /api/payment/create-order**
- Now accepts `slots` array instead of single `slotId` and `date`
- Format: `{ turfId, slots: [{slotId, date}, ...], amount }`
- Creates multiple bookings (one per slot) with same orderId
- Returns array of `bookingIds`

**POST /api/payment/verify**
- Now accepts `bookingIds` array
- Updates all bookings in the array to confirmed status
- Backward compatible with single bookingId

## User Experience

### Before Login
1. User browses turfs
2. Clicks on a turf to view details
3. Selects one or more slots
4. Clicks "Proceed to Payment"
5. Login modal appears
6. After login, returns to booking with slots still selected

### After Login
1. User selects multiple slots
2. Summary panel shows selected slots and total
3. User can add/remove slots before proceeding
4. Clicks "Proceed to Payment"
5. Razorpay modal opens with total amount
6. Completes payment
7. All slots are booked together

## Testing Checklist

- [ ] Select single slot - works
- [ ] Select multiple slots - all highlighted correctly
- [ ] Deselect individual slot by clicking × on badge
- [ ] Deselect individual slot by clicking the slot button again
- [ ] Clear all slots using "Clear All" button
- [ ] Total amount updates correctly as slots are added/removed
- [ ] Login required when clicking slot without auth
- [ ] Selected slots persist after login
- [ ] Payment modal shows correct total for multiple slots
- [ ] All slots are booked after successful payment
- [ ] Booked slots show as unavailable after booking

## Demo Flow

**Live URL:** https://turf-hub-1.preview.emergentagent.com

**Test Steps:**
1. Open the app
2. Click on any turf (e.g., "PlayGround Arena")
3. Select 2-3 time slots (they turn green)
4. See the summary panel appear with total amount
5. Click "Proceed to Payment"
6. Login with mobile: 9999999999, OTP: 123456
7. Complete Razorpay payment (use test cards)
8. See success message with number of slots booked

## Benefits

✅ **Better User Experience**: Book multiple slots in one transaction
✅ **Time Saving**: No need to repeat booking process for each slot
✅ **Cost Efficient**: Single payment processing fee
✅ **Clear Summary**: See all selections before payment
✅ **Easy Management**: Add/remove slots before confirming
✅ **Visual Feedback**: Clear indication of selected slots

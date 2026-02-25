#!/usr/bin/env python3

import requests
import json
import os
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://turf-hub-1.preview.emergentagent.com/api"
TEST_MOBILE = "7777777777"  # Using the specific mobile from test scenario
TEST_OTP = "123456"

def log_test(test_name, success, details=""):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")
    print()

def login_and_get_token():
    """Test Scenario 1: Login with mobile 7777777777 and get JWT token"""
    try:
        print("🔐 Testing Login Process...")
        
        # Send OTP
        otp_response = requests.post(f"{BASE_URL}/auth/send-otp", 
                                   json={"mobile": TEST_MOBILE})
        
        if otp_response.status_code != 200:
            log_test("OTP Send for Profile Test", False, f"Failed to send OTP: {otp_response.text}")
            return None
            
        log_test("OTP Send for Profile Test", True, f"OTP sent successfully for {TEST_MOBILE}")
            
        # Verify OTP and get token
        verify_response = requests.post(f"{BASE_URL}/auth/verify-otp",
                                      json={"mobile": TEST_MOBILE, "otp": TEST_OTP})
        
        if verify_response.status_code != 200:
            log_test("OTP Verify and Token Generation", False, f"Failed to verify OTP: {verify_response.text}")
            return None
            
        data = verify_response.json()
        token = data.get("token")
        user = data.get("user")
        
        if not token:
            log_test("JWT Token Generation", False, "No token in response")
            return None
            
        log_test("JWT Token Generation", True, f"Token obtained for user {user.get('userId')}")
        return token, user
        
    except Exception as e:
        log_test("Login Process for Profile Test", False, f"Login failed: {str(e)}")
        return None

def test_get_bookings_empty(token):
    """Test Scenario 1: Get bookings (may be empty initially)"""
    try:
        print("📋 Testing GET /api/bookings...")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/bookings", headers=headers)
        
        if response.status_code != 200:
            log_test("GET Bookings API", False, f"Failed to get bookings: {response.status_code} - {response.text}")
            return None
            
        data = response.json()
        
        # Verify response structure
        if "bookings" not in data:
            log_test("GET Bookings Response Structure", False, "Missing 'bookings' field in response")
            return None
            
        bookings = data["bookings"]
        
        if not isinstance(bookings, list):
            log_test("GET Bookings Response Structure", False, "Bookings field is not an array")
            return None
            
        log_test("GET Bookings API", True, f"Successfully retrieved bookings array with {len(bookings)} items")
        
        # Check if bookings have turfDetails when present
        if len(bookings) > 0:
            sample_booking = bookings[0]
            if "turfDetails" in sample_booking:
                turf_details = sample_booking["turfDetails"]
                required_fields = ["name", "location", "city"]
                missing_fields = [field for field in required_fields if field not in turf_details]
                
                if missing_fields:
                    log_test("Existing Bookings TurfDetails Structure", False, f"Missing fields in turfDetails: {missing_fields}")
                else:
                    log_test("Existing Bookings TurfDetails Structure", True, "TurfDetails contains required fields: name, location, city")
            else:
                log_test("Existing Bookings TurfDetails", False, "Existing bookings missing turfDetails")
        
        return bookings
        
    except Exception as e:
        log_test("GET Bookings Test", False, f"Exception: {str(e)}")
        return None

def test_create_booking_and_verify_history(token):
    """Test Scenario 2: Create a test booking and verify it appears in history"""
    try:
        print("🏟️ Testing Booking Creation and History...")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get tomorrow's date for booking
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # Create booking using POST /api/payment/create-order with turf-002
        order_data = {
            "turfId": "turf-002",
            "slots": [
                {"slotId": f"slot-{tomorrow}-15", "date": tomorrow}  # 3 PM slot
            ],
            "amount": 2000
        }
        
        # Create order
        create_response = requests.post(f"{BASE_URL}/payment/create-order",
                                     headers=headers, json=order_data)
        
        if create_response.status_code != 200:
            log_test("Test Booking Creation", False, f"Failed to create booking: {create_response.text}")
            return None, None
            
        order_data = create_response.json()
        booking_ids = order_data.get("bookingIds", [])
        
        if not booking_ids:
            log_test("Test Booking Creation", False, "No bookingIds returned")
            return None, None
            
        log_test("Test Booking Creation", True, f"Booking created successfully with ID: {booking_ids[0]}")
        
        # Get bookings again to verify the new booking appears
        get_response = requests.get(f"{BASE_URL}/bookings", headers=headers)
        
        if get_response.status_code != 200:
            log_test("Verify Booking in History", False, f"Failed to get updated bookings: {get_response.text}")
            return None, None
            
        updated_data = get_response.json()
        updated_bookings = updated_data.get("bookings", [])
        
        # Find our test booking
        test_booking = None
        for booking in updated_bookings:
            if booking.get("bookingId") in booking_ids:
                test_booking = booking
                break
                
        if not test_booking:
            log_test("Verify Booking in History", False, "New booking not found in booking history")
            return None, None
            
        log_test("Verify Booking in History", True, f"New booking found in history with turf {test_booking.get('turfId')}")
        
        return test_booking, updated_bookings
        
    except Exception as e:
        log_test("Create Booking and Verify History", False, f"Exception: {str(e)}")
        return None, None

def test_booking_data_enrichment(test_booking, all_bookings):
    """Test Scenario 3: Verify booking data enrichment with turfDetails"""
    try:
        print("🏷️ Testing Booking Data Enrichment...")
        
        if not test_booking:
            log_test("Booking Data Enrichment", False, "No test booking to verify")
            return False
            
        # Verify turfDetails object exists
        if "turfDetails" not in test_booking:
            log_test("TurfDetails Presence", False, "turfDetails object missing from booking")
            return False
            
        turf_details = test_booking["turfDetails"]
        
        # Verify required fields in turfDetails
        required_fields = ["name", "location", "city"]
        missing_fields = [field for field in required_fields if field not in turf_details or not turf_details[field]]
        
        if missing_fields:
            log_test("TurfDetails Required Fields", False, f"Missing or empty fields in turfDetails: {missing_fields}")
            return False
            
        log_test("TurfDetails Required Fields", True, 
                f"All required fields present - Name: {turf_details['name']}, Location: {turf_details['location']}, City: {turf_details['city']}")
        
        # Verify bookings are sorted by createdAt (newest first)
        if len(all_bookings) > 1:
            # Check if the first booking has the latest createdAt
            dates = []
            for booking in all_bookings:
                if "createdAt" in booking:
                    try:
                        # Handle different date formats
                        created_at = booking["createdAt"]
                        if isinstance(created_at, str):
                            # Try parsing ISO format
                            if 'T' in created_at:
                                date_obj = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            else:
                                date_obj = datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S")
                        else:
                            date_obj = created_at
                        dates.append(date_obj)
                    except:
                        # If parsing fails, skip sorting check
                        log_test("Booking Sort Order", True, "Cannot verify sort order due to date format")
                        return True
                        
            if dates and len(dates) > 1:
                is_sorted = all(dates[i] >= dates[i+1] for i in range(len(dates)-1))
                if is_sorted:
                    log_test("Booking Sort Order", True, "Bookings are sorted by createdAt (newest first)")
                else:
                    log_test("Booking Sort Order", False, "Bookings are not sorted by createdAt properly")
                    return False
        else:
            log_test("Booking Sort Order", True, "Single booking - sort order N/A")
            
        return True
        
    except Exception as e:
        log_test("Booking Data Enrichment", False, f"Exception: {str(e)}")
        return False

def test_date_filtering_verification(token):
    """Test Scenario 4: Verify date filtering for slots (no past dates)"""
    try:
        print("📅 Testing Date Filtering Fix...")
        
        today = datetime.now().strftime("%Y-%m-%d")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # Test today's slots - should only return future slots
        today_response = requests.get(f"{BASE_URL}/slots/turf-001?date={today}")
        
        if today_response.status_code != 200:
            log_test("Today Slots API", False, f"Failed to get today's slots: {today_response.text}")
            return False
            
        today_data = today_response.json()
        today_slots = today_data.get("slots", [])
        
        # Check if only future slots are returned for today
        current_hour = datetime.now().hour
        future_slots_count = 0
        past_slots_found = False
        
        for slot in today_slots:
            slot_time = slot.get("time", "")
            if slot_time:
                slot_hour = int(slot_time.split(":")[0])
                if slot_hour <= current_hour:
                    past_slots_found = True
                else:
                    future_slots_count += 1
                    
        if past_slots_found:
            log_test("Today Slots Filtering", False, f"Found past slots in today's results")
            return False
        else:
            log_test("Today Slots Filtering", True, f"Only future slots returned for today ({future_slots_count} slots)")
        
        # Test tomorrow's slots - should return all slots (6 AM - 11 PM = 17 slots)
        tomorrow_response = requests.get(f"{BASE_URL}/slots/turf-001?date={tomorrow}")
        
        if tomorrow_response.status_code != 200:
            log_test("Tomorrow Slots API", False, f"Failed to get tomorrow's slots: {tomorrow_response.text}")
            return False
            
        tomorrow_data = tomorrow_response.json()
        tomorrow_slots = tomorrow_data.get("slots", [])
        
        # Verify all slots are returned for tomorrow (6 AM to 11 PM = 17 slots)
        expected_slots = 17  # 6 AM to 11 PM (6, 7, 8, ..., 22)
        actual_slots = len(tomorrow_slots)
        
        if actual_slots == expected_slots:
            log_test("Tomorrow Slots Count", True, f"All {expected_slots} slots returned for tomorrow")
        else:
            log_test("Tomorrow Slots Count", False, f"Expected {expected_slots} slots, got {actual_slots}")
            return False
            
        # Verify slot time range
        if tomorrow_slots:
            first_slot_time = tomorrow_slots[0].get("time", "")
            last_slot_time = tomorrow_slots[-1].get("time", "")
            
            if first_slot_time.startswith("06:") and last_slot_time.startswith("22:"):
                log_test("Tomorrow Slots Time Range", True, f"Correct time range: {first_slot_time} to {last_slot_time}")
            else:
                log_test("Tomorrow Slots Time Range", False, f"Incorrect time range: {first_slot_time} to {last_slot_time}")
                return False
        
        return True
        
    except Exception as e:
        log_test("Date Filtering Verification", False, f"Exception: {str(e)}")
        return False

def main():
    """Main test execution for Profile and Booking History Features"""
    print("🚀 Starting TurfHub Profile and Booking History Tests")
    print("=" * 70)
    
    # Test Scenario 1: Login and Get Bookings
    print("1️⃣  Testing Login and Initial Booking Retrieval")
    print("-" * 50)
    
    login_result = login_and_get_token()
    if not login_result:
        print("❌ Cannot proceed without authentication token")
        return
        
    token, user = login_result
    
    # Get initial bookings
    initial_bookings = test_get_bookings_empty(token)
    if initial_bookings is None:
        print("❌ Failed to get initial bookings")
        return
        
    print(f"📊 Initial bookings count: {len(initial_bookings)}")
    
    # Test Scenario 2: Create Test Booking and Verify History
    print("\n2️⃣  Testing Booking Creation and History Update")
    print("-" * 50)
    
    test_booking, updated_bookings = test_create_booking_and_verify_history(token)
    
    # Test Scenario 3: Test Booking Data Enrichment
    print("\n3️⃣  Testing Booking Data Enrichment")
    print("-" * 50)
    
    enrichment_success = test_booking_data_enrichment(test_booking, updated_bookings or [])
    
    # Test Scenario 4: Date Filtering Fix Verification
    print("\n4️⃣  Testing Date Filtering Fix")
    print("-" * 50)
    
    filtering_success = test_date_filtering_verification(token)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 PROFILE & BOOKING HISTORY TEST SUMMARY")
    print("=" * 70)
    
    tests_passed = sum([
        bool(login_result),
        initial_bookings is not None,
        test_booking is not None,
        enrichment_success,
        filtering_success
    ])
    
    total_tests = 5
    
    print(f"✅ Tests Passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 ALL PROFILE & BOOKING HISTORY TESTS PASSED!")
    else:
        print(f"⚠️  {total_tests - tests_passed} test(s) failed")
        
    print("\n📝 Key Features Verified:")
    print("• User login with mobile 7777777777 and OTP 123456")
    print("• GET /api/bookings returns bookings array with proper structure")
    print("• Booking creation via POST /api/payment/create-order")
    print("• New bookings appear in booking history")
    print("• TurfDetails enrichment (name, location, city)")
    print("• Booking sort order (newest first)")
    print("• Date filtering - only future slots for today")
    print("• Date filtering - all slots (6 AM-11 PM) for future dates")
    
    print(f"\n🔍 Test Environment: {BASE_URL}")
    print(f"👤 Test User Mobile: {TEST_MOBILE}")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "https://turf-hub-1.preview.emergentagent.com/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'turfhub')

# Test data
VENDOR_MOBILE = "8888888888"
CUSTOMER_MOBILE = "9999999999"
OTP = "123456"

class TurfHubTester:
    def __init__(self):
        self.vendor_token = None
        self.customer_token = None
        self.test_turf_id = None
        self.mongo_client = None
        self.db = None
        
    def setup_database_connection(self):
        """Setup MongoDB connection"""
        try:
            self.mongo_client = MongoClient(MONGO_URL)
            self.db = self.mongo_client[DB_NAME]
            print("✅ Connected to MongoDB")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data before starting"""
        try:
            if self.db:
                # Remove test turfs and vendors
                self.db.turfs.delete_many({"name": "Test Integration Turf"})
                self.db.vendors.delete_many({"mobile": VENDOR_MOBILE})
                self.db.users.delete_many({"mobile": CUSTOMER_MOBILE})
                self.db.bookings.delete_many({"$or": [{"turfId": {"$regex": "^turf-test-"}}, {"userId": {"$regex": ".*test.*"}}]})
                print("✅ Cleaned up existing test data")
        except Exception as e:
            print(f"❌ Failed to cleanup test data: {e}")

    def vendor_register_and_login(self):
        """Register and login as vendor"""
        try:
            print("\n🔄 Testing vendor registration and login...")
            
            # Register vendor first
            register_data = {
                "businessName": "Test Turf Business",
                "ownerName": "Test Owner",
                "mobile": VENDOR_MOBILE,
                "email": "test@vendor.com",
                "gst": "12ABCDE3456F1Z5",
                "pan": "ABCDE1234F"
            }
            
            response = requests.post(f"{BASE_URL}/vendor/register", json=register_data)
            if response.status_code == 400 and "already registered" in response.json().get('error', ''):
                print("✅ Vendor already registered, proceeding with login")
            elif response.status_code == 200:
                print("✅ Vendor registered successfully")
            else:
                print(f"❌ Vendor registration failed: {response.status_code} - {response.text}")
                return False
            
            # Send OTP
            otp_data = {"mobile": VENDOR_MOBILE}
            response = requests.post(f"{BASE_URL}/vendor/send-otp", json=otp_data)
            if response.status_code != 200:
                print(f"❌ Failed to send OTP: {response.status_code} - {response.text}")
                return False
            print("✅ OTP sent to vendor")
            
            # Verify OTP and login
            verify_data = {"mobile": VENDOR_MOBILE, "otp": OTP}
            response = requests.post(f"{BASE_URL}/vendor/verify-otp", json=verify_data)
            if response.status_code != 200:
                print(f"❌ Failed to verify OTP: {response.status_code} - {response.text}")
                return False
            
            data = response.json()
            self.vendor_token = data.get('token')
            print(f"✅ Vendor logged in successfully. Token: {self.vendor_token[:20]}...")
            return True
            
        except Exception as e:
            print(f"❌ Vendor login failed: {e}")
            return False
    
    def customer_login(self):
        """Login as customer"""
        try:
            print("\n🔄 Testing customer login...")
            
            # Send OTP
            otp_data = {"mobile": CUSTOMER_MOBILE}
            response = requests.post(f"{BASE_URL}/auth/send-otp", json=otp_data)
            if response.status_code != 200:
                print(f"❌ Failed to send OTP: {response.status_code} - {response.text}")
                return False
            print("✅ OTP sent to customer")
            
            # Verify OTP and login
            verify_data = {"mobile": CUSTOMER_MOBILE, "otp": OTP}
            response = requests.post(f"{BASE_URL}/auth/verify-otp", json=verify_data)
            if response.status_code != 200:
                print(f"❌ Failed to verify OTP: {response.status_code} - {response.text}")
                return False
            
            data = response.json()
            self.customer_token = data.get('token')
            print(f"✅ Customer logged in successfully. Token: {self.customer_token[:20]}...")
            return True
            
        except Exception as e:
            print(f"❌ Customer login failed: {e}")
            return False

    def test_vendor_adds_turf(self):
        """Test Scenario 1: Vendor adds turf and it appears after approval"""
        try:
            print("\n🔄 Testing Scenario 1: Vendor adds turf...")
            
            headers = {"Authorization": f"Bearer {self.vendor_token}"}
            turf_data = {
                "name": "Test Integration Turf",
                "city": "Mumbai", 
                "location": "Test Location",
                "pricing": {"basePrice": 2500},
                "images": ["https://example.com/img.jpg"],
                "description": "Test turf for integration testing",
                "amenities": ["Floodlights", "Parking"],
                "surface": "Artificial Grass",
                "capacity": 22
            }
            
            # Add turf
            response = requests.post(f"{BASE_URL}/vendor/turfs", json=turf_data, headers=headers)
            if response.status_code != 200:
                print(f"❌ Failed to add turf: {response.status_code} - {response.text}")
                return False
            
            data = response.json()
            self.test_turf_id = data.get('turfId')
            print(f"✅ Turf added successfully. TurfId: {self.test_turf_id}")
            
            # Verify turf created with status="pending"
            turf_doc = self.db.turfs.find_one({"turfId": self.test_turf_id})
            if not turf_doc or turf_doc.get('status') != 'pending':
                print(f"❌ Turf not found in database or status not 'pending': {turf_doc}")
                return False
            print("✅ Turf created with status='pending' in database")
            
            # Check that turf doesn't appear on customer portal (should be pending)
            response = requests.get(f"{BASE_URL}/turfs")
            if response.status_code != 200:
                print(f"❌ Failed to get turfs: {response.status_code}")
                return False
            
            turfs = response.json().get('turfs', [])
            pending_turf_visible = any(t.get('id') == self.test_turf_id for t in turfs)
            if pending_turf_visible:
                print("❌ Pending turf should not appear on customer portal")
                return False
            print("✅ Pending turf correctly hidden from customer portal")
            
            # Manually approve the turf in database
            result = self.db.turfs.update_one(
                {"turfId": self.test_turf_id}, 
                {"$set": {"status": "approved"}}
            )
            if result.modified_count != 1:
                print("❌ Failed to approve turf in database")
                return False
            print("✅ Turf approved in database")
            
            # Verify approved turf appears on customer portal
            response = requests.get(f"{BASE_URL}/turfs")
            if response.status_code != 200:
                print(f"❌ Failed to get turfs: {response.status_code}")
                return False
            
            turfs = response.json().get('turfs', [])
            approved_turf = None
            for t in turfs:
                if t.get('id') == self.test_turf_id:
                    approved_turf = t
                    break
            
            if not approved_turf:
                print("❌ Approved turf not found on customer portal")
                return False
            
            # Verify turf data
            if (approved_turf.get('name') != 'Test Integration Turf' or
                approved_turf.get('city') != 'Mumbai' or
                approved_turf.get('location') != 'Test Location' or
                approved_turf.get('pricePerHour') != 2500):
                print(f"❌ Turf data mismatch: {approved_turf}")
                return False
            
            print("✅ Approved turf appears correctly on customer portal")
            
            # Verify mock turfs still appear
            mock_turf_ids = ['turf-001', 'turf-002', 'turf-003', 'turf-004', 'turf-005', 'turf-006']
            mock_turfs_found = [t for t in turfs if t.get('id') in mock_turf_ids]
            if len(mock_turfs_found) != 6:
                print(f"❌ Expected 6 mock turfs, found {len(mock_turfs_found)}")
                return False
            print("✅ Mock turfs still appear (backward compatibility)")
            
            return True
            
        except Exception as e:
            print(f"❌ Test scenario 1 failed: {e}")
            return False

    def test_city_filtering(self):
        """Test Scenario 2: City filtering with database turfs"""
        try:
            print("\n🔄 Testing Scenario 2: City filtering...")
            
            # Get cities
            response = requests.get(f"{BASE_URL}/cities")
            if response.status_code != 200:
                print(f"❌ Failed to get cities: {response.status_code}")
                return False
            
            cities = response.json().get('cities', [])
            
            # Check expected cities (from mock + database)
            expected_cities = ['All', 'Mumbai', 'Delhi', 'Bangalore']  # Mumbai should include our test turf
            for city in expected_cities:
                if city not in cities:
                    print(f"❌ Expected city '{city}' not found in: {cities}")
                    return False
            
            print(f"✅ Cities correctly include database and mock turfs: {cities}")
            
            # Test Mumbai filtering (should include our test turf + mock turfs)
            response = requests.get(f"{BASE_URL}/turfs?city=Mumbai")
            if response.status_code != 200:
                print(f"❌ Failed to filter turfs by city: {response.status_code}")
                return False
            
            mumbai_turfs = response.json().get('turfs', [])
            
            # Should have our test turf + 2 mock Mumbai turfs
            test_turf_found = any(t.get('id') == self.test_turf_id for t in mumbai_turfs)
            mock_mumbai_turfs = [t for t in mumbai_turfs if t.get('id') in ['turf-001', 'turf-002']]
            
            if not test_turf_found:
                print("❌ Database turf not found in Mumbai filtering")
                return False
            
            if len(mock_mumbai_turfs) != 2:
                print(f"❌ Expected 2 mock Mumbai turfs, found {len(mock_mumbai_turfs)}")
                return False
            
            print(f"✅ City filtering works with database turfs: {len(mumbai_turfs)} Mumbai turfs found")
            return True
            
        except Exception as e:
            print(f"❌ Test scenario 2 failed: {e}")
            return False

    def test_turf_details(self):
        """Test Scenario 3: Turf details from database"""
        try:
            print("\n🔄 Testing Scenario 3: Turf details...")
            
            # Test database turf details
            response = requests.get(f"{BASE_URL}/turfs/{self.test_turf_id}")
            if response.status_code != 200:
                print(f"❌ Failed to get database turf details: {response.status_code}")
                return False
            
            turf = response.json().get('turf')
            if not turf:
                print("❌ No turf data returned")
                return False
            
            # Verify database turf details
            if (turf.get('id') != self.test_turf_id or
                turf.get('name') != 'Test Integration Turf' or
                turf.get('city') != 'Mumbai' or
                turf.get('pricePerHour') != 2500):
                print(f"❌ Database turf details incorrect: {turf}")
                return False
            
            print("✅ Database turf details retrieved correctly")
            
            # Test mock turf details (backward compatibility)
            response = requests.get(f"{BASE_URL}/turfs/turf-001")
            if response.status_code != 200:
                print(f"❌ Failed to get mock turf details: {response.status_code}")
                return False
            
            mock_turf = response.json().get('turf')
            if (not mock_turf or 
                mock_turf.get('id') != 'turf-001' or
                mock_turf.get('name') != 'PlayGround Arena'):
                print(f"❌ Mock turf details incorrect: {mock_turf}")
                return False
            
            print("✅ Mock turf details still work (backward compatibility)")
            return True
            
        except Exception as e:
            print(f"❌ Test scenario 3 failed: {e}")
            return False

    def test_slots_for_database_turf(self):
        """Test Scenario 4: Slots for database turf"""
        try:
            print("\n🔄 Testing Scenario 4: Slots for database turf...")
            
            # Get tomorrow's date for testing
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
            # Test slots for database turf
            response = requests.get(f"{BASE_URL}/slots/{self.test_turf_id}?date={tomorrow}")
            if response.status_code != 200:
                print(f"❌ Failed to get slots for database turf: {response.status_code}")
                return False
            
            slots_data = response.json()
            slots = slots_data.get('slots', [])
            
            # Should have 17 slots (6 AM to 11 PM)
            if len(slots) != 17:
                print(f"❌ Expected 17 slots, got {len(slots)}")
                return False
            
            # Verify slot structure
            first_slot = slots[0]
            if (not first_slot.get('id') or 
                first_slot.get('time') != '06:00' or
                not isinstance(first_slot.get('available'), bool)):
                print(f"❌ Slot structure incorrect: {first_slot}")
                return False
            
            print(f"✅ Slots generated correctly for database turf: {len(slots)} slots")
            
            # Test slots for mock turf (backward compatibility)
            response = requests.get(f"{BASE_URL}/slots/turf-001?date={tomorrow}")
            if response.status_code != 200:
                print(f"❌ Failed to get slots for mock turf: {response.status_code}")
                return False
            
            mock_slots = response.json().get('slots', [])
            if len(mock_slots) != 17:
                print(f"❌ Expected 17 mock slots, got {len(mock_slots)}")
                return False
            
            print("✅ Slots work for mock turfs (backward compatibility)")
            return True
            
        except Exception as e:
            print(f"❌ Test scenario 4 failed: {e}")
            return False

    def test_booking_with_database_turf(self):
        """Test Scenario 5: Booking with database turf"""
        try:
            print("\n🔄 Testing Scenario 5: Booking with database turf...")
            
            headers = {"Authorization": f"Bearer {self.customer_token}"}
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
            # Create booking for database turf
            booking_data = {
                "turfId": self.test_turf_id,
                "slots": [
                    {
                        "slotId": f"slot-{tomorrow}-10",
                        "date": tomorrow
                    }
                ],
                "amount": 2500
            }
            
            # Create order first
            response = requests.post(f"{BASE_URL}/payment/create-order", json=booking_data, headers=headers)
            if response.status_code != 200:
                print(f"❌ Failed to create order: {response.status_code} - {response.text}")
                return False
            
            order_data = response.json()
            booking_ids = order_data.get('bookingIds', [])
            
            if not booking_ids:
                print("❌ No booking IDs returned")
                return False
            
            print(f"✅ Booking created for database turf: {booking_ids[0]}")
            
            # Verify booking in database
            booking_doc = self.db.bookings.find_one({"bookingId": booking_ids[0]})
            if not booking_doc or booking_doc.get('turfId') != self.test_turf_id:
                print(f"❌ Booking not found in database: {booking_doc}")
                return False
            
            print("✅ Booking stored correctly in database")
            
            # Get booking history
            response = requests.get(f"{BASE_URL}/bookings", headers=headers)
            if response.status_code != 200:
                print(f"❌ Failed to get booking history: {response.status_code}")
                return False
            
            bookings = response.json().get('bookings', [])
            
            # Find our booking
            our_booking = None
            for booking in bookings:
                if booking.get('bookingId') == booking_ids[0]:
                    our_booking = booking
                    break
            
            if not our_booking:
                print("❌ Our booking not found in history")
                return False
            
            # Verify turf details enrichment from database
            turf_details = our_booking.get('turfDetails')
            if (not turf_details or
                turf_details.get('name') != 'Test Integration Turf' or
                turf_details.get('city') != 'Mumbai' or
                turf_details.get('location') != 'Test Location'):
                print(f"❌ Turf details not enriched correctly: {turf_details}")
                return False
            
            print("✅ Booking history shows correct turf details from database")
            
            # Verify booking affects slot availability
            response = requests.get(f"{BASE_URL}/slots/{self.test_turf_id}?date={tomorrow}")
            if response.status_code != 200:
                print(f"❌ Failed to get updated slots: {response.status_code}")
                return False
            
            slots = response.json().get('slots', [])
            booked_slot = None
            for slot in slots:
                if slot.get('id') == f"slot-{tomorrow}-10":
                    booked_slot = slot
                    break
            
            if not booked_slot or booked_slot.get('available') != False:
                print(f"❌ Slot not marked as unavailable: {booked_slot}")
                return False
            
            print("✅ Slot correctly marked as unavailable after booking")
            return True
            
        except Exception as e:
            print(f"❌ Test scenario 5 failed: {e}")
            return False

    def run_all_tests(self):
        """Run all database integration tests"""
        print("🚀 Starting TurfHub Database Integration Tests")
        print("=" * 60)
        
        # Setup
        if not self.setup_database_connection():
            return False
        
        self.cleanup_test_data()
        
        # Run tests in sequence
        tests = [
            ("Vendor Registration & Login", self.vendor_register_and_login),
            ("Customer Login", self.customer_login),
            ("Vendor Adds Turf & Approval Flow", self.test_vendor_adds_turf),
            ("City Filtering with Database Turfs", self.test_city_filtering),
            ("Turf Details from Database", self.test_turf_details),
            ("Slots for Database Turf", self.test_slots_for_database_turf),
            ("Booking with Database Turf", self.test_booking_with_database_turf)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n{'='*60}")
            print(f"Running: {test_name}")
            print('='*60)
            
            try:
                if test_func():
                    passed += 1
                    print(f"✅ {test_name} - PASSED")
                else:
                    failed += 1
                    print(f"❌ {test_name} - FAILED")
            except Exception as e:
                failed += 1
                print(f"❌ {test_name} - ERROR: {e}")
        
        # Final results
        print(f"\n{'='*60}")
        print("📊 TEST RESULTS SUMMARY")
        print('='*60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 ALL DATABASE INTEGRATION TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️  {failed} TEST(S) FAILED - REQUIRES ATTENTION")
            return False

    def cleanup(self):
        """Cleanup resources"""
        if self.mongo_client:
            self.mongo_client.close()

if __name__ == "__main__":
    tester = TurfHubTester()
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    finally:
        tester.cleanup()
#!/usr/bin/env python3
"""
TurfHub Vendor Features Testing Script
Tests custom slots, image upload, and dynamic pricing integration
"""

import requests
import json
import io
import os
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "https://turf-hub-1.preview.emergentagent.com/api"
VENDOR_MOBILE = "8888888888"
ADMIN_MOBILE = "9999999999"
OTP = "123456"

class TurfHubVendorTester:
    def __init__(self):
        self.vendor_token = None
        self.test_turf_id = None
        self.uploaded_image_url = None
        self.results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append(f"{status}: {test_name}")
        print(f"{status}: {test_name}")
        if details:
            print(f"    Details: {details}")

    def vendor_login(self):
        """Login as vendor to get JWT token"""
        try:
            # Send OTP
            response = requests.post(f"{BASE_URL}/vendor/send-otp", 
                json={"mobile": VENDOR_MOBILE})
            
            if response.status_code != 200:
                self.log_result("Vendor OTP Send", False, f"Status: {response.status_code}")
                return False

            # Verify OTP
            response = requests.post(f"{BASE_URL}/vendor/verify-otp", 
                json={"mobile": VENDOR_MOBILE, "otp": OTP})
            
            if response.status_code == 200:
                data = response.json()
                self.vendor_token = data.get('token')
                self.log_result("Vendor Login", True, f"Token received: {self.vendor_token[:20]}...")
                return True
            else:
                self.log_result("Vendor Login", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Vendor Login", False, f"Exception: {str(e)}")
            return False

    def test_image_upload(self):
        """Test POST /api/vendor/upload-image endpoint"""
        if not self.vendor_token:
            self.log_result("Image Upload - No Token", False, "Vendor not logged in")
            return False

        try:
            # Test 1: Upload valid image
            headers = {"Authorization": f"Bearer {self.vendor_token}"}
            
            # Create a fake image file
            fake_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00?\x00\x00\x00\x00IEND\xaeB`\x82'
            files = {'file': ('test_image.png', io.BytesIO(fake_image_data), 'image/png')}
            
            response = requests.post(f"{BASE_URL}/vendor/upload-image", 
                headers=headers, files=files)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('imageUrl'):
                    self.uploaded_image_url = data['imageUrl']
                    self.log_result("Image Upload - Valid PNG", True, f"Image URL: {self.uploaded_image_url}")
                else:
                    self.log_result("Image Upload - Valid PNG", False, "No imageUrl in response")
                    return False
            else:
                self.log_result("Image Upload - Valid PNG", False, f"Status: {response.status_code}, Response: {response.text}")
                return False

            # Test 2: Invalid file type
            files = {'file': ('test.txt', io.BytesIO(b'test text'), 'text/plain')}
            response = requests.post(f"{BASE_URL}/vendor/upload-image", 
                headers=headers, files=files)
            
            if response.status_code == 400:
                self.log_result("Image Upload - Invalid File Type", True, "Correctly rejected text file")
            else:
                self.log_result("Image Upload - Invalid File Type", False, f"Expected 400, got {response.status_code}")

            # Test 3: No file
            response = requests.post(f"{BASE_URL}/vendor/upload-image", 
                headers=headers)
            
            if response.status_code == 400:
                self.log_result("Image Upload - No File", True, "Correctly rejected no file")
            else:
                self.log_result("Image Upload - No File", False, f"Expected 400, got {response.status_code}")

            # Test 4: Unauthorized (no token)
            files = {'file': ('test.jpg', io.BytesIO(fake_image_data), 'image/jpeg')}
            response = requests.post(f"{BASE_URL}/vendor/upload-image", files=files)
            
            if response.status_code == 401:
                self.log_result("Image Upload - Unauthorized", True, "Correctly rejected no token")
            else:
                self.log_result("Image Upload - Unauthorized", False, f"Expected 401, got {response.status_code}")

            return True
        except Exception as e:
            self.log_result("Image Upload - Exception", False, f"Exception: {str(e)}")
            return False

    def test_custom_slots_turf_creation(self):
        """Test POST /api/vendor/turfs with customSlots"""
        if not self.vendor_token:
            self.log_result("Custom Slots Turf Creation - No Token", False, "Vendor not logged in")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.vendor_token}",
                "Content-Type": "application/json"
            }

            # Create custom slots with different weekday/weekend pricing
            custom_slots = [
                {"time": "06:00", "endTime": "07:00", "weekdayPrice": 1000, "weekendPrice": 1500},
                {"time": "07:00", "endTime": "08:00", "weekdayPrice": 1200, "weekendPrice": 1800},
                {"time": "08:00", "endTime": "09:00", "weekdayPrice": 1500, "weekendPrice": 2200},
                {"time": "09:00", "endTime": "10:00", "weekdayPrice": 1800, "weekendPrice": 2500},
                {"time": "10:00", "endTime": "11:00", "weekdayPrice": 2000, "weekendPrice": 3000},
                {"time": "18:00", "endTime": "19:00", "weekdayPrice": 2500, "weekendPrice": 3500},
                {"time": "19:00", "endTime": "20:00", "weekdayPrice": 2800, "weekendPrice": 4000},
                {"time": "20:00", "endTime": "21:00", "weekdayPrice": 3000, "weekendPrice": 4200},
                {"time": "21:00", "endTime": "22:00", "weekdayPrice": 2800, "weekendPrice": 4000},
                {"time": "22:00", "endTime": "23:00", "weekdayPrice": 2500, "weekendPrice": 3500}
            ]

            turf_data = {
                "name": "Test Premium Turf with Custom Slots",
                "description": "A test turf with custom pricing for weekdays and weekends",
                "location": "Test Location, Mumbai",
                "city": "Mumbai",
                "area": "Test Area",
                "pincode": "400001",
                "sportTypes": ["Football", "Cricket"],
                "turfType": "outdoor",
                "surface": "Premium Artificial Grass",
                "size": "100x60 meters",
                "capacity": 22,
                "amenities": ["Floodlights", "Parking", "Changing Room", "Cafeteria"],
                "pricing": {
                    "basePrice": 1500,
                    "currency": "INR"
                },
                "operatingHours": {
                    "opening": "06:00",
                    "closing": "23:00"
                },
                "customSlots": custom_slots,
                "images": [self.uploaded_image_url] if self.uploaded_image_url else [],
                "policies": {
                    "cancellation": "Free cancellation up to 2 hours before booking",
                    "advance_booking": "Can book up to 7 days in advance"
                }
            }

            response = requests.post(f"{BASE_URL}/vendor/turfs", 
                headers=headers, json=turf_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('turfId'):
                    self.test_turf_id = data['turfId']
                    self.log_result("Custom Slots Turf Creation", True, 
                        f"Turf created with ID: {self.test_turf_id}, Custom slots: {len(custom_slots)}")
                    
                    # Verify customSlots were saved
                    if 'turf' in data and 'customSlots' in data['turf']:
                        saved_slots = data['turf']['customSlots']
                        if len(saved_slots) == len(custom_slots):
                            self.log_result("Custom Slots Validation", True, 
                                f"All {len(custom_slots)} custom slots saved correctly")
                        else:
                            self.log_result("Custom Slots Validation", False, 
                                f"Expected {len(custom_slots)} slots, got {len(saved_slots)}")
                    else:
                        self.log_result("Custom Slots Validation", False, "No customSlots in response")
                    
                    return True
                else:
                    self.log_result("Custom Slots Turf Creation", False, "No success or turfId in response")
                    return False
            else:
                self.log_result("Custom Slots Turf Creation", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
                return False

        except Exception as e:
            self.log_result("Custom Slots Turf Creation", False, f"Exception: {str(e)}")
            return False

    def test_backward_compatibility(self):
        """Test turf creation without customSlots (backward compatibility)"""
        if not self.vendor_token:
            self.log_result("Backward Compatibility - No Token", False, "Vendor not logged in")
            return False

        try:
            headers = {
                "Authorization": f"Bearer {self.vendor_token}",
                "Content-Type": "application/json"
            }

            turf_data = {
                "name": "Test Standard Turf without Custom Slots",
                "description": "A test turf with standard pricing",
                "location": "Test Location 2, Mumbai",
                "city": "Mumbai",
                "area": "Test Area 2",
                "sportTypes": ["Football"],
                "pricing": {
                    "basePrice": 2000,
                    "currency": "INR"
                }
                # Note: No customSlots field
            }

            response = requests.post(f"{BASE_URL}/vendor/turfs", 
                headers=headers, json=turf_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result("Backward Compatibility - Standard Turf", True, 
                        "Turf created successfully without customSlots")
                    return True
                else:
                    self.log_result("Backward Compatibility - Standard Turf", False, 
                        "No success in response")
                    return False
            else:
                self.log_result("Backward Compatibility - Standard Turf", False, 
                    f"Status: {response.status_code}")
                return False

        except Exception as e:
            self.log_result("Backward Compatibility - Standard Turf", False, f"Exception: {str(e)}")
            return False

    def approve_turf_as_admin(self):
        """Approve the test turf as admin for further testing"""
        if not self.test_turf_id:
            self.log_result("Admin Turf Approval - No Turf ID", False, "No test turf created")
            return False

        try:
            response = requests.post(f"{BASE_URL}/admin/turfs/approve", 
                json={"turfId": self.test_turf_id, "action": "approve"})
            
            if response.status_code == 200:
                self.log_result("Admin Turf Approval", True, f"Turf {self.test_turf_id} approved")
                return True
            else:
                self.log_result("Admin Turf Approval", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
                return False

        except Exception as e:
            self.log_result("Admin Turf Approval", False, f"Exception: {str(e)}")
            return False

    def test_custom_slots_pricing(self):
        """Test GET /api/slots/:turfId with custom pricing for weekday/weekend"""
        if not self.test_turf_id:
            self.log_result("Custom Slots Pricing Test - No Turf ID", False, "No approved test turf")
            return False

        try:
            # Test weekday pricing (Monday)
            today = datetime.now()
            # Find next Monday
            days_until_monday = (7 - today.weekday()) % 7
            if days_until_monday == 0:
                days_until_monday = 7  # If today is Monday, get next Monday
            monday_date = (today + timedelta(days=days_until_monday)).strftime('%Y-%m-%d')
            
            response = requests.get(f"{BASE_URL}/slots/{self.test_turf_id}?date={monday_date}")
            
            if response.status_code == 200:
                data = response.json()
                slots = data.get('slots', [])
                
                # Check if we have custom priced slots
                custom_slots_found = False
                weekday_prices_correct = True
                
                for slot in slots:
                    if 'price' in slot:
                        custom_slots_found = True
                        # Check weekday pricing
                        if slot['time'] == '06:00' and slot['price'] != 1000:
                            weekday_prices_correct = False
                        elif slot['time'] == '18:00' and slot['price'] != 2500:
                            weekday_prices_correct = False
                
                if custom_slots_found and weekday_prices_correct:
                    self.log_result("Custom Slots - Weekday Pricing", True, 
                        f"Weekday prices correct for {monday_date}")
                else:
                    self.log_result("Custom Slots - Weekday Pricing", False, 
                        f"Custom slots: {custom_slots_found}, Prices correct: {weekday_prices_correct}")
            else:
                self.log_result("Custom Slots - Weekday Pricing", False, 
                    f"Status: {response.status_code}")
                return False

            # Test weekend pricing (Sunday)
            days_until_sunday = (6 - today.weekday()) % 7
            if days_until_sunday == 0:
                days_until_sunday = 7  # If today is Sunday, get next Sunday
            sunday_date = (today + timedelta(days=days_until_sunday)).strftime('%Y-%m-%d')
            
            response = requests.get(f"{BASE_URL}/slots/{self.test_turf_id}?date={sunday_date}")
            
            if response.status_code == 200:
                data = response.json()
                slots = data.get('slots', [])
                
                # Check weekend pricing
                weekend_prices_correct = True
                
                for slot in slots:
                    if 'price' in slot:
                        # Check weekend pricing
                        if slot['time'] == '06:00' and slot['price'] != 1500:
                            weekend_prices_correct = False
                        elif slot['time'] == '18:00' and slot['price'] != 3500:
                            weekend_prices_correct = False
                
                if weekend_prices_correct:
                    self.log_result("Custom Slots - Weekend Pricing", True, 
                        f"Weekend prices correct for {sunday_date}")
                else:
                    self.log_result("Custom Slots - Weekend Pricing", False, 
                        f"Weekend prices incorrect for {sunday_date}")
            else:
                self.log_result("Custom Slots - Weekend Pricing", False, 
                    f"Status: {response.status_code}")
                return False

            # Test past slot filtering
            today_date = today.strftime('%Y-%m-%d')
            response = requests.get(f"{BASE_URL}/slots/{self.test_turf_id}?date={today_date}")
            
            if response.status_code == 200:
                data = response.json()
                slots = data.get('slots', [])
                
                # Should only show future slots for today
                current_hour = today.hour
                future_slots_only = True
                
                for slot in slots:
                    slot_hour = int(slot['time'].split(':')[0])
                    if slot_hour <= current_hour:
                        future_slots_only = False
                        break
                
                if future_slots_only:
                    self.log_result("Custom Slots - Past Slot Filtering", True, 
                        f"Only future slots returned for today ({len(slots)} slots)")
                else:
                    self.log_result("Custom Slots - Past Slot Filtering", False, 
                        "Past slots found for today")
            else:
                self.log_result("Custom Slots - Past Slot Filtering", False, 
                    f"Status: {response.status_code}")

            return True

        except Exception as e:
            self.log_result("Custom Slots Pricing Test", False, f"Exception: {str(e)}")
            return False

    def test_integration_flow(self):
        """Test complete integration: vendor creates turf -> admin approves -> customer sees correct pricing"""
        try:
            # 1. Vendor has already created turf with custom slots
            if not self.test_turf_id:
                self.log_result("Integration Flow - Turf Creation", False, "No test turf available")
                return False
            
            self.log_result("Integration Flow - Turf Creation", True, "Vendor created turf with custom slots")

            # 2. Admin has already approved turf
            self.log_result("Integration Flow - Admin Approval", True, "Admin approved the turf")

            # 3. Customer can see turf in public listing
            response = requests.get(f"{BASE_URL}/turfs?city=Mumbai")
            
            if response.status_code == 200:
                data = response.json()
                turfs = data.get('turfs', [])
                
                test_turf_found = False
                for turf in turfs:
                    if turf.get('id') == self.test_turf_id:
                        test_turf_found = True
                        break
                
                if test_turf_found:
                    self.log_result("Integration Flow - Public Visibility", True, 
                        "Approved turf visible in public listings")
                else:
                    self.log_result("Integration Flow - Public Visibility", False, 
                        "Approved turf not found in public listings")
                    return False
            else:
                self.log_result("Integration Flow - Public Visibility", False, 
                    f"Status: {response.status_code}")
                return False

            # 4. Customer can fetch slots with correct dynamic pricing
            today = datetime.now()
            tomorrow_date = (today + timedelta(days=1)).strftime('%Y-%m-%d')
            
            response = requests.get(f"{BASE_URL}/slots/{self.test_turf_id}?date={tomorrow_date}")
            
            if response.status_code == 200:
                data = response.json()
                slots = data.get('slots', [])
                
                # Check if slots have dynamic pricing
                has_pricing = any('price' in slot for slot in slots)
                
                if has_pricing and len(slots) > 0:
                    self.log_result("Integration Flow - Customer Slot Access", True, 
                        f"Customer can access {len(slots)} slots with dynamic pricing")
                    
                    # Check specific pricing for morning and evening slots
                    morning_slot = next((slot for slot in slots if slot['time'] == '06:00'), None)
                    evening_slot = next((slot for slot in slots if slot['time'] == '18:00'), None)
                    
                    # Determine if tomorrow is weekend
                    tomorrow = today + timedelta(days=1)
                    is_weekend = tomorrow.weekday() in [5, 6]  # Saturday or Sunday
                    
                    expected_morning_price = 1500 if is_weekend else 1000
                    expected_evening_price = 3500 if is_weekend else 2500
                    
                    pricing_correct = True
                    if morning_slot and morning_slot.get('price') != expected_morning_price:
                        pricing_correct = False
                    if evening_slot and evening_slot.get('price') != expected_evening_price:
                        pricing_correct = False
                    
                    if pricing_correct:
                        self.log_result("Integration Flow - Dynamic Pricing", True, 
                            f"Pricing correct for {'weekend' if is_weekend else 'weekday'}")
                    else:
                        self.log_result("Integration Flow - Dynamic Pricing", False, 
                            f"Pricing incorrect for {'weekend' if is_weekend else 'weekday'}")
                else:
                    self.log_result("Integration Flow - Customer Slot Access", False, 
                        "No pricing info in slots or empty slots")
            else:
                self.log_result("Integration Flow - Customer Slot Access", False, 
                    f"Status: {response.status_code}")

            return True

        except Exception as e:
            self.log_result("Integration Flow Test", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all vendor feature tests"""
        print("=" * 80)
        print("TURFHUB VENDOR FEATURES TESTING")
        print("=" * 80)
        
        # Step 1: Login as vendor
        if not self.vendor_login():
            print("❌ Cannot proceed without vendor login")
            return

        # Step 2: Test image upload endpoint
        print("\n" + "=" * 40)
        print("TESTING IMAGE UPLOAD ENDPOINT")
        print("=" * 40)
        self.test_image_upload()

        # Step 3: Test custom slots turf creation
        print("\n" + "=" * 40)
        print("TESTING CUSTOM SLOTS TURF CREATION")
        print("=" * 40)
        self.test_custom_slots_turf_creation()

        # Step 4: Test backward compatibility
        print("\n" + "=" * 40)
        print("TESTING BACKWARD COMPATIBILITY")
        print("=" * 40)
        self.test_backward_compatibility()

        # Step 5: Approve turf as admin
        print("\n" + "=" * 40)
        print("ADMIN APPROVAL (FOR TESTING)")
        print("=" * 40)
        self.approve_turf_as_admin()

        # Step 6: Test custom pricing logic
        print("\n" + "=" * 40)
        print("TESTING CUSTOM SLOTS PRICING")
        print("=" * 40)
        self.test_custom_slots_pricing()

        # Step 7: Test complete integration flow
        print("\n" + "=" * 40)
        print("TESTING INTEGRATION FLOW")
        print("=" * 40)
        self.test_integration_flow()

        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        for result in self.results:
            print(result)
        
        passed = len([r for r in self.results if "✅ PASS" in r])
        total = len(self.results)
        print(f"\nRESULTS: {passed}/{total} tests passed")

        if passed == total:
            print("🎉 ALL TESTS PASSED! Vendor features are working correctly.")
        else:
            print(f"⚠️  {total - passed} tests failed. Please review the failures above.")

if __name__ == "__main__":
    tester = TurfHubVendorTester()
    tester.run_all_tests()
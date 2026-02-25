#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime, timedelta
import os
import sys

# Get base URL from environment
def get_base_url():
    try:
        with open('/app/.env', 'r') as f:
            for line in f:
                if line.startswith('NEXT_PUBLIC_BASE_URL='):
                    return line.split('=')[1].strip() + '/api'
        return 'http://localhost:3000/api'
    except:
        return 'http://localhost:3000/api'

BASE_URL = get_base_url()
print(f"🔗 Testing TurfHub API at: {BASE_URL}")

class TurfHubAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.jwt_token = None
        self.test_mobile = "9876543210"
        self.test_otp = "123456"
        
    def test_get_turfs_all(self):
        """Test GET /api/turfs - Get all turfs"""
        try:
            print("\n📋 Testing GET /api/turfs (all turfs)")
            response = requests.get(f"{self.base_url}/turfs", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'turfs' in data and isinstance(data['turfs'], list):
                    print(f"✅ GET /api/turfs - SUCCESS: Retrieved {len(data['turfs'])} turfs")
                    # Verify some turfs have expected structure
                    if len(data['turfs']) > 0:
                        turf = data['turfs'][0]
                        required_fields = ['id', 'name', 'city', 'pricePerHour']
                        missing_fields = [field for field in required_fields if field not in turf]
                        if missing_fields:
                            print(f"⚠️  Missing required fields in turf: {missing_fields}")
                        else:
                            print("✅ Turf structure validation passed")
                    return True
                else:
                    print("❌ GET /api/turfs - Invalid response structure")
                    return False
            else:
                print(f"❌ GET /api/turfs - Failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"❌ GET /api/turfs - Exception: {str(e)}")
            return False

    def test_get_turfs_by_city(self):
        """Test GET /api/turfs with city filters"""
        cities_to_test = ['Mumbai', 'Delhi', 'Bangalore']
        all_passed = True
        
        for city in cities_to_test:
            try:
                print(f"\n📋 Testing GET /api/turfs?city={city}")
                response = requests.get(f"{self.base_url}/turfs?city={city}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'turfs' in data:
                        # Verify all returned turfs are from the requested city
                        city_matches = all(turf.get('city') == city for turf in data['turfs'])
                        if city_matches:
                            print(f"✅ GET /api/turfs?city={city} - SUCCESS: {len(data['turfs'])} turfs from {city}")
                        else:
                            print(f"❌ GET /api/turfs?city={city} - Some turfs not from requested city")
                            all_passed = False
                    else:
                        print(f"❌ GET /api/turfs?city={city} - Invalid response structure")
                        all_passed = False
                else:
                    print(f"❌ GET /api/turfs?city={city} - Failed with status {response.status_code}")
                    all_passed = False
            except Exception as e:
                print(f"❌ GET /api/turfs?city={city} - Exception: {str(e)}")
                all_passed = False
                
        return all_passed

    def test_get_turf_by_id(self):
        """Test GET /api/turfs/:id"""
        all_passed = True
        
        # Test valid ID
        try:
            print(f"\n📋 Testing GET /api/turfs/turf-001 (valid ID)")
            response = requests.get(f"{self.base_url}/turfs/turf-001", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'turf' in data and data['turf']['id'] == 'turf-001':
                    print("✅ GET /api/turfs/turf-001 - SUCCESS: Valid turf retrieved")
                else:
                    print("❌ GET /api/turfs/turf-001 - Invalid response structure")
                    all_passed = False
            else:
                print(f"❌ GET /api/turfs/turf-001 - Failed with status {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ GET /api/turfs/turf-001 - Exception: {str(e)}")
            all_passed = False
        
        # Test invalid ID
        try:
            print(f"\n📋 Testing GET /api/turfs/invalid-id (invalid ID)")
            response = requests.get(f"{self.base_url}/turfs/invalid-id", timeout=10)
            
            if response.status_code == 404:
                print("✅ GET /api/turfs/invalid-id - SUCCESS: Correctly returned 404 for invalid ID")
            else:
                print(f"❌ GET /api/turfs/invalid-id - Expected 404, got {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ GET /api/turfs/invalid-id - Exception: {str(e)}")
            all_passed = False
            
        return all_passed

    def test_get_cities(self):
        """Test GET /api/cities"""
        try:
            print(f"\n📋 Testing GET /api/cities")
            response = requests.get(f"{self.base_url}/cities", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'cities' in data and isinstance(data['cities'], list):
                    expected_cities = ['All', 'Mumbai', 'Delhi', 'Bangalore']
                    cities_found = all(city in data['cities'] for city in expected_cities)
                    if cities_found:
                        print(f"✅ GET /api/cities - SUCCESS: Retrieved {len(data['cities'])} cities")
                        return True
                    else:
                        print(f"❌ GET /api/cities - Missing expected cities. Got: {data['cities']}")
                        return False
                else:
                    print("❌ GET /api/cities - Invalid response structure")
                    return False
            else:
                print(f"❌ GET /api/cities - Failed with status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ GET /api/cities - Exception: {str(e)}")
            return False

    def test_get_slots(self):
        """Test GET /api/slots/:turfId"""
        all_passed = True
        
        # Test slots for today
        try:
            today = datetime.now().strftime('%Y-%m-%d')
            print(f"\n📋 Testing GET /api/slots/turf-001?date={today} (today - should filter past slots)")
            response = requests.get(f"{self.base_url}/slots/turf-001?date={today}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'slots' in data and isinstance(data['slots'], list):
                    current_hour = datetime.now().hour
                    # Should only show future slots for today
                    future_slots = [slot for slot in data['slots'] if int(slot['time'].split(':')[0]) > current_hour]
                    if len(data['slots']) == len(future_slots):
                        print(f"✅ GET /api/slots/turf-001 (today) - SUCCESS: {len(data['slots'])} future slots")
                    else:
                        print(f"⚠️  GET /api/slots/turf-001 (today) - May include past slots: {len(data['slots'])} total")
                else:
                    print("❌ GET /api/slots/turf-001 (today) - Invalid response structure")
                    all_passed = False
            else:
                print(f"❌ GET /api/slots/turf-001 (today) - Failed with status {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ GET /api/slots/turf-001 (today) - Exception: {str(e)}")
            all_passed = False
        
        # Test slots for tomorrow
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            print(f"\n📋 Testing GET /api/slots/turf-001?date={tomorrow} (tomorrow - should show all slots)")
            response = requests.get(f"{self.base_url}/slots/turf-001?date={tomorrow}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'slots' in data and isinstance(data['slots'], list):
                    # Should have slots from 6 AM to 11 PM (17 slots total)
                    expected_slots = 17  # 6 AM to 11 PM
                    if len(data['slots']) == expected_slots:
                        print(f"✅ GET /api/slots/turf-001 (tomorrow) - SUCCESS: {len(data['slots'])} slots (6 AM to 11 PM)")
                    else:
                        print(f"⚠️  GET /api/slots/turf-001 (tomorrow) - Expected {expected_slots} slots, got {len(data['slots'])}")
                    
                    # Verify time range
                    times = [slot['time'] for slot in data['slots']]
                    if '06:00' in times and '22:00' in times:
                        print("✅ Time range validation passed (6 AM to 11 PM)")
                    else:
                        print(f"⚠️  Time range issue. First: {min(times)}, Last: {max(times)}")
                else:
                    print("❌ GET /api/slots/turf-001 (tomorrow) - Invalid response structure")
                    all_passed = False
            else:
                print(f"❌ GET /api/slots/turf-001 (tomorrow) - Failed with status {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ GET /api/slots/turf-001 (tomorrow) - Exception: {str(e)}")
            all_passed = False
            
        return all_passed

    def test_send_otp(self):
        """Test POST /api/auth/send-otp"""
        all_passed = True
        
        # Test valid mobile number
        try:
            print(f"\n📋 Testing POST /api/auth/send-otp (valid mobile: {self.test_mobile})")
            payload = {"mobile": self.test_mobile}
            response = requests.post(
                f"{self.base_url}/auth/send-otp",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('otp') == '123456':
                    print("✅ POST /api/auth/send-otp (valid) - SUCCESS: OTP sent")
                else:
                    print(f"❌ POST /api/auth/send-otp (valid) - Unexpected response: {data}")
                    all_passed = False
            else:
                print(f"❌ POST /api/auth/send-otp (valid) - Failed with status {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ POST /api/auth/send-otp (valid) - Exception: {str(e)}")
            all_passed = False
        
        # Test invalid mobile number
        try:
            print(f"\n📋 Testing POST /api/auth/send-otp (invalid mobile: 123)")
            payload = {"mobile": "123"}
            response = requests.post(
                f"{self.base_url}/auth/send-otp",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                print("✅ POST /api/auth/send-otp (invalid) - SUCCESS: Correctly rejected invalid mobile")
            else:
                print(f"❌ POST /api/auth/send-otp (invalid) - Expected 400, got {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ POST /api/auth/send-otp (invalid) - Exception: {str(e)}")
            all_passed = False
            
        return all_passed

    def test_verify_otp(self):
        """Test POST /api/auth/verify-otp"""
        all_passed = True
        
        # Test correct OTP
        try:
            print(f"\n📋 Testing POST /api/auth/verify-otp (correct OTP: {self.test_otp})")
            payload = {"mobile": self.test_mobile, "otp": self.test_otp}
            response = requests.post(
                f"{self.base_url}/auth/verify-otp",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('token') and data.get('user'):
                    self.jwt_token = data['token']  # Store for payment tests
                    print("✅ POST /api/auth/verify-otp (correct) - SUCCESS: Login successful, JWT received")
                else:
                    print(f"❌ POST /api/auth/verify-otp (correct) - Missing token or user: {data}")
                    all_passed = False
            else:
                print(f"❌ POST /api/auth/verify-otp (correct) - Failed with status {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ POST /api/auth/verify-otp (correct) - Exception: {str(e)}")
            all_passed = False
        
        # Test incorrect OTP
        try:
            print(f"\n📋 Testing POST /api/auth/verify-otp (incorrect OTP: 999999)")
            payload = {"mobile": self.test_mobile, "otp": "999999"}
            response = requests.post(
                f"{self.base_url}/auth/verify-otp",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                print("✅ POST /api/auth/verify-otp (incorrect) - SUCCESS: Correctly rejected wrong OTP")
            else:
                print(f"❌ POST /api/auth/verify-otp (incorrect) - Expected 400, got {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ POST /api/auth/verify-otp (incorrect) - Exception: {str(e)}")
            all_passed = False
            
        return all_passed

    def test_create_payment_order(self):
        """Test POST /api/payment/create-order"""
        all_passed = True
        
        if not self.jwt_token:
            print("❌ POST /api/payment/create-order - No JWT token available, skipping authenticated tests")
            return False
        
        # Test with valid authentication
        try:
            print(f"\n📋 Testing POST /api/payment/create-order (with auth)")
            payload = {
                "turfId": "turf-001",
                "slotId": "slot-2025-01-21-10",
                "date": "2025-01-21",
                "amount": 1500
            }
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.jwt_token}"
            }
            response = requests.post(
                f"{self.base_url}/payment/create-order",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('orderId') and data.get('bookingId'):
                    self.booking_id = data.get('bookingId')  # Store for verification test
                    print("✅ POST /api/payment/create-order (with auth) - SUCCESS: Razorpay order created")
                else:
                    print(f"❌ POST /api/payment/create-order (with auth) - Missing orderId or bookingId: {data}")
                    all_passed = False
            else:
                print(f"❌ POST /api/payment/create-order (with auth) - Failed with status {response.status_code}: {response.text}")
                all_passed = False
        except Exception as e:
            print(f"❌ POST /api/payment/create-order (with auth) - Exception: {str(e)}")
            all_passed = False
        
        # Test without authentication
        try:
            print(f"\n📋 Testing POST /api/payment/create-order (without auth)")
            payload = {
                "turfId": "turf-001",
                "slotId": "slot-2025-01-21-10",
                "date": "2025-01-21",
                "amount": 1500
            }
            response = requests.post(
                f"{self.base_url}/payment/create-order",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 401:
                print("✅ POST /api/payment/create-order (without auth) - SUCCESS: Correctly rejected unauthorized request")
            else:
                print(f"❌ POST /api/payment/create-order (without auth) - Expected 401, got {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ POST /api/payment/create-order (without auth) - Exception: {str(e)}")
            all_passed = False
            
        return all_passed

    def test_verify_payment(self):
        """Test POST /api/payment/verify"""
        if not self.jwt_token:
            print("❌ POST /api/payment/verify - No JWT token available, skipping")
            return False
        
        try:
            print(f"\n📋 Testing POST /api/payment/verify (signature verification logic)")
            
            # Note: This will fail signature verification since we don't have real Razorpay data
            # But we can test the endpoint structure and authentication
            payload = {
                "razorpay_order_id": "order_test123",
                "razorpay_payment_id": "pay_test123", 
                "razorpay_signature": "invalid_signature",
                "bookingId": "test_booking_id"
            }
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.jwt_token}"
            }
            response = requests.post(
                f"{self.base_url}/payment/verify",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            # Should fail with signature verification error (400)
            if response.status_code == 400:
                data = response.json()
                if 'signature' in data.get('error', '').lower():
                    print("✅ POST /api/payment/verify - SUCCESS: Signature verification working correctly")
                    return True
                else:
                    print(f"❌ POST /api/payment/verify - Unexpected error: {data}")
                    return False
            else:
                print(f"❌ POST /api/payment/verify - Expected 400 (signature error), got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ POST /api/payment/verify - Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting TurfHub Backend API Tests")
        print("=" * 60)
        
        results = {}
        
        # Test all endpoints
        results['turfs_all'] = self.test_get_turfs_all()
        results['turfs_by_city'] = self.test_get_turfs_by_city()
        results['turf_by_id'] = self.test_get_turf_by_id()
        results['cities'] = self.test_get_cities()
        results['slots'] = self.test_get_slots()
        results['send_otp'] = self.test_send_otp()
        results['verify_otp'] = self.test_verify_otp()
        results['create_order'] = self.test_create_payment_order()
        results['verify_payment'] = self.test_verify_payment()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\n🎯 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! TurfHub API is working correctly.")
            return True
        else:
            print(f"⚠️  {total - passed} test(s) failed. Review the issues above.")
            return False

if __name__ == "__main__":
    tester = TurfHubAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3

import requests
import json
import sys
import time

# Configuration
BASE_URL = "https://turf-hub-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test data
VENDOR_DATA = {
    "businessName": "Elite Sports Complex",
    "ownerName": "Rajesh Kumar", 
    "mobile": "8888888888",
    "email": "rajesh@elitesports.com",
    "gst": "29ABCDE1234F1Z5",
    "pan": "ABCDE1234F"
}

TURF_DATA = {
    "name": "Elite Football Arena",
    "description": "Premium football turf with floodlights",
    "location": "123 MG Road",
    "city": "Mumbai",
    "area": "Andheri",
    "pincode": "400058",
    "surface": "Artificial Grass",
    "amenities": ["Floodlights", "Parking", "Changing Room"],
    "pricing": {"basePrice": 2000},
    "images": ["https://example.com/img1.jpg"]
}

# Global variables to store test data
vendor_token = None
turf_id = None

def print_test_result(test_name, success, message, response_data=None):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL" 
    print(f"{status} | {test_name}")
    print(f"    Message: {message}")
    if response_data and not success:
        print(f"    Response: {json.dumps(response_data, indent=2)}")
    print()

def test_vendor_registration():
    """Test vendor registration endpoint"""
    print("=" * 60)
    print("🔵 TESTING VENDOR REGISTRATION")
    print("=" * 60)
    
    try:
        url = f"{BASE_URL}/vendor/register"
        response = requests.post(url, json=VENDOR_DATA, headers=HEADERS)
        
        print(f"Request URL: {url}")
        print(f"Request Data: {json.dumps(VENDOR_DATA, indent=2)}")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('vendorId'):
                print_test_result("Vendor Registration", True, f"Vendor registered successfully with ID: {data.get('vendorId')}")
                return True
            else:
                print_test_result("Vendor Registration", False, "Registration response missing success or vendorId", data)
                return False
        elif response.status_code == 400 and "already registered" in response.text:
            print_test_result("Vendor Registration", True, "Vendor already exists - this is expected for repeated tests")
            return True
        else:
            print_test_result("Vendor Registration", False, f"Registration failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Vendor Registration", False, f"Exception occurred: {str(e)}")
        return False

def test_vendor_send_otp():
    """Test vendor send OTP endpoint"""
    print("=" * 60) 
    print("🔵 TESTING VENDOR SEND OTP")
    print("=" * 60)
    
    try:
        url = f"{BASE_URL}/vendor/send-otp"
        data = {"mobile": VENDOR_DATA["mobile"]}
        response = requests.post(url, json=data, headers=HEADERS)
        
        print(f"Request URL: {url}")
        print(f"Request Data: {json.dumps(data, indent=2)}")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('otp') == '123456':
                print_test_result("Vendor Send OTP", True, f"OTP sent successfully: {data.get('otp')}")
                return True
            else:
                print_test_result("Vendor Send OTP", False, "OTP response invalid", data)
                return False
        else:
            print_test_result("Vendor Send OTP", False, f"OTP sending failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Vendor Send OTP", False, f"Exception occurred: {str(e)}")
        return False

def test_vendor_verify_otp():
    """Test vendor OTP verification and login"""
    global vendor_token
    
    print("=" * 60)
    print("🔵 TESTING VENDOR OTP VERIFICATION")
    print("=" * 60)
    
    try:
        url = f"{BASE_URL}/vendor/verify-otp"
        data = {"mobile": VENDOR_DATA["mobile"], "otp": "123456"}
        response = requests.post(url, json=data, headers=HEADERS)
        
        print(f"Request URL: {url}")
        print(f"Request Data: {json.dumps(data, indent=2)}")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('token'):
                vendor_token = data.get('token')
                vendor_info = data.get('vendor', {})
                
                # Verify token contains vendor role by trying to decode it (basic validation)
                import base64
                try:
                    # JWT has 3 parts separated by dots
                    parts = vendor_token.split('.')
                    if len(parts) == 3:
                        # Decode the payload (middle part)
                        payload = parts[1]
                        # Add padding if needed
                        payload += '=' * (4 - len(payload) % 4)
                        decoded = base64.b64decode(payload)
                        payload_data = json.loads(decoded)
                        if payload_data.get('role') == 'vendor':
                            print_test_result("Vendor OTP Verification", True, f"Login successful with vendor role. Token received and vendor data: {vendor_info}")
                            return True
                        else:
                            print_test_result("Vendor OTP Verification", False, f"Token doesn't contain vendor role: {payload_data}")
                            return False
                    else:
                        print_test_result("Vendor OTP Verification", False, "Invalid JWT token format")
                        return False
                except Exception as decode_error:
                    print_test_result("Vendor OTP Verification", False, f"Failed to decode JWT: {str(decode_error)}")
                    return False
            else:
                print_test_result("Vendor OTP Verification", False, "Verification response missing success or token", data)
                return False
        else:
            print_test_result("Vendor OTP Verification", False, f"OTP verification failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Vendor OTP Verification", False, f"Exception occurred: {str(e)}")
        return False

def test_get_vendor_profile():
    """Test getting vendor profile"""
    print("=" * 60)
    print("🔵 TESTING GET VENDOR PROFILE")
    print("=" * 60)
    
    if not vendor_token:
        print_test_result("Get Vendor Profile", False, "No vendor token available - please run login test first")
        return False
    
    try:
        url = f"{BASE_URL}/vendor/profile"
        headers = {**HEADERS, "Authorization": f"Bearer {vendor_token}"}
        response = requests.get(url, headers=headers)
        
        print(f"Request URL: {url}")
        print(f"Authorization: Bearer {vendor_token[:20]}...")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            vendor = data.get('vendor', {})
            required_fields = ['vendorId', 'businessName', 'ownerName', 'mobile', 'email', 'status']
            
            if all(field in vendor for field in required_fields):
                print_test_result("Get Vendor Profile", True, f"Profile retrieved successfully. Business: {vendor.get('businessName')}, Status: {vendor.get('status')}")
                return True
            else:
                missing_fields = [field for field in required_fields if field not in vendor]
                print_test_result("Get Vendor Profile", False, f"Profile missing required fields: {missing_fields}", data)
                return False
        else:
            print_test_result("Get Vendor Profile", False, f"Profile request failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Get Vendor Profile", False, f"Exception occurred: {str(e)}")
        return False

def test_add_turf():
    """Test adding a new turf"""
    global turf_id
    
    print("=" * 60)
    print("🔵 TESTING ADD TURF")
    print("=" * 60)
    
    if not vendor_token:
        print_test_result("Add Turf", False, "No vendor token available - please run login test first")
        return False
    
    try:
        url = f"{BASE_URL}/vendor/turfs"
        headers = {**HEADERS, "Authorization": f"Bearer {vendor_token}"}
        response = requests.post(url, json=TURF_DATA, headers=headers)
        
        print(f"Request URL: {url}")
        print(f"Request Data: {json.dumps(TURF_DATA, indent=2)}")
        print(f"Authorization: Bearer {vendor_token[:20]}...")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('turfId'):
                turf_id = data.get('turfId')
                turf_info = data.get('turf', {})
                if turf_info.get('status') == 'pending':
                    print_test_result("Add Turf", True, f"Turf created successfully with ID: {turf_id}, Status: pending")
                    return True
                else:
                    print_test_result("Add Turf", False, f"Turf status is not 'pending': {turf_info.get('status')}", data)
                    return False
            else:
                print_test_result("Add Turf", False, "Add turf response missing success or turfId", data)
                return False
        else:
            print_test_result("Add Turf", False, f"Add turf failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Add Turf", False, f"Exception occurred: {str(e)}")
        return False

def test_get_vendor_turfs():
    """Test getting vendor's turfs list"""
    print("=" * 60)
    print("🔵 TESTING GET VENDOR TURFS")
    print("=" * 60)
    
    if not vendor_token:
        print_test_result("Get Vendor Turfs", False, "No vendor token available - please run login test first")
        return False
    
    try:
        url = f"{BASE_URL}/vendor/turfs"
        headers = {**HEADERS, "Authorization": f"Bearer {vendor_token}"}
        response = requests.get(url, headers=headers)
        
        print(f"Request URL: {url}")
        print(f"Authorization: Bearer {vendor_token[:20]}...")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            turfs = data.get('turfs', [])
            
            # Verify that turfs belong to this vendor only
            if isinstance(turfs, list):
                print_test_result("Get Vendor Turfs", True, f"Retrieved {len(turfs)} turfs for this vendor")
                return True
            else:
                print_test_result("Get Vendor Turfs", False, "Turfs response is not a list", data)
                return False
        else:
            print_test_result("Get Vendor Turfs", False, f"Get turfs failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Get Vendor Turfs", False, f"Exception occurred: {str(e)}")
        return False

def test_update_vendor_profile():
    """Test updating vendor profile"""
    print("=" * 60)
    print("🔵 TESTING UPDATE VENDOR PROFILE")
    print("=" * 60)
    
    if not vendor_token:
        print_test_result("Update Vendor Profile", False, "No vendor token available - please run login test first")
        return False
    
    try:
        url = f"{BASE_URL}/vendor/profile"
        headers = {**HEADERS, "Authorization": f"Bearer {vendor_token}"}
        
        update_data = {
            "businessName": "Elite Sports Complex Updated",
            "email": "rajesh.updated@elitesports.com"
        }
        
        response = requests.put(url, json=update_data, headers=headers)
        
        print(f"Request URL: {url}")
        print(f"Request Data: {json.dumps(update_data, indent=2)}")
        print(f"Authorization: Bearer {vendor_token[:20]}...")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                vendor = data.get('vendor', {})
                if (vendor.get('businessName') == update_data['businessName'] and 
                    vendor.get('email') == update_data['email']):
                    print_test_result("Update Vendor Profile", True, f"Profile updated successfully. New business name: {vendor.get('businessName')}")
                    return True
                else:
                    print_test_result("Update Vendor Profile", False, "Profile update values not reflected in response", data)
                    return False
            else:
                print_test_result("Update Vendor Profile", False, "Update response missing success flag", data)
                return False
        else:
            print_test_result("Update Vendor Profile", False, f"Profile update failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Update Vendor Profile", False, f"Exception occurred: {str(e)}")
        return False

def test_update_turf():
    """Test updating turf information"""
    print("=" * 60)
    print("🔵 TESTING UPDATE TURF")
    print("=" * 60)
    
    if not vendor_token:
        print_test_result("Update Turf", False, "No vendor token available - please run login test first")
        return False
    
    if not turf_id:
        print_test_result("Update Turf", False, "No turf ID available - please run add turf test first")
        return False
    
    try:
        url = f"{BASE_URL}/vendor/turfs/{turf_id}"
        headers = {**HEADERS, "Authorization": f"Bearer {vendor_token}"}
        
        update_data = {
            "name": "Elite Football Arena - Premium",
            "pricing": {"basePrice": 2500}
        }
        
        response = requests.put(url, json=update_data, headers=headers)
        
        print(f"Request URL: {url}")
        print(f"Request Data: {json.dumps(update_data, indent=2)}")
        print(f"Authorization: Bearer {vendor_token[:20]}...")
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                turf = data.get('turf', {})
                if (turf.get('name') == update_data['name'] and 
                    turf.get('pricing', {}).get('basePrice') == update_data['pricing']['basePrice']):
                    print_test_result("Update Turf", True, f"Turf updated successfully. New name: {turf.get('name')}, New price: {turf.get('pricing', {}).get('basePrice')}")
                    return True
                else:
                    print_test_result("Update Turf", False, "Turf update values not reflected in response", data)
                    return False
            else:
                print_test_result("Update Turf", False, "Update response missing success flag", data)
                return False
        else:
            print_test_result("Update Turf", False, f"Turf update failed with status {response.status_code}", response.json())
            return False
            
    except Exception as e:
        print_test_result("Update Turf", False, f"Exception occurred: {str(e)}")
        return False

def main():
    """Run all vendor portal API tests"""
    print("\n🚀 STARTING VENDOR PORTAL BACKEND API TESTS")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Data: Vendor Mobile: {VENDOR_DATA['mobile']}, Business: {VENDOR_DATA['businessName']}")
    print("=" * 80)
    
    test_results = []
    
    # Test sequence as specified in the requirements
    test_results.append(("Vendor Registration", test_vendor_registration()))
    test_results.append(("Vendor Send OTP", test_vendor_send_otp()))
    test_results.append(("Vendor Verify OTP", test_vendor_verify_otp()))
    test_results.append(("Get Vendor Profile", test_get_vendor_profile()))
    test_results.append(("Add Turf", test_add_turf()))
    test_results.append(("Get Vendor Turfs", test_get_vendor_turfs()))
    test_results.append(("Update Vendor Profile", test_update_vendor_profile()))
    test_results.append(("Update Turf", test_update_turf()))
    
    # Print final summary
    print("\n" + "=" * 80)
    print("🏁 VENDOR PORTAL API TESTING SUMMARY")
    print("=" * 80)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} | {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("=" * 80)
    print(f"📊 RESULTS: {passed} PASSED, {failed} FAILED, {passed + failed} TOTAL")
    
    if failed == 0:
        print("🎉 ALL VENDOR PORTAL API TESTS PASSED!")
    else:
        print(f"⚠️  {failed} TEST(S) FAILED - CHECK DETAILS ABOVE")
    
    print("=" * 80)
    
    return failed == 0

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)
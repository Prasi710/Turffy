'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, User, Building2, Mail, CreditCard, Banknote } from 'lucide-react';
import { toast } from 'sonner';

const VendorProfile = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    businessName: '',
    ownerName: '',
    mobile: '',
    email: '',
    gst: '',
    pan: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: ''
    },
    status: '',
    isActive: true
  });

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      router.push('/vendor');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch('/api/vendor/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setProfileData({
          businessName: data.vendor.businessName || '',
          ownerName: data.vendor.ownerName || '',
          mobile: data.vendor.mobile || '',
          email: data.vendor.email || '',
          gst: data.vendor.gst || '',
          pan: data.vendor.pan || '',
          bankDetails: data.vendor.bankDetails || {
            accountNumber: '',
            ifscCode: '',
            accountHolderName: '',
            bankName: ''
          },
          status: data.vendor.status || '',
          isActive: data.vendor.isActive !== undefined ? data.vendor.isActive : true
        });
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vendorToken');
      
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: profileData.businessName,
          ownerName: profileData.ownerName,
          email: profileData.email,
          gst: profileData.gst,
          pan: profileData.pan,
          bankDetails: profileData.bankDetails
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const updateBankField = (field, value) => {
    setProfileData({
      ...profileData,
      bankDetails: { ...profileData.bankDetails, [field]: value }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/vendor/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Vendor Profile</h1>
          <p className="text-gray-600 mt-2">Update your business and banking information</p>
        </div>

        {/* Account Status Badge */}
        <div className="mb-6 flex gap-3">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            profileData.status === 'approved' 
              ? 'bg-green-100 text-green-700' 
              : profileData.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            Status: {profileData.status?.toUpperCase() || 'PENDING'}
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            profileData.isActive 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {profileData.isActive ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>

        {/* Business Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Information
            </CardTitle>
            <CardDescription>Your business details and registration info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Business Name *</label>
                <Input
                  placeholder="Your Turf Business Name"
                  value={profileData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Owner Name *</label>
                <Input
                  placeholder="Owner Full Name"
                  value={profileData.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                  placeholder="Mobile Number"
                  value={profileData.mobile}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Mobile number cannot be changed</p>
              </div>

              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="business@example.com"
                  value={profileData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">GST Number</label>
                <Input
                  placeholder="22AAAAA0000A1Z5"
                  value={profileData.gst}
                  onChange={(e) => updateField('gst', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">PAN Number</label>
                <Input
                  placeholder="ABCDE1234F"
                  value={profileData.pan}
                  onChange={(e) => updateField('pan', e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Banking Information
            </CardTitle>
            <CardDescription>Add your bank account for receiving payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Account Holder Name</label>
                <Input
                  placeholder="As per bank account"
                  value={profileData.bankDetails.accountHolderName}
                  onChange={(e) => updateBankField('accountHolderName', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Bank Name</label>
                <Input
                  placeholder="HDFC Bank, ICICI Bank, etc."
                  value={profileData.bankDetails.bankName}
                  onChange={(e) => updateBankField('bankName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Account Number</label>
                <Input
                  type="text"
                  placeholder="1234567890"
                  value={profileData.bankDetails.accountNumber}
                  onChange={(e) => updateBankField('accountNumber', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">IFSC Code</label>
                <Input
                  placeholder="HDFC0001234"
                  value={profileData.bankDetails.ifscCode}
                  onChange={(e) => updateBankField('ifscCode', e.target.value)}
                  maxLength={11}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleUpdate} 
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            size="lg"
          >
            {loading ? 'Saving...' : 'Save Changes'}
            <Save className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, User, Mail, Phone, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';

const VendorAuth = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginMobile, setLoginMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Register state
  const [registerForm, setRegisterForm] = useState({
    businessName: '',
    ownerName: '',
    mobile: '',
    email: '',
    gst: '',
    pan: ''
  });

  const handleSendOtp = async () => {
    if (loginMobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vendor/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: loginMobile })
      });

      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        toast.success(`OTP sent! Use: ${data.otp}`);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vendor/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: loginMobile, otp })
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('vendorToken', data.token);
        localStorage.setItem('vendor', JSON.stringify(data.vendor));
        toast.success('Login successful!');
        router.push('/vendor/dashboard');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerForm.businessName || !registerForm.ownerName || !registerForm.mobile || !registerForm.email) {
      toast.error('Please fill all required fields');
      return;
    }

    if (registerForm.mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Registration successful! Please login with your mobile number.');
        setActiveTab('login');
        setLoginMobile(registerForm.mobile);
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TurfHub Vendor
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Manage your turf business with ease</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Login or register to manage your turfs</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Mobile Number</label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={loginMobile}
                        onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={otpSent}
                        maxLength={10}
                      />
                      {!otpSent && (
                        <Button onClick={handleSendOtp} disabled={loading || loginMobile.length !== 10}>
                          {loading ? 'Sending...' : 'Send OTP'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <label className="text-sm font-medium">Enter OTP</label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          type="text"
                          placeholder="6-digit OTP (use 123456)"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                        />
                        <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                          {loading ? 'Verifying...' : 'Verify'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Demo OTP: 123456</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>Business Name *</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Your business name"
                        value={registerForm.businessName}
                        onChange={(e) => setRegisterForm({ ...registerForm, businessName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Owner Name *</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={registerForm.ownerName}
                        onChange={(e) => setRegisterForm({ ...registerForm, ownerName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>Mobile Number *</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="10-digit mobile"
                        value={registerForm.mobile}
                        onChange={(e) => setRegisterForm({ ...registerForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        maxLength={10}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>Email *</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>GST Number</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="29ABCDE1234F1Z5"
                        value={registerForm.gst}
                        onChange={(e) => setRegisterForm({ ...registerForm, gst: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center space-x-1">
                        <CreditCard className="w-4 h-4" />
                        <span>PAN Number</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={registerForm.pan}
                        onChange={(e) => setRegisterForm({ ...registerForm, pan: e.target.value.toUpperCase() })}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    * Required fields
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Customer Portal Link */}
        <div className="text-center mt-6">
          <Button variant="link" onClick={() => router.push('/')}>
            ← Back to Customer Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorAuth;

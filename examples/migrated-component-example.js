/**
 * Example: Migrated Customer Portal Component
 * This demonstrates how to use the new API service
 */

'use client'

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

const ExampleMigratedComponent = () => {
  const [turfs, setTurfs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch turfs on mount
  useEffect(() => {
    loadTurfs();
  }, []);

  // ✅ NEW: Using API service
  const loadTurfs = async () => {
    try {
      const data = await api.turfs.getAll();
      setTurfs(data.turfs);
    } catch (error) {
      console.error('Error loading turfs:', error);
      toast.error('Failed to load turfs');
    }
  };

  // ✅ NEW: Customer Authentication
  const handleSendOtp = async (mobile) => {
    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.sendOtp(mobile);
      if (data.success) {
        toast.success(`OTP sent! Use: ${data.otp}`);
        return true;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleVerifyOtp = async (mobile, otp) => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const data = await api.auth.verifyOtp(mobile, otp);
      if (data.success) {
        // Store token and user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Login successful!');
        return true;
      }
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
    return false;
  };

  // ✅ NEW: Fetch turf slots
  const loadSlots = async (turfId, date) => {
    try {
      const data = await api.turfs.getSlots(turfId, date);
      return data.slots || [];
    } catch (error) {
      console.error('Error loading slots:', error);
      toast.error('Failed to load slots');
      return [];
    }
  };

  // ✅ NEW: Create booking with payment
  const handleBooking = async (turfId, selectedSlots, totalAmount) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Razorpay order
      const orderData = await api.payments.createOrder(turfId, selectedSlots, totalAmount);
      
      if (!orderData.success) {
        throw new Error('Failed to create order');
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Turfie',
        description: 'Turf Booking',
        order_id: orderData.orderId,
        handler: async function (response) {
          // Step 3: Verify payment
          try {
            const verifyData = await api.payments.verify(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              orderData.bookingIds
            );

            if (verifyData.success) {
              toast.success('Booking confirmed!');
              // Redirect or refresh bookings
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          contact: user.mobile,
          email: user.email || ''
        },
        theme: {
          color: '#3b82f6'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch user bookings
  const loadBookings = async () => {
    try {
      const data = await api.bookings.getAll();
      return data.bookings || [];
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
      return [];
    }
  };

  // ✅ NEW: Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const data = await api.profile.update(profileData);
      if (data.success) {
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Profile updated successfully!');
        return true;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
    return false;
  };

  return (
    <div>
      <h1>Example Migrated Component</h1>
      {/* Your UI here */}
    </div>
  );
};

export default ExampleMigratedComponent;

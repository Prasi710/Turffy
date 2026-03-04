'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, TrendingUp, Calendar, DollarSign, LogOut, User, Settings } from 'lucide-react';
import { toast } from 'sonner';

const VendorDashboard = () => {
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('vendorToken');
    const vendorData = localStorage.getItem('vendor');

    if (!token || !vendorData) {
      router.push('/vendor');
      return;
    }

    setVendor(JSON.parse(vendorData));
    await loadTurfs(token);
  };

  const loadTurfs = async (token) => {
    try {
      const response = await fetch('/api/vendor/turfs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setTurfs(data.turfs || []);
      }
    } catch (error) {
      console.error('Error loading turfs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendor');
    toast.success('Logged out successfully');
    router.push('/vendor');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const approvedTurfs = turfs.filter(t => t.status === 'approved').length;
  const pendingTurfs = turfs.filter(t => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{vendor?.businessName}</h1>
                <p className="text-sm text-gray-600">Vendor Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/vendor/profile')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Vendor Status Alert */}
        {vendor?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>Account Pending Approval:</strong> Your vendor account is awaiting admin approval. You can add turfs, but they won't be visible to customers until approved.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Turfs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{turfs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedTurfs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingTurfs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">0</div>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/vendor/add-turf')}>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Add New Turf</CardTitle>
              <CardDescription>List a new turf on the platform</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/vendor/turfs')}>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Manage Turfs</CardTitle>
              <CardDescription>View and edit your turfs</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>View Analytics</CardTitle>
              <CardDescription>Coming soon - Booking insights</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Turfs */}
        <Card>
          <CardHeader>
            <CardTitle>Your Turfs</CardTitle>
            <CardDescription>Manage your listed turfs</CardDescription>
          </CardHeader>
          <CardContent>
            {turfs.length > 0 ? (
              <div className="space-y-4">
                {turfs.map(turf => (
                  <div key={turf.turfId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{turf.name}</h3>
                      <p className="text-sm text-gray-600">{turf.location}, {turf.city}</p>
                      <p className="text-sm text-gray-500 mt-1">₹{turf.pricing?.basePrice || 0}/hour</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(turf.status)}`}>
                        {turf.status}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/vendor/turfs`)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">No turfs added yet</p>
                <Button onClick={() => router.push('/vendor/add-turf')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Turf
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;

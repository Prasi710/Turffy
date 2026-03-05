'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building2, CheckCircle, XCircle, Clock, LogOut, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [vendors, setVendors] = useState([]);
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    
    await loadData();
  };

  const loadData = async () => {
    try {
      // Fetch all vendors and turfs directly from API
      const vendorsRes = await fetch('/api/admin/vendors');
      const turfsRes = await fetch('/api/admin/turfs');
      
      if (vendorsRes.ok && turfsRes.ok) {
        const vendorsData = await vendorsRes.json();
        const turfsData = await turfsRes.json();
        setVendors(vendorsData.vendors || []);
        setTurfs(turfsData.turfs || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVendor = async (vendorId) => {
    try {
      const response = await fetch('/api/admin/vendors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, action: 'approve' })
      });

      if (response.ok) {
        toast.success('Vendor approved successfully!');
        await loadData();
      } else {
        toast.error('Failed to approve vendor');
      }
    } catch (error) {
      toast.error('Error approving vendor');
    }
  };

  const handleRejectVendor = async (vendorId) => {
    try {
      const response = await fetch('/api/admin/vendors/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, action: 'reject' })
      });

      if (response.ok) {
        toast.success('Vendor rejected');
        await loadData();
      } else {
        toast.error('Failed to reject vendor');
      }
    } catch (error) {
      toast.error('Error rejecting vendor');
    }
  };

  const handleApproveTurf = async (turfId) => {
    try {
      const response = await fetch('/api/admin/turfs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turfId, action: 'approve' })
      });

      if (response.ok) {
        toast.success('Turf approved and now visible to customers!');
        await loadData();
      } else {
        toast.error('Failed to approve turf');
      }
    } catch (error) {
      toast.error('Error approving turf');
    }
  };

  const handleRejectTurf = async (turfId) => {
    try {
      const response = await fetch('/api/admin/turfs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turfId, action: 'reject' })
      });

      if (response.ok) {
        toast.success('Turf rejected');
        await loadData();
      } else {
        toast.error('Failed to reject turf');
      }
    } catch (error) {
      toast.error('Error rejecting turf');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    toast.success('Logged out successfully');
    router.push('/admin');
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const pendingVendors = vendors.filter(v => v.status === 'pending');
  const approvedVendors = vendors.filter(v => v.status === 'approved');
  const pendingTurfs = turfs.filter(t => t.status === 'pending');
  const approvedTurfs = turfs.filter(t => t.status === 'approved');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TurfHub Admin</h1>
                <p className="text-sm text-gray-400">Management Dashboard</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} className="text-white border-white hover:bg-gray-700">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{vendors.length}</div>
              <p className="text-xs text-gray-500 mt-1">{pendingVendors.length} pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Turfs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{turfs.length}</div>
              <p className="text-xs text-gray-500 mt-1">{pendingTurfs.length} pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approved Turfs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedTurfs.length}</div>
              <p className="text-xs text-gray-500 mt-1">Live on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingVendors.length + pendingTurfs.length}</div>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vendors">
                  <Users className="w-4 h-4 mr-2" />
                  Vendors ({pendingVendors.length} pending)
                </TabsTrigger>
                <TabsTrigger value="turfs">
                  <Building2 className="w-4 h-4 mr-2" />
                  Turfs ({pendingTurfs.length} pending)
                </TabsTrigger>
              </TabsList>

              {/* Vendors Tab */}
              <TabsContent value="vendors" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Vendor Management</h3>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">{approvedVendors.length} Approved</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">{pendingVendors.length} Pending</Badge>
                  </div>
                </div>

                {vendors.length > 0 ? (
                  <div className="space-y-3">
                    {vendors.map(vendor => (
                      <Card key={vendor.vendorId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-lg">{vendor.businessName}</h4>
                                <Badge className={getStatusBadge(vendor.status)}>{vendor.status}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div><span className="font-medium">Owner:</span> {vendor.ownerName}</div>
                                <div><span className="font-medium">Mobile:</span> {vendor.mobile}</div>
                                <div><span className="font-medium">Email:</span> {vendor.email}</div>
                                {vendor.gst && <div><span className="font-medium">GST:</span> {vendor.gst}</div>}
                              </div>
                            </div>
                            
                            {vendor.status === 'pending' && (
                              <div className="flex space-x-2 ml-4">
                                <Button size="sm" onClick={() => handleApproveVendor(vendor.vendorId)} className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRejectVendor(vendor.vendorId)}>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>No vendors registered yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Turfs Tab */}
              <TabsContent value="turfs" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Turf Management</h3>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">{approvedTurfs.length} Approved</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">{pendingTurfs.length} Pending</Badge>
                  </div>
                </div>

                {turfs.length > 0 ? (
                  <div className="space-y-3">
                    {turfs.map(turf => {
                      const vendor = vendors.find(v => v.vendorId === turf.vendorId);
                      return (
                        <Card key={turf.turfId} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-lg">{turf.name}</h4>
                                  <Badge className={getStatusBadge(turf.status)}>{turf.status}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                                  <div><span className="font-medium">Location:</span> {turf.location}, {turf.city}</div>
                                  <div><span className="font-medium">Price:</span> ₹{turf.pricing?.basePrice || 0}/hour</div>
                                  <div><span className="font-medium">Surface:</span> {turf.surface}</div>
                                  <div><span className="font-medium">Type:</span> {turf.turfType}</div>
                                </div>
                                {vendor && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    <span className="font-medium">Vendor:</span> {vendor.businessName} ({vendor.mobile})
                                  </div>
                                )}
                              </div>
                              
                              {turf.status === 'pending' && (
                                <div className="flex space-x-2 ml-4">
                                  <Button size="sm" onClick={() => handleApproveTurf(turf.turfId)} className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleRejectTurf(turf.turfId)}>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>No turfs listed yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

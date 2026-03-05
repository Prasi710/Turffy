'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building2, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const router = useRouter();
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

  const handleToggleVendorActive = async (vendorId, currentStatus) => {
    try {
      const response = await fetch('/api/admin/vendors/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, isActive: !currentStatus })
      });

      if (response.ok) {
        toast.success(`Vendor ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        await loadData();
      } else {
        toast.error('Failed to update vendor status');
      }
    } catch (error) {
      toast.error('Error updating vendor status');
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
              <p className="text-xs text-gray-500 mt-1">{pendingVendors.length} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Turfs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{turfs.length}</div>
              <p className="text-xs text-gray-500 mt-1">{pendingTurfs.length} pending</p>
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
              <p className="text-xs text-gray-500 mt-1">Need approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Vendors */}
        {pendingVendors.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Pending Vendor Approvals</span>
                  </CardTitle>
                  <CardDescription>Review and approve new vendors</CardDescription>
                </div>
                <Badge className="bg-yellow-500 text-white">{pendingVendors.length} Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {pendingVendors.map(vendor => (
                  <Card key={vendor.vendorId} className="border-2 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{vendor.businessName}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><span className="font-medium">Owner:</span> {vendor.ownerName}</div>
                            <div><span className="font-medium">Mobile:</span> {vendor.mobile}</div>
                            <div><span className="font-medium">Email:</span> {vendor.email}</div>
                            {vendor.gst && <div><span className="font-medium">GST:</span> {vendor.gst}</div>}
                          </div>
                        </div>
                        
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Turfs */}
        {pendingTurfs.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Pending Turf Approvals</span>
                  </CardTitle>
                  <CardDescription>Review and approve new turfs</CardDescription>
                </div>
                <Badge className="bg-yellow-500 text-white">{pendingTurfs.length} Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {pendingTurfs.map(turf => {
                  const vendor = vendors.find(v => v.vendorId === turf.vendorId);
                  return (
                    <Card key={turf.turfId} className="border-2 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-2">{turf.name}</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                              <div><span className="font-medium">Location:</span> {turf.location}, {turf.city}</div>
                              <div><span className="font-medium">Price:</span> ₹{turf.pricing?.basePrice || 0}/hr</div>
                              <div><span className="font-medium">Surface:</span> {turf.surface}</div>
                              <div><span className="font-medium">Type:</span> {turf.turfType}</div>
                            </div>
                            {vendor && (
                              <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                                <span className="font-medium">Vendor:</span> {vendor.businessName}
                              </div>
                            )}
                          </div>
                          
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
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Vendors */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>All Vendors ({vendors.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendors.length > 0 ? (
              <div className="space-y-3">
                {vendors.map(vendor => (
                  <Card key={vendor.vendorId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{vendor.businessName}</h4>
                            <Badge className={vendor.status === 'approved' ? 'bg-green-100 text-green-800' : vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                              {vendor.status}
                            </Badge>
                            <Badge className={vendor.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                              {vendor.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {vendor.ownerName} • {vendor.mobile} • {vendor.email}
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant={vendor.isActive ? "outline" : "default"}
                          onClick={() => handleToggleVendorActive(vendor.vendorId, vendor.isActive)}
                          className={!vendor.isActive ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {vendor.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No vendors yet</p>
            )}
          </CardContent>
        </Card>

        {/* All Turfs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>All Turfs ({turfs.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {turfs.length > 0 ? (
              <div className="space-y-3">
                {turfs.map(turf => {
                  const vendor = vendors.find(v => v.vendorId === turf.vendorId);
                  return (
                    <Card key={turf.turfId}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">{turf.name}</h4>
                              <Badge className={turf.status === 'approved' ? 'bg-green-100 text-green-800' : turf.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                {turf.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {turf.city} • ₹{turf.pricing?.basePrice || 0}/hr • {turf.surface}
                              {vendor && <span> • Vendor: {vendor.businessName}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No turfs yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowLeft, Plus, Edit, MapPin, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

const ManageTurfs = () => {
  const router = useRouter();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadTurfs();
  }, []);

  const checkAuthAndLoadTurfs = async () => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      router.push('/vendor');
      return;
    }

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
      } else {
        toast.error('Failed to load turfs');
      }
    } catch (error) {
      console.error('Error loading turfs:', error);
      toast.error('Error loading turfs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading turfs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/vendor/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold">Manage Turfs</h1>
              <p className="text-gray-600 mt-2">View and manage all your listed turfs</p>
            </div>
            <Button onClick={() => router.push('/vendor/add-turf')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Add New Turf
            </Button>
          </div>
        </div>

        {/* Status Legend */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                <span className="text-xs text-gray-600">- Visible to customers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                <span className="text-xs text-gray-600">- Awaiting admin approval</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                <span className="text-xs text-gray-600">- Not approved</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Turfs List */}
        {turfs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {turfs.map(turf => (
              <Card key={turf.turfId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left: Turf Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-2xl font-bold text-gray-800">{turf.name}</h3>
                        <Badge className={`border ${getStatusColor(turf.status)}`}>
                          {turf.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{turf.location}, {turf.city}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm">₹{turf.pricing?.basePrice || 0}/hour</span>
                        </div>

                        <div className="flex items-center space-x-2 text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm capitalize">{turf.turfType} - {turf.surface}</span>
                        </div>

                        {turf.capacity && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">Capacity: {turf.capacity} players</span>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      {turf.amenities && turf.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {turf.amenities.slice(0, 5).map(amenity => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {turf.amenities.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{turf.amenities.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {turf.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {turf.description}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button variant="outline" size="sm" disabled>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Stats
                      </Button>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {turf.status === 'pending' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⏳ Your turf is pending approval. It will be visible to customers once approved by admin.
                      </p>
                    </div>
                  )}

                  {turf.status === 'rejected' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        ❌ Your turf was not approved. Please contact admin for more details or edit and resubmit.
                      </p>
                    </div>
                  )}

                  {turf.status === 'approved' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Your turf is live and visible to customers on the platform!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Turfs Yet</h3>
              <p className="text-gray-500 mb-6">Start by adding your first turf to the platform</p>
              <Button onClick={() => router.push('/vendor/add-turf')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Turf
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManageTurfs;

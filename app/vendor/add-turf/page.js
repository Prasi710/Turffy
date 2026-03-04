'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Building2, MapPin, DollarSign, Image, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

const amenitiesList = [
  'Floodlights', 'Parking', 'Changing Rooms', 'Washrooms', 'Shower Facilities',
  'Drinking Water', 'First Aid Kit', 'Equipment Rental', 'Cafeteria',
  'Seating Area', 'Air Conditioning', 'CCTV Surveillance', 'WiFi',
  'Lockers', 'Pro Shop', 'Coaching Available'
];

const AddTurf = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    sportTypes: [],
    turfType: 'outdoor',
    surface: 'Artificial Grass',
    
    // Location
    location: '',
    city: '',
    area: '',
    pincode: '',
    googleMapsLink: '',
    
    // Physical Details
    size: '',
    capacity: '',
    
    // Amenities
    amenities: [],
    
    // Pricing
    pricing: {
      basePrice: '',
      weekdayMorning: '',
      weekdayEvening: '',
      weekendMorning: '',
      weekendEvening: ''
    },
    
    // Operating Hours
    operatingHours: {
      opening: '06:00',
      closing: '23:00'
    },
    
    // Images
    images: ['', '', ''],
    
    // Policies
    policies: {
      cancellation: '',
      refund: ''
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      router.push('/vendor');
    }
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.location || !formData.city || !formData.pricing.basePrice) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('vendorToken');
      
      // Filter out empty images
      const filteredImages = formData.images.filter(img => img.trim() !== '');
      
      const response = await fetch('/api/vendor/turfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: filteredImages,
          capacity: parseInt(formData.capacity) || 0,
          pricing: {
            basePrice: parseInt(formData.pricing.basePrice),
            weekdayMorning: parseInt(formData.pricing.weekdayMorning) || parseInt(formData.pricing.basePrice),
            weekdayEvening: parseInt(formData.pricing.weekdayEvening) || parseInt(formData.pricing.basePrice),
            weekendMorning: parseInt(formData.pricing.weekendMorning) || parseInt(formData.pricing.basePrice),
            weekendEvening: parseInt(formData.pricing.weekendEvening) || parseInt(formData.pricing.basePrice)
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Turf added successfully! It will be visible after admin approval.');
        router.push('/vendor/dashboard');
      } else {
        toast.error(data.error || 'Failed to add turf');
      }
    } catch (error) {
      toast.error('Error adding turf');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateNestedField = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: { ...formData[parent], [field]: value }
    });
  };

  const toggleAmenity = (amenity) => {
    const amenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity];
    updateField('amenities', amenities);
  };

  const updateImage = (index, value) => {
    const images = [...formData.images];
    images[index] = value;
    updateField('images', images);
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
          <h1 className="text-3xl font-bold mt-4">Add New Turf</h1>
          <p className="text-gray-600 mt-2">Fill in the details to list your turf on TurfHub</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 6 && <div className={`w-12 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Basic</span>
            <span>Location</span>
            <span>Details</span>
            <span>Amenities</span>
            <span>Pricing</span>
            <span>Images</span>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Basic Information'}
              {step === 2 && 'Location Details'}
              {step === 3 && 'Physical Details'}
              {step === 4 && 'Amenities & Facilities'}
              {step === 5 && 'Pricing & Hours'}
              {step === 6 && 'Images & Policies'}
            </CardTitle>
            <CardDescription>
              Step {step} of 6
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Turf Name *</label>
                  <Input
                    placeholder="e.g., Elite Football Arena"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe your turf, facilities, and what makes it special"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Turf Type</label>
                    <Select value={formData.turfType} onValueChange={(value) => updateField('turfType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="indoor">Indoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Surface Type</label>
                    <Select value={formData.surface} onValueChange={(value) => updateField('surface', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Artificial Grass">Artificial Grass</SelectItem>
                        <SelectItem value="Natural Grass">Natural Grass</SelectItem>
                        <SelectItem value="Hybrid Grass">Hybrid Grass</SelectItem>
                        <SelectItem value="Cement">Cement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Address *</label>
                  <Input
                    placeholder="Street address, building name, etc."
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">City *</label>
                    <Input
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Area/Locality</label>
                    <Input
                      placeholder="Andheri"
                      value={formData.area}
                      onChange={(e) => updateField('area', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">PIN Code</label>
                    <Input
                      placeholder="400058"
                      value={formData.pincode}
                      onChange={(e) => updateField('pincode', e.target.value)}
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Google Maps Link</label>
                    <Input
                      placeholder="https://maps.google.com/..."
                      value={formData.googleMapsLink}
                      onChange={(e) => updateField('googleMapsLink', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Physical Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Size</label>
                    <Input
                      placeholder="e.g., 50x30 meters"
                      value={formData.size}
                      onChange={(e) => updateField('size', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Maximum Capacity</label>
                    <Input
                      type="number"
                      placeholder="22"
                      value={formData.capacity}
                      onChange={(e) => updateField('capacity', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Opening Time</label>
                    <Input
                      type="time"
                      value={formData.operatingHours.opening}
                      onChange={(e) => updateNestedField('operatingHours', 'opening', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Closing Time</label>
                    <Input
                      type="time"
                      value={formData.operatingHours.closing}
                      onChange={(e) => updateNestedField('operatingHours', 'closing', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Amenities */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select all amenities available at your turf</p>
                <div className="grid grid-cols-2 gap-4">
                  {amenitiesList.map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <label className="text-sm">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Pricing */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Base Price per Hour *</label>
                  <Input
                    type="number"
                    placeholder="2000"
                    value={formData.pricing.basePrice}
                    onChange={(e) => updateNestedField('pricing', 'basePrice', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be used if you don't set time-specific prices</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Time-based Pricing (Optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">Weekday Morning (6 AM - 12 PM)</label>
                      <Input
                        type="number"
                        placeholder="1500"
                        value={formData.pricing.weekdayMorning}
                        onChange={(e) => updateNestedField('pricing', 'weekdayMorning', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Weekday Evening (6 PM - 11 PM)</label>
                      <Input
                        type="number"
                        placeholder="2500"
                        value={formData.pricing.weekdayEvening}
                        onChange={(e) => updateNestedField('pricing', 'weekdayEvening', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Weekend Morning (6 AM - 12 PM)</label>
                      <Input
                        type="number"
                        placeholder="2000"
                        value={formData.pricing.weekendMorning}
                        onChange={(e) => updateNestedField('pricing', 'weekendMorning', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Weekend Evening (6 PM - 11 PM)</label>
                      <Input
                        type="number"
                        placeholder="3000"
                        value={formData.pricing.weekendEvening}
                        onChange={(e) => updateNestedField('pricing', 'weekendEvening', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Images & Policies */}
            {step === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Turf Images</label>
                  <p className="text-xs text-gray-500 mb-2">Add at least one image URL</p>
                  {formData.images.map((img, index) => (
                    <Input
                      key={index}
                      className="mb-2"
                      placeholder={`Image URL ${index + 1}`}
                      value={img}
                      onChange={(e) => updateImage(index, e.target.value)}
                    />
                  ))}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Policies (Optional)</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm">Cancellation Policy</label>
                      <Input
                        placeholder="e.g., Free cancellation 24 hours before booking"
                        value={formData.policies.cancellation}
                        onChange={(e) => updateNestedField('policies', 'cancellation', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm">Refund Policy</label>
                      <Input
                        placeholder="e.g., Full refund for cancellations 24 hours before"
                        value={formData.policies.refund}
                        onChange={(e) => updateNestedField('policies', 'refund', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {step < 6 ? (
                <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600">
                  {loading ? 'Submitting...' : 'Submit Turf'}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTurf;

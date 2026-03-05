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

const sportsList = [
  'Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball', 
  'Volleyball', 'Hockey', 'Kabaddi', 'Table Tennis', 'Squash'
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
    
    // Operating Hours
    operatingHours: {
      opening: '09:00',
      closing: '23:00'
    },
    
    // Custom Slots (NEW)
    customSlots: [],
    
    // Base Pricing (for backward compatibility)
    pricing: {
      basePrice: ''
    },
    
    // Images (now stores file paths instead of URLs)
    images: [],
    
    // Policies
    policies: {
      cancellation: '',
      refund: ''
    }
  });
  const [uploadingImages, setUploadingImages] = useState([false, false, false]);

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

    // Validate sports selection
    if (formData.sportTypes.length === 0) {
      toast.error('Please select at least one sport');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('vendorToken');
      
      // Filter out empty images
      const filteredImages = formData.images.filter(img => img.trim() !== '');
      
      // Prepare custom slots with proper pricing
      const customSlots = formData.customSlots.map(slot => ({
        time: slot.time,
        endTime: slot.endTime,
        weekdayPrice: parseInt(slot.weekdayPrice) || parseInt(formData.pricing.basePrice),
        weekendPrice: parseInt(slot.weekendPrice) || parseInt(formData.pricing.basePrice)
      }));
      
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
          customSlots: customSlots.length > 0 ? customSlots : [],
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

  const toggleSport = (sport) => {
    const sportTypes = formData.sportTypes.includes(sport)
      ? formData.sportTypes.filter(s => s !== sport)
      : [...formData.sportTypes, sport];
    updateField('sportTypes', sportTypes);
  };

  const generateSlots = () => {
    const slots = [];
    const opening = parseInt(formData.operatingHours.opening.split(':')[0]);
    const closing = parseInt(formData.operatingHours.closing.split(':')[0]);
    
    for (let hour = opening; hour < closing; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      slots.push({
        time,
        endTime,
        weekdayPrice: formData.pricing.basePrice || '',
        weekendPrice: formData.pricing.basePrice || ''
      });
    }
    
    updateField('customSlots', slots);
    toast.success(`Generated ${slots.length} time slots!`);
  };

  const updateSlotPrice = (index, field, price) => {
    const slots = [...formData.customSlots];
    slots[index][field] = price;
    updateField('customSlots', slots);
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Set uploading state
    const newUploadingStates = [...uploadingImages];
    newUploadingStates[index] = true;
    setUploadingImages(newUploadingStates);

    try {
      const token = localStorage.getItem('vendorToken');
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await fetch('/api/vendor/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      
      if (data.success) {
        const newImages = [...formData.images];
        newImages[index] = data.imageUrl;
        updateField('images', newImages);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
    } finally {
      const newUploadingStates = [...uploadingImages];
      newUploadingStates[index] = false;
      setUploadingImages(newUploadingStates);
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages[index] = '';
    updateField('images', newImages.filter((_, i) => i !== index));
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Sports Available *</label>
                  <p className="text-xs text-gray-500 mb-3">Select all sports that can be played on this turf</p>
                  <div className="grid grid-cols-3 gap-3">
                    {sportsList.map(sport => (
                      <div key={sport} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.sportTypes.includes(sport)}
                          onCheckedChange={() => toggleSport(sport)}
                        />
                        <label className="text-sm">{sport}</label>
                      </div>
                    ))}
                  </div>
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

            {/* Step 3: Physical Details & Operating Hours */}
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

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Operating Hours *</h4>
                  <p className="text-sm text-gray-600 mb-4">Select your turf operating hours. You'll set prices for each hour slot in the next step.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Opening Time</label>
                      <Input
                        type="time"
                        value={formData.operatingHours.opening}
                        onChange={(e) => {
                          updateNestedField('operatingHours', 'opening', e.target.value);
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Closing Time</label>
                      <Input
                        type="time"
                        value={formData.operatingHours.closing}
                        onChange={(e) => {
                          updateNestedField('operatingHours', 'closing', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Example: 9:00 AM to 11:00 PM means you'll set prices for slots from 9 AM to 10 PM
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">This will be used as default for all slots</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm font-medium">Custom Slot Pricing</p>
                      <p className="text-xs text-gray-500">Set different prices for each time slot</p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={generateSlots}
                      variant="outline"
                      disabled={!formData.pricing.basePrice}
                    >
                      {formData.customSlots.length > 0 ? 'Regenerate' : 'Generate'} Slots
                    </Button>
                  </div>

                  {formData.customSlots.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium">Time Slot</th>
                              <th className="px-4 py-3 text-left font-medium">Weekday Price (₹)</th>
                              <th className="px-4 py-3 text-left font-medium">Weekend Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {formData.customSlots.map((slot, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">
                                  {slot.time} - {slot.endTime}
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="number"
                                    placeholder="1500"
                                    value={slot.weekdayPrice}
                                    onChange={(e) => updateSlotPrice(index, 'weekdayPrice', e.target.value)}
                                    className="h-8"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="number"
                                    placeholder="2000"
                                    value={slot.weekendPrice}
                                    onChange={(e) => updateSlotPrice(index, 'weekendPrice', e.target.value)}
                                    className="h-8"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600">
                        Total: {formData.customSlots.length} time slots configured
                      </div>
                    </div>
                  )}

                  {formData.customSlots.length === 0 && formData.pricing.basePrice && (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      <p className="text-sm">Click "Generate Slots" to create pricing table</p>
                      <p className="text-xs mt-1">Based on your operating hours: {formData.operatingHours.opening} - {formData.operatingHours.closing}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Images & Policies */}
            {step === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Turf Images</label>
                  <p className="text-xs text-gray-500 mb-3">Upload up to 3 images of your turf (JPG, PNG, WebP - Max 5MB each)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        {formData.images[index] ? (
                          <div className="relative">
                            <img 
                              src={formData.images[index]} 
                              alt={`Turf ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => removeImage(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <label 
                              htmlFor={`image-${index}`}
                              className="cursor-pointer flex flex-col items-center justify-center h-48"
                            >
                              {uploadingImages[index] ? (
                                <>
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                  <p className="text-sm text-gray-600">Uploading...</p>
                                </>
                              ) : (
                                <>
                                  <Image className="w-12 h-12 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600">Click to upload</p>
                                  <p className="text-xs text-gray-500 mt-1">or use camera</p>
                                </>
                              )}
                            </label>
                            <input
                              id={`image-${index}`}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(index, file);
                              }}
                              disabled={uploadingImages[index]}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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

/**
 * API Utility Service for Turfie Frontend
 * Handles communication with Rails backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/**
 * Convert camelCase object keys to snake_case for Rails
 */
export const toSnakeCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  const snakeObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeObj[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return snakeObj;
};

/**
 * Convert snake_case object keys to camelCase for frontend
 */
export const toCamelCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return camelObj;
};

/**
 * Get authorization headers
 */
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Generic API request handler
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  // Convert payload to snake_case if present
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(toSnakeCase(JSON.parse(body)));
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Convert response to camelCase
    return toCamelCase(data);
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * API Methods
 */
export const api = {
  // Auth - Customer
  auth: {
    sendOtp: (mobile) => 
      apiRequest('/api/v1/auth/send_otp', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      }),
    
    verifyOtp: (mobile, otp) => 
      apiRequest('/api/v1/auth/verify_otp', {
        method: 'POST',
        body: JSON.stringify({ mobile, otp }),
      }),
  },

  // Auth - Vendor
  vendorAuth: {
    register: (data) => 
      apiRequest('/api/v1/vendor_auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    sendOtp: (mobile) => 
      apiRequest('/api/v1/vendor_auth/send_otp', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      }),
    
    verifyOtp: (mobile, otp) => 
      apiRequest('/api/v1/vendor_auth/verify_otp', {
        method: 'POST',
        body: JSON.stringify({ mobile, otp }),
      }),
  },

  // Auth - Admin
  adminAuth: {
    login: (mobile, otp) => 
      apiRequest('/api/v1/admin_auth/login', {
        method: 'POST',
        body: JSON.stringify({ mobile, otp }),
      }),
  },

  // Turfs (Public)
  turfs: {
    getAll: (city = null, sportId = null) => {
      const params = new URLSearchParams();
      if (city && city !== 'All') params.append('city', city);
      if (sportId) params.append('sport_id', sportId);
      return apiRequest(`/api/v1/turfs?${params.toString()}`);
    },
    
    getById: (id) => apiRequest(`/api/v1/turfs/${id}`),
    
    getSlots: (turfId, date) => 
      apiRequest(`/api/v1/turfs/${turfId}/slots?date=${date}`),
  },

  // Cities & Sports
  cities: {
    getAll: () => apiRequest('/api/v1/cities'),
  },

  sports: {
    getAll: () => apiRequest('/api/v1/sports'),
  },

  // User Profile
  profile: {
    get: () => apiRequest('/api/v1/profile'),
    
    update: (data) => 
      apiRequest('/api/v1/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Bookings
  bookings: {
    getAll: () => apiRequest('/api/v1/bookings'),
    
    getById: (id) => apiRequest(`/api/v1/bookings/${id}`),
    
    cancel: (id) => 
      apiRequest(`/api/v1/bookings/${id}/cancel`, {
        method: 'PATCH',
      }),
  },

  // Payments
  payments: {
    createOrder: (turfId, slots, amount) => 
      apiRequest('/api/v1/payments/create_order', {
        method: 'POST',
        body: JSON.stringify({ turf_id: turfId, slots, amount }),
      }),
    
    verify: (razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingIds) => 
      apiRequest('/api/v1/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          booking_ids: bookingIds,
        }),
      }),
  },

  // Vendor - Profile
  vendor: {
    profile: {
      get: () => apiRequest('/api/v1/vendor/profile'),
      
      update: (data) => 
        apiRequest('/api/v1/vendor/profile', {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
    },

    // Vendor - Turfs
    turfs: {
      getAll: () => apiRequest('/api/v1/vendor/turfs'),
      
      getById: (id) => apiRequest(`/api/v1/vendor/turfs/${id}`),
      
      create: (data) => 
        apiRequest('/api/v1/vendor/turfs', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      update: (id, data) => 
        apiRequest(`/api/v1/vendor/turfs/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      delete: (id) => 
        apiRequest(`/api/v1/vendor/turfs/${id}`, {
          method: 'DELETE',
        }),
    },

    // Vendor - Upload
    uploadImage: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/vendor/upload_image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return toCamelCase(data);
    },
  },

  // Admin
  admin: {
    vendors: {
      getAll: (status = null) => {
        const params = status ? `?status=${status}` : '';
        return apiRequest(`/api/v1/admin/vendors${params}`);
      },
      
      getById: (id) => apiRequest(`/api/v1/admin/vendors/${id}`),
      
      approve: (id) => 
        apiRequest(`/api/v1/admin/vendors/${id}/approve`, {
          method: 'PATCH',
        }),
      
      reject: (id) => 
        apiRequest(`/api/v1/admin/vendors/${id}/reject`, {
          method: 'PATCH',
        }),
      
      toggleActive: (id, isActive) => 
        apiRequest(`/api/v1/admin/vendors/${id}/toggle_active`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: isActive }),
        }),
    },

    turfs: {
      getAll: (status = null) => {
        const params = status ? `?status=${status}` : '';
        return apiRequest(`/api/v1/admin/turfs${params}`);
      },
      
      getById: (id) => apiRequest(`/api/v1/admin/turfs/${id}`),
      
      approve: (id) => 
        apiRequest(`/api/v1/admin/turfs/${id}/approve`, {
          method: 'PATCH',
        }),
      
      reject: (id) => 
        apiRequest(`/api/v1/admin/turfs/${id}/reject`, {
          method: 'PATCH',
        }),
    },

    bookings: {
      getAll: () => apiRequest('/api/v1/admin/bookings'),
      
      getById: (id) => apiRequest(`/api/v1/admin/bookings/${id}`),
    },
  },
};

export default api;

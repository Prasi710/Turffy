'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

const AdminLogin = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Simple admin credentials (in production, use proper auth)
    if (username === 'admin' && password === 'admin123') {
      const adminToken = 'admin_' + Date.now();
      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('admin', JSON.stringify({ username: 'admin', role: 'admin' }));
      toast.success('Login successful!');
      router.push('/admin/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              TurfHub Admin
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Secure Admin Access</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Admin Login</span>
            </CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-xs text-gray-500 text-center mt-4">
                Demo: username: <code className="bg-gray-100 px-1 rounded">admin</code> | password: <code className="bg-gray-100 px-1 rounded">admin123</code>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center mt-6">
          <Button variant="link" className="text-gray-400" onClick={() => router.push('/')}>
            ← Back to Customer Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

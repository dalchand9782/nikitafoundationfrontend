import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const DEFAULT_LOGO = "https://static.prod-images.emergentagent.com/jobs/04df6465-0ae2-4c67-a040-007b8dd7bc4b/images/5182ef1626dd29657c0bc411a5a888354abad8edd935a9fcca25f530b6c3042d.png";
const BG_IMAGE = "https://static.prod-images.emergentagent.com/jobs/04df6465-0ae2-4c67-a040-007b8dd7bc4b/images/67433ca0a752c2121f111b937dd328773d50a14bc3ef2931302e93073d4195fb.png";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background Image (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src={BG_IMAGE} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-600/80 to-forest-800/60"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="font-heading text-4xl font-bold mb-4">निकीता फाउंडेशन</h1>
          <p className="text-lg text-white/80 max-w-md">
            Empowering communities through accessible financial solutions. Your trusted partner in growth.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={DEFAULT_LOGO} alt="Logo" className="h-16 w-16 mb-4" />
            <h1 className="font-heading text-2xl font-bold text-forest-600">निकीता फाउंडेशन</h1>
          </div>

          <Card className="border-stone-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="hidden lg:block mx-auto mb-4">
                <img src={DEFAULT_LOGO} alt="Logo" className="h-14 w-14 mx-auto" />
              </div>
              <CardTitle className="font-heading text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    data-testid="login-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-10"
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-forest-600 hover:text-forest-700 font-medium"
                    data-testid="forgot-password-link"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-forest-500 hover:bg-forest-600 text-white font-semibold"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-stone-500">
                  This is an internal system. Contact admin for access.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

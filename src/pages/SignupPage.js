import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatApiError } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, Mail, ArrowLeft } from 'lucide-react';

const DEFAULT_LOGO = "https://static.prod-images.emergentagent.com/jobs/04df6465-0ae2-4c67-a040-007b8dd7bc4b/images/5182ef1626dd29657c0bc411a5a888354abad8edd935a9fcca25f530b6c3042d.png";
const BG_IMAGE = "https://static.prod-images.emergentagent.com/jobs/04df6465-0ae2-4c67-a040-007b8dd7bc4b/images/67433ca0a752c2121f111b937dd328773d50a14bc3ef2931302e93073d4195fb.png";

export default function SignupPage() {
  const { sendOtp, register } = useAuth();
  const [step, setStep] = useState(1); // 1: Enter details, 2: OTP verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(formData.email, 'signup');
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email,
        otp: otp,
        name: formData.name,
        mobile: formData.mobile,
        password: formData.password,
      });
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      await sendOtp(formData.email, 'signup');
      toast.success('OTP resent successfully!');
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
          <h1 className="font-heading text-4xl font-bold mb-4">Join Us</h1>
          <p className="text-lg text-white/80 max-w-md">
            Create your account to access our loan management system and start your journey towards financial empowerment.
          </p>
        </div>
      </div>

      {/* Right side - Signup Form */}
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
              <CardTitle className="font-heading text-2xl">
                {step === 1 ? 'Create Account' : 'Verify Email'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Fill in your details to get started' 
                  : `Enter the OTP sent to ${formData.email}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12"
                      data-testid="signup-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12"
                      data-testid="signup-email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="h-12"
                      data-testid="signup-mobile-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 pr-10"
                        data-testid="signup-password-input"
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

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-forest-500 hover:bg-forest-600 text-white font-semibold"
                    disabled={loading}
                    data-testid="signup-send-otp-button"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-5 w-5 mr-2" />
                        Send OTP
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center text-sm text-stone-600 hover:text-forest-600 mb-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to details
                  </button>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      data-testid="signup-otp-input"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <p className="text-center text-sm text-stone-500">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={resendOtp}
                      className="text-forest-600 hover:text-forest-700 font-medium"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </p>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-forest-500 hover:bg-forest-600 text-white font-semibold"
                    disabled={loading || otp.length !== 6}
                    data-testid="signup-verify-button"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 mr-2" />
                        Verify & Create Account
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-stone-600">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-forest-600 hover:text-forest-700 font-semibold"
                    data-testid="login-link"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

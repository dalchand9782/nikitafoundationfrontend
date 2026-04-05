import React, { useState, useEffect } from 'react';
import { getSmtpSettings, saveSmtpSettings, testSmtp, getLogo, uploadLogo, formatApiError } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Settings,
  Mail,
  Image,
  Save,
  TestTube,
  Upload,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

const DEFAULT_LOGO = "https://static.prod-images.emergentagent.com/jobs/04df6465-0ae2-4c67-a040-007b8dd7bc4b/images/5182ef1626dd29657c0bc411a5a888354abad8edd935a9fcca25f530b6c3042d.png";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('smtp');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(DEFAULT_LOGO);
  const [smtpConfig, setSmtpConfig] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_email: '',
    smtp_password: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [smtpRes, logoRes] = await Promise.all([
          getSmtpSettings().catch(() => null),
          getLogo().catch(() => null)
        ]);
        
        if (smtpRes?.data?.config) {
          setSmtpConfig(prev => ({
            ...prev,
            smtp_host: smtpRes.data.config.smtp_host || 'smtp.gmail.com',
            smtp_port: smtpRes.data.config.smtp_port || 587,
            smtp_email: smtpRes.data.config.smtp_email || ''
          }));
        }
        
        if (logoRes?.data?.logo_url) {
          setCurrentLogo(logoRes.data.logo_url);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSmtpSave = async (e) => {
    e.preventDefault();
    
    if (!smtpConfig.smtp_email || !smtpConfig.smtp_password) {
      toast.error('Email and password are required');
      return;
    }

    setSmtpLoading(true);
    try {
      await saveSmtpSettings(smtpConfig);
      toast.success('SMTP settings saved successfully');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleSmtpTest = async () => {
    setTestLoading(true);
    try {
      await testSmtp();
      toast.success('SMTP connection successful!');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setTestLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setLogoLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await uploadLogo({ logo_base64: reader.result });
          setCurrentLogo(reader.result);
          toast.success('Logo uploaded successfully');
        } catch (error) {
          toast.error(formatApiError(error));
        } finally {
          setLogoLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to read file');
      setLogoLoading(false);
    }
  };

  const resetLogo = async () => {
    setLogoLoading(true);
    try {
      await uploadLogo({ logo_base64: DEFAULT_LOGO });
      setCurrentLogo(DEFAULT_LOGO);
      toast.success('Logo reset to default');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLogoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stone-800">
          Settings
        </h1>
        <p className="text-stone-500 mt-1">Configure system settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100">
          <TabsTrigger value="smtp" data-testid="smtp-tab">
            <Mail className="h-4 w-4 mr-2" />
            SMTP
          </TabsTrigger>
          <TabsTrigger value="branding" data-testid="branding-tab">
            <Image className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        {/* SMTP Settings */}
        <TabsContent value="smtp" className="mt-4">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-forest-600" />
                Gmail SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for sending OTP and notification emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSmtpSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={smtpConfig.smtp_host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      data-testid="smtp-host-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={smtpConfig.smtp_port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_port: parseInt(e.target.value) })}
                      placeholder="587"
                      data-testid="smtp-port-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_email">Gmail Address</Label>
                  <Input
                    id="smtp_email"
                    type="email"
                    value={smtpConfig.smtp_email}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_email: e.target.value })}
                    placeholder="your-email@gmail.com"
                    data-testid="smtp-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">App Password</Label>
                  <div className="relative">
                    <Input
                      id="smtp_password"
                      type={showPassword ? 'text' : 'password'}
                      value={smtpConfig.smtp_password}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_password: e.target.value })}
                      placeholder="Enter app password"
                      className="pr-10"
                      data-testid="smtp-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Use an App Password from your Google Account settings, not your regular Gmail password.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSmtpTest}
                    disabled={testLoading || !smtpConfig.smtp_email || !smtpConfig.smtp_password}
                    data-testid="test-smtp-button"
                  >
                    {testLoading ? (
                      <div className="w-4 h-4 border-2 border-forest-500 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                  <Button
                    type="submit"
                    disabled={smtpLoading}
                    className="bg-forest-500 hover:bg-forest-600"
                    data-testid="save-smtp-button"
                  >
                    {smtpLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="mt-4">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Image className="h-5 w-5 text-forest-600" />
                Logo Configuration
              </CardTitle>
              <CardDescription>
                Upload your organization's logo to display throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Logo Preview */}
              <div className="space-y-2">
                <Label>Current Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-xl border border-stone-200 flex items-center justify-center bg-white p-2">
                    <img 
                      src={currentLogo} 
                      alt="Current Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-stone-600 mb-3">
                      Your logo will be displayed in the sidebar, mobile header, and login page.
                    </p>
                    {currentLogo !== DEFAULT_LOGO && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetLogo}
                        disabled={logoLoading}
                        className="text-stone-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reset to Default
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload New Logo */}
              <div className="space-y-2">
                <Label>Upload New Logo</Label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-forest-500 hover:bg-forest-50/50 transition-colors">
                  {logoLoading ? (
                    <div className="w-8 h-8 border-3 border-forest-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-10 w-10 mx-auto text-stone-400 mb-3" />
                      <p className="text-sm font-medium text-stone-600">Click to upload logo</p>
                      <p className="text-xs text-stone-400 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={logoLoading}
                    data-testid="logo-upload-input"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

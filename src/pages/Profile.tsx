import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Phone, Mail, MapPin, Calendar, Save } from "lucide-react";

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export default function Profile() {
  const { profile, isAuthenticated, loading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: ""
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch profile data
  useEffect(() => {
    if (profile) {
      fetchFullProfile();
    }
  }, [profile]);

  const fetchFullProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Use relative URL in production, localhost only in development
      const apiUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
      const response = await fetch(`${apiUrl}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          setFormData({
            fullName: data.profile.fullName || "",
            email: data.profile.email || "",
            phone: data.profile.phone || "",
            dateOfBirth: data.profile.dateOfBirth || "",
            gender: data.profile.gender || "",
            addressLine1: data.profile.addressLine1 || "",
            addressLine2: data.profile.addressLine2 || "",
            city: data.profile.city || "",
            state: data.profile.state || "",
            pincode: data.profile.pincode || ""
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    console.log('[Profile] Submitting form with data:', formData);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[Profile] No auth token found');
        toast({
          title: "Error",
          description: "Please sign in again.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      // Use relative URL in production, localhost only in development
      const apiUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
      console.log('[Profile] Making PUT request to:', `${apiUrl}/api/profile`);

      const response = await fetch(`${apiUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('[Profile] Response status:', response.status);
      const data = await response.json();
      console.log('[Profile] Response data:', data);

      if (response.ok && data.success) {
        // Update local storage with new profile data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            user.fullName = formData.fullName;
            user.isProfileComplete = true;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('[Profile] Error updating local storage:', e);
          }
        }

        await refreshProfile();
        toast({
          title: "Profile Updated!",
          description: "Your profile has been saved successfully."
        });

        // Redirect to home if profile is now complete
        if (data.profile?.isProfileComplete) {
          navigate("/");
        }
      } else {
        console.error('[Profile] Update failed:', data);
        toast({
          title: "Error",
          description: data.message || data.error || "Failed to update profile.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[Profile] Request error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isNewUser = profile?.isNewUser || !profile?.isProfileComplete;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Avatar className="h-24 w-24 mx-auto">
            <AvatarImage src={profile?.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-white">
              {formData.fullName ? getInitials(formData.fullName) : <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">
            {isNewUser ? "Complete Your Profile" : "Edit Profile"}
          </h1>
          <p className="text-muted-foreground">
            {isNewUser 
              ? "Please fill in your details to get started" 
              : "Update your personal information"}
          </p>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Fields marked with * are required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    disabled={profile?.authMethod === 'email'}
                    className={profile?.authMethod === 'email' ? 'bg-muted' : ''}
                  />
                  {profile?.authMethod === 'email' && (
                    <p className="text-xs text-muted-foreground">Signed in with this email</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                       disabled={profile?.authMethod === 'phone'}
                    className={profile?.authMethod === 'phone' ? 'bg-muted' : ''}
                  />
                  {profile?.authMethod === 'phone' && (
                    <p className="text-xs text-muted-foreground">Signed in with this phone</p>
                  )}
                </div>
              </div>

              {/* DOB & Gender Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleSelectChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>

                <div className="space-y-2">
                  <Input
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    placeholder="Address Line 1"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Address Line 2 (Optional)"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />

                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />

                  <Input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Pincode"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11"
                disabled={saving || !formData.fullName}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isNewUser ? "Complete Profile" : "Save Changes"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


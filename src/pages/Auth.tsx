import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    otp: ""
  });
  const { signIn, signUp, signInWithPhone, verifyOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully."
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          toast({
            title: "Signup failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account."
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpSent) {
      if (!termsAccepted) {
        toast({
          title: "Terms Required",
          description: "Please accept the terms and conditions to continue.",
          variant: "destructive"
        });
        return;
      }
      
      setLoading(true);
      try {
        const { error } = await signInWithPhone(formData.phone);
        if (error) {
          toast({
            title: "Failed to send OTP",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setOtpSent(true);
          toast({
            title: "OTP Sent!",
            description: "Please check your phone for the verification code."
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { error } = await verifyOtp(formData.phone, formData.otp);
        if (error) {
          toast({
            title: "Verification failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success!",
            description: "You have been logged in successfully."
          });
          navigate("/");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <Button variant="ghost" asChild className="self-start -ml-2">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </Button>
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-11">
                <TabsTrigger value="phone" className="text-sm font-medium">Phone + OTP</TabsTrigger>
                <TabsTrigger value="email" className="text-sm font-medium">Email + Password</TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="space-y-6">
                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 1234567890"
                      disabled={otpSent}
                      className="h-11"
                    />
                  </div>

                  {otpSent && (
                    <div className="space-y-2.5">
                      <Label htmlFor="otp" className="text-sm font-medium">Enter OTP</Label>
                      <Input
                        id="otp"
                        name="otp"
                        type="text"
                        value={formData.otp}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="h-11 text-center text-lg tracking-widest"
                      />
                    </div>
                  )}

                  {!otpSent && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                            className="mt-0.5 h-5 w-5"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor="terms" className="text-sm font-medium cursor-pointer leading-relaxed flex-1">
                                I accept the Terms and Conditions
                              </Label>
                              <button
                                type="button"
                                onClick={() => setShowTerms(!showTerms)}
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium shrink-0"
                              >
                                {showTerms ? 'Hide' : 'View'} details
                                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showTerms ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <Collapsible open={showTerms} onOpenChange={setShowTerms}>
                          <CollapsibleContent className="space-y-3 text-sm text-muted-foreground bg-background/50 p-4 rounded-md border border-border/50 mt-2">
                            <p className="font-semibold text-foreground text-base">Customer Information & Terms</p>
                            <p className="leading-relaxed">By using our service, you agree to provide accurate information for service delivery.</p>
                            <ul className="space-y-2 pl-1">
                              <li className="flex gap-2">
                                <span className="text-primary mt-1 shrink-0">•</span>
                                <span>By continuing, you agree to Finance and authorize our representatives to Call/Email/SMS/RCS/WhatsApp you regarding your application.</span>
                              </li>
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {otpSent ? "Verifying..." : "Sending OTP..."}
                        </>
                      ) : (
                        otpSent ? "Verify OTP" : "Send OTP"
                      )}
                    </Button>

                    {otpSent && (
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => {
                          setOtpSent(false);
                          setFormData({ ...formData, otp: "" });
                        }}
                        className="w-full h-auto py-2 text-sm"
                      >
                        Change phone number
                      </Button>
                    )}
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="email" className="space-y-6">
                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  {!isLogin && (
                    <div className="space-y-2.5">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required={!isLogin}
                        placeholder="Enter your full name"
                        className="h-11"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email"
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your password"
                      minLength={6}
                      className="h-11"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isLogin ? "Signing In..." : "Creating Account..."}
                        </>
                      ) : (
                        isLogin ? "Sign In" : "Sign Up"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="pt-2 text-center border-t">
                  <Button
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm h-auto py-2"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
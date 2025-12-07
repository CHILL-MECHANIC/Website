import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSignUp, setIsSignUp] = useState<boolean | null>(null); // null = not checked yet, true = sign up, false = sign in
  const [userName, setUserName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phone: "",
    otp: ""
  });
  const { checkPhoneExists, signUp, signIn, verifySignUpOtp, verifySignInOtp, resendOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
        // First check if phone exists
        const { exists, hasName } = await checkPhoneExists(formData.phone);
        
        if (exists) {
          // Phone exists - Sign In flow
          setIsSignUp(false);
          const { error, userName: name } = await signIn(formData.phone);
          if (error) {
            toast({
              title: "Failed to send OTP",
              description: error.message,
              variant: "destructive"
            });
            setIsSignUp(null);
          } else {
            setOtpSent(true);
            setUserName(name || null);
            toast({
              title: "OTP Sent!",
              description: name ? `Welcome back! Please check your phone for the verification code.` : "Please check your phone for the verification code."
            });
          }
        } else {
          // Phone doesn't exist - Sign Up flow
          setIsSignUp(true);
          const { error } = await signUp(formData.phone);
          if (error) {
            toast({
              title: "Failed to send OTP",
              description: error.message,
              variant: "destructive"
            });
            setIsSignUp(null);
          } else {
            setOtpSent(true);
            setUserName(null);
            toast({
              title: "OTP Sent!",
              description: "Please check your phone for the verification code to complete registration."
            });
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
        setIsSignUp(null);
      } finally {
        setLoading(false);
      }
    } else {
      // Verify OTP
      setLoading(true);
      try {
        let result;
        if (isSignUp) {
          result = await verifySignUpOtp(formData.phone, formData.otp);
        } else {
          result = await verifySignInOtp(formData.phone, formData.otp);
        }
        
        if (result.error) {
          toast({
            title: "Verification failed",
            description: result.error.message,
            variant: "destructive"
          });
        } else {
          // Navigate based on user state
          if (result.user?.isNewUser || !result.user?.isProfileComplete) {
            navigate("/profile");
          } else {
            navigate("/");
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
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await resendOtp(formData.phone);
      if (error) {
        toast({
          title: "Failed to resend OTP",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "OTP Resent!",
          description: "Please check your phone for the new verification code."
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Reset sign up/in state when phone changes
    if (e.target.name === 'phone' && otpSent) {
      setIsSignUp(null);
      setOtpSent(false);
      setFormData(prev => ({ ...prev, otp: "" }));
    }
  };

  const handleChangePhone = () => {
    setOtpSent(false);
    setIsSignUp(null);
    setUserName(null);
    setFormData({ ...formData, otp: "" });
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
              {isSignUp === false && userName ? `Welcome back, ${userName}!` : isSignUp === true ? "Join ChillMechanic" : "Welcome to ChillMechanic"}
            </CardTitle>
            {isSignUp === false && (
              <p className="text-sm text-muted-foreground">Sign in to your account</p>
            )}
            {isSignUp === true && (
              <p className="text-sm text-muted-foreground">Create your account</p>
            )}
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs value="phone" className="w-full">

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
                        placeholder="Enter 4-digit OTP"
                        maxLength={4}
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
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="link"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="w-full h-auto py-2 text-sm"
                        >
                          Resend OTP
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          onClick={handleChangePhone}
                          disabled={loading}
                          className="w-full h-auto py-2 text-sm"
                        >
                          Change phone number
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

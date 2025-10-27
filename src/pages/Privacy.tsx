import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Shield, Eye, Lock, Users, UserX, AlertTriangle } from "lucide-react";

export default function Privacy() {
  const { getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Call the database function to delete user account and all associated data
      const { error: deleteError } = await supabase.rpc('delete_user_account');
      
      if (deleteError) {
        throw deleteError;
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error deleting account",
        description: error.message || "Failed to delete your account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Privacy Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  At The Chill Mechanic, we are committed to protecting your privacy and ensuring 
                  the security of your personal information. This Privacy Policy explains how we 
                  collect, use, disclose, and safeguard your information when you use our services.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Name, email address, phone number</li>
                    <li>Home or business address for service delivery</li>
                    <li>Payment information (processed securely through payment providers)</li>
                    <li>Service history and preferences</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>How you interact with our website and services</li>
                    <li>Device information and IP address</li>
                    <li>Browser type and operating system</li>
                    <li>Pages visited and time spent on our site</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>To provide and improve our appliance repair services</li>
                  <li>To schedule appointments and send service reminders</li>
                  <li>To process payments and send invoices</li>
                  <li>To communicate with you about our services</li>
                  <li>To send promotional offers (with your consent)</li>
                  <li>To maintain service history for warranty purposes</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card>
              <CardHeader>
                <CardTitle>Information Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We do not sell, trade, or otherwise transfer your personal information to third 
                  parties without your consent, except in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>With service providers who help us operate our business</li>
                  <li>To comply with legal requirements or court orders</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>In connection with a business transfer or merger</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5 text-primary" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Encryption of sensitive data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and employee training</li>
                  <li>Secure payment processing through certified providers</li>
                  <li>Regular backup and disaster recovery procedures</li>
                </ul>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle>Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Access and review your personal information</li>
                  <li>Request corrections to inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  To exercise these rights, please contact us at privacy@chillmechanic.com
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our website uses cookies to enhance your experience, analyze site usage, and 
                  provide personalized content. You can control cookie settings through your 
                  browser preferences. Some features may not function properly if cookies are disabled.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the "Last updated" 
                  date. Your continued use of our services after any changes constitutes acceptance 
                  of the updated policy.
                </p>
              </CardContent>
            </Card>

            {/* Delete Account Section */}
            {user && (
              <Card className="border-destructive bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center text-destructive">
                    <UserX className="mr-2 h-5 w-5" />
                    Delete Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-destructive">Warning: This action is irreversible</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deleting your account will permanently remove all your data, including:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                        <li>Your profile information and contact details</li>
                        <li>All booking history and service records</li>
                        <li>Payment history and receipts</li>
                        <li>Preferences and settings</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-sm">
                      Before deleting your account, consider:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Downloading any important data or receipts you may need</li>
                      <li>Completing any pending service appointments</li>
                      <li>Canceling any active service agreements</li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="lg" disabled={isDeleting}>
                          {isDeleting ? "Deleting..." : "Delete My Account"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center text-destructive">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <p>
                              This action cannot be undone. This will permanently delete your account 
                              and remove all your data from our servers.
                            </p>
                            <p className="font-semibold">
                              Type your email address to confirm: <span className="text-primary">{user.email}</span>
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Yes, delete my account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our data practices, 
                  please contact us:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p>Email: privacy@chillmechanic.com</p>
                  <p>Phone: +91 98765 43210</p>
                  <p>Address: The Chill Mechanic Privacy Office</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

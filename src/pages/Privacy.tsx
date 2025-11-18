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
import { Shield, Eye, Lock, Users, UserX, AlertTriangle, FileText, Scale, AlertCircle, BookOpen, DollarSign, Copyright, Ban, UserCheck, Globe, MessageSquare } from "lucide-react";

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
            <span className="text-secondary">Terms </span> and <span className="text-primary">Conditions</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Please read these terms carefully before using our platform and services.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  1. Introduction and Acceptance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Welcome to Chill Mechanic ("CM" or "the Platform"), operated by Chill Mechanic Pvt Ltd, 
                  a company incorporated under the provisions of the Companies Act, 2013, having its registered office at 
                  Gurgaon, Haryana, India (hereinafter referred to as "the Company," "we," "our," or "us").
                </p>
                <p className="text-muted-foreground">
                  These Terms and Conditions ("Terms") govern your access to and use of the Platform (including the website 
                  https://www.chillmechanic.com, mobile application(s), and related services) and constitute a legally binding 
                  agreement between you and the Company.
                </p>
                <p className="text-muted-foreground">
                  By accessing, registering on, or using the Platform, you agree to be bound by these Terms, including any 
                  policies, guidelines, or amendments thereto that may be introduced by the Company from time to time. If you 
                  do not agree with any of these Terms, you must refrain from using the Platform or any of its services.
                </p>
                <p className="text-muted-foreground">
                  The Company reserves the right to modify, revise, or update these Terms at any time, without prior notice. 
                  Any changes will be effective upon posting on the Platform. Your continued use of the Platform following 
                  such changes constitutes acceptance of the revised Terms.
                </p>
              </CardContent>
            </Card>

            {/* Definitions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  2. Definitions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  For the purpose of these Terms, unless the context otherwise requires:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>"Account"</strong> means the user account created by a User on the Platform to access and use the Services.</li>
                  <li><strong>"Applicable Law"</strong> means all laws, regulations, statutes, ordinances, and other legal requirements in force in India.</li>
                  <li><strong>"Customer" or "User"</strong> refers to any individual or entity using the Platform to request or avail services from professionals registered on CM.</li>
                  <li><strong>"Professional" or "Service Partner"</strong> refers to any individual or entity offering their professional services through the Platform.</li>
                  <li><strong>"Platform"</strong> refers to the Chill Mechanic website and/or mobile application that facilitates the connection between Users and Professionals.</li>
                  <li><strong>"Services"</strong> means all services made available on or through the Platform, including repair, maintenance, inspection, and related tasks.</li>
                  <li><strong>"Company"</strong> refers to Chill Mechanic Pvt Ltd</li>
                  <li><strong>"Content"</strong> means all text, graphics, images, audio, video, software, data compilations, and other information appearing on or forming part of the Platform.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Eligibility */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5 text-primary" />
                  3. Eligibility to Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">You represent and warrant that:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>You are at least 18 years of age and competent to contract under the Indian Contract Act, 1872.</li>
                  <li>You have the right, authority, and capacity to enter into this agreement and to abide by all the Terms.</li>
                  <li>If you are registering or using the Platform on behalf of a business or organization, you are authorized to act on its behalf and bind it to these Terms.</li>
                </ul>
                <p className="text-muted-foreground">
                  The Company reserves the right to deny access to the Platform to any User without prior notice and at its sole discretion.
                </p>
              </CardContent>
            </Card>

            {/* Account Registration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5 text-primary" />
                  4. Account Registration and Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>To access certain features of the Platform, you may be required to create an Account by providing accurate and complete information, including but not limited to your name, contact number, and email address.</li>
                  <li>You agree to maintain the confidentiality of your login credentials and are fully responsible for all activities that occur under your Account.</li>
                  <li>You must immediately notify CM at support@chillmechanic.com of any unauthorized use of your Account or any other breach of security.</li>
                  <li>The Company shall not be liable for any loss or damage arising from your failure to comply with this section.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Service Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  5. Service Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">Role of the Platform:</h3>
                  <p className="text-muted-foreground">
                    Chill Mechanic acts solely as an intermediary to connect Users with Professionals. The actual contract 
                    for service is between the User and the Professional. The Company is not a party to any such contract.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Service Execution:</h3>
                  <p className="text-muted-foreground">
                    Once a booking is confirmed through the Platform, the User agrees to avail of the services directly from 
                    the Professional. The Professional is solely responsible for the performance, quality, and completion of the service.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Pricing:</h3>
                  <p className="text-muted-foreground">
                    Service prices displayed on the Platform are indicative and may vary based on the scope, location, and 
                    nature of the work. Final charges will be confirmed before service initiation.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Verification of Professionals:</h3>
                  <p className="text-muted-foreground">
                    CM undertakes reasonable efforts to verify the background and qualifications of Professionals; however, 
                    CM does not guarantee their competence or the quality of service provided.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">User Acknowledgement:</h3>
                  <p className="text-muted-foreground">
                    By using the Platform, the User acknowledges that CM is not liable for any acts, errors, omissions, 
                    representations, warranties, or negligence of Professionals or for any personal injuries, property damage, 
                    or other damages resulting from services rendered.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cancellations:</h3>
                  <p className="text-muted-foreground">
                    Bookings that are cancelled before confirmation on the Platform will not be charged. CM's cancellation 
                    policy sets out applicable cancellation fees.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Substitution:</h3>
                  <p className="text-muted-foreground">
                    In case of the unavailability of, or cancellation by a selected Service Professional, we will offer you 
                    a substitute of the Service Professional from among our registered Service Professionals.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Obligations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  6. User Obligations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  You agree to use the Platform and Services solely for lawful purposes and in accordance with these Terms.
                </p>
                <p className="text-muted-foreground">You shall not use the Platform to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Engage in any fraudulent, abusive, or unlawful activity;</li>
                  <li>Post or transmit any content that is defamatory, obscene, threatening, or infringing upon third-party rights;</li>
                  <li>Interfere with or disrupt the operation of the Platform, its servers, or networks;</li>
                  <li>Attempt to gain unauthorized access to any portion of the Platform, accounts, or systems connected thereto.</li>
                </ul>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>You shall provide accurate, current, and complete information when registering and during your use of the Platform.</li>
                  <li>You shall cooperate with Professionals and ensure that the premises or property where the service is to be provided is accessible and safe.</li>
                  <li>You shall not request or avail of services directly from Professionals outside the Platform for any work that was initiated through CM.</li>
                </ul>
                <p className="text-muted-foreground">
                  Failure to comply with the above obligations may result in suspension or termination of your account without prior notice.
                </p>
              </CardContent>
            </Card>

            {/* Payment and Refund */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" />
                  7. Payment, Fees, and Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">Payment:</h3>
                  <p className="text-muted-foreground">
                    Users shall pay for services availed through the payment options provided on the Platform, including 
                    credit/debit cards, UPI, wallets, or other authorized payment methods.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Payment Gateway:</h3>
                  <p className="text-muted-foreground">
                    CM uses secure third-party payment gateways. The Company is not responsible for any unauthorized 
                    transactions or issues arising from third-party payment systems.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Service Charges:</h3>
                  <p className="text-muted-foreground">
                    The total amount payable for any service shall include applicable taxes, platform fees, and other 
                    charges as notified before service confirmation.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Refund Policy:</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Refunds may be issued in case of service non-fulfillment, cancellation by the Professional, or duplicate transactions, as per CM's refund policy.</li>
                    <li>Refunds, if applicable, will be processed to the original payment method within 7–10 working days.</li>
                    <li>CM reserves the right to deduct administrative or transaction charges, if any.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Promotions and Discounts:</h3>
                  <p className="text-muted-foreground">
                    Any promotional offers, coupons, or discounts are subject to specific terms and may be modified or 
                    withdrawn at CM's sole discretion.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Copyright className="mr-2 h-5 w-5 text-primary" />
                  8. Intellectual Property Rights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>All content, software, designs, graphics, text, trademarks, and logos on the Platform are the intellectual property of Chill Mechanic Pvt Ltd or its licensors.</li>
                  <li>You agree not to reproduce, modify, copy, distribute, transmit, display, perform, or create derivative works from any material obtained from the Platform without prior written consent.</li>
                  <li>You retain ownership of any content or feedback submitted by you to CM; however, by doing so, you grant CM a worldwide, royalty-free, perpetual license to use, modify, reproduce, and display such content for the purpose of operating and improving the Platform.</li>
                  <li>Any unauthorized use of the Platform's intellectual property may result in legal action under applicable laws.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Disclaimers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-primary" />
                  9. Disclaimers and Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  The Platform and Services are provided on an "as is" and "as available" basis without warranties of any kind, 
                  express or implied.
                </p>
                <p className="text-muted-foreground">CM does not warrant that:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>The Platform will be uninterrupted, timely, secure, or error-free;</li>
                  <li>The Services provided by Professionals will meet your expectations or standards.</li>
                </ul>
                <p className="text-muted-foreground">
                  The Company makes no representations or warranties regarding the reliability, quality, or suitability of any 
                  Professional or the Services provided.
                </p>
                <p className="text-muted-foreground">
                  To the fullest extent permitted by law, CM shall not be liable for any direct, indirect, incidental, special, 
                  consequential, or exemplary damages, including but not limited to loss of profits, goodwill, or data, arising 
                  out of your use or inability to use the Platform or Services.
                </p>
                <p className="text-muted-foreground">
                  The total liability of CM, if any, shall not exceed the amount paid by the User for the specific service in question.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ban className="mr-2 h-5 w-5 text-primary" />
                  10. Termination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  CM may, at its sole discretion, suspend or terminate your access to the Platform, without prior notice, 
                  for any reason, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Violation of these Terms or applicable laws;</li>
                  <li>Misuse of the Platform or Services;</li>
                  <li>Engagement in fraudulent, illegal, or abusive conduct.</li>
                </ul>
                <p className="text-muted-foreground">
                  Upon termination, your right to use the Platform shall immediately cease.
                </p>
                <p className="text-muted-foreground">
                  The Company reserves the right to remove or delete your account information and any content associated with 
                  it, subject to legal data retention requirements.
                </p>
                <p className="text-muted-foreground">
                  The provisions relating to intellectual property, limitations of liability, and indemnity shall survive 
                  termination of these Terms.
                </p>
              </CardContent>
            </Card>

            {/* Indemnity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scale className="mr-2 h-5 w-5 text-primary" />
                  11. Indemnity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless Chill Mechanic Pvt Ltd, its directors, 
                  employees, agents, affiliates, and representatives from and against any and all losses, liabilities, damages, 
                  claims, demands, costs, or expenses (including reasonable legal fees) arising out of or in connection with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Your use or misuse of the Platform or Services;</li>
                  <li>Your breach of these Terms or any applicable law;</li>
                  <li>Any infringement of intellectual property or other rights of a third party;</li>
                  <li>Any act, omission, or negligence resulting in injury or damage to any person or property.</li>
                </ul>
                <p className="text-muted-foreground">
                  This obligation will survive the termination or expiration of these Terms and your use of the Platform.
                </p>
              </CardContent>
            </Card>

            {/* Privacy and Data Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-primary" />
                  12. Privacy and Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  CM values your privacy and is committed to protecting your personal data. All personal information collected 
                  from Users and Professionals shall be handled in accordance with applicable data protection laws and the 
                  Chill Mechanic Privacy Policy, available at https://www.chillmechanic.com/privacy.
                </p>
                <p className="text-muted-foreground">
                  By using the Platform, you consent to the collection, storage, and use of your personal data as described 
                  in the Privacy Policy.
                </p>
                <p className="text-muted-foreground">CM may use your information to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Facilitate and improve service delivery;</li>
                  <li>Communicate updates, offers, or relevant information;</li>
                  <li>Ensure safety, fraud prevention, and legal compliance.</li>
                </ul>
                <p className="text-muted-foreground">
                  CM shall not share your personal data with third parties without your consent, except as required by law or 
                  to facilitate service delivery.
                </p>
                <p className="text-muted-foreground">
                  For any concerns regarding data privacy, you may contact support@chillmechanic.com.
                </p>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  13. Governing Law and Jurisdiction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.</li>
                  <li>Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Gurgaon, Haryana, India.</li>
                  <li>You expressly consent to the jurisdiction of such courts and waive any objections on the grounds of venue or inconvenience.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Grievance Redressal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  14. Grievance Redressal Mechanism
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  In accordance with the Information Technology Act, 2000 and applicable rules, the details of the Grievance 
                  Officer are as follows:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold">Grievance Officer:</p>
                  <p className="text-muted-foreground">Chill Mechanic Pvt Ltd</p>
                  <p className="text-muted-foreground">Gurgaon, Haryana, India</p>
                  <p className="text-muted-foreground">Email: support@chillmechanic.com</p>
                   <p className="text-muted-foreground">GST: 06AANCC0852E1ZV</p>
                </div>
                <p className="text-muted-foreground">
                  Any complaints or concerns regarding the use of the Platform, violation of these Terms, or breach of applicable 
                  laws may be addressed to the Grievance Officer via email. CM shall make reasonable efforts to respond to and 
                  resolve complaints within 30 days from the date of receipt.
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
                <CardTitle>15. Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  For general inquiries, feedback, or support, you may reach us at:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold">Chill Mechanic Pvt Ltd</p>
                  <p className="text-muted-foreground">Registered Office: Suncity Vatsal Valley Sector 02 Gwal Pahari Gurgaon 122003, Haryana, India</p>
                  <p className="text-muted-foreground">Website: https://www.chillmechanic.com</p>
                  <p className="text-muted-foreground">Email: support@chillmechanic.com</p>
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

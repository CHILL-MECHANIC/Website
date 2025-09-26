import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { CheckCircle, Users, Award, Clock, Shield } from "lucide-react";

export default function About() {
  const { getCartItemsCount } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="text-primary">The Chill Mechanic</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your trusted partner for all cooling and heating appliance services. 
              We bring professional, reliable, and affordable solutions right to your doorstep.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-center text-muted-foreground">
                To provide exceptional appliance maintenance and repair services that ensure comfort, 
                efficiency, and peace of mind for every home and business we serve. We believe in 
                building lasting relationships through quality service and transparent pricing.
              </p>
            </CardContent>
          </Card>

          {/* Why Choose Us */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose The Chill Mechanic?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>Expert Technicians</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Our certified professionals have years of experience in appliance repair 
                    and maintenance across all major brands.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Clock className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>Quick Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Same-day service available with flexible scheduling options 
                    to fit your busy lifestyle.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>Quality Guarantee</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    All our services come with warranty coverage and 100% 
                    satisfaction guarantee for your peace of mind.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Award className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>Transparent Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    No hidden charges or surprise fees. Get upfront pricing 
                    before any work begins.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle>Genuine Parts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    We use only genuine and high-quality replacement parts 
                    to ensure longevity of your appliances.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Clock className="h-12 w-12 mx-auto text-secondary mb-4" />
                  <CardTitle>24/7 Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Round-the-clock customer support for emergency repairs 
                    and service inquiries.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Services Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Our Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cooling Solutions</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Air Conditioner Service & Repair
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Refrigerator Maintenance
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Deep Cleaning Services
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Other Appliances</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Water Purifier (RO) Service
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Geyser Repair & Installation
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Washing Machine Service
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
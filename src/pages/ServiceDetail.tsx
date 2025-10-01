import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

import acServiceImage from "@/assets/ac-service.jpg";
import refrigeratorServiceImage from "@/assets/refrigerator-service.jpg";
import roServiceImage from "@/assets/ro-service.jpg";
import geyserServiceImage from "@/assets/geyser-service.jpg";
import washingMachineServiceImage from "@/assets/washing-machine-service.jpg";

const serviceDetails = {
  ac: {
    title: "AC Service & Repair",
    image: acServiceImage,
    description: "Professional AC repair and maintenance services for all brands and models.",
    longDescription: `
      Our expert technicians provide comprehensive AC services including cooling system diagnostics, 
      filter cleaning and replacement, compressor repair, refrigerant charging, and complete system maintenance. 
      We ensure your air conditioning unit operates at peak efficiency, providing optimal cooling comfort for your home.
    `,
    services: [
      { id: "ac-full", name: "AC Full Servicing", price: 749, description: "Complete AC maintenance with filter cleaning, compressor check, and performance optimization." },
      { id: "ac-basic", name: "AC Basic Cleaning", price: 299, description: "Basic filter cleaning and general inspection of your AC unit." },
      { id: "ac-repair", name: "AC Repair", price: 1200, description: "Comprehensive repair services for cooling issues, compressor problems, and electrical faults." },
      { id: "ac-installation", name: "AC Installation", price: 899, description: "Professional installation of new AC units with proper setup and testing." },
    ],
  },
  refrigerator: {
    title: "Refrigerator Service & Repair",
    image: refrigeratorServiceImage,
    description: "Expert refrigerator repair services for cooling, compressor, and electrical issues.",
    longDescription: `
      Our skilled technicians handle all types of refrigerator problems including cooling issues, 
      compressor failures, thermostat problems, door seal replacements, and electrical repairs. 
      We service all major brands and ensure your refrigerator maintains optimal food preservation.
    `,
    services: [
      { id: "fridge-full", name: "Refrigerator Full Service", price: 699, description: "Complete inspection and maintenance of cooling system and components." },
      { id: "fridge-repair", name: "Refrigerator Repair", price: 999, description: "Professional repair for compressor issues, cooling problems, and electrical faults." },
      { id: "fridge-installation", name: "Refrigerator Installation", price: 599, description: "Professional installation and setup of new refrigerator units." },
    ],
  },
  ro: {
    title: "RO Water Purifier Service",
    image: roServiceImage,
    description: "Complete RO system maintenance, filter replacement, and water quality optimization.",
    longDescription: `
      Our RO service includes filter replacement, membrane cleaning, TDS testing, 
      water quality assessment, and complete system maintenance. We ensure your 
      water purifier delivers safe, clean drinking water for your family.
    `,
    services: [
      { id: "ro-service", name: "RO Service & Maintenance", price: 399, description: "Regular maintenance with filter replacement and system check." },
      { id: "ro-installation", name: "RO Installation", price: 1299, description: "Complete installation of new RO system with water quality testing." },
      { id: "ro-repair", name: "RO Repair", price: 799, description: "Repair services for pump issues, leakage, and electrical problems." },
    ],
  },
  geyser: {
    title: "Geyser Service & Repair",
    image: geyserServiceImage,
    description: "Professional geyser repair, maintenance, and installation services.",
    longDescription: `
      Our geyser services include heating element replacement, thermostat repair, 
      tank cleaning, safety valve maintenance, and electrical safety checks. 
      We ensure reliable hot water supply and safe operation of your water heater.
    `,
    services: [
      { id: "geyser-service", name: "Geyser Service", price: 499, description: "Complete maintenance with element check and tank cleaning." },
      { id: "geyser-installation", name: "Geyser Installation", price: 899, description: "Professional installation with proper pipe fitting and safety setup." },
      { id: "geyser-repair", name: "Geyser Repair", price: 799, description: "Repair services for heating issues, thermostat problems, and leakage." },
    ],
  },
  "washing-machine": {
    title: "Washing Machine Service & Repair",
    image: washingMachineServiceImage,
    description: "Expert washing machine repair and maintenance for all brands and models.",
    longDescription: `
      Our washing machine services cover motor repair, drum cleaning, belt replacement, 
      drain cleaning, control panel fixes, and complete system maintenance. 
      We ensure your washing machine operates efficiently for reliable laundry care.
    `,
    services: [
      { id: "wm-service", name: "Washing Machine Service", price: 599, description: "Regular maintenance with drum cleaning and performance check." },
      { id: "wm-repair", name: "Washing Machine Repair", price: 1199, description: "Complete repair services for motor, belt, and control issues." },
      { id: "wm-installation", name: "Washing Machine Installation", price: 699, description: "Professional installation and setup of new washing machines." },
    ],
  },
};

export default function ServiceDetail() {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemsCount } = useCart();
  
  const service = serviceType ? serviceDetails[serviceType as keyof typeof serviceDetails] : null;

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={getCartItemsCount()} />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Service not found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = (serviceItem: any) => {
    const cartService = {
      id: serviceItem.id,
      name: serviceItem.name,
      description: [serviceItem.description],
      price: serviceItem.price,
    };
    
    addToCart([cartService]);
    toast({
      title: "Added to cart",
      description: `${serviceItem.name} has been added to your cart.`,
    });
  };

  const handleBookNow = (serviceItem: any) => {
    handleAddToCart(serviceItem);
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {service.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {service.description}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {service.longDescription}
              </p>
            </div>
            
            <div className="relative">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our range of professional services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.services.map((serviceItem) => (
              <Card key={serviceItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <h3 className="text-xl font-semibold">{serviceItem.name}</h3>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {serviceItem.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <span className="text-2xl font-bold text-primary">${serviceItem.price}</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => navigate(`/services/${serviceType}/${serviceItem.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button 
                      onClick={() => handleAddToCart(serviceItem)}
                      variant="outline" 
                      className="flex-1"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
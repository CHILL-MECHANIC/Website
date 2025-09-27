import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

import acServiceImage from "@/assets/ac-service.jpg";
import refrigeratorServiceImage from "@/assets/refrigerator-service.jpg";
import roServiceImage from "@/assets/ro-service.jpg";
import geyserServiceImage from "@/assets/geyser-service.jpg";
import washingMachineServiceImage from "@/assets/washing-machine-service.jpg";

const serviceItemDetails = {
  "ac-full": {
    id: "ac-full",
    name: "AC Full Servicing",
    categoryTitle: "AC Service & Repair",
    image: acServiceImage,
    price: 749,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Complete AC maintenance with filter cleaning, compressor check, and performance optimization.",
    detailedDescription: "Our comprehensive AC full servicing ensures your air conditioning unit operates at peak efficiency. Our certified technicians perform thorough cleaning, inspection, and optimization to maximize cooling performance and extend your AC's lifespan.",
    included: [
      "Deep cleaning of indoor and outdoor units",
      "Filter cleaning and replacement if needed",
      "Compressor inspection and testing",
      "Refrigerant level check and top-up if required",
      "Electrical connection inspection",
      "Thermostat calibration",
      "Performance optimization",
      "30-day service warranty"
    ],
    notIncluded: [
      "Major component replacement (compressor, condenser)",
      "Refrigerant gas refill (charged separately)",
      "Electrical wiring repairs",
      "Ductwork cleaning",
      "Installation or relocation services"
    ]
  },
  "ac-basic": {
    id: "ac-basic",
    name: "AC Basic Cleaning",
    categoryTitle: "AC Service & Repair",
    image: acServiceImage,
    price: 299,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Basic filter cleaning and general inspection of your AC unit.",
    detailedDescription: "Essential AC maintenance service focused on cleaning and basic inspection to ensure your air conditioner runs smoothly and efficiently.",
    included: [
      "Indoor unit filter cleaning",
      "Outdoor unit basic cleaning",
      "General inspection of visible components",
      "Basic performance check",
      "15-day service warranty"
    ],
    notIncluded: [
      "Deep cleaning of internal components",
      "Refrigerant level check",
      "Electrical component inspection",
      "Compressor servicing",
      "Parts replacement"
    ]
  },
  "ac-repair": {
    id: "ac-repair",
    name: "AC Repair",
    categoryTitle: "AC Service & Repair",
    image: acServiceImage,
    price: 1200,
    duration: "2-4 hours",
    warranty: "90 days",
    description: "Comprehensive repair services for cooling issues, compressor problems, and electrical faults.",
    detailedDescription: "Professional AC repair service to diagnose and fix cooling issues, electrical problems, and component failures to restore your air conditioner to optimal working condition.",
    included: [
      "Complete diagnostic assessment",
      "Repair of cooling issues",
      "Electrical fault correction",
      "Component testing and repair",
      "Performance restoration",
      "90-day repair warranty",
      "Post-repair testing and optimization"
    ],
    notIncluded: [
      "Cost of replacement parts",
      "Refrigerant gas charges",
      "Installation of new units",
      "Ductwork modifications",
      "Cosmetic damage repairs"
    ]
  },
  "fridge-full": {
    id: "fridge-full",
    name: "Refrigerator Full Service",
    categoryTitle: "Refrigerator Service & Repair",
    image: refrigeratorServiceImage,
    price: 699,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Complete inspection and maintenance of cooling system and components.",
    detailedDescription: "Comprehensive refrigerator servicing including cooling system maintenance, component inspection, and performance optimization to ensure food preservation efficiency.",
    included: [
      "Complete cooling system inspection",
      "Compressor performance check",
      "Thermostat calibration",
      "Door seal inspection and cleaning",
      "Internal and external cleaning",
      "Energy efficiency optimization",
      "30-day service warranty"
    ],
    notIncluded: [
      "Major component replacement",
      "Refrigerant gas refill",
      "Electrical board repairs",
      "Ice maker repairs",
      "Cosmetic damage fixes"
    ]
  },
  "ro-service": {
    id: "ro-service",
    name: "RO Service & Maintenance",
    categoryTitle: "RO Water Purifier Service",
    image: roServiceImage,
    price: 399,
    duration: "1-2 hours",
    warranty: "60 days",
    description: "Regular maintenance with filter replacement and system check.",
    detailedDescription: "Complete RO water purifier maintenance including filter replacement, system cleaning, and water quality testing to ensure safe, clean drinking water.",
    included: [
      "Pre-filter replacement",
      "Post-carbon filter replacement",
      "System cleaning and sanitization",
      "TDS level testing",
      "Water quality assessment",
      "Pressure check",
      "60-day service warranty"
    ],
    notIncluded: [
      "RO membrane replacement (charged separately)",
      "UV lamp replacement",
      "Pump repairs",
      "Electrical component fixes",
      "Installation or relocation"
    ]
  },
  "geyser-service": {
    id: "geyser-service",
    name: "Geyser Service",
    categoryTitle: "Geyser Service & Repair",
    image: geyserServiceImage,
    price: 499,
    duration: "1-2 hours",
    warranty: "30 days",
    description: "Complete maintenance with element check and tank cleaning.",
    detailedDescription: "Professional geyser servicing including heating element inspection, tank cleaning, and safety system checks for reliable hot water supply.",
    included: [
      "Heating element inspection",
      "Thermostat testing",
      "Tank internal cleaning",
      "Safety valve check",
      "Electrical connection inspection",
      "Temperature calibration",
      "30-day service warranty"
    ],
    notIncluded: [
      "Heating element replacement",
      "Thermostat replacement",
      "Tank replacement",
      "Pipe fitting modifications",
      "Electrical rewiring"
    ]
  },
  "wm-service": {
    id: "wm-service",
    name: "Washing Machine Service",
    categoryTitle: "Washing Machine Service & Repair",
    image: washingMachineServiceImage,
    price: 599,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Regular maintenance with drum cleaning and performance check.",
    detailedDescription: "Comprehensive washing machine maintenance including drum cleaning, component inspection, and performance optimization for efficient laundry care.",
    included: [
      "Drum deep cleaning and descaling",
      "Filter cleaning",
      "Drain pipe cleaning",
      "Belt and motor inspection",
      "Control panel testing",
      "Water inlet valve check",
      "30-day service warranty"
    ],
    notIncluded: [
      "Motor replacement",
      "Belt replacement",
      "Control board repairs",
      "Drum replacement",
      "Installation services"
    ]
  }
};

export default function ServiceItemDetail() {
  const { serviceType, serviceId } = useParams<{ serviceType: string; serviceId: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemsCount } = useCart();
  
  const serviceItem = serviceId ? serviceItemDetails[serviceId as keyof typeof serviceItemDetails] : null;

  if (!serviceItem) {
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

  const handleAddToCart = () => {
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

  const handleBookNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/services/${serviceType}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {serviceItem.categoryTitle}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Service Image */}
          <div className="relative">
            <img
              src={serviceItem.image}
              alt={serviceItem.name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Service Details */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{serviceItem.categoryTitle}</Badge>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">{serviceItem.name}</h1>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">${serviceItem.price}</div>
                <div className="text-sm text-muted-foreground">Price</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{serviceItem.duration}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{serviceItem.warranty}</div>
                <div className="text-sm text-muted-foreground">Warranty</div>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-6">
              {serviceItem.detailedDescription}
            </p>

            <div className="flex gap-3 mb-8">
              <Button onClick={handleBookNow} size="lg" className="flex-1">
                Book Now
              </Button>
              <Button onClick={handleAddToCart} variant="outline" size="lg" className="flex-1">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* What's Included & Not Included */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* What's Included */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-green-600 flex items-center">
                <Check className="mr-2 h-5 w-5" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {serviceItem.included.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* What's Not Included */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-red-600 flex items-center">
                <X className="mr-2 h-5 w-5" />
                What's Not Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {serviceItem.notIncluded.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <X className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
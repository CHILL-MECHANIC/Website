import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Clock, Shield, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

import acServiceImage from "@/assets/ac-service.jpg";
import acServiceImage2 from "@/assets/ac-service-2.jpg";
import acServiceImage3 from "@/assets/ac-service-3.jpg";
import refrigeratorServiceImage from "@/assets/refrigerator-service.jpg";
import refrigeratorServiceImage2 from "@/assets/refrigerator-service-2.jpg";
import roServiceImage from "@/assets/ro-service.jpg";
import roServiceImage2 from "@/assets/ro-service-2.jpg";
import geyserServiceImage from "@/assets/geyser-service.jpg";
import geyserServiceImage2 from "@/assets/geyser-service-2.jpg";
import washingMachineServiceImage from "@/assets/washing-machine-service.jpg";
import washingMachineServiceImage2 from "@/assets/washing-machine-service-2.jpg";
import microwaveServiceImage from "@/assets/microwave-service.jpg";
import microwaveServiceImage2 from "@/assets/microwave-service-2.jpg";

const serviceItemDetails = {
  "ac-full": {
    id: "ac-full",
    name: "AC Full Servicing",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
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
    images: [acServiceImage, acServiceImage2],
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
    images: [acServiceImage, acServiceImage3],
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
    images: [refrigeratorServiceImage, refrigeratorServiceImage2],
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
    images: [roServiceImage, roServiceImage2],
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
    images: [geyserServiceImage, geyserServiceImage2],
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
    images: [washingMachineServiceImage, washingMachineServiceImage2],
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
  },
  "microwave-service": {
    id: "microwave-service",
    name: "Microwave Service",
    categoryTitle: "Microwave Service & Repair",
    images: [microwaveServiceImage, microwaveServiceImage2],
    price: 399,
    duration: "1-2 hours",
    warranty: "30 days",
    description: "Complete maintenance with interior cleaning and component check.",
    detailedDescription: "Professional microwave maintenance including interior cleaning, magnetron testing, turntable inspection, and safety checks for optimal cooking performance.",
    included: [
      "Interior deep cleaning",
      "Magnetron functionality test",
      "Turntable and roller inspection",
      "Door seal and alignment check",
      "Control panel testing",
      "Safety interlock inspection",
      "30-day service warranty"
    ],
    notIncluded: [
      "Magnetron replacement",
      "Control board replacement",
      "Door replacement",
      "Cavity repair",
      "Installation services"
    ]
  },
  "microwave-repair": {
    id: "microwave-repair",
    name: "Microwave Repair",
    categoryTitle: "Microwave Service & Repair",
    images: [microwaveServiceImage, microwaveServiceImage2],
    price: 799,
    duration: "2-3 hours",
    warranty: "60 days",
    description: "Professional repair for heating issues, door problems, and electrical faults.",
    detailedDescription: "Expert microwave repair service to diagnose and fix heating issues, door problems, electrical faults, and component failures to restore your microwave to optimal working condition.",
    included: [
      "Complete diagnostic assessment",
      "Heating issue repair",
      "Door mechanism repair",
      "Electrical fault correction",
      "Component replacement (if needed)",
      "Safety system verification",
      "60-day repair warranty"
    ],
    notIncluded: [
      "Cost of major replacement parts",
      "Cavity structural repairs",
      "Cosmetic damage repairs",
      "Installation of new units",
      "Extended warranty coverage"
    ]
  },
  "microwave-installation": {
    id: "microwave-installation",
    name: "Microwave Installation",
    categoryTitle: "Microwave Service & Repair",
    images: [microwaveServiceImage, microwaveServiceImage2],
    price: 499,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Professional installation and setup of new microwave units.",
    detailedDescription: "Complete microwave installation service including mounting, electrical connection, safety checks, and operational demonstration for countertop and over-the-range models.",
    included: [
      "Professional mounting and positioning",
      "Electrical connection setup",
      "Safety and functionality testing",
      "Operational demonstration",
      "User guide explanation",
      "15-day installation warranty"
    ],
    notIncluded: [
      "Microwave unit cost",
      "Custom cabinetry work",
      "Major electrical upgrades",
      "Wall modifications",
      "Removal of old unit"
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
          {/* Service Image Carousel */}
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {serviceItem.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <img
                      src={image}
                      alt={`${serviceItem.name} - Image ${index + 1}`}
                      className="w-full h-96 object-cover rounded-lg shadow-lg"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>

          {/* Service Details */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{serviceItem.categoryTitle}</Badge>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">{serviceItem.name}</h1>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">₹{serviceItem.price}</div>
                  <div className="text-2xl font-bold text-primary">${serviceItem.price}</div>
                  <div className="text-sm text-muted-foreground">Price</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{serviceItem.duration}</div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{serviceItem.warranty}</div>
                  <div className="text-sm text-muted-foreground">Warranty</div>
                </div>
              </Card>
            </div>

            <Card className="p-6 mb-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">Service Description</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="text-muted-foreground leading-relaxed">
                  {serviceItem.detailedDescription}
                </p>
              </CardContent>
            </Card>

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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ServiceOption {
  id: string;
  name: string;
  description: string[];
  price: number;
}

interface ServiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
  onContinue: (selectedServices: ServiceOption[]) => void;
  onAddToCart: (selectedServices: ServiceOption[]) => void;
}

const serviceOptions: { [key: string]: ServiceOption[] } = {
  ac: [
    {
      id: "ac-full",
      name: "AC not cooling/less cooling",
      description: ["Complete diagnostic inspection", "Cooling system check", "Thermostat calibration"],
      price: 299,
    },
    {
      id: "ac-basic",
      name: "Foam Power Jet Service - 1 AC",
      description: ["Foam jet deep cleaning of indoor unit", "Filter cleaning and sanitization", "Outdoor unit cleaning", "Cooling performance check", "Drainage system cleaning"],
      price: 549,
    },
    {
      id: "ac-repair",
      name: "Foam Power Jet Service - 2 AC",
      description: ["Foam jet deep cleaning of 2 indoor units", "Filter cleaning and sanitization for both units", "Outdoor unit cleaning for both", "Cooling performance check", "Drainage system cleaning"],
      price: 949,
    },
    {
      id: "ac-repair",
      name: "Foam Power Jet Service - 3 AC",
      description: ["Foam jet deep cleaning of 3 indoor units", "Filter cleaning and sanitization for all units", "Outdoor unit cleaning for all", "Cooling performance check", "Drainage system cleaning"],
      price: 1399,
    },
    {
      id: "ac-repair",
      name: "Foam Power Jet Service - 4 AC",
      description: ["Foam jet deep cleaning of 4 indoor units", "Filter cleaning and sanitization for all units", "Outdoor unit cleaning for all", "Cooling performance check", "Drainage system cleaning"],
      price: 1949,
    },
    {
      id: "ac-repair",
      name: "Foam Power Jet Service - 5 AC",
      description: ["Foam jet deep cleaning of 5 indoor units", "Filter cleaning and sanitization for all units", "Outdoor unit cleaning for all", "Cooling performance check", "Drainage system cleaning"],
      price: 2449,
    },  
    {
      id: "ac-repair",
      name: "Split AC installation",
      description: ["Copper pipe connection (up to 3 meters)", "Electrical wiring and connection", "Indoor and outdoor unit mounting", "Vacuum testing", "Complete commissioning"],
      price: 1449,
    },
  ],
  refrigerator: [
    {
      id: "fridge-full",
      name: "Check Up - Single Door",
      description: ["Complete diagnostic inspection", "Cooling system check", "Thermostat calibration"],
      price: 249,
    },
    {
      id: "fridge-repair",
      name: "Check Up - Double Door",
      description: ["Complete diagnostic inspection", "Cooling system check", "Thermostat calibration"],
      price: 249,
    },
  ],
  ro: [
    {
      id: "ro-service",
      name: "Water Purifier Full Service",
      description: ["Complete diagnostic inspection", "Filter replacement", "Membrane cleaning", "TDS check", "Water quality assessment", "Leakage detection", "System cleaning"],
      price: 3799,
    },
    {
      id: "ro-installation",
      name: "Water Purifier Installation",
      description: ["Complete installation", "Water quality test", "Setup and demonstration"],
      price: 349,
    },
  ],
  geyser: [
    {
      id: "geyser-service",
      name: "Check Up - Geyser",
      description: ["Complete diagnostic inspection", "Heating element inspection", "Thermostat testing", "Safety valve check", "Electrical connection inspection", "Temperature testing", "Leakage detection"],
      price: 249,
    },
    {
      id: "geyser-installation",
      name: "Geyser Installation",
      description: ["Complete Installation", "Pipe Fitting", "Safety Check"],
      price: 399,
    },
  ],
  "washing-machine": [
    {
      id: "wm-service",
      name: "Checkup - AM Top Load",
      description: ["Complete diagnostic inspection", "Drum and agitator check", "Motor and belt inspection", "Control panel testing", "Drain system check", "Water inlet valve test"],
      price: 249,
    },
    {
      id: "wm-repair",
      name: "Checkup - AM Front Load",
      description: ["Complete diagnostic inspection", "Drum and door seal check", "Motor and suspension inspection", "Control panel testing", "Drain pump check", "Water inlet system test"],
      price: 249,
    },
  ],
  microwave: [
    {
      id: "microwave-service",
      name: "Check Up - Microwave",
      description: ["Complete diagnostic inspection", "Magnetron functionality check", "Turntable Check"],
      price: 249,
    },
  ],
};

export default function ServiceSelectionModal({
  isOpen,
  onClose,
  serviceType,
  onContinue,
  onAddToCart,
}: ServiceSelectionModalProps) {
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const navigate = useNavigate();
  
  const options = serviceOptions[serviceType] || [];

  const handleOtherServicesClick = () => {
    onClose();
    navigate("/");
    // Scroll to services section after navigation
    setTimeout(() => {
      const servicesSection = document.querySelector('[data-services-section]');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleServiceCategoryClick = (category: string) => {
    onClose();
    navigate(`/services/${category}`);
  };

  const handleServiceToggle = (service: ServiceOption, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, service]);
    } else {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    }
  };

  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

  const handleContinue = () => {
    onContinue(selectedServices);
    setSelectedServices([]);
  };

  const handleAddToCart = () => {
    onAddToCart(selectedServices);
    setSelectedServices([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Service</DialogTitle>
          <DialogDescription>Choose the services you need</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {options.map((service) => {
            const isChecked = selectedServices.some(s => s.id === service.id);
            
            return (
              <div key={service.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{service.name}</h4>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      {service.description.map((desc, index) => (
                        <li key={index}>{desc}</li>
                      ))}
                    </ul>
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Total Price incl. taxes </span>
                      <span className="font-bold text-lg">₹{service.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="text-center mb-3">
              <span className="text-sm font-medium text-muted-foreground">Browse Other Services</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleServiceCategoryClick('ac')}
                className="text-xs"
              >
                AC Services
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleServiceCategoryClick('refrigerator')}
                className="text-xs"
              >
                Refrigerator
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleServiceCategoryClick('ro')}
                className="text-xs"
              >
                RO Services
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleServiceCategoryClick('geyser')}
                className="text-xs"
              >
                Geyser Services
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleServiceCategoryClick('washing-machine')}
                className="text-xs"
              >
                Washing Machine
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleServiceCategoryClick('microwave')}
                className="text-xs"
              >
                Microwave
              </Button>
            </div>
          </div>
        </div>

        {selectedServices.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold text-primary">₹{totalPrice}</span>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          {selectedServices.length > 0 && (
            <>
              <Button onClick={handleAddToCart} variant="secondary" className="flex-1">
                Add to Cart
              </Button>
              <Button onClick={handleContinue} className="flex-1">
                Continue
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      id: "ac-foam-1",
      name: "Foam Power Jet Service-1 AC",
      description: ["Basic foam cleaning", "Filter cleaning"],
      price: 549,
    },
    {
      id: "ac-foam-2",
      name: "Foam Power Jet Service-2 AC",
      description: ["Deep foam cleaning", "Filter cleaning", "Basic maintenance"],
      price: 949,
    },
    {
      id: "ac-foam-3",
      name: "Foam Power Jet Service-3 AC",
      description: ["Deep foam cleaning", "Complete filter service", "Coil cleaning"],
      price: 1399,
    },
    {
      id: "ac-foam-4",
      name: "Foam Power Jet Service-4 AC",
      description: ["Premium foam cleaning", "Complete servicing", "Performance check"],
      price: 1949,
    },
    {
      id: "ac-foam-5",
      name: "Foam Power Jet Service-5 AC",
      description: ["Ultimate foam cleaning", "Complete deep service", "Full inspection"],
      price: 2449,
    },
    {
      id: "ac-not-cooling",
      name: "AC Not Cooling/Less Cooling",
      description: ["Diagnose cooling issues", "Basic repair"],
      price: 249,
    },
    {
      id: "ac-power-issue",
      name: "AC Power Issue",
      description: ["Electrical diagnosis", "Power circuit repair"],
      price: 249,
    },
    {
      id: "ac-noise",
      name: "AC Noise Reduction",
      description: ["Noise diagnosis", "Component adjustment", "Lubrication"],
      price: 449,
    },
    {
      id: "ac-water-leakage",
      name: "AC Water Leakage Repair",
      description: ["Leak detection", "Drain cleaning", "Seal repair"],
      price: 549,
    },
    {
      id: "ac-gas-refill",
      name: "Gas Refill & Check Up",
      description: ["Gas leak detection", "Gas refill", "Pressure check"],
      price: 2399,
    },
    {
      id: "ac-split-installation",
      name: "Split AC Installation",
      description: ["Complete installation", "Piping & wiring", "Testing"],
      price: 1449,
    },
    {
      id: "ac-split-uninstallation",
      name: "Split AC Uninstallation",
      description: ["Safe removal", "Gas recovery", "Dismantling"],
      price: 1299,
    },
    {
      id: "ac-window-installation",
      name: "Window AC Installation",
      description: ["Window mounting", "Electrical setup", "Testing"],
      price: 1049,
    },
    {
      id: "ac-window-uninstallation",
      name: "Window AC Uninstallation",
      description: ["Safe removal", "Window restoration"],
      price: 949,
    },
  ],
  refrigerator: [
    {
      id: "fridge-full",
      name: "Refrigerator Full Service",
      description: ["Complete Inspection", "Cooling System Check", "Thermostat Calibration"],
      price: 699,
    },
    {
      id: "fridge-repair",
      name: "Refrigerator Repair",
      description: ["Compressor Issues", "Door Seal Replacement", "Temperature Control"],
      price: 999,
    },
  ],
  ro: [
    {
      id: "ro-service",
      name: "RO Service & Maintenance",
      description: ["Filter Replacement", "Membrane Cleaning", "TDS Check"],
      price: 399,
    },
    {
      id: "ro-installation",
      name: "RO Installation",
      description: ["Complete Installation", "Water Quality Test", "Setup & Demo"],
      price: 1299,
    },
  ],
  geyser: [
    {
      id: "geyser-service",
      name: "Geyser Service",
      description: ["Element Replacement", "Thermostat Check", "Tank Cleaning"],
      price: 499,
    },
    {
      id: "geyser-installation",
      name: "Geyser Installation",
      description: ["Complete Installation", "Pipe Fitting", "Safety Check"],
      price: 899,
    },
  ],
  "washing-machine": [
    {
      id: "wm-service",
      name: "Washing Machine Service",
      description: ["Drum Cleaning", "Motor Check", "Drain Cleaning"],
      price: 599,
    },
    {
      id: "wm-repair",
      name: "Washing Machine Repair",
      description: ["Motor Repair", "Belt Replacement", "Control Panel Fix"],
      price: 1199,
    },
  ],
  microwave: [
    {
      id: "microwave-service",
      name: "Microwave Service",
      description: ["Interior Cleaning", "Magnetron Test", "Turntable Check"],
      price: 399,
    },
    {
      id: "microwave-repair",
      name: "Microwave Repair",
      description: ["Heating Issues", "Door Repair", "Electrical Faults"],
      price: 799,
    },
    {
      id: "microwave-installation",
      name: "Microwave Installation",
      description: ["Professional Mounting", "Electrical Setup", "Safety Test"],
      price: 499,
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
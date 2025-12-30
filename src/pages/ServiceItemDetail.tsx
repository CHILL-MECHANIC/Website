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
  "ac-foam-1": {
    id: "ac-foam-1",
    name: "Foam Power Jet Service-1 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 549,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Basic foam cleaning and filter cleaning for single AC unit.",
    detailedDescription: "Our foam power jet service uses advanced cleaning technology to deeply clean your AC unit, removing dirt, bacteria, and allergens for improved air quality and cooling efficiency.",
    included: [
      "Foam jet cleaning of indoor unit",
      "Filter cleaning and sanitization",
      "Outdoor unit basic cleaning",
      "Cooling performance check",
      "Drainage system check",
      "30-day service warranty"
    ],
    notIncluded: [
      "Gas refilling",
      "Component replacement",
      "Electrical repairs",
      "Installation services"
    ]
  },
  "ac-foam-2": {
    id: "ac-foam-2",
    name: "Foam Power Jet Service-2 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 949,
    duration: "3-4 hours",
    warranty: "30 days",
    description: "Deep foam cleaning with filter service and basic maintenance.",
    detailedDescription: "Complete foam power jet cleaning for two AC units, providing thorough maintenance and improved air quality throughout your space.",
    included: [
      "Deep foam jet cleaning of 2 indoor units",
      "Filter cleaning and sanitization for both units",
      "Outdoor unit cleaning for both",
      "Cooling performance check",
      "Drainage system cleaning",
      "30-day service warranty"
    ],
    notIncluded: [
      "Gas refilling",
      "Component replacement",
      "Electrical repairs",
      "Installation services"
    ]
  },
  "ac-foam-3": {
    id: "ac-foam-3",
    name: "Foam Power Jet Service-3 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 1399,
    duration: "4-5 hours",
    warranty: "30 days",
    description: "Deep foam cleaning with complete filter service and coil cleaning.",
    detailedDescription: "Comprehensive foam power jet service for three AC units, ensuring optimal performance and air quality across multiple rooms.",
    included: [
      "Deep foam jet cleaning of 3 indoor units",
      "Filter cleaning and sanitization for all units",
      "Outdoor unit cleaning for all",
      "Complete system performance check",
      "Drainage system cleaning",
      "30-day service warranty"
    ],
    notIncluded: [
      "Gas refilling",
      "Component replacement",
      "Electrical repairs",
      "Installation services"
    ]
  },
  "ac-foam-4": {
    id: "ac-foam-4",
    name: "Foam Power Jet Service-4 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 1949,
    duration: "5-6 hours",
    warranty: "30 days",
    description: "Premium foam cleaning with complete servicing and performance check.",
    detailedDescription: "Complete foam power jet maintenance for four AC units, providing comprehensive cleaning and performance optimization for larger spaces.",
    included: [
      "Premium foam jet cleaning of 4 indoor units",
      "Filter cleaning and sanitization for all units",
      "Outdoor unit cleaning for all",
      "Thorough system inspection",
      "Drainage system cleaning",
      "30-day service warranty"
    ],
    notIncluded: [
      "Gas refilling",
      "Component replacement",
      "Electrical repairs",
      "Installation services"
    ]
  },
  "ac-foam-5": {
    id: "ac-foam-5",
    name: "Foam Power Jet Service-5 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 2449,
    duration: "6-7 hours",
    warranty: "30 days",
    description: "Ultimate foam cleaning with complete deep service and full inspection.",
    detailedDescription: "Premium foam power jet service for five AC units, delivering complete maintenance and optimization for commercial or large residential spaces.",
    included: [
      "Ultimate foam jet cleaning of 5 indoor units",
      "Filter cleaning and sanitization for all units",
      "Outdoor unit cleaning for all",
      "Complete performance optimization",
      "Drainage system cleaning",
      "30-day service warranty"
    ],
    notIncluded: [
      "Gas refilling",
      "Component replacement",
      "Electrical repairs",
      "Installation services"
    ]
  },
  "ac-not-cooling": {
    id: "ac-not-cooling",
    name: "AC Not Cooling/Less Cooling",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2],
    price: 249,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Diagnostic and repair service for AC cooling issues and performance problems.",
    detailedDescription: "Expert diagnosis and solution for AC cooling problems, identifying the root cause and providing effective repairs to restore proper cooling.",
    included: [
      "Complete diagnostic assessment",
      "Cooling system inspection",
      "Filter and coil cleaning",
      "Thermostat check",
      "Minor adjustments and fixes",
      "15-day service warranty"
    ],
    notIncluded: [
      "Gas refilling (charged separately)",
      "Compressor replacement",
      "Major component replacement",
      "Electrical board repairs"
    ]
  },
  "ac-power-issue": {
    id: "ac-power-issue",
    name: "AC Power Issue",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage3],
    price: 249,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Electrical troubleshooting and repair for AC power-related problems.",
    detailedDescription: "Professional electrical troubleshooting to identify and fix power issues, ensuring safe and reliable AC operation.",
    included: [
      "Electrical connection inspection",
      "Power supply testing",
      "Control board check",
      "Wiring inspection",
      "Safety system verification",
      "15-day service warranty"
    ],
    notIncluded: [
      "Major electrical board replacement",
      "External wiring repairs",
      "Power supply upgrades",
      "Compressor replacement"
    ]
  },
  "ac-noise-reduction": {
    id: "ac-noise-reduction",
    name: "AC Noise Reduction",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2],
    price: 449,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Specialized service to identify and fix AC noise and vibration issues.",
    detailedDescription: "Comprehensive noise reduction service that identifies the source of AC noise and provides effective solutions for quieter operation.",
    included: [
      "Noise source identification",
      "Fan and motor inspection",
      "Component tightening and securing",
      "Lubrication of moving parts",
      "Vibration dampening",
      "30-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Fan motor replacement",
      "Major component replacement",
      "Structural modifications"
    ]
  },
  "ac-water-leakage": {
    id: "ac-water-leakage",
    name: "AC Water Leakage Repair",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage3],
    price: 549,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Complete repair service for AC water leakage and drainage problems.",
    detailedDescription: "Expert water leakage repair service addressing drainage issues, pipe blockages, and condensation problems for a leak-free AC operation.",
    included: [
      "Drainage system inspection",
      "Pipe cleaning and unclogging",
      "Drain pan cleaning",
      "Condensate pump check",
      "Proper drainage setup",
      "30-day service warranty"
    ],
    notIncluded: [
      "Drain pan replacement",
      "Condensate pump replacement",
      "Major pipe modifications",
      "Wall or ceiling repairs"
    ]
  },
  "ac-gas-refill": {
    id: "ac-gas-refill",
    name: "Gas Refill & Check Up",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 2399,
    duration: "2-3 hours",
    warranty: "60 days",
    description: "Complete refrigerant gas refill service with comprehensive system check.",
    detailedDescription: "Professional refrigerant gas refilling service including leak detection, pressure testing, and complete system optimization for maximum cooling efficiency.",
    included: [
      "Leak detection and repair",
      "Complete gas evacuation",
      "Fresh refrigerant gas filling",
      "Pressure testing",
      "System performance optimization",
      "60-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Additional gas top-ups"
    ]
  },
  "ac-split-installation": {
    id: "ac-split-installation",
    name: "Split AC Installation",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2],
    price: 1449,
    duration: "3-4 hours",
    warranty: "30 days",
    description: "Professional installation of split AC units with proper setup and testing.",
    detailedDescription: "Complete split AC installation service including mounting, pipe work, electrical connections, vacuum testing, and commissioning for optimal performance.",
    included: [
      "Indoor and outdoor unit mounting",
      "Copper pipe connection (up to 3 meters)",
      "Electrical wiring and connection",
      "Vacuum testing",
      "Gas pressure check",
      "Complete commissioning",
      "30-day installation warranty"
    ],
    notIncluded: [
      "AC unit cost",
      "Extra copper piping beyond 3 meters",
      "External electrical work",
      "Wall modifications",
      "Stand or brackets"
    ]
  },
  "ac-split-uninstall": {
    id: "ac-split-uninstall",
    name: "Split AC Uninstallation",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage3],
    price: 1299,
    duration: "2-3 hours",
    warranty: "15 days",
    description: "Safe and careful uninstallation of split AC units.",
    detailedDescription: "Professional split AC uninstallation with proper gas recovery, safe dismounting, and careful handling to preserve unit condition for future use.",
    included: [
      "Gas recovery and storage",
      "Pipe disconnection",
      "Indoor unit removal",
      "Outdoor unit dismounting",
      "Electrical disconnection",
      "15-day service warranty"
    ],
    notIncluded: [
      "Wall repairs or patching",
      "Transportation of unit",
      "Storage services",
      "Re-installation"
    ]
  },
  "ac-window-installation": {
    id: "ac-window-installation",
    name: "Window AC Installation",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2],
    price: 1049,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Professional installation of window AC units with secure mounting.",
    detailedDescription: "Complete window AC installation with proper mounting, weatherproofing, electrical connection, and testing for reliable operation.",
    included: [
      "Window bracket installation",
      "AC unit mounting and leveling",
      "Weatherproofing and sealing",
      "Electrical connection",
      "Performance testing",
      "30-day installation warranty"
    ],
    notIncluded: [
      "AC unit cost",
      "Window modifications",
      "External electrical work",
      "Custom bracket fabrication"
    ]
  },
  "ac-window-uninstall": {
    id: "ac-window-uninstall",
    name: "Window AC Uninstallation",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage3],
    price: 949,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Safe removal and uninstallation of window AC units.",
    detailedDescription: "Professional window AC removal with careful dismounting and handling to preserve unit condition.",
    included: [
      "Electrical disconnection",
      "Careful unit removal",
      "Bracket removal",
      "Basic window cleaning",
      "15-day service warranty"
    ],
    notIncluded: [
      "Window repairs",
      "Transportation of unit",
      "Storage services",
      "Re-installation"
    ]
  },
  "fridge-single-door": {
    id: "fridge-single-door",
    name: "Check Up - Single Door",
    categoryTitle: "Refrigerator Service & Repair",
    images: [refrigeratorServiceImage, refrigeratorServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up for single door refrigerators with performance assessment.",
    detailedDescription: "Thorough diagnostic inspection of single door refrigerators to identify any issues and ensure optimal cooling performance.",
    included: [
      "Complete diagnostic inspection",
      "Cooling performance test",
      "Thermostat check",
      "Door seal inspection",
      "Compressor assessment",
      "Energy efficiency check",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Gas refilling",
      "Deep cleaning",
      "Parts cost"
    ]
  },
  "fridge-double-door": {
    id: "fridge-double-door",
    name: "Check Up - Double Door",
    categoryTitle: "Refrigerator Service & Repair",
    images: [refrigeratorServiceImage, refrigeratorServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up for double door refrigerators with cooling system inspection.",
    detailedDescription: "Comprehensive diagnostic assessment of double door refrigerators including both compartments to ensure proper cooling and functionality.",
    included: [
      "Complete diagnostic inspection",
      "Cooling performance test for both compartments",
      "Thermostat and temperature control check",
      "Door seal inspection",
      "Compressor assessment",
      "Energy efficiency check",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Gas refilling",
      "Deep cleaning",
      "Parts cost"
    ]
  },
  "ro-checkup": {
    id: "ro-checkup",
    name: "Check Up - Water Purifier",
    categoryTitle: "RO Water Purifier Service",
    images: [roServiceImage, roServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up of water purifier with TDS testing and system inspection.",
    detailedDescription: "Comprehensive water purifier inspection including water quality testing, filter assessment, and system performance evaluation.",
    included: [
      "Complete system inspection",
      "TDS level testing",
      "Water quality assessment",
      "Filter condition check",
      "Pressure and flow rate test",
      "Leak detection",
      "15-day service warranty"
    ],
    notIncluded: [
      "Filter replacement",
      "Membrane cleaning",
      "Repairs",
      "Parts cost"
    ]
  },
  "ro-filter-checkup": {
    id: "ro-filter-checkup",
    name: "Check Up - Water Purifier Filter",
    categoryTitle: "RO Water Purifier Service",
    images: [roServiceImage, roServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Detailed filter inspection and performance assessment for water purifier.",
    detailedDescription: "Focused filter inspection to determine filter condition and recommend necessary replacements for optimal water quality.",
    included: [
      "All filter inspection",
      "Filter life assessment",
      "Water flow test",
      "TDS testing",
      "Filter replacement recommendations",
      "15-day service warranty"
    ],
    notIncluded: [
      "Filter replacement",
      "Membrane replacement",
      "System repairs",
      "Parts cost"
    ]
  },
  "ro-regular-service": {
    id: "ro-regular-service",
    name: "Water Purifier Regular Service",
    categoryTitle: "RO Water Purifier Service",
    images: [roServiceImage, roServiceImage2],
    price: 1699,
    duration: "2-3 hours",
    warranty: "90 days",
    description: "Regular maintenance service with basic filter replacement and system cleaning.",
    detailedDescription: "Comprehensive regular service including essential filter replacements, system cleaning, and performance optimization for safe drinking water.",
    included: [
      "Pre-filter replacement",
      "Post-carbon filter replacement",
      "System sanitization",
      "TDS testing",
      "Leak detection and repair",
      "Water quality assessment",
      "90-day service warranty"
    ],
    notIncluded: [
      "RO membrane replacement",
      "UV lamp replacement",
      "Pump replacement",
      "Storage tank replacement"
    ]
  },
  "ro-full-service": {
    id: "ro-full-service",
    name: "Water Purifier Full Service",
    categoryTitle: "RO Water Purifier Service",
    images: [roServiceImage, roServiceImage2],
    price: 3799,
    duration: "3-4 hours",
    warranty: "180 days",
    description: "Comprehensive full service with all filter replacements, membrane cleaning, and complete maintenance.",
    detailedDescription: "Complete water purifier overhaul including all filter and membrane replacements, thorough system cleaning, and comprehensive maintenance for like-new performance.",
    included: [
      "All filter replacements (pre, post, carbon)",
      "RO membrane replacement",
      "UV lamp replacement (if applicable)",
      "Complete system sanitization",
      "Storage tank cleaning",
      "TDS optimization",
      "Leak detection and repair",
      "180-day service warranty"
    ],
    notIncluded: [
      "Pump replacement",
      "Storage tank replacement",
      "Major electrical repairs",
      "Installation or relocation"
    ]
  },
  "ro-installation": {
    id: "ro-installation",
    name: "Water Purifier Installation",
    categoryTitle: "RO Water Purifier Service",
    images: [roServiceImage, roServiceImage2],
    price: 399,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Professional installation of new water purifier with complete setup and testing.",
    detailedDescription: "Complete water purifier installation including mounting, plumbing connections, electrical setup, and water quality testing.",
    included: [
      "Wall mounting and setup",
      "Water inlet connection",
      "Drain connection",
      "Electrical connection",
      "Initial system flushing",
      "TDS testing",
      "30-day installation warranty"
    ],
    notIncluded: [
      "Water purifier unit cost",
      "Additional piping beyond standard",
      "Electrical board work",
      "Wall modifications"
    ]
  },
  "ro-uninstallation": {
    id: "ro-uninstallation",
    name: "Water Purifier Uninstallation",
    categoryTitle: "RO Water Purifier Service",
    images: [roServiceImage, roServiceImage2],
    price: 349,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Safe removal and uninstallation of water purifier systems.",
    detailedDescription: "Professional water purifier removal with proper disconnection and careful handling to preserve unit condition.",
    included: [
      "Water connection disconnection",
      "Drain disconnection",
      "Electrical disconnection",
      "Unit removal from wall",
      "Basic cleanup",
      "15-day service warranty"
    ],
    notIncluded: [
      "Wall repairs",
      "Transportation",
      "Storage",
      "Re-installation"
    ]
  },
  "geyser-checkup": {
    id: "geyser-checkup",
    name: "Check Up - Geyser",
    categoryTitle: "Geyser Service & Repair",
    images: [geyserServiceImage, geyserServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up of geyser with heating element and thermostat inspection.",
    detailedDescription: "Thorough geyser inspection to identify any issues with heating, safety systems, and overall performance.",
    included: [
      "Heating element inspection",
      "Thermostat testing",
      "Safety valve check",
      "Electrical connection inspection",
      "Temperature testing",
      "Leakage detection",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Tank cleaning",
      "Element replacement",
      "Parts cost"
    ]
  },
  "geyser-service": {
    id: "geyser-service",
    name: "Geyser Service",
    categoryTitle: "Geyser Service & Repair",
    images: [geyserServiceImage, geyserServiceImage2],
    price: 549,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Complete maintenance service with element check, tank cleaning, and safety inspection.",
    detailedDescription: "Comprehensive geyser maintenance including tank cleaning, element inspection, safety system checks, and performance optimization.",
    included: [
      "Tank internal cleaning and descaling",
      "Heating element inspection",
      "Thermostat calibration",
      "Safety valve testing",
      "Electrical safety check",
      "Temperature optimization",
      "30-day service warranty"
    ],
    notIncluded: [
      "Heating element replacement",
      "Thermostat replacement",
      "Tank replacement",
      "Major pipe modifications"
    ]
  },
  "geyser-installation": {
    id: "geyser-installation",
    name: "Geyser Installation",
    categoryTitle: "Geyser Service & Repair",
    images: [geyserServiceImage, geyserServiceImage2],
    price: 449,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Professional installation with proper pipe fitting and electrical setup.",
    detailedDescription: "Complete geyser installation including wall mounting, pipe connections, electrical setup, and safety testing for reliable hot water supply.",
    included: [
      "Wall mounting and bracket installation",
      "Hot and cold water pipe connections",
      "Electrical wiring and connection",
      "Safety valve installation",
      "Pressure relief valve setup",
      "Testing and commissioning",
      "30-day installation warranty"
    ],
    notIncluded: [
      "Geyser unit cost",
      "Extra piping beyond standard",
      "Electrical board work",
      "Wall strengthening",
      "Stand or bracket cost"
    ]
  },
  "geyser-uninstallation": {
    id: "geyser-uninstallation",
    name: "Geyser Uninstallation",
    categoryTitle: "Geyser Service & Repair",
    images: [geyserServiceImage, geyserServiceImage2],
    price: 349,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Safe removal and uninstallation of geyser units.",
    detailedDescription: "Professional geyser removal with proper water drainage, disconnection, and careful handling.",
    included: [
      "Water drainage",
      "Pipe disconnection",
      "Electrical disconnection",
      "Unit removal from wall",
      "Basic cleanup",
      "15-day service warranty"
    ],
    notIncluded: [
      "Wall repairs",
      "Transportation",
      "Storage",
      "Re-installation"
    ]
  },
  "wm-top-load-checkup": {
    id: "wm-top-load-checkup",
    name: "Checkup - AM Top Load",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up for automatic top load washing machines.",
    detailedDescription: "Comprehensive inspection of automatic top load washing machines including drum, motor, control panel, and washing performance assessment.",
    included: [
      "Complete diagnostic inspection",
      "Drum and agitator check",
      "Motor and belt inspection",
      "Control panel testing",
      "Drain system check",
      "Water inlet valve test",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Deep cleaning",
      "Parts cost",
      "Installation services"
    ]
  },
  "wm-front-load-checkup": {
    id: "wm-front-load-checkup",
    name: "Checkup - AM Front Load",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up for automatic front load washing machines.",
    detailedDescription: "Thorough inspection of automatic front load washing machines including drum seal, suspension, motor, and washing performance assessment.",
    included: [
      "Complete diagnostic inspection",
      "Drum and door seal check",
      "Motor and suspension inspection",
      "Control panel testing",
      "Drain pump check",
      "Water inlet system test",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Deep cleaning",
      "Parts cost",
      "Installation services"
    ]
  },
  "wm-semi-auto-checkup": {
    id: "wm-semi-auto-checkup",
    name: "Check Up - Semi Automatic",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up for semi-automatic washing machines.",
    detailedDescription: "Complete inspection of semi-automatic washing machines including wash and spin tubs, motor, timer, and overall functionality.",
    included: [
      "Complete diagnostic inspection",
      "Wash and spin tub check",
      "Motor inspection",
      "Timer and control testing",
      "Drain system check",
      "Performance assessment",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Deep cleaning",
      "Parts cost",
      "Installation services"
    ]
  },
  "wm-install-uninstall": {
    id: "wm-install-uninstall",
    name: "Installation & Uninstallation",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 349,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Professional installation or uninstallation service for washing machines.",
    detailedDescription: "Complete installation or uninstallation service for washing machines including connections, leveling, testing, and proper setup.",
    included: [
      "Machine positioning and leveling",
      "Water inlet connection",
      "Drain hose setup",
      "Electrical connection (if installation)",
      "Test run (if installation)",
      "Careful disconnection (if uninstallation)",
      "15-day service warranty"
    ],
    notIncluded: [
      "Washing machine cost",
      "Extra hose or pipes",
      "Electrical board work",
      "Transportation",
      "Stand cost"
    ]
  },
  "microwave-checkup": {
    id: "microwave-checkup",
    name: "Check Up",
    categoryTitle: "Microwave Service & Repair",
    images: [microwaveServiceImage, microwaveServiceImage2],
    price: 249,
    duration: "1 hour",
    warranty: "15 days",
    description: "Complete diagnostic check-up of microwave with functionality testing and safety inspection.",
    detailedDescription: "Comprehensive microwave inspection including heating performance, door safety, turntable function, and control panel testing.",
    included: [
      "Complete diagnostic inspection",
      "Heating performance test",
      "Magnetron functionality check",
      "Door seal and interlock inspection",
      "Turntable and roller test",
      "Control panel assessment",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Deep cleaning",
      "Parts cost",
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

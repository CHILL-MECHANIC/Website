import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Check, X, Clock, Shield, DollarSign, Star, ShieldCheck, Wrench, Gauge, ClipboardCheck, Handshake, Rocket } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import CustomerReviews from "@/components/CustomerReviews";
import BrandsCarousel from "@/components/BrandsCarousel";
import ServiceAreas from "@/components/ServiceAreas";
import { getServiceItemImages } from "@/config/serviceImages";

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
import waterDispenserServiceImage from "@/assets/water-dispenser-service.jpg";
import deepFreezerServiceImage from "@/assets/deep-freezer-service.jpg";

// SEO data for all service items
const SERVICE_ITEM_SEO: Record<string, { title: string; description: string }> = {
  // AC Services
  "ac-foam-1": { title: "AC Foam Cleaning Service - 1 AC | Premium Service | Chill Mechanic", description: "Professional AC foam jet cleaning for single AC unit. Filter cleaning, sanitization, 30-day warranty. Book now at ₹599." },
  "ac-foam-2": { title: "AC Foam Cleaning Service - 2 AC | Deep Cleaning | Chill Mechanic", description: "Premium foam cleaning for 2 AC units. Deep cleaning, filter service, coil cleaning. Book now at ₹1149." },
  "ac-foam-3": { title: "AC Foam Cleaning Service - 3 AC | Complete Service | Chill Mechanic", description: "Comprehensive foam cleaning for 3 AC units. Full filter service, performance check. Book now at ₹1649." },
  "ac-foam-4": { title: "AC Foam Cleaning Service - 4 AC | Premium Package | Chill Mechanic", description: "Premium foam cleaning for 4 AC units. Complete servicing, full inspection. Book now at ₹2199." },
  "ac-foam-5": { title: "AC Foam Cleaning Service - 5 AC | Ultimate Package | Chill Mechanic", description: "Ultimate foam cleaning for 5 AC units. Complete deep service, full system inspection. Book now at ₹2499." },
  "ac-power-jet-1": { title: "AC Power Jet Cleaning - 1 AC | Quick Service | Chill Mechanic", description: "Professional power jet cleaning for single AC unit. Fast, efficient, 30-day warranty. Book now at ₹499." },
  "ac-power-jet-2": { title: "AC Power Jet Cleaning - 2 AC | Professional Service | Chill Mechanic", description: "Power jet cleaning for 2 AC units. Filter service included. Book now at ₹949." },
  "ac-power-jet-3": { title: "AC Power Jet Cleaning - 3 AC | Complete Cleaning | Chill Mechanic", description: "Power jet cleaning for 3 AC units. Full filter service. Book now at ₹1349." },
  "ac-power-jet-4": { title: "AC Power Jet Cleaning - 4 AC | Full Service | Chill Mechanic", description: "Power jet cleaning for 4 AC units. Complete servicing. Book now at ₹1799." },
  "ac-not-cooling": { title: "AC Not Cooling Repair Gurgaon | Expert Technicians | Chill Mechanic", description: "Expert AC cooling repair service in Gurgaon. Diagnose and fix cooling issues. Same day service. Book now at ₹249." },
  "ac-power-issue": { title: "AC Power Issue Repair Gurgaon | Electrical Diagnosis | Chill Mechanic", description: "Professional AC power issue repair. Electrical diagnosis, circuit repair. Expert technicians. Book now at ₹249." },
  "ac-noise-reduction": { title: "AC Noise Reduction Service Gurgaon | Quiet Operation | Chill Mechanic", description: "AC noise reduction service. Diagnosis, component adjustment, lubrication. Smooth operation. Book now at ₹449." },
  "ac-water-leakage": { title: "AC Water Leakage Repair Gurgaon | Fix Leaks Fast | Chill Mechanic", description: "Expert AC water leakage repair. Leak detection, drain cleaning, seal repair. Same day service. Book now at ₹549." },
  "ac-gas-refill": { title: "AC Gas Refill & Charging Gurgaon | 1T, 1.5T, 2T | Chill Mechanic", description: "Professional AC gas refill & charging in Gurgaon. Top up from ₹1999, full charging from ₹2999. 3-month warranty." },
  "ac-gas-1ton-topup": { title: "AC Gas Top Up - 1 Ton | Gurgaon | Chill Mechanic", description: "AC gas top up for 1 Ton AC in Gurgaon. Leak detection, pressure check. ₹1999. 3-month warranty." },
  "ac-gas-1ton-full": { title: "AC Full Gas Charging - 1 Ton | Gurgaon | Chill Mechanic", description: "Complete AC gas charging for 1 Ton AC in Gurgaon. Fresh gas, leak detection. ₹2999. 3-month warranty." },
  "ac-gas-1.5ton-topup": { title: "AC Gas Top Up - 1.5 Ton | Gurgaon | Chill Mechanic", description: "AC gas top up for 1.5 Ton AC in Gurgaon. Professional service. ₹2499. 3-month warranty." },
  "ac-gas-1.5ton-full": { title: "AC Full Gas Charging - 1.5 Ton | Gurgaon | Chill Mechanic", description: "Complete AC gas charging for 1.5 Ton AC in Gurgaon. ₹3499. 3-month warranty." },
  "ac-gas-2ton-topup": { title: "AC Gas Top Up - 2 Ton | Gurgaon | Chill Mechanic", description: "AC gas top up for 2 Ton AC in Gurgaon. Professional service. ₹2999. 3-month warranty." },
  "ac-gas-2ton-full": { title: "AC Full Gas Charging - 2 Ton | Gurgaon | Chill Mechanic", description: "Complete AC gas charging for 2 Ton AC in Gurgaon. ₹3999. 3-month warranty." },
  "ac-split-installation": { title: "Split AC Installation Gurgaon | Professional Setup | Chill Mechanic", description: "Professional split AC installation in Gurgaon. Complete piping, wiring, testing. Book now at ₹1499." },
  "ac-split-uninstall": { title: "Split AC Uninstallation Gurgaon | Safe Removal | Chill Mechanic", description: "Safe split AC uninstallation in Gurgaon. Gas recovery included. Book now at ₹799." },
  "ac-window-installation": { title: "Window AC Installation Gurgaon | Expert Service | Chill Mechanic", description: "Professional window AC installation in Gurgaon. Electrical setup included. Book now at ₹699." },
  "ac-window-uninstall": { title: "Window AC Uninstallation Gurgaon | Safe Removal | Chill Mechanic", description: "Safe window AC uninstallation in Gurgaon. Quick service. Book now at ₹499." },
  // Refrigerator Services
  "fridge-single-door": { title: "Refrigerator Repair - Single Door | Gurgaon | Chill Mechanic", description: "Expert single door refrigerator repair in Gurgaon. Complete diagnostic check-up. Book now at ₹249." },
  "fridge-double-door": { title: "Refrigerator Repair - Double Door | Gurgaon | Chill Mechanic", description: "Expert double door refrigerator repair in Gurgaon. Cooling system inspection. Book now at ₹249." },
  // RO Services
  "ro-checkup": { title: "RO Water Purifier Checkup Gurgaon | TDS Testing | Chill Mechanic", description: "Complete RO water purifier checkup in Gurgaon. TDS testing, system inspection. Book now at ₹249." },
  "ro-filter-checkup": { title: "RO Filter Checkup Gurgaon | Filter Inspection | Chill Mechanic", description: "RO water purifier filter inspection. Performance assessment. Book now at ₹249." },
  "ro-regular-service": { title: "RO Water Purifier Service Gurgaon | Regular Maintenance | Chill Mechanic", description: "RO water purifier regular service. Basic filter replacement, cleaning. Book now at ₹1699." },
  "ro-full-service": { title: "RO Water Purifier Full Service Gurgaon | Complete Maintenance | Chill Mechanic", description: "RO water purifier full service. All filters, membrane cleaning. Book now at ₹3799." },
  "ro-installation": { title: "RO Water Purifier Installation Gurgaon | Professional Setup | Chill Mechanic", description: "Professional RO water purifier installation. Complete setup and testing. Book now at ₹399." },
  "ro-uninstallation": { title: "RO Water Purifier Uninstallation Gurgaon | Safe Removal | Chill Mechanic", description: "Safe RO water purifier uninstallation. Quick service. Book now at ₹349." },
  // Geyser Services
  "geyser-checkup": { title: "Geyser Repair Checkup Gurgaon | Expert Diagnosis | Chill Mechanic", description: "Complete geyser checkup in Gurgaon. Heating element, thermostat inspection. Book now at ₹249." },
  "geyser-service": { title: "Geyser Service Gurgaon | Complete Maintenance | Chill Mechanic", description: "Professional geyser service. Element check, tank cleaning, safety inspection. Book now at ₹549." },
  "geyser-installation": { title: "Geyser Installation Gurgaon | Professional Setup | Chill Mechanic", description: "Professional geyser installation. Pipe fitting, electrical setup. Book now at ₹449." },
  "geyser-uninstallation": { title: "Geyser Uninstallation Gurgaon | Safe Removal | Chill Mechanic", description: "Safe geyser uninstallation. Quick service. Book now at ₹349." },
  // Washing Machine Services
  "wm-top-load-checkup": { title: "Washing Machine Repair - Top Load | Gurgaon | Chill Mechanic", description: "Expert top load washing machine repair in Gurgaon. Complete diagnostic. Book now at ₹249." },
  "wm-front-load-checkup": { title: "Washing Machine Repair - Front Load | Gurgaon | Chill Mechanic", description: "Expert front load washing machine repair in Gurgaon. Complete diagnostic. Book now at ₹249." },
  "wm-semi-auto-checkup": { title: "Washing Machine Repair - Semi Automatic | Gurgaon | Chill Mechanic", description: "Expert semi-automatic washing machine repair in Gurgaon. Complete checkup. Book now at ₹249." },
  "wm-top-load-service": { title: "Top Load Washing Machine Service | Complete Maintenance | Chill Mechanic", description: "Professional top load washing machine service in Gurgaon. Complete cleaning and maintenance. Book now at ₹499." },
  "wm-top-load-jet": { title: "Top Load Jet Cleaning Service | Premium Deep Cleaning | Chill Mechanic", description: "Premium jet cleaning service for top load washing machines. Deep maintenance and cleaning. Book now at ₹999." },
  "wm-front-load-service": { title: "Front Load Washing Machine Service | Complete Maintenance | Chill Mechanic", description: "Professional front load washing machine service in Gurgaon. Thorough inspection and cleaning. Book now at ₹700." },
  "wm-front-load-jet": { title: "Front Load Jet Cleaning Service | Advanced Deep Cleaning | Chill Mechanic", description: "Premium jet cleaning service for front load washing machines. Advanced deep cleaning and maintenance. Book now at ₹1699." },
  "wm-install-uninstall": { title: "Washing Machine Installation Gurgaon | Professional Setup | Chill Mechanic", description: "Professional washing machine installation/uninstallation. Quick service. Book now at ₹399." },
  // Microwave Services
  "microwave-checkup": { title: "Microwave Repair Gurgaon | Expert Service | Chill Mechanic", description: "Professional microwave repair in Gurgaon. Complete diagnostic checkup. Book now at ₹249." },
  // Water Dispenser Services
  "wd-checkup": { title: "Water Dispenser Repair Gurgaon | Expert Service | Chill Mechanic", description: "Professional water dispenser repair in Gurgaon. Cooling, heating system inspection. Book now at ₹249." },
  // Deep Freezer Services
  "df-checkup": { title: "Deep Freezer Repair Gurgaon | Expert Service | Chill Mechanic", description: "Professional deep freezer repair in Gurgaon. Temperature, cooling system inspection. Book now at ₹249." },
};

const serviceItemDetails = {
  "ac-foam-1": {
    id: "ac-foam-1",
    name: "Foam Power Jet Service-1 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 599,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Premium foam cleaning and filter cleaning for single AC unit.",
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
    price: 1149,
    duration: "3-4 hours",
    warranty: "30 days",
    description: "Deep foam cleaning with filter service and basic maintenance for 2 ACs.",
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
    price: 1649,
    duration: "4-5 hours",
    warranty: "30 days",
    description: "Deep foam cleaning with complete filter service and coil cleaning for 3 ACs.",
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
    price: 2199,
    duration: "5-6 hours",
    warranty: "30 days",
    description: "Premium foam cleaning with complete servicing and performance check for 4 ACs.",
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
    price: 2499,
    duration: "6-7 hours",
    warranty: "30 days",
    description: "Ultimate foam cleaning with complete deep service and full inspection for 5 ACs.",
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
  "ac-power-jet-1": {
    id: "ac-power-jet-1",
    name: "Power Jet Service-1 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 499,
    duration: "1-2 hours",
    warranty: "30 days",
    description: "Power jet cleaning for single AC unit.",
    detailedDescription: "Professional power jet cleaning service that uses high-pressure water jets to thoroughly clean your AC unit, removing dust, dirt, and debris for improved cooling performance.",
    included: [
      "Power jet cleaning of indoor unit",
      "Filter cleaning",
      "Outdoor unit cleaning",
      "Cooling performance check",
      "Drainage system check",
      "30-day service warranty"
    ],
    notIncluded: [
      "Foam cleaning",
      "Gas refilling",
      "Component replacement",
      "Electrical repairs"
    ]
  },
  "ac-power-jet-2": {
    id: "ac-power-jet-2",
    name: "Power Jet Service-2 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 949,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Power jet cleaning with filter service for 2 ACs.",
    detailedDescription: "Complete power jet cleaning for two AC units, providing thorough cleaning and improved cooling efficiency throughout your space.",
    included: [
      "Power jet cleaning of 2 indoor units",
      "Filter cleaning for both units",
      "Outdoor unit cleaning for both",
      "Cooling performance check",
      "Drainage system cleaning",
      "30-day service warranty"
    ],
    notIncluded: [
      "Foam cleaning",
      "Gas refilling",
      "Component replacement",
      "Electrical repairs"
    ]
  },
  "ac-power-jet-3": {
    id: "ac-power-jet-3",
    name: "Power Jet Service-3 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 1349,
    duration: "3-4 hours",
    warranty: "30 days",
    description: "Power jet cleaning with complete filter service for 3 ACs.",
    detailedDescription: "Comprehensive power jet cleaning service for three AC units, ensuring optimal cooling performance across multiple rooms.",
    included: [
      "Power jet cleaning of 3 indoor units",
      "Filter cleaning for all units",
      "Outdoor unit cleaning for all",
      "Complete system performance check",
      "Drainage system cleaning",
      "30-day service warranty"
    ],
    notIncluded: [
      "Foam cleaning",
      "Gas refilling",
      "Component replacement",
      "Electrical repairs"
    ]
  },
  "ac-power-jet-4": {
    id: "ac-power-jet-4",
    name: "Power Jet Service-4 AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 1799,
    duration: "4-5 hours",
    warranty: "30 days",
    description: "Power jet cleaning with complete servicing for 4 ACs.",
    detailedDescription: "Complete power jet cleaning and maintenance for four AC units, providing comprehensive cleaning and performance optimization for larger spaces.",
    included: [
      "Power jet cleaning of 4 indoor units",
      "Filter cleaning for all units",
      "Outdoor unit cleaning for all",
      "Thorough system inspection",
      "Drainage system cleaning",
      "30-day service warranty"
    ],
    notIncluded: [
      "Foam cleaning",
      "Gas refilling",
      "Component replacement",
      "Electrical repairs"
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
    price: 1999,
    duration: "1-3 hours",
    warranty: "90 days",
    description: "Gas charging service with leak detection and pressure check. Choose your AC tonnage and charging type.",
    detailedDescription: "Professional gas charging service for all AC tonnages. Choose between a gas top-up for minor cooling improvements or full gas charging for complete refrigerant replacement with vacuum testing and system optimization.",
    included: [
      "Leak detection",
      "Pressure testing",
      "Gas charging (top-up or full)",
      "System performance optimization",
      "Cooling performance check",
      "90-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Pipe replacement"
    ]
  },
  "ac-gas-1ton-topup": {
    id: "ac-gas-1ton-topup",
    name: "Gas Top Up - 1 Ton AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 1999,
    duration: "1-2 hours",
    warranty: "60 days",
    description: "Gas top-up with leak detection and pressure check for 1 Ton AC.",
    detailedDescription: "Professional gas top-up service for 1 Ton AC units. Includes leak detection, pressure testing, and refrigerant top-up to restore optimal cooling performance.",
    included: [
      "Leak detection",
      "Gas top-up to optimal level",
      "Pressure testing",
      "Cooling performance check",
      "System optimization",
      "60-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Full gas evacuation"
    ]
  },
  "ac-gas-1ton-full": {
    id: "ac-gas-1ton-full",
    name: "Full Gas Charging - 1 Ton AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 2999,
    duration: "2-3 hours",
    warranty: "60 days",
    description: "Complete gas evacuation, fresh gas charging with leak detection for 1 Ton AC.",
    detailedDescription: "Complete gas charging service for 1 Ton AC units. Includes full evacuation of old gas, vacuum testing, fresh refrigerant charging, and comprehensive system check.",
    included: [
      "Complete gas evacuation",
      "Vacuum testing",
      "Fresh refrigerant gas charging",
      "Leak detection and repair",
      "Pressure testing",
      "System performance optimization",
      "60-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Pipe replacement"
    ]
  },
  "ac-gas-1.5ton-topup": {
    id: "ac-gas-1.5ton-topup",
    name: "Gas Top Up - 1.5 Ton AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 2499,
    duration: "1-2 hours",
    warranty: "60 days",
    description: "Gas top-up with leak detection and pressure check for 1.5 Ton AC.",
    detailedDescription: "Professional gas top-up service for 1.5 Ton AC units. Includes leak detection, pressure testing, and refrigerant top-up to restore optimal cooling performance.",
    included: [
      "Leak detection",
      "Gas top-up to optimal level",
      "Pressure testing",
      "Cooling performance check",
      "System optimization",
      "60-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Full gas evacuation"
    ]
  },
  "ac-gas-1.5ton-full": {
    id: "ac-gas-1.5ton-full",
    name: "Full Gas Charging - 1.5 Ton AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 3499,
    duration: "2-3 hours",
    warranty: "60 days",
    description: "Complete gas evacuation, fresh gas charging with leak detection for 1.5 Ton AC.",
    detailedDescription: "Complete gas charging service for 1.5 Ton AC units. Includes full evacuation of old gas, vacuum testing, fresh refrigerant charging, and comprehensive system check.",
    included: [
      "Complete gas evacuation",
      "Vacuum testing",
      "Fresh refrigerant gas charging",
      "Leak detection and repair",
      "Pressure testing",
      "System performance optimization",
      "60-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Pipe replacement"
    ]
  },
  "ac-gas-2ton-topup": {
    id: "ac-gas-2ton-topup",
    name: "Gas Top Up - 2 Ton AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 2999,
    duration: "1-2 hours",
    warranty: "60 days",
    description: "Gas top-up with leak detection and pressure check for 2 Ton AC.",
    detailedDescription: "Professional gas top-up service for 2 Ton AC units. Includes leak detection, pressure testing, and refrigerant top-up to restore optimal cooling performance.",
    included: [
      "Leak detection",
      "Gas top-up to optimal level",
      "Pressure testing",
      "Cooling performance check",
      "System optimization",
      "60-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Full gas evacuation"
    ]
  },
  "ac-gas-2ton-full": {
    id: "ac-gas-2ton-full",
    name: "Full Gas Charging - 2 Ton AC",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2, acServiceImage3],
    price: 3999,
    duration: "2-3 hours",
    warranty: "60 days",
    description: "Complete gas evacuation, fresh gas charging with leak detection for 2 Ton AC.",
    detailedDescription: "Complete gas charging service for 2 Ton AC units. Includes full evacuation of old gas, vacuum testing, fresh refrigerant charging, and comprehensive system check.",
    included: [
      "Complete gas evacuation",
      "Vacuum testing",
      "Fresh refrigerant gas charging",
      "Leak detection and repair",
      "Pressure testing",
      "System performance optimization",
      "60-day service warranty"
    ],
    notIncluded: [
      "Compressor replacement",
      "Major leak repairs",
      "Coil replacement",
      "Pipe replacement"
    ]
  },
  "ac-split-installation": {
    id: "ac-split-installation",
    name: "Split AC Installation",
    categoryTitle: "AC Service & Repair",
    images: [acServiceImage, acServiceImage2],
    price: 1499,
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
    price: 799,
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
    price: 699,
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
    price: 499,
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
  "wm-top-load-service": {
    id: "wm-top-load-service",
    name: "Top Load Service",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 499,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Complete service and maintenance for top load washing machines with comprehensive cleaning.",
    detailedDescription: "Professional top load washing machine service including thorough inspection, cleaning, drum and agitator examination, motor check, and complete system maintenance to ensure optimal performance.",
    included: [
      "Complete diagnostic inspection",
      "Drum and agitator cleaning",
      "Motor lubrication and inspection",
      "Brake band and pulley check",
      "Water inlet valve cleaning",
      "Drain pump inspection",
      "Belt condition assessment",
      "Performance test run",
      "30-day service warranty"
    ],
    notIncluded: [
      "Component replacement",
      "Deep descaling",
      "Part cost",
      "Installation services"
    ]
  },
  "wm-top-load-jet": {
    id: "wm-top-load-jet",
    name: "Top Load Jet Service",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 999,
    duration: "3-4 hours",
    warranty: "30 days",
    description: "Premium jet cleaning service for top load washing machines with deep maintenance.",
    detailedDescription: "Premium jet cleaning service for top load washing machines using advanced water jet technology for deep cleaning and complete maintenance. This service provides thorough removal of deposits, bacterial growth, and mineral buildup.",
    included: [
      "Complete diagnostic inspection",
      "High-pressure jet cleaning of drum",
      "Agitator and base cleaning",
      "Motor and bearing inspection",
      "Complete system descaling",
      "Brake and pulley maintenance",
      "Belt replacement (if needed)",
      "Water inlet valve cleaning",
      "Drain pump deep cleaning",
      "Performance optimization",
      "30-day service warranty"
    ],
    notIncluded: [
      "Additional component repairs",
      "Electrical system work",
      "Part cost (except belt)",
      "Installation services"
    ]
  },
  "wm-front-load-service": {
    id: "wm-front-load-service",
    name: "Front Load Service",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 700,
    duration: "2-3 hours",
    warranty: "30 days",
    description: "Complete service and maintenance for front load washing machines with thorough inspection.",
    detailedDescription: "Professional front load washing machine service including comprehensive inspection, drum seal examination, suspension system check, motor assessment, and complete system maintenance for optimal washing performance.",
    included: [
      "Complete diagnostic inspection",
      "Drum seal and gasket examination",
      "Door lock mechanism check",
      "Suspension and damper inspection",
      "Motor and bearing check",
      "Heater element inspection",
      "Pump and drain system cleaning",
      "Control panel testing",
      "Detergent dispenser cleaning",
      "Performance test run",
      "30-day service warranty"
    ],
    notIncluded: [
      "Component replacement",
      "Seal or gasket replacement",
      "Deep descaling",
      "Part cost",
      "Installation services"
    ]
  },
  "wm-front-load-jet": {
    id: "wm-front-load-jet",
    name: "Front Load Jet Service",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 1699,
    duration: "4-5 hours",
    warranty: "30 days",
    description: "Premium jet cleaning service for front load washing machines with advanced deep cleaning.",
    detailedDescription: "Ultimate premium jet cleaning service for front load washing machines using advanced water jet technology. This comprehensive service provides deep cleaning, complete descaling, and thorough maintenance for superior washing performance and longevity.",
    included: [
      "Complete diagnostic inspection",
      "High-pressure jet cleaning of drum",
      "Door gasket and seal cleaning",
      "Suspension and damper servicing",
      "Motor bearing lubrication",
      "Complete system descaling",
      "Heater element cleaning",
      "Pump and drain system deep cleaning",
      "Control module testing",
      "Detergent dispenser deep cleaning",
      "Water inlet valve cleaning",
      "Suspension replacement (if needed)",
      "Performance optimization and testing",
      "30-day service warranty"
    ],
    notIncluded: [
      "Motor or drum replacement",
      "Electrical system repairs",
      "Door replacement",
      "Additional part cost"
    ]
  },
  "wm-install-uninstall": {
    id: "wm-install-uninstall",
    name: "Installation & Uninstallation",
    categoryTitle: "Washing Machine Service & Repair",
    images: [washingMachineServiceImage, washingMachineServiceImage2],
    price: 399,
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
    images: [microwaveServiceImage],
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
  },
  "wd-checkup": {
    id: "wd-checkup",
    name: "Check Up - Water Dispenser",
    categoryTitle: "Water Dispenser Service & Repair",
    images: [waterDispenserServiceImage],
    price: 249,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Complete diagnostic check-up of water dispenser with cooling and heating system inspection.",
    detailedDescription: "Comprehensive water dispenser inspection including cooling and heating performance, water filtration quality, temperature control, and system safety checks.",
    included: [
      "Complete diagnostic inspection",
      "Cooling system performance test",
      "Heating element check",
      "Water filtration assessment",
      "Temperature control inspection",
      "Water quality basic check",
      "Safety mechanism verification",
      "15-day service warranty"
    ],
    notIncluded: [
      "Filter replacement",
      "Repairs or component replacement",
      "Deep cleaning",
      "Parts cost"
    ]
  },

  "df-checkup": {
    id: "df-checkup",
    name: "Check Up - Deep Freezer",
    categoryTitle: "Deep Freezer Service & Repair",
    images: [deepFreezerServiceImage],
    price: 249,
    duration: "1-2 hours",
    warranty: "15 days",
    description: "Complete diagnostic check-up of deep freezer with temperature and cooling system inspection.",
    detailedDescription: "Comprehensive deep freezer inspection including cooling performance, temperature control, compressor function, and overall system health assessment.",
    included: [
      "Complete diagnostic inspection",
      "Temperature performance test",
      "Cooling system assessment",
      "Compressor functionality check",
      "Thermostat inspection",
      "Door seal and latch verification",
      "Electrical connection check",
      "15-day service warranty"
    ],
    notIncluded: [
      "Repairs or component replacement",
      "Defrosting service",
      "Deep cleaning",
      "Parts cost"
    ]
  },

};

const gasChargingOptions = [
  {
    tonnage: "1 Ton",
    topUp: { id: "ac-gas-1ton-topup", name: "Gas Top Up - 1 Ton AC", price: 1999, description: "Gas top-up with leak detection and pressure check for 1 Ton AC." },
    fullCharge: { id: "ac-gas-1ton-full", name: "Full Gas Charging - 1 Ton AC", price: 2999, description: "Complete gas evacuation, fresh gas charging with leak detection for 1 Ton AC." },
  },
  {
    tonnage: "1.5 Ton",
    topUp: { id: "ac-gas-1.5ton-topup", name: "Gas Top Up - 1.5 Ton AC", price: 2499, description: "Gas top-up with leak detection and pressure check for 1.5 Ton AC." },
    fullCharge: { id: "ac-gas-1.5ton-full", name: "Full Gas Charging - 1.5 Ton AC", price: 3499, description: "Complete gas evacuation, fresh gas charging with leak detection for 1.5 Ton AC." },
  },
  {
    tonnage: "2 Ton",
    topUp: { id: "ac-gas-2ton-topup", name: "Gas Top Up - 2 Ton AC", price: 2999, description: "Gas top-up with leak detection and pressure check for 2 Ton AC." },
    fullCharge: { id: "ac-gas-2ton-full", name: "Full Gas Charging - 2 Ton AC", price: 3999, description: "Complete gas evacuation, fresh gas charging with leak detection for 2 Ton AC." },
  },
];

export default function ServiceItemDetail() {
  const { serviceType, serviceId } = useParams<{ serviceType: string; serviceId: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemsCount } = useCart();

  const isGasRefill = serviceId === "ac-gas-refill";
  const serviceItem = serviceId ? serviceItemDetails[serviceId as keyof typeof serviceItemDetails] : null;

  // Get Supabase images for the service item, with fallback to asset images
  const displayImages = useMemo(() => {
    if (!serviceId) return [];
    const supabaseImages = getServiceItemImages(serviceId);
    if (supabaseImages.length > 0) {
      return supabaseImages;
    }
    return serviceItem?.images || [];
  }, [serviceId, serviceItem?.images]);

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

  const handleGasAddToCart = (option: { id: string; name: string; price: number; description: string }) => {
    addToCart([{
      id: option.id,
      name: option.name,
      description: [option.description],
      price: option.price,
    }]);
    toast({
      title: "Added to cart",
      description: `${option.name} (₹${option.price}) has been added to your cart.`,
    });
  };

  const handleGasBookNow = (option: { id: string; name: string; price: number; description: string }) => {
    handleGasAddToCart(option);
    navigate("/cart");
  };

  const GasRefillInfoSection = ({ className = "" }: { className?: string }) => (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Accurate gas level diagnosis using advanced tools</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Gas refilling done only if required and approved by customer</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Suitable for Split and Window ACs</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Complete leakage detection and repair support</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Ensures better cooling and energy efficiency</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Transparent pricing with no hidden charges</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Skilled and experienced technicians</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>Quick service with same-day availability</span></li>
          <li className="flex items-start gap-3"><Check className="h-4 w-4 mt-1 text-primary" /><span>3 months warranty on gas charging (our work)</span></li>
        </ul>

        <div>
          <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Why Choose Us
          </h4>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2"><Wrench className="h-4 w-4 mt-1 text-primary" /><span>Professional inspection before refilling</span></li>
            <li className="flex items-start gap-2"><Gauge className="h-4 w-4 mt-1 text-primary" /><span>Proper pressure and performance testing</span></li>
            <li className="flex items-start gap-2"><ClipboardCheck className="h-4 w-4 mt-1 text-primary" /><span>End-to-end service (checkup to repair to refill)</span></li>
            <li className="flex items-start gap-2"><Handshake className="h-4 w-4 mt-1 text-primary" /><span>Customer approval before any extra work</span></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-orange-600" />
            Service Promise
          </h4>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-1 text-primary" /><span>No unnecessary gas refilling</span></li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-1 text-primary" /><span>Clean and hassle-free service</span></li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 mt-1 text-primary" /><span>Reliable after-service support</span></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  // Get SEO data for current service item
  const seo = serviceId ? SERVICE_ITEM_SEO[serviceId] : null;
  const canonicalUrl = serviceId && serviceType ? `https://chillmechanic.com/services/${serviceType}/${serviceId}` : null;

  return (
    <>
      {seo && (
        <Helmet>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        </Helmet>
      )}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Service Image Carousel */}
          <div className="flex flex-col gap-6">
            <Carousel className="w-full">
              <CarouselContent>
                {displayImages.map((image, index) => (
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

            {isGasRefill && <GasRefillInfoSection className="hidden lg:block" />}
          </div>

          {/* Service Details */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{serviceItem.categoryTitle}</Badge>
            </div>

            <h1 className="text-4xl font-bold">{serviceItem.name}</h1>
            {serviceItem.name.toLowerCase().includes('foam') && (
              <span className="inline-block ml-3 align-middle bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">Free gas check</span>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{isGasRefill ? "From " : ""}₹{serviceItem.price}</div>
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

            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">Service Description</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="text-muted-foreground leading-relaxed">
                  {serviceItem.detailedDescription}
                </p>
              </CardContent>
            </Card>

            {isGasRefill ? (
              /* Gas Refill Tonnage Selection Cards */
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Select AC Tonnage & Charging Type</h3>
                {gasChargingOptions.map((option) => (
                  <Card key={option.tonnage} className="p-5 border-2 hover:border-primary/50 transition-colors">
                    <h4 className="text-lg font-bold mb-4 text-center">{option.tonnage} AC</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Top Up Option */}
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Top Up</p>
                        <p className="text-2xl font-bold text-primary mb-3">₹{option.topUp.price}</p>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" onClick={() => handleGasBookNow(option.topUp)} className="w-full">
                            Book Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleGasAddToCart(option.topUp)} className="w-full">
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                      {/* Full Gas Charging Option */}
                      <div className="border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Full Gas Charging</p>
                        <p className="text-2xl font-bold text-primary mb-3">₹{option.fullCharge.price}</p>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" onClick={() => handleGasBookNow(option.fullCharge)} className="w-full">
                            Book Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleGasAddToCart(option.fullCharge)} className="w-full">
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex gap-3">
                <Button onClick={handleBookNow} size="lg" className="flex-1">
                  Book Now
                </Button>
                <Button onClick={handleAddToCart} variant="outline" size="lg" className="flex-1">
                  Add to Cart
                </Button>
              </div>
            )}

            {isGasRefill && <GasRefillInfoSection className="lg:hidden" />}
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

        <CustomerReviews />
      </div>
      <BrandsCarousel />
      <ServiceAreas />
    </div>
    <Footer />
    </>
  );
}

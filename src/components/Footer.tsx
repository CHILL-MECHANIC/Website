import { Link } from "react-router-dom";
import logo from "@/assets/Logo.webp";
import { SiInstagram, SiFacebook, SiWhatsapp, SiLinkedin, SiX } from "react-icons/si";
import { Phone, Mail, Clock, MapPin } from "lucide-react";

export default function Footer() {
  return <footer className="bg-card border-t hidden md:block">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <img src={logo} alt="ChillMechanic Logo" className="h-26 w-26 mb-4 mx-auto" />
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/services/ac" className="text-muted-foreground hover:text-primary transition-colors">
                  AC Service
                </Link>
              </li>
              <li>
                <Link to="/services/refrigerator" className="text-muted-foreground hover:text-primary transition-colors">
                  Refrigerator Service
                </Link>
              </li>
              <li>
                <Link to="/services/ro" className="text-muted-foreground hover:text-primary transition-colors">
                  RO Service
                </Link>
              </li>
              <li>
                <Link to="/services/geyser" className="text-muted-foreground hover:text-primary transition-colors">
                  Geyser Service
                </Link>
              </li>
              <li>
                <Link to="/services/washing-machine" className="text-muted-foreground hover:text-primary transition-colors">
                  Washing Machine Service
                </Link>
              </li>
              <li>
                <Link to="/services/microwave" className="text-muted-foreground hover:text-primary transition-colors">
                  Microwave Services
                </Link>
              </li>
              <li>
                <Link to="/services/water-dispenser" className="text-muted-foreground hover:text-primary transition-colors">
                  Water Dispenser Service
                </Link>
              </li>
              <li>
                <Link to="/services/deep-freezer" className="text-muted-foreground hover:text-primary transition-colors">
                  Deep Freezer Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.facebook.com/share/17c6FYTJ9H/" target="_blank" rel="noopener noreferrer" className="text-lg hover:scale-110 transition-transform bg-transparent" aria-label="Facebook">
                <SiFacebook size={20} className="text-foreground hover:text-[#1877F2] transition-colors" />
              </a>
              <a href="https://www.instagram.com/p/DQ8e6tjkxCK/?igsh=MXN6M244cGJ2NnZ6aA==" target="_blank" rel="noopener noreferrer" className="text-lg hover:scale-110 transition-transform bg-transparent" aria-label="Instagram">
                <SiInstagram size={20} className="text-foreground hover:text-[#E4405F] transition-colors" />
              </a>
              <a href="https://x.com/chill_mechanic?s=21" target="_blank" rel="noopener noreferrer" className="text-lg hover:scale-110 transition-transform bg-transparent" aria-label="Twitter">
                <SiX size={20} className="text-foreground hover:text-[#000000] transition-colors" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-lg hover:scale-110 transition-transform bg-transparent" aria-label="LinkedIn">
                <SiLinkedin size={20} className="text-foreground hover:text-[#0A66C2] transition-colors" />
              </a>
              <a href="https://wa.me/message/SGJEOWC7BT4QA1" target="_blank" rel="noopener noreferrer" className="text-lg hover:scale-110 transition-transform bg-transparent" aria-label="WhatsApp">
                <SiWhatsapp size={20} className="text-foreground hover:text-[#25D366] transition-colors" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a 
                href="tel:+919211970030" 
                className="flex items-center gap-2 group hover:text-primary transition-all duration-200 cursor-pointer"
              >
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-110">
                  <Phone className="h-4 w-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-200">+91 9211970030</span>
              </a>
              <a 
                href="mailto:support@chillmechanic.com" 
                className="flex items-center gap-2 group hover:text-primary transition-all duration-200 cursor-pointer"
              >
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-110">
                  <Mail className="h-4 w-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform duration-200" />
                </div>
                <span className="group-hover:translate-x-1 transition-transform duration-200">support@chillmechanic.com</span>
              </a>
              <div className="flex items-center gap-2 group">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                </div>
                <span>Mon - Sat: 9:30 AM - 7:30 PM</span>
              </div>
              <a 
                href="https://maps.google.com/?q=Opposite+Worldmark,+Maidawas+Road,+Sector+64+Gurgaon+122102" 
                target="_blank" 
                rel="noopener noreferrer"
                className="space-y-1 group block"
              >
                <div className="font-medium flex items-center gap-2 hover:text-primary transition-all duration-200">
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-110">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Chill Mechanic Pvt. Ltd.</span>
                </div>
                <div className="ml-6 group-hover:text-primary/80 transition-colors duration-200">Opposite Worldmark, Maidawas Road, Sector 64 Gurgaon 122102</div>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Chill Mechanic. Happy Appliance, Happier Homes. All rights reserved.</p>
        </div>
      </div>
    </footer>;
}

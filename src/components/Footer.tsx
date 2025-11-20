import { Link } from "react-router-dom";
import logo from "@/assets/Logo.webp";
import { SiInstagram, SiFacebook, SiWhatsapp, SiLinkedin, SiX } from "react-icons/si";

export default function Footer() {
  return <footer className="bg-card border-t">
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
              <div className="flex items-center gap-3">
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
          </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📞 +91 9211970030</p>
              <p>✉️ support@chillmechanic.com</p>
              <p>🕒 Mon - Sat: 9:30 AM - 7:30 PM</p>
              <div className="space-y-1">
                <p className="font-medium">📍 Chill Mechanic Pvt. Ltd.</p>
                <p>Suncity Vatsal Valley, Sector 02 Gwal Pahari Gurgaon 122003, Haryana, India</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Chill Mechanic. Happy Appliance, Happier Homes. All rights reserved.</p>
        </div>
      </div>
    </footer>;
}

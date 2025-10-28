import { Link } from "react-router-dom";
import logo from "@/assets/Logo.webp";
export default function Footer() {
  return <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <img src={logo} alt="ChillMechanic Logo" className="h-24 w-24 mb-4 mx-auto" />
            
            
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
                  Microwave Service
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
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📞 +91 9211970028</p>
              <p>✉️ support@chillmechanic.com</p>
              <p>🕒 Mon - Sat: 8 AM - 8 PM</p>
              <p>📍 Delhi NCR</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Chill Mechanic | Happy Appliances, Happier Homes. All rights reserved.</p>
        </div>
      </div>
    </footer>;
}
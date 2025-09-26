import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
interface HeaderProps {
  cartItemsCount?: number;
}
export default function Header({
  cartItemsCount = 0
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const services = [{
    name: "AC Service",
    path: "/services/ac"
  }, {
    name: "Refrigerator Service",
    path: "/services/refrigerator"
  }, {
    name: "RO Service",
    path: "/services/ro"
  }, {
    name: "Geyser Service",
    path: "/services/geyser"
  }, {
    name: "Washing Machine Service",
    path: "/services/washing-machine"
  }];
  return <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="The Chill Mechanic" className="h-10 w-10" />
            <span className="text-xl font-bold text-primary">CHILL MECHANIC</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:text-primary">
                  Services
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {services.map(service => <DropdownMenuItem key={service.path} asChild>
                    <Link to={service.path}>{service.name}</Link>
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/how-it-works" className="hover:text-primary transition-colors">
              How it works
            </Link>
            <Link to="/contact" className="hover:text-primary transition-colors">
              Contact Us
            </Link>
          </nav>

          {/* Cart and CTA */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 hover:text-primary transition-colors" />
              {cartItemsCount > 0 && <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartItemsCount}
                </Badge>}
            </Link>
            
            <Button variant="default" className="hidden md:inline-flex" asChild>
              <Link to="/get-the-app">Get The App</Link>
            </Button>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <nav className="mt-4 pb-4 md:hidden border-t pt-4">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              
              <div className="space-y-2">
                <div className="font-medium text-primary">Services</div>
                {services.map(service => <Link key={service.path} to={service.path} className="block ml-4 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {service.name}
                  </Link>)}
              </div>
              
              <Link to="/how-it-works" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                How it works
              </Link>
              <Link to="/contact" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                Contact Us
              </Link>
              
              <Button variant="default" className="w-full mt-4" asChild>
                <Link to="/get-the-app" onClick={() => setIsMenuOpen(false)}>
                  Get The App
                </Link>
              </Button>
            </div>
          </nav>}
      </div>
    </header>;
}
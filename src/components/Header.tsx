import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "@/assets/Logo.webp";
interface HeaderProps {
  cartItemsCount?: number;
}
export default function Header({
  cartItemsCount = 0
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    profile,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useAdmin();
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
  }, {
    name: "Microwave Service",
    path: "/services/microwave"
  }, {
    name: "Water Dispenser Service",
    path: "/services/water-dispenser"
  }, {
    name: "Deep Freezer Service",
    path: "/services/deep-freezer"
  }];
  return <header className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 rounded-lg">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="The Chill Mechanic" className="h-10 w-10" />
            <span className="text-xl font-bold">
              <span className="text-[#1277BD]">CHILL</span>
              <span className="text-[#FBB044]"> MECHANIC</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-primary transition-colors">HOME</Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:text-primary font-semibold text-base">SERVICES</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {services.map(service => <DropdownMenuItem key={service.path} asChild>
                    <Link to={service.path}>{service.name}</Link>
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/about" className="hover:text-primary transition-colors">ABOUT US</Link>
          </nav>

          {/* Cart, Profile and CTA */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 hover:text-primary transition-colors" />
              {cartItemsCount > 0 && <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartItemsCount}
                </Badge>}
            </Link>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {profile ? <>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">View Profile</Link>
                    </DropdownMenuItem>
                    {isAdmin && <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="text-primary font-medium">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    </>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign Out
                    </DropdownMenuItem>
                  </> : <>
                    <DropdownMenuItem asChild>
                      <Link to="/auth">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/auth">Sign Up</Link>
                    </DropdownMenuItem>
                  </>}
              </DropdownMenuContent>
            </DropdownMenu>
            
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
              
              <Link to="/about" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                About Us
              </Link>

              {/* Mobile Profile Section */}
              {profile ? <>
                  <Link to="/profile" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    View Profile
                  </Link>
                  {isAdmin && <Link to="/admin" className="text-primary font-medium hover:text-primary/80 transition-colors" onClick={() => setIsMenuOpen(false)}>
                      Admin Dashboard
                    </Link>}
                  <Button variant="ghost" className="justify-start p-0 h-auto hover:text-primary" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </> : <Link to="/auth" className="hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Sign In / Sign Up
                </Link>}
              
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

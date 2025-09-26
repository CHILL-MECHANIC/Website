import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import ServiceSelectionModal from "@/components/ServiceSelectionModal";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import acServiceImage from "@/assets/ac-service.jpg";
import refrigeratorServiceImage from "@/assets/refrigerator-service.jpg";
import roServiceImage from "@/assets/ro-service.jpg";
import geyserServiceImage from "@/assets/geyser-service.jpg";
import washingMachineServiceImage from "@/assets/washing-machine-service.jpg";
const services = [{
  id: "ac",
  title: "AC Service",
  description: "Expert AC repair and maintenance services. We fix cooling issues, clean filters, and ensure optimal performance for your comfort.",
  image: acServiceImage,
  price: "$299",
  route: "/services/ac"
}, {
  id: "refrigerator",
  title: "Refrigerator Service",
  description: "Professional refrigerator repair services. From cooling problems to compressor issues, we keep your appliances running smoothly.",
  image: refrigeratorServiceImage,
  price: "$399",
  route: "/services/refrigerator"
}, {
  id: "ro",
  title: "RO Service",
  description: "Complete RO water purifier service and maintenance. Filter replacements, membrane cleaning, and installation services.",
  image: roServiceImage,
  price: "$199",
  route: "/services/ro"
}, {
  id: "geyser",
  title: "Geyser Service",
  description: "Reliable geyser repair and installation services. We handle heating element replacement, thermostat issues, and safety checks.",
  image: geyserServiceImage,
  price: "$249",
  route: "/services/geyser"
}, {
  id: "washing-machine",
  title: "Washing Machine Service",
  description: "Expert washing machine repair services. Motor repairs, drum cleaning, and maintenance to keep your laundry running smoothly.",
  image: washingMachineServiceImage,
  price: "$349",
  route: "/services/washing-machine"
}];
const Index = () => {
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    addToCart,
    getCartItemsCount
  } = useCart();
  const navigate = useNavigate();
  const handleBookNow = (serviceId: string) => {
    setSelectedServiceType(serviceId);
    setIsModalOpen(true);
  };
  const handleEnquire = (serviceId: string) => {
    navigate(`/services/${serviceId}`);
  };
  const handleModalContinue = (selectedServices: any[]) => {
    if (selectedServices.length > 0) {
      addToCart(selectedServices);
      toast({
        title: "Services added to cart",
        description: `${selectedServices.length} service(s) added successfully.`
      });
      navigate("/cart");
    }
    setIsModalOpen(false);
  };
  const handleAddToCart = (selectedServices: any[]) => {
    if (selectedServices.length > 0) {
      addToCart(selectedServices);
      toast({
        title: "Added to cart",
        description: `${selectedServices.length} service(s) added to your cart.`
      });
    }
  };
  return <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl mb-4 text-gray-50 text-center font-bold md:text-7xl">HAPPY APPLIANCES, HAPPIER HOMES</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Dependable, reliable and efficient services for Less home appliance demands & service today!
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Book Service Now
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional appliance repair and maintenance services you can trust. 
              Quick, reliable, and affordable solutions for your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {services.map(service => <ServiceCard key={service.id} title={service.title} description={service.description} image={service.image} price={service.price} onBookNow={() => handleBookNow(service.id)} onEnquire={() => handleEnquire(service.id)} />)}
          </div>
        </div>
      </section>

      <ServiceSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} serviceType={selectedServiceType} onContinue={handleModalContinue} onAddToCart={handleAddToCart} />
    </div>;
};
export default Index;
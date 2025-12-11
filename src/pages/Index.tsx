import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import ServiceSelectionModal from "@/components/ServiceSelectionModal";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, Sparkles, Star } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import acServiceImage from "@/assets/ac-service.jpg";
import refrigeratorServiceImage from "@/assets/refrigerator-service.jpg";
import roServiceImage from "@/assets/ro-service.jpg";
import geyserServiceImage from "@/assets/geyser-service.jpg";
import washingMachineServiceImage from "@/assets/washing-machine-service.jpg";
import microwaveServiceImage from "@/assets/microwave-service.jpg";
import heroBackground from "@/assets/hero-background.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

const services = [{
  id: "ac",
  title: "AC Service",
  description: "Expert AC repair and maintenance services. We fix cooling issues, clean filters, and ensure optimal performance for your comfort.",
  image: acServiceImage,
  price: "₹249",
  route: "/services/ac"
}, {
  id: "refrigerator",
  title: "Refrigerator Service",
  description: "Professional refrigerator repair services. From cooling problems to compressor issues, we keep your appliances running smoothly.",
  image: refrigeratorServiceImage,
  price: "₹399",
  route: "/services/refrigerator"
}, {
  id: "ro",
  title: "RO Service",
  description: "Complete RO water purifier service and maintenance. Filter replacements, membrane cleaning, and installation services.",
  image: roServiceImage,
  price: "₹199",
  route: "/services/ro"
}, {
  id: "geyser",
  title: "Geyser Service",
  description: "Reliable geyser repair and installation services. We handle heating element replacement, thermostat issues, and safety checks.",
  image: geyserServiceImage,
  price: "₹249",
  route: "/services/geyser"
}, {
  id: "washing-machine",
  title: "Washing Machine Service",
  description: "Expert washing machine repair services. Motor repairs, drum cleaning, and maintenance to keep your laundry running smoothly.",
  image: washingMachineServiceImage,
  price: "₹349",
  route: "/services/washing-machine"
}, {
  id: "microwave",
  title: "Microwave Service",
  description: "Professional microwave repair and maintenance services. We handle heating issues, door repairs, and electrical problems.",
  image: microwaveServiceImage,
  price: "₹249",
  route: "/services/microwave"
}];
const Index = () => {
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
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
      <section className="relative bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground py-16 bg-cover bg-center bg-no-repeat overflow-hidden" style={{
      backgroundImage: `url(${heroBackground})`
    }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl mb-4 text-white text-center font-bold md:text-7xl animate-fade-in drop-shadow-2xl [text-shadow:_2px_2px_8px_rgba(0,0,0,0.8)]">
            HAPPY APPLIANCES,
          </h1>
          <h1 className="text-4xl mb-4 text-white text-center font-bold md:text-7xl animate-fade-in drop-shadow-2xl [text-shadow:_2px_2px_8px_rgba(0,0,0,0.8)]">
            HAPPIER HOMES
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90 animate-fade-in [animation-delay:200ms] drop-shadow-lg [text-shadow:_1px_1px_4px_rgba(0,0,0,0.7)]">
          Reliable, efficient, and affordable solutions for all your home appliance needs because your comfort deserves the best.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3 animate-scale-in [animation-delay:400ms] hover-scale shadow-2xl" onClick={() => {
              const servicesSection = document.querySelector('[data-services-section]');
              servicesSection?.scrollIntoView({
                behavior: 'smooth'
              });
            }}>
              Book Service Now
            </Button>
            <Button size="lg" variant="default" className="text-lg px-8 py-3 animate-scale-in [animation-delay:500ms] hover-scale shadow-2xl" onClick={() => setIsCallDialogOpen(true)}>
              <Phone className="mr-2 h-5 w-5" />
              Call Now
            </Button>
          </div>
        </div>
      </section>

      {/* Info Strip */}
      <section className="bg-[#E53935] text-primary-foreground py-3 overflow-hidden">
        <div className="relative flex">
          <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap">
            <div className="flex items-center gap-8 px-8">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                GET 10% OFF ON SERVICE PARTS BOOKED VIA MOBILE APP USE CODE - APP10
              </span>
            </div>
          </div>
          <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap" aria-hidden="true">
            <div className="flex items-center gap-8 px-8">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                GET 10% OFF ON SERVICE PARTS BOOKED VIA MOBILE APP USE CODE - APP10
              </span>
            </div>
          </div>
          <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap" aria-hidden="true">
            <div className="flex items-center gap-8 px-8">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                GET 10% OFF ON SERVICE PARTS BOOKED VIA MOBILE APP USE CODE - APP10
              </span>
            </div>
          </div>
        </div>
      </section>


      {/* Services Section */}
      <section className="py-16" data-services-section>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">OUR SERVICES</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional appliance repair and maintenance services you can trust. 
              Quick, reliable, and affordable solutions for your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => <ServiceCard key={service.id} title={service.title} description={service.description} image={service.image} price={service.price} onBookNow={() => handleBookNow(service.id)} onEnquire={() => handleEnquire(service.id)} />)}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">WHAT OUR CUSTOMERS SAY</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We appreciate your feedback and are committed to providing the best possible service.
            </p>
          </div>

          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "It was a good experience for washing machine repair."
                    </p>
                    <div>
                      <p className="font-semibold">Hima</p>
                      <p className="text-xs text-muted-foreground">Gurgaon</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "I recently used Chill Mechanic for some home repairs, and l was very impressed. Their prices are really reasonable which made it easy for me to get the help I needed without breaking the bank. The quality of their work was excellent too. They were professional and quick. Highly recommend Chill Mechanic for any one looking for affordable and reliable home repair services!"
                    </p>
                    <div>
                      <p className="font-semibold">Shashi</p>
                      <p className="text-xs text-muted-foreground">Gurgaon</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "Chill Mechanic is a top-notch home utility and repair service that truly stands out! Their team is professional, reliable, and has an impressive knack for fixing appliances in excellent condition. I recently had my refrigerator serviced and the results were remarkable!They offer quick response times and exceptional customer care. Highly recommend Chill Mechanic for anyone in need of appliance repair or maintenance. Your home will thank you!"
                    </p>
                    <div>
                      <p className="font-semibold">Sumit</p>
                      <p className="text-xs text-muted-foreground">Gurgaon</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "I had a great experience with Chill Mechanic. They provide home utility and repair services. The service was excellent. The team was friendly and helpful. They fixed my problems quickly and did a good job."
                    </p>
                    <div>
                      <p className="font-semibold">Nitin</p>
                      <p className="text-xs text-muted-foreground">Gurgaon</p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      <a
        href="https://wa.me/message/SGJEOWC7BT4QA1"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl"
        aria-label="Chat on WhatsApp"
      >
        <SiWhatsapp className="h-6 w-6" />
      </a>

      <ServiceSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} serviceType={selectedServiceType} onContinue={handleModalContinue} onAddToCart={handleAddToCart} />
      
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Us Now
            </DialogTitle>
            <DialogDescription>
              Click on any number to call us directly
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <a href="tel:+919211970031" className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Customer Support</p>
                <p className="text-lg font-semibold">+919211970031</p>
              </div>
            </a>
            <a href="tel:+919211970030" className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Booking Inquiries</p>
                <p className="text-lg font-semibold">+919211970030</p>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>;
};
export default Index;

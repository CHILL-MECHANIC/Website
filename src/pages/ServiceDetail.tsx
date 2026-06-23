import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import TrustBadgeBar from "@/components/TrustBadgeBar";
import FaqAccordion from "@/components/FaqAccordion";
import CustomerReviews from "@/components/CustomerReviews";
import BrandsCarousel from "@/components/BrandsCarousel";
import ServiceAreas from "@/components/ServiceAreas";
import CompanyStats from "@/components/CompanyStats";
import QuickFacts from "@/components/QuickFacts";
import { serviceFaqMap } from "@/data/faqs";
import { serviceContentMap } from "@/data/serviceContent";
import { serviceStatsData } from "@/data/serviceStats";
import { generateFaqSchema } from "@/utils/faqSchema";
import { ChevronDown, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getServiceItemPrimaryImage } from "@/config/serviceImages";

import acServiceImage from "@/assets/ac-service.jpg";
import refrigeratorServiceImage from "@/assets/refrigerator-service.jpg";
import roServiceImage from "@/assets/ro-service.jpg";
import geyserServiceImage from "@/assets/geyser-service.jpg";
import washingMachineServiceImage from "@/assets/washing-machine-service.jpg";
import microwaveServiceImage from "@/assets/microwave-service.jpg";
import waterDispenserServiceImage from "@/assets/water-dispenser-service.jpg";
import deepFreezerServiceImage from "@/assets/deep-freezer-service.jpg";

const supabaseUrl = (filename: string, bucket: string) =>
  supabase.storage.from(bucket).getPublicUrl(filename).data.publicUrl;

const VIDEOS = [
  { id: 1, title: 'AC Deep Cleaning Service',      videoUrl: supabaseUrl('MainVD1.mp4', 'gallery-videos'), serviceType: 'AC' },
  { id: 2, title: 'Appliance Repair in Action',    videoUrl: supabaseUrl('MainVD2.mp4', 'gallery-videos'), serviceType: 'AC' },
  { id: 3, title: 'Refrigerator Repair',           videoUrl: supabaseUrl('Video2.mp4',  'gallery-videos'), serviceType: 'Refrigerator' },
  { id: 4, title: 'Washing Machine Service',       videoUrl: supabaseUrl('Video3.mp4',  'gallery-videos'), serviceType: 'Washing Machine' },
  { id: 5, title: 'Geyser & Appliance Repair',     videoUrl: supabaseUrl('Video4.mp4',  'gallery-videos'), serviceType: 'Geyser' },
];

const SERVICE_SEO: Record<string, { title: string; description: string; price: string; keywords: string }> = {
  ac: { 
    title: 'AC Repair Gurgaon | AC Service Near Me | Starting Rs. 599 | Chill Mechanic', 
    description: 'Professional AC repair & service in Gurgaon. Foam jet cleaning, gas refilling, cooling issues fixed. Same day service. Call +91-2902-1835 to book', 
    price: '599',
    keywords: 'AC repair Gurgaon, AC service near me, air conditioner repair, cooling issues, AC maintenance'
  },
  refrigerator: { 
    title: 'Fridge Repair Gurgaon | Refrigerator Service Near Me | Starting Rs. 249 | Chill Mechanic', 
    description: 'Expert refrigerator repair in Gurgaon. Cooling issues, compressor problems, door seal replacement. All brands serviced. Same day repair available. Call +91-2902-1835', 
    price: '249',
    keywords: 'refrigerator repair Gurgaon, fridge service, cooling issues, compressor repair, fridge maintenance'
  },
  'washing-machine': { 
    title: 'Washing Machine Repair Gurgaon | WM Service Near Me | Starting Rs. 249 | Chill Mechanic', 
    description: 'Washing machine repair in Gurgaon. Motor repair, drum cleaning, belt replacement. Top load & front load experts. Same day service. Call +91-2902-1835 to book', 
    price: '249',
    keywords: 'washing machine repair Gurgaon, WM service, top load repair, front load repair, washing machine maintenance'
  },
  ro: { 
    title: 'RO Water Purifier Repair Gurgaon | Water Purifier Service Near Me | Starting Rs. 249 | Chill Mechanic', 
    description: 'RO water purifier service in Gurgaon. Filter replacement, membrane cleaning, installation. All brands Kent, Aquaguard, Pureit serviced. Same day service available! Call +91-2902-1835', 
    price: '249',
    keywords: 'RO repair Gurgaon, water purifier service, RO maintenance, filter replacement, water quality testing'
  },
  geyser: { 
    title: 'Geyser Repair Gurgaon | Water Heater Service Near Me | Starting Rs. 249 | Chill Mechanic', 
    description: 'Geyser repair & installation in Gurgaon. Heating element replacement, thermostat issues, safety checks. Same day service. Call +91-2902-1835', 
    price: '249',
    keywords: 'geyser repair Gurgaon, water heater service, heating element repair, geyser installation, water heater maintenance'
  },
  microwave: { 
    title: 'Microwave Repair Gurgaon | Microwave Service Near Me | Starting Rs. 249 | Chill Mechanic', 
    description: 'Microwave oven repair in Gurgaon. Heating issues, door problems, electrical faults. All brands repaired. Genuine parts guaranteed. Same day service!', 
    price: '249',
    keywords: 'microwave repair Gurgaon, microwave oven service, heating issues, microwave maintenance, microwave repair near me'
  },
  'water-dispenser': { 
    title: 'Water Dispenser Repair Gurgaon | Dispenser Service Near Me | Starting Rs. 249 | Chill Mechanic', 
    description: 'Water dispenser service in Gurgaon. Filter replacement, temperature control, cleaning. Commercial & residential. Same day repair available!', 
    price: '249',
    keywords: 'water dispenser repair, dispenser service Gurgaon, filter replacement, water dispenser maintenance, commercial dispenser'
  },
  'deep-freezer': { 
    title: 'Deep Freezer Repair Gurgaon | Commercial Freezer Service | Starting Rs. 249 | Chill Mechanic', 
    description: 'Deep freezer repair in Gurgaon. Cooling issues, compressor repair, maintenance. Restaurant & commercial freezer experts. Same day service!', 
    price: '249',
    keywords: 'deep freezer repair Gurgaon, commercial freezer service, freezer maintenance, compressor repair, commercial refrigeration'
  },
};

const serviceDetails = {
  ac: {
    title: "AC Service & Repair",
    image: acServiceImage,
    description: "Professional AC repair and maintenance services for all brands and models.",
    longDescription: `
      Our expert technicians provide comprehensive AC services including cooling system diagnostics, 
      filter cleaning and replacement, compressor repair, refrigerant charging, and complete system maintenance. 
      We ensure your air conditioning unit operates at peak efficiency, providing optimal cooling comfort for your home.
    `,
    services: [
      { id: "ac-foam-1", name: "Foam Power Jet Service-1 AC", price: 599, description: "Premium foam cleaning and filter cleaning for single AC unit." },
      { id: "ac-foam-2", name: "Foam Power Jet Service-2 AC", price: 1149, description: "Deep foam cleaning with filter service and basic maintenance for 2 ACs." },
      { id: "ac-foam-3", name: "Foam Power Jet Service-3 AC", price: 1649, description: "Deep foam cleaning with complete filter service and coil cleaning for 3 ACs." },
      { id: "ac-foam-4", name: "Foam Power Jet Service-4 AC", price: 2199, description: "Premium foam cleaning with complete servicing and performance check for 4 ACs." },
      { id: "ac-foam-5", name: "Foam Power Jet Service-5 AC", price: 2499, description: "Ultimate foam cleaning with complete deep service and full inspection for 5 ACs." },
      { id: "ac-power-jet-1", name: "Power Jet Service-1 AC", price: 499, description: "Power jet cleaning for single AC unit." },
      { id: "ac-power-jet-2", name: "Power Jet Service-2 AC", price: 949, description: "Power jet cleaning with filter service for 2 ACs." },
      { id: "ac-power-jet-3", name: "Power Jet Service-3 AC", price: 1349, description: "Power jet cleaning with complete filter service for 3 ACs." },
      { id: "ac-power-jet-4", name: "Power Jet Service-4 AC", price: 1799, description: "Power jet cleaning with complete servicing for 4 ACs." },
      { id: "ac-not-cooling", name: "AC Not Cooling/Less Cooling", price: 249, description: "Diagnose and fix cooling issues and performance problems." },
      { id: "ac-power-issue", name: "AC Power Issue", price: 249, description: "Electrical diagnosis and power circuit repair." },
      { id: "ac-noise-reduction", name: "AC Noise Reduction", price: 449, description: "Noise diagnosis, component adjustment, and lubrication." },
      { id: "ac-water-leakage", name: "AC Water Leakage Repair", price: 549, description: "Leak detection, drain cleaning, and seal repair." },
      { id: "ac-gas-refill", name: "Gas Refill & Check Up", price: 1999, description: "Gas leak detection, gas refill, and pressure check. Choose from 1, 1.5 & 2 Ton options." },
      { id: "ac-split-installation", name: "Split AC Installation", price: 1499, description: "Complete installation with piping, wiring, and testing." },
      { id: "ac-split-uninstall", name: "Split AC Uninstallation", price: 799, description: "Safe removal with gas recovery and dismantling." },
      { id: "ac-window-installation", name: "Window AC Installation", price: 699, description: "Window mounting with electrical setup and testing." },
      { id: "ac-window-uninstall", name: "Window AC Uninstallation", price: 499, description: "Safe removal and window restoration." },
    ],
  },
  refrigerator: {
    title: "Refrigerator Service & Repair",
    image: refrigeratorServiceImage,
    description: "Expert refrigerator repair services for cooling, compressor, and electrical issues.",
    longDescription: `
      Our skilled technicians handle all types of refrigerator problems including cooling issues, 
      compressor failures, thermostat problems, door seal replacements, and electrical repairs. 
      We service all major brands and ensure your refrigerator maintains optimal food preservation.
    `,
    services: [
      { id: "fridge-single-door", name: "Check Up - Single Door", price: 249, description: "Complete diagnostic check-up for single door refrigerators with performance assessment." },
      { id: "fridge-double-door", name: "Check Up - Double Door", price: 249, description: "Complete diagnostic check-up for double door refrigerators with cooling system inspection." },
    ],
  },
  ro: {
    title: "RO Water Purifier Service",
    image: roServiceImage,
    description: "Complete RO system maintenance, filter replacement, and water quality optimization.",
    longDescription: `
      Our RO service includes filter replacement, membrane cleaning, TDS testing, 
      water quality assessment, and complete system maintenance. We ensure your 
      water purifier delivers safe, clean drinking water for your family.
    `,
    services: [
      { id: "ro-checkup", name: "Check Up - Water Purifier", price: 249, description: "Complete diagnostic check-up of water purifier with TDS testing and system inspection." },
      { id: "ro-filter-checkup", name: "Check Up - Water Purifier Filter", price: 249, description: "Detailed filter inspection and performance assessment for water purifier." },
      { id: "ro-regular-service", name: "Water Purifier Regular Service", price: 1699, description: "Regular maintenance service with basic filter replacement and system cleaning." },
      { id: "ro-full-service", name: "Water Purifier Full Service", price: 3799, description: "Comprehensive full service with all filter replacements, membrane cleaning, and complete maintenance." },
      { id: "ro-installation", name: "Water Purifier Installation", price: 399, description: "Professional installation of new water purifier with complete setup and testing." },
      { id: "ro-uninstallation", name: "Water Purifier Uninstallation", price: 349, description: "Safe removal and uninstallation of water purifier systems." },
    ],
  },
  geyser: {
    title: "Geyser Service & Repair",
    image: geyserServiceImage,
    description: "Professional geyser repair, maintenance, and installation services.",
    longDescription: `
      Our geyser services include heating element replacement, thermostat repair, 
      tank cleaning, safety valve maintenance, and electrical safety checks. 
      We ensure reliable hot water supply and safe operation of your water heater.
    `,
    services: [
      { id: "geyser-checkup", name: "Check Up - Geyser", price: 249, description: "Complete diagnostic check-up of geyser with heating element and thermostat inspection." },
      { id: "geyser-service", name: "Geyser Service", price: 549, description: "Complete maintenance service with element check, tank cleaning, and safety inspection." },
      { id: "geyser-installation", name: "Geyser Installation", price: 449, description: "Professional installation with proper pipe fitting and electrical setup." },
      { id: "geyser-uninstallation", name: "Geyser Uninstallation", price: 349, description: "Safe removal and uninstallation of geyser units." },
    ],
  },
  "washing-machine": {
    title: "Washing Machine Service & Repair",
    image: washingMachineServiceImage,
    description: "Expert washing machine repair and maintenance for all brands and models.",
    longDescription: `
      Our washing machine services cover motor repair, drum cleaning, belt replacement,
      drain cleaning, control panel fixes, and complete system maintenance.
      We ensure your washing machine operates efficiently for reliable laundry care.
    `,
    services: [
      { id: "wm-top-load-checkup", name: "Checkup - AM Top Load", price: 249, description: "Complete diagnostic check-up for automatic top load washing machines." },
      { id: "wm-front-load-checkup", name: "Checkup - AM Front Load", price: 249, description: "Complete diagnostic check-up for automatic front load washing machines." },
      { id: "wm-semi-auto-checkup", name: "Check Up - Semi Automatic", price: 249, description: "Complete diagnostic check-up for semi-automatic washing machines." },
      { id: "wm-top-load-service", name: "Top Load Service", price: 499, description: "Complete service and maintenance for top load washing machines with comprehensive cleaning." },
      { id: "wm-top-load-jet", name: "Top Load Jet Service", price: 999, description: "Premium jet cleaning service for top load washing machines with deep maintenance." },
      { id: "wm-front-load-service", name: "Front Load Service", price: 700, description: "Complete service and maintenance for front load washing machines with thorough inspection." },
      { id: "wm-front-load-jet", name: "Front Load Jet Service", price: 1699, description: "Premium jet cleaning service for front load washing machines with advanced deep cleaning." },
      { id: "wm-install-uninstall", name: "Installation & Uninstallation", price: 399, description: "Professional installation or uninstallation service for washing machines." },
    ],
  },
  microwave: {
    title: "Microwave Service & Repair",
    image: microwaveServiceImage,
    description: "Professional microwave repair services for heating issues, door problems, and electrical faults.",
    longDescription: `
      Our microwave repair services include magnetron replacement, door repair, turntable fixes, 
      control panel repairs, and complete system diagnostics. We handle all major brands and 
      ensure your microwave operates safely and efficiently for convenient cooking.
    `,
    services: [
      { id: "microwave-checkup", name: "Check Up", price: 249, description: "Complete diagnostic check-up of microwave with functionality testing and safety inspection." },
    ],
  },
  "water-dispenser": {
    title: "Water Dispenser Service & Repair",
    image: waterDispenserServiceImage,
    description: "Professional water dispenser maintenance and diagnostics.",
    longDescription: `
      Our water dispenser services include comprehensive system diagnostics, 
      cooling and heating system inspection, and complete functionality checks. 
      We ensure your dispenser provides safe, cool drinking water for your family.
    `,
    services: [
      { id: "wd-checkup", name: "Check Up - Water Dispenser", price: 249, description: "Complete diagnostic check-up of water dispenser with cooling and heating system inspection." },
    ],
  },
  "deep-freezer": {
    title: "Deep Freezer Service & Repair",
    image: deepFreezerServiceImage,
    description: "Expert deep freezer maintenance and diagnostics.",
    longDescription: `
      Our deep freezer services include comprehensive system diagnostics, 
      cooling system inspection, temperature monitoring, and complete functionality checks. 
      We ensure reliable food preservation and optimal freezer performance.
    `,
    services: [
      { id: "df-checkup", name: "Check Up - Deep Freezer", price: 249, description: "Complete diagnostic check-up of deep freezer with temperature and cooling system inspection." },
    ],
  },
};

export default function ServiceDetail() {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemsCount } = useCart();
  const [showFullContent, setShowFullContent] = useState(false);

  const service = serviceType ? serviceDetails[serviceType as keyof typeof serviceDetails] : null;

  if (!service) {
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

  const handleAddToCart = (serviceItem: { id: string; name: string; description: string; price: number }) => {
    const cartService = {
      id: serviceItem.id,
      name: serviceItem.name,
      description: [serviceItem.description],
      price: serviceItem.price,
    };
    
    addToCart([cartService]);
    toast({
      title: "Added to cart",
     description: `₹${serviceItem.price} has been added to your cart.`,
    });
  };

  const handleBookNow = (serviceItem: { id: string; name: string; description: string; price: number }) => {
    handleAddToCart(serviceItem);
    navigate("/cart");
  };

  const seo = serviceType ? SERVICE_SEO[serviceType] : null;
  const faqs = serviceType ? serviceFaqMap[serviceType] : undefined;
  const content = serviceType ? serviceContentMap[serviceType] : undefined;

  // Prefer the richer content meta when available, falling back to SERVICE_SEO.
  const metaTitle = content?.metaTitle || seo?.title;
  const metaDescription = content?.metaDescription || seo?.description;

  return (
    <>
      <div className="min-h-screen bg-background">
        {seo && (
          <Helmet>
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={seo.keywords} />
            <meta name="language" content="en-US" />
            <meta name="revisit-after" content="7 days" />
            <meta name="author" content="Chill Mechanic" />
            <link rel="canonical" href={`https://www.chillmechanic.com/services/${serviceType}`} />

            {/* Open Graph Meta Tags for Social Sharing */}
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={`https://www.chillmechanic.com/services/${serviceType}`} />
            <meta property="og:site_name" content="Chill Mechanic" />
            <meta property="og:image" content={service.image ? `https://www.chillmechanic.com${service.image}` : 'https://www.chillmechanic.com/og-image.jpg'} />
            <meta property="og:image:alt" content={service.title} />

            {/* Twitter Card Meta Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={service.image ? `https://www.chillmechanic.com${service.image}` : 'https://www.chillmechanic.com/og-image.jpg'} />
            <meta name="twitter:site" content="@chillmechanic" />
          </Helmet>
        )}
        {seo && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: service.title,
            description: metaDescription,
            provider: { 
              '@type': 'LocalBusiness', 
              name: 'Chill Mechanic',
              telephone: '+91-2902-1835',
              email: 'info@chillmechanic.com',
              url: 'https://www.chillmechanic.com',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Gurgaon',
                addressLocality: 'Gurgaon',
                addressRegion: 'Haryana',
                postalCode: '122001',
                addressCountry: 'IN'
              }
            },
            areaServed: {
              '@type': 'City',
              name: 'Gurgaon'
            },
            offers: { 
              '@type': 'Offer', 
              price: seo.price, 
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `https://www.chillmechanic.com/services/${serviceType}`
            },
            serviceType: service.title,
            url: `https://www.chillmechanic.com/services/${serviceType}`,
            // aggregateRating temporarily removed - hardcoded values don't reflect real user reviews
            // Will be re-enabled when integrated with actual review data
          }) }} />
        )}
        {faqs && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFaqSchema(faqs)) }} />
        )}
        {seo && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.chillmechanic.com'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: service.title,
                item: `https://www.chillmechanic.com/services/${serviceType}`
              }
            ]
          }) }} />
        )}
        <Header cartItemsCount={getCartItemsCount()} />

      {/* Trust Badges */}
      <TrustBadgeBar />

      {/* CTA Section - Call Now Button at Top */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold mb-2">⚡ Limited slots available today</p>
          <p className="text-2xl md:text-3xl font-bold mb-4">Book Your {service.title} Now</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" onClick={() => {
              const grid = document.querySelector('[data-services-grid]');
              grid?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Book Now
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-secondary-foreground hover:text-primary-foreground hover:bg-secondary-foreground/10" asChild>
              <a href="tel:+919211970030">Call +919211970030</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-foreground">
                {content?.h1 || service.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {content?.intro || service.description}
              </p>
              {!content && (
                <p className="text-muted-foreground leading-relaxed">
                  {service.longDescription}
                </p>
              )}
            </div>
            
            <div className="relative">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-muted/20" data-services-grid>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Available Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our range of professional services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.services.map((serviceItem) => {
              const itemImage = getServiceItemPrimaryImage(serviceItem.id);
              return (
              <Card key={serviceItem.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {itemImage && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={itemImage}
                      alt={serviceItem.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{serviceItem.name}</h3>
                    {serviceItem.name.toLowerCase().includes('foam') && (
                      <span className="ml-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">Free gas check</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {serviceItem.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <span className="text-2xl font-bold text-primary">₹{serviceItem.price}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => navigate(`/services/${serviceType}/${serviceItem.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleAddToCart(serviceItem)}
                      variant="outline"
                      className="flex-1"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Content Section (H2-H4) with expandable content */}
      {content && content.sections.length > 0 && (
        <section className="py-12 bg-muted/20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-4">
              {content.sections.map((section, i) => {
                const sectionId = `section-${i}`;
                const isExpanded = showFullContent || i === 0;
                return (
                  <div key={i} className="border-b border-border last:border-b-0">
                    <button
                      onClick={() => {
                        if (i === 0) return;
                        setShowFullContent((prev) => !prev);
                      }}
                      className="w-full text-left py-4 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-sm"
                      disabled={i === 0}
                      aria-expanded={isExpanded}
                      aria-controls={sectionId}
                    >
                      <h2 className="text-lg font-medium text-foreground">
                        {section.heading}
                      </h2>
                      {i > 0 && (
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ml-3 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {isExpanded && (
                      <div
                        id={sectionId}
                        className="pb-4 text-muted-foreground leading-relaxed"
                      >
                        {section.body}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs && <FaqAccordion faqs={faqs} />}

      {/* Company Stats & Quick Facts Section */}
      {serviceStatsData[serviceType] && (
        <>
          <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto px-4">
              <div className="mb-12">
                <CompanyStats
                  title={`${service.title} - Company Stats`}
                  stats={serviceStatsData[serviceType].stats}
                />
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <QuickFacts
                title={`Quick Facts - ${service.title}`}
                facts={serviceStatsData[serviceType].quickFacts}
                columns={1}
              />
            </div>
          </section>
        </>
      )}

      <CustomerReviews />

      {/* Videos Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Play className="h-6 w-6 text-secondary" />
            <h2 className="text-3xl md:text-4xl font-bold">Our Work</h2>
          </div>
          <p className="text-center text-muted-foreground mb-10">Real repairs, real results</p>

          <Carousel opts={{ align: 'start', loop: true }} className="w-full max-w-6xl mx-auto">
            <CarouselContent>
              {VIDEOS.map((v) => (
                <CarouselItem key={v.id} className="basis-[82%] sm:basis-1/2 lg:basis-1/3">
                  <div className="rounded-2xl overflow-hidden border bg-black aspect-[9/16]">
                    <video
                      src={v.videoUrl}
                      preload="none"
                      playsInline
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      <BrandsCarousel />
      <ServiceAreas />
    </div>
    <Footer />
    </>
  );
}

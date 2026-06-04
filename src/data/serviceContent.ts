// Rich SEO content for service detail pages.
// h1/intro render in the hero; sections (H2-H4) render in an expandable
// "Read More" block above the FAQs. metaTitle/metaDescription feed <Helmet>.

export interface ServiceContentSection {
  heading: string;
  body: string;
}

export interface ServiceContent {
  h1: string;
  intro: string;
  sections: ServiceContentSection[];
  metaTitle: string;
  metaDescription: string;
}

export const serviceContentMap: Record<string, ServiceContent> = {
  ac: {
    h1: "Book Best AC Service in Gurgaon Online",
    intro:
      "Looking for the Best AC Service in Gurgaon for your home or office? Chill Mechanic provides professional and affordable air conditioner repair and maintenance solutions with fast doorstep support across Gurgaon. We understand how important a properly working AC is during every season, which is why our skilled team focuses on delivering reliable, timely and long-lasting solutions for all AC brands and models.",
    sections: [
      {
        heading: "Best AC Repair Service in Gurgaon",
        body: "At Chill Mechanic, we offer the Best AC Repair Service in Gurgaon with advanced tools and experienced technicians. Whether your air conditioner is not cooling properly, leaking water, making unusual noise or consuming excessive electricity, our experts quickly identify the issue and provide effective repair services. Our goal is to restore your cooling system with minimum downtime and maximum customer satisfaction.",
      },
      {
        heading: "Expert AC Technicians in Gurgaon",
        body: "Our team includes highly trained and Expert AC Technicians in Gurgaon who handle every repair and maintenance task with complete professionalism. From regular servicing to major technical faults, we provide dependable solutions for residential as well as commercial air conditioning systems. We ensure transparent service, proper inspection and quality workmanship for every customer.",
      },
      {
        heading: "Split AC Repair Service in Gurgaon",
        body: "Chill Mechanic specializes in Split AC Repair Service in Gurgaon for all major brands. Split air conditioners require proper maintenance and expert handling to maintain cooling efficiency and energy performance. Our technicians repair cooling problems, sensor issues, gas leakage, PCB faults, drainage blockage and airflow issues using modern repair techniques.",
      },
      {
        heading: "Window AC Repair in Gurgaon",
        body: "We also provide trusted Window AC Repair in Gurgaon with complete servicing and maintenance support. If your window AC is producing low cooling, vibration noise, bad smell or water leakage, our technicians can fix the problem efficiently. We provide complete inspection and servicing to improve the overall performance and lifespan of your unit.",
      },
      {
        heading: "AC Compressor Repair in Gurgaon",
        body: "The compressor plays a vital role in maintaining the cooling performance of an air conditioner. Our AC Compressor Repair in Gurgaon service helps resolve compressor overheating, starting issues, unusual sounds and cooling failure problems. Chill Mechanic uses quality spare parts and proper diagnostic methods to ensure smooth and long-lasting AC performance.",
      },
      {
        heading: "AC Gas Filling in Gurgaon",
        body: "Low refrigerant levels can directly affect cooling efficiency. We provide professional AC gas filling in Gurgaon for split ACs and window ACs with proper pressure checking and leakage inspection. Our gas refilling service improves cooling performance while helping your AC operate efficiently and safely.",
      },
      {
        heading: "AC Deep Cleaning Service in Gurgaon",
        body: "Regular cleaning is important for healthy airflow and better cooling. Our AC Deep Cleaning Service in Gurgaon removes dust, bacteria and dirt buildup from filters, coils and internal parts. This service helps improve cooling, reduces electricity consumption and increases the lifespan of your air conditioner.",
      },
      {
        heading: "Residential and Commercial AC Service Gurgaon",
        body: "Chill Mechanic offers complete Residential and Commercial AC Service Gurgaon with fast response and professional support. From homes and apartments to offices, shops and commercial spaces, we provide reliable Doorstep AC Repair in Gurgaon with customer focused solutions at affordable pricing.",
      },
    ],
    metaTitle: "Book Online Best AC Repair & Services Gurgaon|2000+ Serviced",
    metaDescription:
      "Book Online Best AC Repair & Services in Gurgaon with Chill Mechanic. 2000+ ACs serviced by experts. Fast, reliable doorstep service at affordable rates.",
  },

  refrigerator: {
    h1: "Book Best Refrigerator Service in Gurgaon Online",
    intro:
      "When your refrigerator stops cooling properly, leaks water, makes unusual noise or faces compressor issues, you need a trusted and professional repair company that delivers quick and reliable solutions. At Chill Mechanic, we provide the Best Refrigerator Service in Gurgaon with expert technicians, advanced tools and fast doorstep support. Our experienced team understands the importance of a properly working fridge in your home or business, which is why we focus on quality service, genuine repairs and customer satisfaction.",
    sections: [
      {
        heading: "Refrigerator Repair Service in Gurgaon",
        body: "At Chill Mechanic, we specialize in complete Refrigerator Repair Service in Gurgaon for all major refrigerator brands and models. Whether you own a single door fridge, side by side refrigerator or require Double door fridge repair Gurgaon, our technicians are trained to diagnose and fix every issue efficiently. We repair cooling problems, compressor faults, thermostat issues, gas leakage and electrical malfunctions with precision. Our goal is to restore your refrigerator's performance quickly so you can avoid food spoilage and inconvenience.",
      },
      {
        heading: "Fridge Service Near Me Gurgaon",
        body: "If you are searching for reliable Fridge Service Near Me Gurgaon, Chill Mechanic is your trusted local repair partner. We provide fast and affordable repair services across Gurgaon with same day support in many areas. Our technicians arrive fully equipped to handle repairs at your doorstep, saving your time and effort. We believe in transparent pricing, professional behaviour and long-lasting repair solutions for every customer.",
      },
      {
        heading: "Refrigerator Gas Filling Gurgaon",
        body: "Low cooling is often caused by gas leakage or low refrigerant levels. Our professional Refrigerator Gas Filling Gurgaon service ensures proper cooling performance and energy efficiency. We use high quality refrigerants and advanced leak detection methods to provide safe and effective gas refilling services. Our trained experts carefully inspect the cooling system before refilling gas to ensure your refrigerator performs smoothly for a longer period.",
      },
      {
        heading: "Refrigerator Cooling Repair Gurgaon",
        body: "Cooling problems can affect the efficiency of your refrigerator and increase electricity consumption. At Chill Mechanic, we offer expert Refrigerator Cooling Repair Gurgaon services to fix cooling related issues quickly. Our skilled technicians inspect compressors, cooling coils, thermostats, fans and gas pressure to identify the exact problem. As a trusted Refrigerator Repair Expert Gurgaon, we ensure accurate diagnosis and dependable repair solutions for all refrigerator models.",
      },
      {
        heading: "Doorstep Refrigerator Repair Service in Gurgaon",
        body: "Our Doorstep Refrigerator Repair Service in Gurgaon is designed to provide convenience and fast assistance at your home or office. You no longer need to transport heavy refrigerators to service centers. Our certified technicians visit your location with the required tools and spare parts to complete repairs on site. We also provide Fridge water leakage repair Gurgaon, thermostat replacement, wiring repair and Refrigerator compressor repair Gurgaon with complete professionalism.",
      },
      {
        heading: "Commercial Refrigerator Repair Gurgaon",
        body: "Apart from residential refrigerators, Chill Mechanic also offers expert Commercial refrigerator repair Gurgaon services for restaurants, cafes, hotels, grocery stores and commercial kitchens. We understand how important commercial refrigeration systems are for businesses, which is why our technicians provide quick troubleshooting and efficient repairs to minimize downtime.",
      },
      {
        heading: "Refrigerator Installation Service Gurgaon",
        body: "Along with repair services, we also provide professional Refrigerator installation service Gurgaon for homes, offices and commercial spaces. Our experts ensure proper installation, voltage safety checks and correct positioning for smooth performance and longer appliance life. You can also Book Refrigerator Service Online in Gurgaon easily with Chill Mechanic for fast scheduling and hassle-free support. As the Best Refrigerator Technician Gurgaon, we are committed to delivering reliable, affordable and high-quality refrigerator repair services across Gurgaon.",
      },
    ],
    metaTitle: "Book Online Refrigerator Service Gurgaon| Fridge Repair Near me| Rs 249",
    metaDescription:
      "Book Online Refrigerator Service in Gurgaon with Chill Mechanic. Fridge Repair Near Me starting at Rs. 249 by expert technicians with 50+ year's experience.",
  },

  ro: {
    h1: "Book Best RO Water Purifier Service in Gurgaon Online",
    intro:
      "At Chill Mechanic, we provide the best RO water purifier service in Gurgaon with fast response time, expert technicians and reliable doorstep support. Clean drinking water is essential for every home and office, and our team is dedicated to delivering high quality RO solutions at affordable prices. Whether you need regular maintenance, urgent repair or a complete RO setup, our experienced professionals are always ready to help. We focus on customer satisfaction, genuine spare parts and long-lasting service solutions to make us the preferred choice for RO services in Gurgaon.",
    sections: [
      {
        heading: "RO Repair Service in Gurgaon by Expert Technician",
        body: "Our professional RO repair service in Gurgaon is designed to solve every type of water purifier issue quickly and efficiently. From low water flow and unusual noise to water leakage and poor purification quality, our team handles all problems with precision. We are known as the best water purifier technician in Gurgaon because we use advanced tools and proper diagnosis methods to repair all major RO brands. If you are searching for dependable water purifier repair in Gurgaon, our expert team ensures safe, hygienic and hassle-free service right at your doorstep.",
      },
      {
        heading: "RO Installation Service in Gurgaon for Homes & Offices",
        body: "We offer trusted RO installation service in Gurgaon for residential and commercial spaces. Proper installation is essential for the long-term performance of any RO system and our technicians ensure perfect fitting, safe connections and complete testing before completing the installation process. Whether you have purchased a new RO purifier or shifted to a new location, our team provides quick and professional installation support. Customers looking to book online RO water purifier service in Gurgaon can easily connect with us for same day service assistance and affordable pricing.",
      },
      {
        heading: "Doorstep RO Repair Service Gurgaon with Genuine Spare Parts",
        body: "At Chill Mechanic, we specialize in doorstep RO repair service Gurgaon to save your time and provide complete convenience. Our technicians arrive fully equipped to handle repairs, servicing and maintenance in a single visit. We also provide high quality RO filter replacement in Gurgaon and RO membrane replacement Gurgaon services to improve water purity and enhance the performance of your purifier. Regular filter and membrane replacement helps maintain healthy drinking water and increases the lifespan of your RO system. We use genuine spare parts to ensure reliable and long-lasting results for every customer.",
      },
      {
        heading: "Top Rated RO Service Provider Gurgaon for All Major Brands",
        body: "As a top-rated RO service provider Gurgaon, we work with all leading water purifier brands including Kent, Aquaguard, Livpure, Pureit, AO Smith and more. Many customers searching for Kent service near me Gurgaon trust Chill Mechanic for professional service, affordable pricing and quick support. Our team is trained to handle installation, repair, maintenance and annual servicing for every type of RO system. We believe in transparent service, timely visits and customer first support that makes us one of the most trusted RO service companies in Gurgaon.",
      },
      {
        heading: "Book Online RO Water Purifier Service in Gurgaon Today",
        body: "When it comes to reliable and professional RO solutions, Chill Mechanic is committed to delivering quality RO water purifier service across Gurgaon with expert support and doorstep assistance. From emergency repair and RO maintenance to installation and filter replacement, we provide complete RO solutions at your convenience. Contact our team today to book online RO water purifier service in Gurgaon and experience fast, affordable and professional RO services at your doorstep. Clean and safe drinking water is just one call away with Chill Mechanic.",
      },
    ],
    metaTitle: "Book Online RO Water Purifier Repair Gurgaon| Starting 249",
    metaDescription:
      "Book Online Water Purifier Repair in Gurgaon with Chill Mechanic. Expert RO service starting at Rs. 249. Fast, reliable doorstep repair by trained technicians.",
  },

  geyser: {
    h1: "Book Best Geyser Service & Repair in Gurgaon Online",
    intro:
      "At Chill Mechanic, we provide the best geyser service & repair in Gurgaon with fast response, affordable pricing and expert technical support. A properly working geyser is essential for daily comfort, especially during winters and our experienced team ensures safe and reliable repair solutions for all types of water heaters. From urgent repairs and routine servicing to complete geyser installation solutions, our experienced technicians provide reliable support for every requirement. We focus on quality service, customer satisfaction and long-lasting repair solutions that make us a trusted name in Gurgaon.",
    sections: [
      {
        heading: "Geyser Installation Service in Gurgaon for Homes & Offices",
        body: "Our professional geyser installation service in Gurgaon is designed for both residential and commercial properties. Proper installation is important for safety, energy efficiency and long-term performance and our trained technicians ensure secure fitting and accurate setup for every geyser model. We provide complete geyser fitting service in Gurgaon for electric geysers, instant geysers and storage water heaters. Our team follows proper safety standards and testing procedures to ensure smooth performance after installation. Customers looking for reliable and professional installation support can trust Chill Mechanic for quick and hassle-free service.",
      },
      {
        heading: "Water Heater Repair in Gurgaon by Professional Experts",
        body: "We specialize in expert water heater repair in Gurgaon for all major brands and models. Our team of professional geyser repair experts Gurgaon is trained to diagnose and fix common as well as advanced geyser problems efficiently. Whether your geyser is producing less hot water, making unusual noise or facing electrical issues, we provide effective solutions using genuine spare parts. We are known for offering dependable home geyser repair Gurgaon services with quick turnaround time and transparent pricing. Our goal is to restore your geyser performance while ensuring complete safety and convenience for your family.",
      },
      {
        heading: "Electric Geyser Repair & Gas Geyser Repair Service Gurgaon",
        body: "At Chill Mechanic, we provide trusted electric geyser repair Gurgaon services for all types of electric water heaters. From thermostat problems and heating element failure to wiring issues and power fluctuations, our technicians handle every repair with expertise. We also offer reliable gas geyser repair service Gurgaon for customers facing ignition problems, low heating performance or gas leakage concerns. Our experienced team carefully inspects every component to ensure safe and smooth operation. With years of experience in geyser servicing, we have become one of the preferred choices for water heater repair solutions in Gurgaon.",
      },
      {
        heading: "Doorstep Geyser Repair Service Gurgaon for Quick Assistance",
        body: "Our fast and convenient doorstep geyser repair service Gurgaon allows customers to get expert support without leaving their home. We understand the importance of quick service, which is why our technicians arrive fully equipped to resolve most issues in a single visit. We provide specialized services for leaking geyser repair Gurgaon and geyser not heating repair Gurgaon to help customers avoid bigger appliance damage and unnecessary electricity consumption. Whether it is a minor fault or a complete breakdown, our skilled technicians ensure professional repair and long-lasting performance.",
      },
      {
        heading: "Book Online Geyser Repair Service Gurgaon Today",
        body: "If you are searching for the best water heater repair company Gurgaon, Chill Mechanic is your trusted service partner for reliable and affordable geyser solutions. From installation and maintenance to emergency repair services, we provide complete support for all types of geysers. Customers can easily use our online geyser service booking Gurgaon facility to schedule quick and professional service at their convenience. Contact Chill Mechanic today to book online geyser repair service Gurgaon and experience expert repair solutions, doorstep assistance and quality service you can trust.",
      },
    ],
    metaTitle: "Book Online Geyser Service & Repair Gurgaon| 1500+ Serviced",
    metaDescription:
      "Book Online Geyser Service & Repair in Gurgaon, 1500+ Geysers Serviced, 90% Same-Day Resolution Rate. Expert Technicians & Fast Doorstep Service.",
  },

  microwave: {
    h1: "Book Best Microwave Service & Repair in Gurgaon Online",
    intro:
      "At Chill Mechanic, we provide the best microwave service & repair in Gurgaon with professional technicians, fast response time and reliable doorstep support. Our team specializes in repairing all types of microwave ovens for residential and commercial customers across Gurgaon. Whether your microwave is not heating properly, showing sparks, making unusual noise or facing power issues, we deliver complete repair solutions with quality workmanship.",
    sections: [
      {
        heading: "Trusted Microwave Repair Company in Gurgaon",
        body: "As a trusted microwave repair company in Gurgaon, our focus is on customer satisfaction, affordable pricing and long-lasting repair services. We use advanced diagnostic tools and quality spare parts to ensure smooth and safe microwave performance after every service.",
      },
      {
        heading: "Professional Microwave Oven Repair in Gurgaon",
        body: "We offer complete microwave oven repair in Gurgaon for all major brands and models including convection, grill and solo microwaves. Our experienced team understands the technical structure of modern microwave ovens and provides accurate fault diagnosis for every issue. Our skilled microwave technician in Gurgaon handles heating problems, touch panel issues, fuse damage, magnetron faults, door switch problems and electrical errors efficiently. We provide reliable repair support designed to restore your appliance performance quickly and safely.",
      },
      {
        heading: "Doorstep Microwave Repair in Gurgaon",
        body: "Our company offers fast and convenient doorstep microwave repair in Gurgaon so customers can get their appliances repaired without visiting a service center. Our technicians arrive at your location with proper tools and equipment to diagnose and repair the issue on-site. We understand the importance of time and convenience, which is why we provide same day repair support in many areas of Gurgaon. Our doorstep service helps customers save time while receiving professional repair assistance directly at home or office.",
      },
      {
        heading: "Microwave Not Heating Repair Gurgaon",
        body: "If your microwave is running but food is not heating properly, our experts provide specialized microwave not heating repair Gurgaon services. This issue is commonly caused by problems related to the magnetron, capacitor, diode or internal electrical components. Our technicians carefully inspect the appliance and provide safe repair solutions to restore proper heating performance. We ensure every repair is completed using proper safety standards and high-quality replacement parts.",
      },
      {
        heading: "Microwave Sparking Issue Repair Gurgaon",
        body: "Sparking inside the microwave can damage internal components and create safety risks if ignored. At Chill Mechanic, we provide expert microwave sparking issue repair Gurgaon services to identify and fix the root cause quickly. Our team checks waveguide covers, cavity surfaces, internal wiring and damaged components to ensure safe microwave operation. We focus on providing durable repair solutions that improve appliance efficiency and safety.",
      },
      {
        heading: "Microwave Fuse Repair in Gurgaon",
        body: "We provide reliable microwave fuse repair in Gurgaon for microwaves facing sudden power failure or startup issues. A damaged fuse can stop the appliance from functioning completely and may indicate electrical faults inside the system. Our experienced technicians inspect the microwave carefully, replace faulty fuses with compatible parts and ensure stable performance before completing the service. We prioritize safety, accuracy and long-term appliance protection during every repair.",
      },
      {
        heading: "Microwave Installation Service in Gurgaon",
        body: "Along with repair support, we also offer professional microwave installation service in Gurgaon for homes, offices, restaurants and commercial kitchens. Proper installation is important for safe operation, ventilation and appliance durability. Our team ensures correct placement, electrical connection and operational setup for all types of microwave ovens. We help customers install new appliances safely while minimizing the risk of future technical problems.",
      },
      {
        heading: "Microwave Maintenance Service in Gurgaon",
        body: "Regular maintenance helps improve microwave performance and prevents unexpected breakdowns. Our affordable microwave maintenance service in Gurgaon includes internal inspection, cleaning, component testing and performance checks. Preventive maintenance helps extend the life of your appliance while improving energy efficiency and cooking performance. Our technicians provide detailed inspection support for both residential and commercial microwave ovens.",
      },
      {
        heading: "Book Microwave Repair Online Gurgaon",
        body: "At Chill Mechanic, customers can easily book microwave repair online Gurgaon for quick and hassle-free service scheduling. Our support team responds promptly and assigns experienced technicians based on your appliance issue and location. We aim to provide a smooth customer experience with transparent communication, affordable service pricing and trusted repair support across Gurgaon. Choose Chill Mechanic for the best microwave service & repair in Gurgaon and get reliable appliance repair solutions designed for safety, performance and long-term customer satisfaction.",
      },
    ],
    metaTitle: "Book Online Microwave Repair & Service Gurgaon|50+ Years Exp",
    metaDescription:
      "Book Online Microwave Repair & Service in Gurgaon from Rs. 249. Backed by 50+ years of combined experience with fast doorstep repair solutions.",
  },

  "deep-freezer": {
    h1: "Book Best Deep Freezer Service & Repair in Gurgaon Online",
    intro:
      "At Chill Mechanic, we provide the best deep freezer service & repair in Gurgaon with fast response time, skilled technicians and reliable doorstep support. Our company specializes in repairing residential and commercial deep freezers for shops, restaurants, hotels, supermarkets, ice cream parlours and homes across Gurgaon.",
    sections: [
      {
        heading: "Trusted Deep Freezer Repair Company in Gurgaon",
        body: "As a trusted deep freezer repair company in Gurgaon, we focus on delivering high quality repair solutions with transparent pricing and professional customer support. Whether your freezer is not cooling, leaking gas, facing compressor issues or showing temperature fluctuations, our experienced team provides complete repair and maintenance solutions for long lasting performance.",
      },
      {
        heading: "Professional Deep Freezer Repair in Gurgaon",
        body: "We offer complete deep freezer repair in Gurgaon for all major brands and freezer models. Our technicians are trained to handle technical issues related to cooling systems, compressors, thermostats, fan motors, gas leakage and electrical faults. Our expert deep freezer technician in Gurgaon uses advanced tools and modern repair methods to diagnose and fix issues quickly. We understand the importance of proper cooling for food storage and commercial operations, which is why we provide fast and dependable repair services throughout Gurgaon.",
      },
      {
        heading: "Commercial Deep Freezer Repair in Gurgaon",
        body: "Our company provides specialized commercial deep freezer repair in Gurgaon for restaurants, grocery stores, cafes, bakeries, hotels and commercial kitchens. Commercial freezers operate continuously and require expert servicing to maintain proper cooling efficiency. We repair vertical freezers, horizontal freezers, display freezers and heavy-duty commercial refrigeration systems. Our technicians ensure minimal downtime and provide durable repair solutions to keep your business operations running smoothly.",
      },
      {
        heading: "Doorstep Deep Freezer Repair in Gurgaon",
        body: "We provide quick and reliable doorstep deep freezer repair in Gurgaon so customers can get their appliances repaired without transportation hassles. Our technicians visit your location with proper equipment and tools to inspect and repair the freezer on-site. Our doorstep service helps save time while ensuring safe and professional repairs for both residential and commercial customers across Gurgaon.",
      },
      {
        heading: "Deep Freezer Cooling & Not Cooling Repair Gurgaon",
        body: "If your freezer is not maintaining proper cooling, our experts provide professional deep freezer cooling issue repair Gurgaon services. Cooling issues can occur due to compressor faults, thermostat malfunction, blocked airflow or gas leakage. At Chill Mechanic, we specialize in deep freezer not cooling repair Gurgaon for all brands and freezer types. A freezer that is not cooling properly can affect food quality and business operations.",
      },
      {
        heading: "Deep Freezer Compressor Repair Gurgaon",
        body: "The compressor is one of the most important parts of any refrigeration system. We provide expert deep freezer compressor repair Gurgaon services for compressors facing overheating, noise, low cooling performance or complete failure.",
      },
      {
        heading: "Deep Freezer Gas Filling Service Gurgaon",
        body: "Low refrigerant levels can reduce freezer cooling performance significantly. Our deep freezer gas filling service Gurgaon includes leak detection, gas refilling and complete cooling system inspection. We use proper tools and safe gas charging methods to ensure stable cooling performance and long-term appliance efficiency.",
      },
      {
        heading: "Deep Freezer Leakage & Temperature Issue Repair Gurgaon",
        body: "Water leakage or gas leakage can affect the performance and safety of your appliance. We provide reliable deep freezer leakage repair Gurgaon services to identify and resolve leakage issues quickly. If your freezer is unable to maintain the correct temperature, our experts provide advanced deep freezer temperature issue repair Gurgaon solutions. Temperature fluctuations can damage stored products and increase electricity consumption.",
      },
      {
        heading: "Deep Freezer Maintenance Service in Gurgaon",
        body: "Regular servicing is important to maintain freezer performance and prevent costly breakdowns. Our affordable deep freezer maintenance service in Gurgaon includes cooling inspection, condenser cleaning, gas pressure checking, electrical testing and complete system diagnosis.",
      },
      {
        heading: "Book Deep Freezer Repair Online Gurgaon",
        body: "Customers can easily book deep freezer repair online Gurgaon with Chill Mechanic for quick and hassle-free service scheduling. Our support team responds quickly and assigns experienced technicians according to your appliance issue and location. Choose Chill Mechanic for the best deep freezer service & repair in Gurgaon and get trusted refrigeration repair solutions designed for performance, efficiency and customer satisfaction.",
      },
    ],
    metaTitle: "Book Online Deep Freezer Repair Gurgaon | Commercial Freezer Repair| Starting Rs 249",
    metaDescription:
      "Book Online Deep Freezer Repair in Gurgaon, Commercial Freezer Repair Starting at Rs. 249. Expert technicians, fast doorstep service & reliable solutions.",
  },
};

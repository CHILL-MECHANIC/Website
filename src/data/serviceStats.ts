export interface ServiceStats {
  stats: Array<{ label: string; value: string }>;
  quickFacts: string[];
}

export const serviceStatsData: Record<string, ServiceStats> = {
  ac: {
    stats: [
      { label: "AC Repairs Completed", value: "4000+ (4 Months Data)" },
      { label: "Common AC Issue", value: "Lack of Maintenance" },
      { label: "Recommended Service Interval", value: "Every 3 Months" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Same Day Repair Rate", value: "90%" },
      { label: "Response Time", value: "Within 60 Minutes" },
      { label: "Inspection Fee", value: "₹249" },
      { label: "Average Repair Cost", value: "₹1000+" },
    ],
    quickFacts: [
      "4000+ (4 Months Data) AC Repairs Completed",
      "Most Common Issue: Dirty Filters & Lack of Maintenance",
      "Recommended Service Frequency: Every 3 Months",
    ],
  },
  refrigerator: {
    stats: [
      { label: "Refrigerator Repairs Completed", value: "2000+ (4 Months Data)" },
      { label: "Common Issue", value: "Cooling & Maintenance Problems" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Same Day Repair Rate", value: "90%" },
      { label: "Response Time", value: "Within 60 Minutes" },
      { label: "Inspection Charges", value: "₹249" },
      { label: "Average Repair Cost", value: "₹1000+" },
    ],
    quickFacts: [
      "2000+ (4 Months Data) Refrigerator Repairs Completed",
      "Most Common Issue: Cooling Problems",
      "Common Brands Serviced: All major brands",
    ],
  },
  "washing-machine": {
    stats: [
      { label: "Washing Machine Services Completed", value: "500+ (4 Months Data)" },
      { label: "Common Issue", value: "Maintenance Related Problems" },
      { label: "Same Day Resolution", value: "90%" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Response Time", value: "60 Minutes" },
      { label: "Inspection Fee", value: "₹249" },
      { label: "Recommended Maintenance", value: "Every 3 Months" },
    ],
    quickFacts: [
      "500+ (4 Months Data) Washing Machine Repairs Completed",
      "Most Common Issue: Drainage Problems",
      "Front Load & Top Load Expertise",
    ],
  },
  ro: {
    stats: [
      { label: "RO Repairs Completed", value: "1000+ (4 Months Data)" },
      { label: "Common Issue", value: "Filter Maintenance" },
      { label: "Recommended Service Frequency", value: "Every 3 Months" },
      { label: "Same Day Resolution", value: "90%" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Inspection Fee", value: "₹249" },
    ],
    quickFacts: [
      "1000+ (4 Months Data) RO Repairs Completed",
      "Common Issue: Filter Choking",
      "Recommended Filter Service Interval: Every 3 Months",
    ],
  },
  microwave: {
    stats: [
      { label: "Microwave Repairs Completed", value: "1500+ (4 Months Data)" },
      { label: "Common Issue", value: "Maintenance & Heating Problems" },
      { label: "Same Day Repair Rate", value: "90%" },
      { label: "Response Time", value: "60 Minutes" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Inspection Charge", value: "₹249" },
    ],
    quickFacts: [
      "1500+ (4 Months Data) Microwave Repairs Completed",
      "Common Issue: Heating Failure",
      "All major brands serviced",
    ],
  },
  "water-dispenser": {
    stats: [
      { label: "Water Dispenser Repairs", value: "2000+ (4 Months Data)" },
      { label: "Common Issue", value: "Regular Maintenance" },
      { label: "Recommended Maintenance", value: "Every 3 Months" },
      { label: "Same Day Resolution", value: "90%" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Inspection Fee", value: "₹249" },
    ],
    quickFacts: [
      "2000+ (4 Months Data) Water Dispenser Repairs Completed",
      "Common Issue: Cooling & Water Leakage",
      "Commercial & Residential expertise",
    ],
  },
  "deep-freezer": {
    stats: [
      { label: "Deep Freezer Repairs", value: "500+ (4 Months Data)" },
      { label: "Common Issue", value: "Cooling Maintenance" },
      { label: "Same Day Resolution", value: "90%" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Inspection Charge", value: "₹249" },
      { label: "Response Time", value: "Within 60 Minutes" },
    ],
    quickFacts: [
      "500+ (4 Months Data) Deep Freezer Repairs Completed",
      "Most Common Issue: Cooling Problems",
      "Commercial & Domestic Deep Freezer Expertise",
    ],
  },
  geyser: {
    stats: [
      { label: "Appliance Repairs Completed", value: "10000+ (4 Months Data)" },
      { label: "Common Issue", value: "Maintenance & Heating Issues" },
      { label: "Technician Experience", value: "10+ Years" },
      { label: "Same Day Repair Rate", value: "90%" },
      { label: "Inspection Charge", value: "₹249" },
      { label: "Average Response Time", value: "60 Minutes" },
    ],
    quickFacts: [
      "Hundreds of Geyser Repairs Completed",
      "Most Common Issue: Heating Problems",
      "Electric & Instant Geyser Expertise",
    ],
  },
};

export const homepageStats = {
  stats: [
    { label: "Total Repairs Completed", value: "10000+ (4 Months Data)" },
    { label: "AC Repairs Completed", value: "3000+ (4 Months Data)" },
    { label: "Refrigerator Repairs Completed", value: "2000+ (4 Months Data)" },
    { label: "Water Dispenser Repairs", value: "2000+ (4 Months Data)" },
    { label: "Microwave Repairs", value: "1500+ (4 Months Data)" },
    { label: "RO Repairs", value: "1000+ (4 Months Data)" },
    { label: "Deep Freezer Repairs", value: "500+ (4 Months Data)" },
    { label: "Average Technician Experience", value: "10+ Years" },
    { label: "Combined Team Experience", value: "50+ Years" },
    { label: "Average Response Time", value: "Within 60 Minutes" },
    { label: "Same Day Resolution Rate", value: "90%" },
    { label: "Repeat Customer Rate", value: "20-30%" },
    { label: "Inspection Charges", value: "Starting ₹249" },
    { label: "Average Repair Cost", value: "₹1000" },
    { label: "Maintenance Frequency Recommended", value: "Every 3 Months" },
    { label: "Service Coverage", value: "Across Gurgaon" },
  ],
};

export const aboutStats = {
  stats: [
    { label: "Years of Combined Experience", value: "50+ Years" },
    { label: "Experienced Technicians", value: "10+ Years Average" },
    { label: "Home Appliance Repairs Completed", value: "10,000+ (4 Months Data)" },
    { label: "Same Day Service Success Rate", value: "90%" },
    { label: "Customer Repeat Rate", value: "20-30%" },
    { label: "Average Arrival Time", value: "60 Minutes" },
    { label: "Areas Covered", value: "Entire Gurgaon" },
    { label: "Safety Protocols Followed", value: "Every Visit, Every Time" },
    { label: "Inspection Charge", value: "₹249" },
  ],
};

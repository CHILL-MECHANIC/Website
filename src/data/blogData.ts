export interface Article {
  id: number;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  fullArticle: string;
  seoDescription: string;
  keywords: string;
  publishedDate: string;
  updatedDate?: string;
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    title: 'AC Not Cooling? 10 Common Causes & Solutions',
    category: 'AC Tips',
    readTime: '6 min read',
    excerpt:
      "Is your AC running but not cooling? Here are 10 common causes and fixes every Gurgaon homeowner should know — from dirty filters and low refrigerant gas to faulty compressors and thermostat issues.",
    fullArticle:
      'Start with the basics: clean AC filters, check thermostat settings, and inspect airflow around indoor and outdoor units. If cooling is still weak, the issue can be low refrigerant, a blocked condenser coil, sensor failure, or compressor inefficiency. In Gurgaon heat, delayed servicing quickly worsens these issues and increases electricity bills. Book a diagnostic if your AC runs continuously without reaching set temperature.',
    seoDescription: 'AC not cooling? Learn 10 common causes including dirty filters, low refrigerant, and compressor issues. Expert fixes for Gurgaon homeowners from Chill Mechanic.',
    keywords: 'AC not cooling, AC repair, air conditioner troubleshooting, Gurgaon',
    publishedDate: '2026-03-15',
    updatedDate: '2026-05-24',
  },
  {
    id: 2,
    title: 'How Often Should You Service Your AC in Gurgaon?',
    category: 'AC Tips',
    readTime: '5 min read',
    excerpt:
      "Gurgaon's extreme heat and dusty environment demand regular AC maintenance. Experts recommend servicing every 3–4 months. Learn why skipping service costs more in the long run.",
    fullArticle:
      'For Gurgaon households, servicing every 3–4 months is ideal. Peak summer usage causes faster dust buildup, drain blockages, and reduced cooling efficiency. A preventive schedule keeps your AC efficient, lowers power consumption, and reduces emergency repairs. Foam service every 6 months plus regular filter cleaning is a practical combination for most homes.',
    seoDescription: 'AC service schedule for Gurgaon: How often to service your air conditioner. Maintenance tips, seasonal schedule, and cost-saving strategies.',
    keywords: 'AC service frequency, air conditioner maintenance, Gurgaon AC service schedule',
    publishedDate: '2026-03-20',
  },
  {
    id: 3,
    title: 'Refrigerator Not Cooling: DIY Fixes vs Professional Help',
    category: 'Refrigerator',
    readTime: '7 min read',
    excerpt:
      "Some fridge problems are easy to fix yourself — like cleaning condenser coils. Others, such as compressor issues, require a trained technician. Here's how to tell the difference.",
    fullArticle:
      'DIY checks include thermostat setting, door seal condition, condenser coil dust, and ventilation space around the unit. If you hear repeated clicking, observe uneven cooling, or notice compressor overheating, professional diagnosis is needed. Compressor, relay, and refrigerant work should always be handled by certified technicians to avoid safety and warranty issues.',
    seoDescription: 'Refrigerator not cooling? Learn which repairs you can DIY and which need professional help. Complete troubleshooting guide from Chill Mechanic.',
    keywords: 'refrigerator not cooling, fridge repair, DIY refrigerator fixes, cooling issues',
    publishedDate: '2026-04-01',
  },
  {
    id: 4,
    title: 'RO Water Purifier Maintenance: Complete Guide',
    category: 'RO & Water',
    readTime: '8 min read',
    excerpt:
      "Your RO purifier needs regular filter changes to keep water safe. Sediment filter every 6 months, carbon filter every 6–8 months, and membrane every 12–18 months based on water quality.",
    fullArticle:
      'A good RO maintenance cycle: sediment filter every 6 months, carbon filter every 6–8 months, and membrane around 12–18 months based on TDS and usage. Also sanitize the tank and check for pressure drops and leaks during service. Poor taste, low flow, and bad odor are common signs that at least one filter stage is overdue for replacement.',
    seoDescription: 'RO water purifier maintenance guide: Filter replacement schedule, TDS levels, and when to service. Keep your water safe with proper maintenance.',
    keywords: 'RO maintenance, water purifier service, filter replacement, RO purifier care',
    publishedDate: '2026-04-05',
  },
  {
    id: 5,
    title: "Washing Machine Making Noise? Here's What to Do",
    category: 'Washing Machine',
    readTime: '6 min read',
    excerpt:
      "Loud banging, grinding, or squealing? These sounds often point to worn bearings, loose drums, foreign objects, or motor issues. Identify the noise type and know when to call a professional.",
    fullArticle:
      'Banging often indicates unbalanced load or suspension wear, grinding can mean bearing damage, and squealing usually points to belt or motor stress. First pause the cycle, rebalance clothes, and inspect for trapped objects. Persistent noise across cycles needs a technician inspection to prevent drum or motor damage and costly replacements.',
    seoDescription: 'Washing machine noise? Learn what different sounds mean and how to fix them. Expert diagnosis for banging, grinding, and squealing noises.',
    keywords: 'washing machine noise, loud washing machine, washing machine repair, noise diagnosis',
    publishedDate: '2026-04-10',
  },
  {
    id: 6,
    title: 'AC Service Cost in Gurgaon: 2026 Price Guide',
    category: 'AC Tips',
    readTime: '5 min read',
    excerpt:
      "Power jet cleaning starts at ₹499, foam jet at ₹599, and gas refilling at ₹1,999. Get a full breakdown of AC service costs in Gurgaon and tips to get the best value.",
    fullArticle:
      'Typical pricing in Gurgaon: power jet service from ₹499, foam service from ₹599, issue diagnostics from ₹249, and gas refill around ₹1,999 depending on tonnage and leakage condition. Always ask what is included: coil cleaning depth, drain line cleaning, electrical checks, and post-service cooling validation. Upfront estimates avoid hidden charges later.',
    seoDescription: 'AC service cost in Gurgaon 2026: Prices for cleaning, gas refill, repairs. Get transparent pricing and find the best value for your air conditioner.',
    keywords: 'AC service cost Gurgaon, air conditioner price, service charges, AC maintenance cost',
    publishedDate: '2026-04-15',
  },
  {
    id: 7,
    title: 'Signs Your Refrigerator Needs Immediate Repair',
    category: 'Refrigerator',
    readTime: '4 min read',
    excerpt:
      "Unusual warm spots, constant running, frost buildup inside, water pooling underneath — these warning signs mean your fridge needs professional attention before a full breakdown.",
    fullArticle:
      'Watch for frequent compressor cycling, melted freezer items, unusual rear-panel heat, and water leakage. These symptoms often indicate airflow issues, sensor faults, or sealed system problems. Early service prevents food spoilage and compressor failure. If your unit runs all day with weak cooling, schedule immediate inspection.',
    seoDescription: 'Refrigerator repair signs: When your fridge needs professional help. Warning symptoms that indicate urgent repair requirements.',
    keywords: 'refrigerator repair signs, fridge problems, cooling issues, emergency repair',
    publishedDate: '2026-04-20',
  },
  {
    id: 8,
    title: 'Geyser Not Heating? Common Problems & Solutions',
    category: 'Geyser',
    readTime: '4 min read',
    excerpt:
      "Faulty heating elements, thermostat failures, and sediment buildup are the most common geyser issues. Learn when a quick fix works and when you need a replacement.",
    fullArticle:
      'If your geyser is not heating, check power supply and MCB first. Common failures include burned heating element, thermostat malfunction, and tank sediment reducing heat transfer. Minor thermostat or connection issues can be repaired quickly, but old, corroded tanks often justify replacement. Regular descaling extends geyser life and heating performance.',
    seoDescription: 'Geyser not heating? Troubleshoot common problems like heating element failure and thermostat issues. Professional geyser repair solutions.',
    keywords: 'geyser repair, water heater not working, geyser troubleshooting, heating element',
    publishedDate: '2026-05-01',
  },
  {
    id: 9,
    title: 'How to Choose the Best AC Repair Service in Gurgaon',
    category: 'AC Tips',
    readTime: '6 min read',
    excerpt:
      "Look for certified technicians, transparent pricing, warranty on repairs, and genuine parts. Avoid services that give quotes without inspection or charge hidden fees.",
    fullArticle:
      'Choose services that offer technician verification, diagnostic-first pricing, proper invoices, and repair warranty. Ask whether genuine parts are used and if post-repair performance checks are included. Strong local support and quick callback times matter in summer. Online reviews are helpful, but transparent scope and warranty terms are the real trust indicators.',
    seoDescription: 'How to choose an AC repair service: Tips for finding certified technicians, transparent pricing, and warranty guarantees in Gurgaon.',
    keywords: 'AC repair service, technician selection, repair warranty, air conditioner service',
    publishedDate: '2026-05-05',
  },
  {
    id: 10,
    title: 'Microwave Repair vs Replacement: Making the Right Choice',
    category: 'Microwave',
    readTime: '5 min read',
    excerpt:
      "If your microwave is under 5 years old and the repair cost is below 40% of a new unit, repair is usually the smarter choice. Here's a complete decision framework.",
    fullArticle:
      'A practical rule: repair when the microwave is under 5 years old and repair cost is below 40% of replacement value. Replace when repeated faults occur, cavity rust is severe, or spare parts are obsolete. Safety checks are essential with high-voltage components like capacitor and magnetron, so always use qualified technicians for diagnosis.',
    seoDescription: 'Microwave repair vs replacement: Decision guide to save money. When to repair and when to replace your microwave.',
    keywords: 'microwave repair, microwave replacement, repair cost, microwave maintenance',
    publishedDate: '2026-05-10',
  },
];

export const categoryColor: Record<string, string> = {
  'AC Tips': 'bg-primary/10 text-primary',
  Refrigerator: 'bg-green-100 text-green-700',
  'RO & Water': 'bg-sky-100 text-sky-700',
  'Washing Machine': 'bg-orange-100 text-orange-700',
  Geyser: 'bg-red-100 text-red-700',
  Microwave: 'bg-purple-100 text-purple-700',
};

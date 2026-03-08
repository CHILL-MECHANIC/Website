export default function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Chill Mechanic',
    image: 'https://chillmechanic.com/logo.png',
    telephone: '+919211970030',
    email: 'support@chillmechanic.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Gurgaon',
      addressRegion: 'Haryana',
      addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 28.4595, longitude: 77.0266 },
    url: 'https://chillmechanic.com',
    openingHours: 'Mo-Su 08:00-20:00',
    priceRange: '₹₹',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '500',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

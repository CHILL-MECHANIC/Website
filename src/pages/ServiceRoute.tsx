import { useParams, Navigate } from "react-router-dom";
import ServiceDetail from "./ServiceDetail";
import ServiceItemDetail from "./ServiceItemDetail";

// Service category pages live at /services/<type>/<city>. The same two-segment
// slot also serves service-item detail pages (/services/<type>/<item-id>), so the
// second segment decides which page renders. Cities are a fixed allowlist; item
// ids never collide with them (they look like "ac-gas-2ton-topup").
export const SERVICE_CITIES = ["gurgaon"] as const;
export const DEFAULT_CITY = SERVICE_CITIES[0];

export function ServiceCityOrItem() {
  const { serviceId = "" } = useParams();
  return (SERVICE_CITIES as readonly string[]).includes(serviceId)
    ? <ServiceDetail />
    : <ServiceItemDetail />;
}

// Keeps the old /services/<type> URLs working by sending them to the city URL.
export function ServiceTypeRedirect() {
  const { serviceType } = useParams();
  return <Navigate to={`/services/${serviceType}/${DEFAULT_CITY}`} replace />;
}


const imageModules = import.meta.glob("../assets/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// Build a lookup keyed by the filename without its .png extension,
// so the mappings below can reference the human-readable names.
const imagesByName: Record<string, string> = {};
for (const path in imageModules) {
  const filename = path.split("/").pop()?.replace(/\.png$/i, "");
  if (filename) {
    imagesByName[filename] = imageModules[path];
  }
}

const getAssetImageUrl = (filename: string): string | undefined => imagesByName[filename];

// Map service item IDs to their image filenames (without extension)
export const SERVICE_ITEM_IMAGES: Record<string, string[]> = {
  // AC Services
  "ac-foam-1": ["foam jet service"],
  "ac-foam-2": ["foam jet service"],
  "ac-foam-3": ["foam jet service"],
  "ac-foam-4": ["foam jet service"],
  "ac-foam-5": ["foam jet service"],
  "ac-power-jet-1": ["for all power jet services"],
  "ac-power-jet-2": ["for all power jet services"],
  "ac-power-jet-3": ["for all power jet services"],
  "ac-power-jet-4": ["for all power jet services"],
  "ac-not-cooling": ["for ac not cooling issue"],
  "ac-power-issue": ["for ac power issue"],
  "ac-noise-reduction": ["for ac noise reduction"],
  "ac-water-leakage": ["for ac water leakage"],
  "ac-gas-refill": ["ac gas check and refill"],
  "ac-gas-1ton-topup": ["ac gas check and refill"],
  "ac-gas-1ton-full": ["ac gas check and refill"],
  "ac-gas-1.5ton-topup": ["ac gas check and refill"],
  "ac-gas-1.5ton-full": ["ac gas check and refill"],
  "ac-gas-2ton-topup": ["ac gas check and refill"],
  "ac-gas-2ton-full": ["ac gas check and refill"],
  "ac-split-installation": ["split ac installation"],
  "ac-split-uninstall": ["for split ac uninstallation"],
  "ac-window-installation": ["window ac installation"],
  "ac-window-uninstall": ["window ac uninstallation"],

  // Refrigerator Services
  "fridge-single-door": ["single door"],
  "fridge-double-door": ["Double door"],

  // RO Services
  "ro-checkup": ["Check Up - Water Purifier"],
  "ro-filter-checkup": ["Check Up - Water Purifier Filter"],
  "ro-regular-service": ["Water Purifier Regular Service"],
  "ro-full-service": ["Water Purifier Full Service"],
  "ro-installation": ["Water Purifier Installation"],
  "ro-uninstallation": ["Water Purifier Uninstallation"],

  // Geyser Services
  "geyser-checkup": ["Check Up - Geyser"],
  "geyser-service": ["Geyser Service"],
  "geyser-installation": ["Geyser Installation"],
  "geyser-uninstallation": ["Geyser Uninstallation"],

  // Washing Machine Services
  "wm-top-load-checkup": ["Checkup - Automatic Front Load"],
  "wm-front-load-checkup": ["Checkup - Automatic Front Load"],
  "wm-semi-auto-checkup": ["Check Up - Semi Automatic"],
  "wm-top-load-service": ["Checkup - Automatic Front Load"],
  "wm-top-load-jet": ["Checkup - Automatic Front Load"],
  "wm-front-load-service": ["Checkup - Automatic Front Load"],
  "wm-front-load-jet": ["Checkup - Automatic Front Load"],
  "wm-install-uninstall": ["Installation & Uninstallation"],

  // Microwave Services
  "microwave-checkup": ["Check Up microwave"],

  // Water Dispenser Services
  "wd-checkup": ["Check Up - Water Purifier"],

  // Deep Freezer Services
  "df-checkup": ["Check Up - Deep Freezer"],
};

// Map main service categories to their primary image filenames
export const SERVICE_CATEGORY_IMAGES: Record<string, string[]> = {
  ac: ["foam jet service", "for all power jet services"],
  refrigerator: ["Double door", "single door"],
  ro: ["Check Up - Water Purifier", "Water Purifier Regular Service"],
  geyser: ["Geyser Service", "Check Up - Geyser"],
  "washing-machine": ["Checkup - Automatic Front Load", "Check Up - Semi Automatic"],
  microwave: ["Check Up microwave"],
  "water-dispenser": ["Check Up - Water Purifier"],
  "deep-freezer": ["Check Up - Deep Freezer"],
};

// Get image URLs for a service item
export const getServiceItemImages = (serviceItemId: string, fallbackImages?: string[]): string[] => {
  const imageFilenames = SERVICE_ITEM_IMAGES[serviceItemId];

  if (!imageFilenames) {
    return fallbackImages || [];
  }

  const urls = imageFilenames
    .map(getAssetImageUrl)
    .filter((url): url is string => Boolean(url));

  return urls.length > 0 ? urls : fallbackImages || [];
};

// Get image URLs for a service category
export const getServiceCategoryImages = (serviceCategory: string, fallbackImages?: string[]): string[] => {
  const imageFilenames = SERVICE_CATEGORY_IMAGES[serviceCategory];

  if (!imageFilenames) {
    return fallbackImages || [];
  }

  const urls = imageFilenames
    .map(getAssetImageUrl)
    .filter((url): url is string => Boolean(url));

  return urls.length > 0 ? urls : fallbackImages || [];
};

// Get first image for a service item (useful for card displays)
export const getServiceItemPrimaryImage = (serviceItemId: string, fallbackImage?: string): string => {
  const images = getServiceItemImages(serviceItemId);
  return images[0] || fallbackImage || "";
};

// Get first image for a service category
export const getServiceCategoryPrimaryImage = (serviceCategory: string, fallbackImage?: string): string => {
  const images = getServiceCategoryImages(serviceCategory);
  return images[0] || fallbackImage || "";
};

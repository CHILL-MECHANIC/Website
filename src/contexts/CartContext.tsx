import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { couponDiscount, getCoupon } from "@/data/coupons";
import { BUNDLE_ITEMS, bundleSaving, computeBundleSavings, getBundle } from "@/data/bundles";

interface ServiceOption {
  id: string;
  name: string;
  description: string[];
  price: number;
}

interface CartItem extends ServiceOption {
  quantity: number;
  bundleId?: string;       // set when the line was added as part of a bundle
  bundleDiscount?: number; // that bundle's total saving, kept for reference. The server recomputes it.
}

export interface BundleSaving { bundleId: string; title: string; amount: number }

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (services: ServiceOption[]) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  addBundle: (bundleId: string) => void;
  getBundleSavings: () => BundleSaving[];
  couponCode: string;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  getCouponDiscount: () => number;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'chill_mechanic_cart';
const COUPON_STORAGE_KEY = 'chill_mechanic_coupon';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    try { return getCoupon(localStorage.getItem(COUPON_STORAGE_KEY))?.code ?? ''; } catch { return ''; }
  });

  useEffect(() => {
    try { localStorage.setItem(COUPON_STORAGE_KEY, couponCode); } catch { /* ignore */ }
  }, [couponCode]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
      // Silently fail - cart will remain in memory for current session
    }
  }, [cartItems]);

  const addToCart = (services: ServiceOption[]) => {
    setCartItems(prevItems => {
      const newItems = [...prevItems];

      services.forEach(service => {
        const existingIndex = newItems.findIndex(item => item.id === service.id);

        if (existingIndex >= 0) {
          newItems[existingIndex].quantity += 1;
        } else {
          newItems.push({ ...service, quantity: 1 });
        }
      });

      return newItems;
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== serviceId));
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === serviceId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCouponCode('');
  };

  // Adds both items of a bundle. An item already in the cart keeps its quantity and is tagged with the bundle.
  const addBundle = (bundleId: string) => {
    const bundle = getBundle(bundleId);
    if (!bundle) return;
    const discount = bundleSaving(bundle);
    setCartItems(prev => {
      const next = [...prev];
      bundle.itemIds.forEach(id => {
        const tag = { bundleId, bundleDiscount: discount };
        const i = next.findIndex(item => item.id === id);
        if (i >= 0) next[i] = { ...next[i], ...tag };
        else {
          const { name, description, price } = BUNDLE_ITEMS[id];
          next.push({ id, name, description: [description], price, quantity: 1, ...tag });
        }
      });
      return next;
    });
  };

  const getBundleSavings = () => computeBundleSavings(cartItems);

  const getCartSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const afterBundles = () => getCartSubtotal() - getBundleSavings().reduce((sum, b) => sum + b.amount, 0);

  // Returns false for an unknown code. The server checks the code again when the booking is created.
  const applyCoupon = (code: string) => {
    const c = getCoupon(code);
    if (c) setCouponCode(c.code);
    return !!c;
  };
  const removeCoupon = () => setCouponCode('');
  const getCouponDiscount = () => couponDiscount(couponCode, afterBundles());

  // What the customer pays: items minus bundle savings minus coupon.
  const getCartTotal = () => afterBundles() - getCouponDiscount();

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      addBundle,
      couponCode,
      applyCoupon,
      removeCoupon,
      getCouponDiscount,
      getBundleSavings,
      getCartSubtotal,
      getCartTotal,
      getCartItemsCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

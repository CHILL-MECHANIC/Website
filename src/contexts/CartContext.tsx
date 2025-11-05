import { createContext, useContext, useState, ReactNode } from "react";

interface ServiceOption {
  id: string;
  name: string;
  description: string[];
  price: number;
}

interface CartItem extends ServiceOption {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (services: ServiceOption[]) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  discountCode: string | null;
  applyDiscount: (code: string) => boolean;
  getDiscountAmount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

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
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const applyDiscount = (code: string): boolean => {
    // Discount codes: percentage-based and fixed amount
    const percentageCodes: Record<string, number> = {
      "SAVE10": 10,
      "SAVE20": 20,
    };
    
    const fixedAmountCodes: Record<string, number> = {
      "WELCOME": 50,
      "FIRST": 100,
    };
    
    const upperCode = code.toUpperCase();
    if (percentageCodes[upperCode] || fixedAmountCodes[upperCode]) {
      setDiscountCode(upperCode);
      return true;
    }
    return false;
  };

  const getDiscountAmount = (): number => {
    if (!discountCode) return 0;
    
    const percentageCodes: Record<string, number> = {
      "SAVE10": 10,
      "SAVE20": 20,
    };
    
    const fixedAmountCodes: Record<string, number> = {
      "WELCOME": 50,
      "FIRST": 100,
    };
    
    const subtotal = getCartTotal();
    
    // Check for fixed amount discounts first
    if (fixedAmountCodes[discountCode]) {
      const fixedAmount = fixedAmountCodes[discountCode];
      // Return the fixed amount, but not more than the subtotal
      return Math.min(fixedAmount, subtotal);
    }
    
    // Check for percentage discounts
    if (percentageCodes[discountCode]) {
      const discountPercent = percentageCodes[discountCode];
      return Math.floor((subtotal * discountPercent) / 100);
    }
    
    return 0;
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount,
      discountCode,
      applyDiscount,
      getDiscountAmount,
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

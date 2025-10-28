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
  discountCode: string;
  applyDiscount: (code: string) => boolean;
  getDiscountAmount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState<string>("");

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
    const validCodes = ["AC10", "PREMIUM10", "FIRST50"];
    if (validCodes.includes(code.toUpperCase())) {
      setDiscountCode(code.toUpperCase());
      return true;
    }
    return false;
  };

  const getDiscountAmount = (): number => {
    const subtotal = getCartTotal();
    
    if (discountCode === "AC10") {
      // 10% off on all AC services
      const acServices = cartItems.filter(item => 
        item.name.toLowerCase().includes("ac")
      );
      const acTotal = acServices.reduce((total, item) => total + item.price * item.quantity, 0);
      return Math.floor(acTotal * 0.1);
    }
    
    if (discountCode === "PREMIUM10" && subtotal >= 1000) {
      // 10% off on orders above 1000
      return Math.floor(subtotal * 0.1);
    }
    
    if (discountCode === "FIRST50") {
      // 50 rupees flat discount
      return 50;
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
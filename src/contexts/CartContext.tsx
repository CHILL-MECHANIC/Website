import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'chill_mechanic_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

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
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

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

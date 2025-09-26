import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function Cart() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartItemsCount 
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header cartItemsCount={getCartItemsCount()} />
        
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some services to get started with your booking.
            </p>
            <Button onClick={() => navigate("/")} size="lg">
              Browse Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    // For demo purposes, we'll show a success message
    // In a real app, this would navigate to payment/booking flow
    clearCart();
    navigate("/booking-success");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemsCount={getCartItemsCount()} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              Clear Cart
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {item.description.map((desc, index) => (
                            <div key={index}>{desc}</div>
                          ))}
                        </div>
                        <div className="text-lg font-bold text-primary mt-2">
                          ${item.price}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Item Total */}
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-bold text-primary">${item.price * item.quantity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({getCartItemsCount()} items)</span>
                    <span>${getCartTotal()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Service Tax</span>
                    <span>${(getCartTotal() * 0.18).toFixed(0)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Travel Charges</span>
                    <span>$50</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      ${(getCartTotal() + getCartTotal() * 0.18 + 50).toFixed(0)}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
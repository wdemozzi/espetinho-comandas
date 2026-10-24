import React, { createContext, useContext, useState } from 'react';
import { Product } from '../types/database.types';

export interface CartItem {
  id: string; // unique item id in cart
  product: Product;
  quantity: number;
  selectedAddons: { name: string; price_cents: number }[];
  notes?: string;
  totalCents: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, addons: { name: string; price_cents: number }[], notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalCents: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (
    product: Product,
    quantity: number,
    addons: { name: string; price_cents: number }[],
    notes?: string
  ) => {
    const addonsTotal = addons.reduce((sum, a) => sum + a.price_cents, 0);
    const itemTotalCents = (product.price_cents + addonsTotal) * quantity;

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      product,
      quantity,
      selectedAddons: addons,
      notes,
      totalCents: itemTotalCents,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const addonsTotal = i.selectedAddons.reduce((sum, a) => sum + a.price_cents, 0);
          return {
            ...i,
            quantity,
            totalCents: (i.product.price_cents + addonsTotal) * quantity,
          };
        }
        return i;
      })
    );
  };

  const clearCart = () => setItems([]);

  const totalCents = items.reduce((sum, i) => sum + i.totalCents, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCents,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de CartProvider');
  }
  return context;
};

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ola_cart');
    if (stored) {
      try { setCartItems(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  // Save to local storage whenever cart changes
  useEffect(() => {
    localStorage.setItem('ola_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const closeDrawer = () => setIsDrawerOpen(false);
  const openDrawer = () => setIsDrawerOpen(true);

  const addToCart = (product, quantity, variants = {}) => {
    setCartItems(prev => {
      // Check if exact same product + variants exists
      const existingIdx = prev.findIndex(item => 
        item.product._id === product._id && 
        JSON.stringify(item.variants) === JSON.stringify(variants)
      );

      if (existingIdx >= 0) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += quantity;
        return newCart;
      }
      
      return [...prev, { 
        id: `${product._id}-${Date.now()}`, 
        product, 
        quantity, 
        variants,
        priceAtAddition: product.price 
      }];
    });
    openDrawer();
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId, newQty) => {
    if (newQty < 1) return;
    setCartItems(prev => prev.map(item => 
      item.id === cartItemId ? { ...item, quantity: newQty } : item
    ));
  };

  // NEW: Clear cart after successful checkout
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('ola_cart');
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.priceAtAddition || 0) * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartCount, cartTotal,
      isDrawerOpen, toggleDrawer, closeDrawer, openDrawer,
      addToCart, removeFromCart, updateQuantity, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
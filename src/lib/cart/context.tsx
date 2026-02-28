'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { CartContextValue } from './types'

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const noop = () => {}
  const value: CartContextValue = {
    items: [],
    addItem: noop as any,
    removeItem: noop,
    updateQuantity: noop as any,
    clearCart: noop,
    getItemQuantity: () => 0,
    getSubtotal: () => 0,
    getItemCount: () => 0,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

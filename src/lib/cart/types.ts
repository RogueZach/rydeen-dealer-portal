export interface CartItem {
  productId: string
  sku: string
  name: string
  imageUrl: string | null
  unitPrice: number
  msrp: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
}

export interface CartActions {
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  getSubtotal: () => number
  getItemCount: () => number
}

export type CartContextValue = CartState & CartActions

import { describe, it, expect } from 'vitest'
import { cartReducer } from '../reducer'
import type { CartItem } from '../types'

const mockItem: CartItem = {
  productId: 'p1',
  sku: 'TEST-1',
  name: 'Test Product',
  imageUrl: null,
  unitPrice: 100,
  msrp: 150,
  quantity: 1,
}

describe('cartReducer', () => {
  it('adds an item to empty cart', () => {
    const state = cartReducer({ items: [] }, { type: 'ADD_ITEM', item: mockItem })
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(1)
  })

  it('increments quantity when adding existing item', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'ADD_ITEM', item: { ...mockItem, quantity: 2 } }
    )
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(3)
  })

  it('updates quantity of an item', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'UPDATE_QUANTITY', productId: 'p1', quantity: 5 }
    )
    expect(state.items[0].quantity).toBe(5)
  })

  it('removes item when quantity set to 0', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'UPDATE_QUANTITY', productId: 'p1', quantity: 0 }
    )
    expect(state.items).toHaveLength(0)
  })

  it('removes a specific item', () => {
    const state = cartReducer(
      { items: [mockItem, { ...mockItem, productId: 'p2', sku: 'TEST-2' }] },
      { type: 'REMOVE_ITEM', productId: 'p1' }
    )
    expect(state.items).toHaveLength(1)
    expect(state.items[0].productId).toBe('p2')
  })

  it('clears all items', () => {
    const state = cartReducer(
      { items: [mockItem] },
      { type: 'CLEAR_CART' }
    )
    expect(state.items).toHaveLength(0)
  })
})

// contexts/CartContext.tsx - Cart context for managing shopping cart state

'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface CartItem {
  id: number
  slug: string
  title: string
  title_ar?: string
  tokens: number
  price_gbp: number
  image?: string
}

interface CartContextValue {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (slug: string) => void
  clearCart: () => void
  getCartTotal: (currency?: string) => { tokens: number; price: number }
  itemCount: number
  /** False until the cart has been restored from localStorage on the client. */
  isHydrated: boolean
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const CART_STORAGE_KEY = 'avenqor_cart'

// Token packs and custom top-ups are card-only and are paid for directly via the
// hosted payment session — they must never enter the cart. Only courses do.
export function isCartableSlug(slug: string): boolean {
  return !slug.startsWith('token-pack-') && !slug.startsWith('custom-top-up')
}

// Load cart from localStorage
function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as CartItem[]
      // Drop any legacy token-pack / top-up entries left over in storage
      return Array.isArray(parsed) ? parsed.filter((item) => isCartableSlug(item?.slug ?? '')) : []
    }
  } catch (error) {
    console.error('Failed to load cart from storage:', error)
  }

  return []
}

// Save cart to localStorage
function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save cart to storage:', error)
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // Load cart from storage on mount. Child effects run before this one, so items
  // added during that first pass must be merged in rather than overwritten.
  useEffect(() => {
    const loadedItems = loadCartFromStorage()
    setItems((prevItems) => {
      const merged = [...loadedItems]
      prevItems.forEach((item) => {
        if (!merged.some((existing) => existing.slug === item.slug)) merged.push(item)
      })
      return merged
    })
    setIsMounted(true)
  }, [])

  // Save cart to storage whenever items change
  useEffect(() => {
    if (isMounted) {
      saveCartToStorage(items)
    }
  }, [items, isMounted])

  const addToCart = useCallback((item: CartItem) => {
    if (!isCartableSlug(item.slug)) {
      console.warn('[Cart] Token purchases are card-only and cannot be added to the cart:', item.slug)
      return
    }

    setItems((prevItems) => {
      // Check if item already exists in cart
      const existingIndex = prevItems.findIndex((i) => i.slug === item.slug)
      
      if (existingIndex >= 0) {
        // Item already in cart, don't add duplicate
        return prevItems
      }
      
      // Add new item
      return [...prevItems, item]
    })
  }, [])

  const removeFromCart = useCallback((slug: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.slug !== slug))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const getCartTotal = useCallback((currency: string = 'GBP') => {
    const tokens = items.reduce((sum, item) => sum + item.tokens, 0)
    
    // Calculate price based on tokens (1.00 GBP = 100 tokens)
    // For other currencies, we'll use the price_gbp and convert
    // For simplicity, using price_gbp * items.length (assuming each course has same base price)
    // In production, you'd want proper currency conversion
    const price = items.reduce((sum, item) => sum + item.price_gbp, 0)
    
    return { tokens, price }
  }, [items])

  const itemCount = items.length

  const value: CartContextValue = {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    itemCount,
    isHydrated: isMounted,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}


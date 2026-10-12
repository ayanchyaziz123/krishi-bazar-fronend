import { useEffect, useState } from 'react'
import axios from 'axios'
import {
    Wheat, Leaf, CookingPot, Bean, Citrus, Coffee, Palette, Tag, Apple, Milk, Egg, Fish, Cookie, Gift,
} from 'lucide-react'

// Icons an admin can pick for a category. The key is what the server stores.
export const CATEGORY_ICONS = {
    tag: Tag, wheat: Wheat, leaf: Leaf, pot: CookingPot, bean: Bean, citrus: Citrus, coffee: Coffee,
    palette: Palette, apple: Apple, milk: Milk, egg: Egg, fish: Fish, cookie: Cookie, gift: Gift,
}

const TINTS = [
    'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700', 'bg-lime-100 text-lime-700', 'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700',
]

// Shape used by every screen: the keyword is matched against product categories.
const toItem = (c, i) => ({
    id: c.id,
    keyword: c.keyword,
    label: c.name,
    iconKey: c.icon,
    icon: CATEGORY_ICONS[c.icon] || Tag,
    tint: TINTS[i % TINTS.length],
    productCount: c.product_count,
})

// Shown until the server answers, and if it can't be reached.
const STARTER = [
    { name: 'Rice', keyword: 'rice', icon: 'wheat' },
    { name: 'Spices', keyword: 'spices', icon: 'leaf' },
    { name: 'Pickles', keyword: 'pickle', icon: 'pot' },
    { name: 'Dry Goods', keyword: 'dry goods', icon: 'bean' },
    { name: 'Fresh Fruit', keyword: 'fresh fruit', icon: 'citrus' },
    { name: 'Tea', keyword: 'tea', icon: 'coffee' },
    { name: 'Handicraft', keyword: 'handicraft', icon: 'palette' },
].map(toItem)

// One shared copy, so every screen updates together after an admin changes a category.
let cache = null
let pending = null
const listeners = new Set()

export function loadCategories(config) {
    pending = axios.get('/api/categories/', config)
        .then(({ data }) => {
            cache = data.map(toItem)
            listeners.forEach((fn) => fn(cache))
            return cache
        })
        .catch(() => cache || STARTER)
        .finally(() => { pending = null })
    return pending
}

export function useCategories() {
    const [items, setItems] = useState(cache || STARTER)
    useEffect(() => {
        listeners.add(setItems)
        if (!cache && !pending) loadCategories()
        return () => listeners.delete(setItems)
    }, [])
    return items
}

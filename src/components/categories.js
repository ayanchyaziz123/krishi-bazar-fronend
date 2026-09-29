import { Wheat, Leaf, CookingPot, Bean, Citrus, Coffee, Palette } from 'lucide-react'

// Product categories. The keyword is matched against product names and categories by the backend.
const categories = [
    { keyword: 'rice', label: 'Rice', icon: Wheat, tint: 'bg-amber-100 text-amber-700' },
    { keyword: 'spices', label: 'Spices', icon: Leaf, tint: 'bg-emerald-100 text-emerald-700' },
    { keyword: 'pickle', label: 'Pickles', icon: CookingPot, tint: 'bg-orange-100 text-orange-700' },
    { keyword: 'dry goods', label: 'Dry Goods', icon: Bean, tint: 'bg-rose-100 text-rose-700' },
    { keyword: 'fresh fruit', label: 'Fresh Fruit', icon: Citrus, tint: 'bg-lime-100 text-lime-700' },
    { keyword: 'tea', label: 'Tea', icon: Coffee, tint: 'bg-green-100 text-green-800' },
    { keyword: 'handicraft', label: 'Handicraft', icon: Palette, tint: 'bg-yellow-100 text-yellow-800' },
]

export default categories

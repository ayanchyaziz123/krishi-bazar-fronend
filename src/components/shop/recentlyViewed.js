// Products this visitor looked at recently, kept on this device only.
const KEY = 'recentlyViewed'
const MAX = 12

export function getRecentlyViewed() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch (e) { return [] }
}

export function rememberViewed(product) {
    if (!product || !product._id) return
    const entry = {
        _id: product._id, name: product.name, image: product.image, price: product.price,
        is_offer: product.is_offer, offer_percentage: product.offer_percentage, countInStock: product.countInStock,
    }
    const list = [entry, ...getRecentlyViewed().filter((p) => p._id !== product._id)].slice(0, MAX)
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch (e) { /* storage blocked */ }
}

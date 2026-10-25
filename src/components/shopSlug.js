// Which shop the public site shows. Every shop on the platform shares this site; the shop
// comes from the web address (?shop=gbi before the #), and without one it's the platform's
// first shop. The server checks the shop exists and only shows that shop's data.

export function shopSlug() {
    try {
        return (new URLSearchParams(window.location.search).get('shop') || '').trim().toLowerCase().slice(0, 60)
    } catch (e) {
        return ''
    }
}

// The shop's own web address, e.g. https://example.com/?shop=gbi#/
export function shopUrl(slug, path = '/') {
    const base = window.location.origin + window.location.pathname
    return `${base}${slug ? `?shop=${encodeURIComponent(slug)}` : ''}#${path}`
}

// A cart, coupon and checkout address belong to one shop. When the visitor arrives at a
// different shop, start them with an empty cart. Runs once, before the store is created.
export function resetCartIfShopChanged() {
    try {
        const slug = shopSlug()
        if ((localStorage.getItem('cartShop') || '') === slug) return
        localStorage.removeItem('cartItems')
        localStorage.removeItem('recentlyViewed')
        sessionStorage.removeItem('checkoutAddress')
        sessionStorage.removeItem('checkoutCoupon')
        localStorage.setItem('cartShop', slug)
    } catch (e) { /* storage blocked */ }
}

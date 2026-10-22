// Checkout choices kept between the three checkout steps, and the order totals the
// server will charge (the server works them out again; these are only shown).

const DELIVERY_KEY = 'deliveryMethod'

export function getDeliveryMethod() {
    try { return localStorage.getItem(DELIVERY_KEY) === 'pickup' ? 'pickup' : 'deliver' } catch (e) { return 'deliver' }
}

export function setDeliveryMethod(method) {
    try { localStorage.setItem(DELIVERY_KEY, method === 'pickup' ? 'pickup' : 'deliver') } catch (e) { /* storage blocked */ }
}

export const unitPrice = (item) => (item.offer_percentage
    ? Number((item.price - (item.price * item.offer_percentage) / 100).toFixed(2))
    : Number(item.price))

const round = (n) => Math.round(n * 100) / 100

// The shop's delivery rules as numbers (from the store settings).
import { gstFor, gstOf } from './gst'

export function shippingRules(store) {
    const s = (store && store.shipping) || {}
    const num = (v, d) => (v === null || v === undefined || v === '' ? d : Number(v))
    return {
        deliveryEnabled: s.delivery_enabled !== false,
        pickupEnabled: s.pickup_enabled !== false,
        fee: num(s.delivery_fee, 10),
        freeOver: s.free_delivery_over === null ? null : num(s.free_delivery_over, 100),
        minOrder: num(s.min_order, 0),
        taxRate: num(s.tax_rate, 5),
        deliveryTime: s.delivery_time || '',
        pickupTime: s.pickup_time || '',
        pincodes: (s.delivery_pincodes || '').split(/[\s,;]+/).filter(Boolean),
        gst: gstOf(store),
    }
}

// Whether the shop delivers to a PIN code (same rule as the server). No list: everywhere.
export function deliversTo(rules, pincode) {
    if (!rules.pincodes.length) return true
    const pin = String(pincode || '').trim()
    return rules.pincodes.some((p) => (p.endsWith('*') ? pin.startsWith(p.slice(0, -1)) : pin === p))
}

// Same rules as base/pricing.py: no delivery charge for pick-up or over the shop's free
// limit, and the shop's tax rate. `rules` comes from shippingRules(store).
export function cartTotals(cartItems, { pickup = false, discount = 0, rules = shippingRules(null) } = {}) {
    const items = round(cartItems.reduce((sum, i) => sum + unitPrice(i) * i.qty, 0))
    const full = round(cartItems.reduce((sum, i) => sum + Number(i.price) * i.qty, 0))
    const free = pickup || (rules.freeOver !== null && items > rules.freeOver)
    const shipping = free ? 0 : rules.fee
    // Registered shops charge GST per item (composition: none); others the flat online tax.
    const gst = rules.gst || { mode: 'none' }
    let tax = gst.mode === 'none' ? round((items * rules.taxRate) / 100) : 0
    let addedTax = tax
    if (gst.mode === 'regular') {
        const lines = cartItems.map((i) => [round(unitPrice(i) * i.qty), Number(i.gst_rate) || 0])
        const result = gstFor(lines, Math.min(Number(discount) || 0, items), gst.prices_include_gst)
        tax = result.tax
        addedTax = result.added
    }
    const coupon = Math.min(Number(discount) || 0, items + shipping + addedTax)
    return {
        items, shipping, tax, coupon, taxIncluded: gst.mode === 'regular' && gst.prices_include_gst, gstMode: gst.mode,
        total: round(items + shipping + addedTax - coupon),
        saved: round(full - items + coupon),
        count: itemCount(cartItems),
    }
}


// A coupon checked on the summary step, used when the order is placed.
const COUPON_KEY = 'checkoutCoupon'

export function getCheckoutCoupon() {
    try { return JSON.parse(sessionStorage.getItem(COUPON_KEY) || 'null') } catch (e) { return null }
}

export function setCheckoutCoupon(coupon) {
    try {
        if (coupon) sessionStorage.setItem(COUPON_KEY, JSON.stringify(coupon))
        else sessionStorage.removeItem(COUPON_KEY)
    } catch (e) { /* storage blocked */ }
}

// The saved address chosen for delivery, and the note for the delivery person.
export function getCheckoutAddress() {
    try { return JSON.parse(sessionStorage.getItem('checkoutAddress') || 'null') } catch (e) { return null }
}
export function setCheckoutAddress(address) {
    try { address ? sessionStorage.setItem('checkoutAddress', JSON.stringify(address)) : sessionStorage.removeItem('checkoutAddress') } catch (e) { /* blocked */ }
}
export function getDeliveryNote() {
    try { return sessionStorage.getItem('deliveryNote') || '' } catch (e) { return '' }
}
export function setDeliveryNote(note) {
    try { sessionStorage.setItem('deliveryNote', note || '') } catch (e) { /* blocked */ }
}

// Loose items are bought in steps of 0.5 (kg), everything else one at a time.
export const qtyStep = (item) => (item && item.sold_by_weight ? 0.5 : 1)
// "1.5 kg", or just "2" for things counted in pieces.
export const qtyText = (qty, item) => {
    const n = Number(qty) || 0
    const unit = item && item.unit && item.unit !== 'piece' ? ` ${item.unit}` : ''
    return `${Number.isInteger(n) ? n : n.toFixed(n * 10 % 1 ? 2 : 1)}${item && item.sold_by_weight ? unit || ' kg' : ''}`
}
// How many items are in the cart: 1.5 kg of rice is one item.
export const itemCount = (cartItems) => cartItems.reduce((n, i) => n + (i.sold_by_weight ? 1 : Number(i.qty)), 0)

// One address on one or two lines, the Indian way.
export const addressLines = (a) => [
    [a.line1 || a.address, a.area, a.landmark && `Near ${a.landmark.replace(/^near\s+/i, '')}`].filter(Boolean).join(', '),
    [a.city, a.state, a.pincode || a.postalCode].filter(Boolean).join(', '),
]

// The steps of an order, as the server defines them (base/delivery.py).
export const STATUS_LABELS = {
    placed: 'Placed', confirmed: 'Confirmed', packed: 'Packed', out_for_delivery: 'Out for delivery',
    ready_for_pickup: 'Ready for pick-up', delivered: 'Delivered', cancelled: 'Cancelled',
}
export const statusLabel = (status, pickup) => (status === 'delivered' && pickup ? 'Collected' : STATUS_LABELS[status] || 'Placed')
export const orderFlow = (pickup) => (pickup
    ? ['placed', 'confirmed', 'packed', 'ready_for_pickup', 'delivered']
    : ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'])
export const STATUS_TONES = {
    placed: 'slate', confirmed: 'sky', packed: 'sky', out_for_delivery: 'amber', ready_for_pickup: 'amber', delivered: 'green', cancelled: 'red',
}

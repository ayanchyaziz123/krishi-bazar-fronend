// Staff roles, matching base/roles.py on the server. The server enforces them;
// these rules only decide which pages and menu items each person sees.
export const ROLE_LABELS = { owner: 'Owner', manager: 'Manager', cashier: 'Cashier', stock: 'Stock keeper', orders: 'Online orders' }

export const ROLE_OPTIONS = [
    { value: 'customer', label: 'Customer', hint: 'No access to the admin area.' },
    { value: 'cashier', label: 'Cashier', hint: 'Counter, today’s sales and money owed. No profit or buying prices.' },
    { value: 'stock', label: 'Stock keeper', hint: 'Stock, receiving and suppliers. No sales or customers.' },
    { value: 'orders', label: 'Online orders', hint: 'Website orders: check, mark paid and delivered. Contact messages. No counter, stock or profit.' },
    { value: 'manager', label: 'Manager', hint: 'Everything, including items, prices, reports and staff.' },
]

// The owner can do everything a manager can.
export const isManagerRole = (role) => role === 'owner' || role === 'manager'

// The business this person is working in. Someone on the staff of several businesses
// picks one (saved as `activeBusiness`); otherwise it is their only one.
const savedBusiness = () => {
    try { return localStorage.getItem('activeBusiness') } catch (e) { return null }
}

export function activeBusinessInfo(userInfo) {
    const list = (userInfo && userInfo.businesses) || []
    return list.find((b) => b.slug === savedBusiness()) || list[0] || null
}

export const activeBusiness = (userInfo) => {
    const current = activeBusinessInfo(userInfo)
    return current ? current.slug : null
}

// Whether the person has already picked one of their businesses on this device.
export const hasChosenBusiness = (userInfo) =>
    ((userInfo && userInfo.businesses) || []).some((b) => b.slug === savedBusiness())

export function setActiveBusiness(slug) {
    try { localStorage.setItem('activeBusiness', slug) } catch (e) { /* storage blocked */ }
}

// The person's role in the business they are working in. Older saved logins have no
// business list, only `role` or `isAdmin` (which means manager).
export const roleOf = (userInfo) => {
    if (!userInfo) return null
    if (Array.isArray(userInfo.businesses)) {
        const current = activeBusinessInfo(userInfo)
        return current ? current.role : null
    }
    return userInfo.role || (userInfo.isAdmin ? 'manager' : null)
}

const PAGES = {
    cashier: ['/admin/counter', '/admin/sales'],
    stock: ['/admin/stock', '/admin/receive'],
    orders: ['/admin/orderlist', '/admin/order/', '/admin/contact'],
}

export const canOpen = (role, path) =>
    isManagerRole(role) || (PAGES[role] || []).some((page) => path.startsWith(page))

// Where each role lands after signing in.
const HOME = { cashier: '/admin/counter', stock: '/admin/stock', orders: '/admin/orderlist' }
export const homeFor = (role) => HOME[role] || '/dashboard'

// Managers and online-orders staff handle website orders.
export const handlesOrders = (userInfo) => ['owner', 'manager', 'orders'].includes(roleOf(userInfo))

// Open another business. The page reloads so nothing from the previous business
// (lists, totals, an open form) stays on screen.
export function switchBusiness(userInfo, slug) {
    setActiveBusiness(slug)
    const next = ((userInfo && userInfo.businesses) || []).find((b) => b.slug === slug)
    window.location.hash = '#' + homeFor(next ? next.role : null)
    window.location.reload()
}

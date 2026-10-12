// Staff roles, matching base/roles.py on the server. The server enforces them;
// these rules only decide which pages and menu items each person sees.
export const ROLE_LABELS = { manager: 'Manager', cashier: 'Cashier', stock: 'Stock keeper', orders: 'Online orders' }

export const ROLE_OPTIONS = [
    { value: 'customer', label: 'Customer', hint: 'No access to the admin area.' },
    { value: 'cashier', label: 'Cashier', hint: 'Counter, today’s sales and money owed. No profit or buying prices.' },
    { value: 'stock', label: 'Stock keeper', hint: 'Stock, receiving and suppliers. No sales or customers.' },
    { value: 'orders', label: 'Online orders', hint: 'Website orders: check, mark paid and delivered. Contact messages. No counter, stock or profit.' },
    { value: 'manager', label: 'Manager', hint: 'Everything, including products, prices, reports and staff.' },
]

// Older saved logins have no `role`, only `isAdmin`, which means manager.
export const roleOf = (userInfo) => (userInfo ? userInfo.role || (userInfo.isAdmin ? 'manager' : null) : null)

const PAGES = {
    cashier: ['/admin/counter', '/admin/sales'],
    stock: ['/admin/stock', '/admin/receive'],
    orders: ['/admin/orderlist', '/admin/order/', '/admin/contact'],
}

export const canOpen = (role, path) =>
    role === 'manager' || (PAGES[role] || []).some((page) => path.startsWith(page))

// Where each role lands after signing in.
const HOME = { cashier: '/admin/counter', stock: '/admin/stock', orders: '/admin/orderlist' }
export const homeFor = (role) => HOME[role] || '/dashboard'

// Managers and online-orders staff handle website orders.
export const handlesOrders = (userInfo) => ['manager', 'orders'].includes(roleOf(userInfo))

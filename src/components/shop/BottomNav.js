import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Home, LayoutGrid, MapPin, User, ShoppingCart } from 'lucide-react'
import { cn } from '../ui'
import { itemCount } from './checkout'

// Pages with their own bar at the bottom (buy buttons, checkout) don't show the tabs.
const HIDDEN_ON = ['/product/', '/shipping', '/placeorder', '/payment', '/order/']

export const showsBottomNav = (pathname) => !HIDDEN_ON.some((p) => pathname.startsWith(p))

// The tab bar along the bottom of the shop on phones.
function BottomNav() {
    const { pathname } = useLocation()
    const { userInfo } = useSelector((state) => state.userLogin)
    const count = useSelector((state) => itemCount(state.cart.cartItems))
    if (!showsBottomNav(pathname)) return null

    const tabs = [
        { to: '/', label: 'Home', icon: Home, exact: true },
        { to: '/categories', label: 'Category', icon: LayoutGrid },
        { to: '/stores', label: 'Stores', icon: MapPin },
        { to: userInfo ? '/profile' : '/login', label: 'Account', icon: User, match: ['/profile', '/login', '/register'] },
        { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: count },
    ]

    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Shop">
            <ul className="grid grid-cols-5">
                {tabs.map(({ to, label, icon: Icon, exact, match, badge }) => (
                    <li key={label}>
                        <NavLink to={to} exact={exact}
                            isActive={(m, loc) => (match ? match.some((p) => loc.pathname.startsWith(p)) : Boolean(m))}
                            className="group relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium text-slate-500"
                            activeClassName="is-active !text-brand-600">
                            <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand-600 opacity-0 group-[.is-active]:opacity-100" />
                            <span className="relative">
                                <Icon className="h-6 w-6" strokeWidth={1.75} />
                                {badge > 0 && (
                                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{badge}</span>
                                )}
                            </span>
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

export function BottomNavSpacer() {
    const { pathname } = useLocation()
    return <div className={cn('md:hidden', showsBottomNav(pathname) ? 'h-20' : 'h-0')} />
}

export default BottomNav

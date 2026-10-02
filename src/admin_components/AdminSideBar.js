import React from 'react'
import { useDispatch } from 'react-redux'
import { NavLink, useHistory } from 'react-router-dom'
import {
    LayoutDashboard, Users, Tag, Package, ShoppingCart, Mail, LogOut,
    Store, Boxes, PackagePlus, Receipt,
} from 'lucide-react'
import { logout } from '../actions/userActions'
import { cn } from '../components/ui'

// The physical shop's back office.
const shopLinks = [
    { to: '/admin/counter', label: 'Counter sale', icon: Store },
    { to: '/admin/stock', label: 'Stock', icon: Boxes },
    { to: '/admin/receive', label: 'Receive stock', icon: PackagePlus },
    { to: '/admin/sales', label: 'Sales and reports', icon: Receipt },
]

// The online store.
const storeLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/orderlist', label: 'Online orders', icon: ShoppingCart, also: '/admin/order/' },
    { to: '/admin/productlist', label: 'Products', icon: Package, also: '/admin/product/' },
    { to: '/brand', label: 'Categories', icon: Tag },
    { to: '/admin/userlist', label: 'Users', icon: Users, also: '/admin/user/' },
    { to: '/admin/contact', label: 'Contacts', icon: Mail },
]

// Left navigation for every admin page. `compact` shows icons only, for the counter.
function AdminSideBar({ compact, onNavigate }) {
    const dispatch = useDispatch()
    const history = useHistory()

    const logoutHandler = () => {
        dispatch(logout())
        history.push('/login')
    }

    const renderLink = ({ to, label, icon: Icon, also }) => (
        <NavLink
            key={to}
            to={to}
            title={compact ? label : undefined}
            onClick={onNavigate}
            isActive={(match, location) => Boolean(match) || Boolean(also && location.pathname.startsWith(also))}
            className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900',
                compact ? 'h-10 w-10 justify-center' : 'px-3 py-2'
            )}
            activeClassName="!bg-brand-50 !text-brand-700"
        >
            <Icon className="h-4 w-4 shrink-0" />
            {!compact && label}
        </NavLink>
    )

    const heading = (text, first) => compact
        ? (first ? null : <div className="mx-auto my-2 h-px w-6 bg-slate-200" />)
        : <p className="px-3 pb-1.5 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400 first:pt-1">{text}</p>

    return (
        <nav className={cn('flex h-full flex-col p-3', compact && 'items-center')}>
            {heading('Shop', true)}
            <div className="flex flex-col gap-0.5">{shopLinks.map(renderLink)}</div>
            {heading('Online store')}
            <div className="flex flex-col gap-0.5">{storeLinks.map(renderLink)}</div>
            <div className="mt-auto pt-3">
                <button
                    type="button"
                    onClick={logoutHandler}
                    title={compact ? 'Log out' : undefined}
                    className={cn(
                        'flex items-center gap-3 rounded-xl text-sm font-medium text-rose-600 transition hover:bg-rose-50',
                        compact ? 'h-10 w-10 justify-center' : 'w-full px-3 py-2'
                    )}
                >
                    <LogOut className="h-4 w-4" /> {!compact && 'Log out'}
                </button>
            </div>
        </nav>
    )
}

export default AdminSideBar

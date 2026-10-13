import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useHistory } from 'react-router-dom'
import {
    LayoutDashboard, Users, Tag, Package, ShoppingCart, Mail, LogOut,
    Store, Boxes, PackagePlus, Receipt, UserCog,
} from 'lucide-react'
import { logout } from '../actions/userActions'
import { cn } from '../components/ui'
import { canOpen, roleOf } from './roles'

// Sidebar sections. Products and stock are shared by the shop counter and the online store,
// so they get their own section instead of sitting under either one.
// `short` is the label under the icon in the narrow rail used on the counter.
const sections = [
    {
        title: null,
        links: [{ to: '/dashboard', label: 'Home', short: 'Home', icon: LayoutDashboard }],
    },
    {
        title: 'Shop counter',
        links: [
            { to: '/admin/counter', label: 'Counter sale', short: 'Register', icon: Store },
            { to: '/admin/sales', label: 'Sales and reports', short: 'Sales', icon: Receipt },
        ],
    },
    {
        title: 'Products and stock',
        links: [
            { to: '/admin/productlist', label: 'Products', short: 'Items', icon: Package, also: '/admin/product/' },
            { to: '/brand', label: 'Categories', short: 'Groups', icon: Tag },
            { to: '/admin/stock', label: 'Stock', short: 'Stock', icon: Boxes },
            { to: '/admin/receive', label: 'Receive stock', short: 'Receive', icon: PackagePlus },
        ],
    },
    {
        title: 'Online store',
        links: [
            { to: '/admin/orderlist', label: 'Online orders', short: 'Orders', icon: ShoppingCart, also: '/admin/order/' },
            { to: '/admin/contact', label: 'Contact messages', short: 'Messages', icon: Mail },
        ],
    },
    {
        title: 'Customers and staff',
        links: [
            { to: '/admin/staff', label: 'Staff', short: 'Staff', icon: UserCog },
            { to: '/admin/customers', label: 'Customers', short: 'Customers', icon: Users },
        ],
    },
]

// Dark left navigation for every admin page. `compact` is the narrow icon rail on the counter.
function AdminSideBar({ compact, onNavigate }) {
    const dispatch = useDispatch()
    const history = useHistory()
    const { userInfo } = useSelector((state) => state.userLogin)
    const role = roleOf(userInfo)
    // Each role only sees the pages it can use.
    const visible = sections
        .map((section) => ({ ...section, links: section.links.filter((l) => canOpen(role, l.to)) }))
        .filter((section) => section.links.length > 0)

    const logoutHandler = () => {
        dispatch(logout())
        history.push('/staff')
    }

    const renderLink = ({ to, label, short, icon: Icon, also }) => (
        <NavLink
            key={to}
            to={to}
            title={compact ? label : undefined}
            onClick={onNavigate}
            isActive={(match, location) => Boolean(match) || Boolean(also && location.pathname.startsWith(also))}
            className={cn(
                'group relative flex rounded-lg font-medium text-slate-400 transition hover:bg-white/5 hover:text-white',
                compact ? 'h-14 w-14 flex-col items-center justify-center gap-1 text-[10px]' : 'items-center gap-3 px-3 py-2 text-sm'
            )}
            activeClassName="!bg-white/10 !text-white [&>span.bar]:opacity-100"
        >
            {/* Green bar marking the current page */}
            <span className={cn('bar absolute rounded-full bg-brand-500 opacity-0 transition',
                compact ? '-left-2 top-3 bottom-3 w-1' : '-left-3 top-2 bottom-2 w-1')} />
            <Icon className={cn('shrink-0', compact ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
            {compact ? short : label}
        </NavLink>
    )

    return (
        <nav className={cn('flex h-full flex-col py-3', compact ? 'items-center px-2' : 'px-3')}>
            {visible.map((section, i) => (
                <div key={section.title || 'home'} className={cn(i > 0 && (compact ? 'mt-2 border-t border-white/10 pt-2' : 'mt-5'))}>
                    {section.title && !compact && (
                        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
                    )}
                    <div className="flex flex-col gap-0.5">{section.links.map(renderLink)}</div>
                </div>
            ))}
            <div className={cn('mt-auto pt-3', !compact && 'border-t border-white/10')}>
                <button
                    type="button"
                    onClick={logoutHandler}
                    title={compact ? 'Log out' : undefined}
                    className={cn(
                        'flex rounded-lg font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300',
                        compact ? 'h-14 w-14 flex-col items-center justify-center gap-1 text-[10px]' : 'w-full items-center gap-3 px-3 py-2 text-sm'
                    )}
                >
                    <LogOut className={compact ? 'h-5 w-5' : 'h-[18px] w-[18px]'} /> {compact ? 'Log out' : 'Log out'}
                </button>
            </div>
        </nav>
    )
}

export default AdminSideBar

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useHistory } from 'react-router-dom'
import {
    LayoutDashboard, Users, Tag, Package, ShoppingCart, Mail, LogOut,
    Store, Boxes, PackagePlus, Receipt, UserCog, Settings, Globe, Truck, Landmark,
} from 'lucide-react'
import { logout } from '../actions/userActions'
import { cn } from '../components/ui'
import { ROLE_LABELS, canOpen, roleOf } from './roles'

// The admin navigation. `short` is the label in the narrow rail; `also` marks
// detail pages that belong to a section (e.g. editing one product).
export const NAV_SECTIONS = [
    {
        title: 'Overview',
        links: [{ to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard }],
    },
    {
        title: 'Shop counter',
        links: [
            { to: '/admin/counter', label: 'Counter sale', short: 'Register', icon: Store },
            { to: '/admin/sales', label: 'Sales & reports', short: 'Sales', icon: Receipt },
            { to: '/admin/gst', label: 'GST report', short: 'GST', icon: Landmark },
        ],
    },
    {
        title: 'Catalog & stock',
        links: [
            { to: '/admin/productlist', label: 'Items', short: 'Items', icon: Package, also: ['/admin/product/'] },
            { to: '/brand', label: 'Categories', short: 'Groups', icon: Tag },
            { to: '/admin/stock', label: 'Stock', short: 'Stock', icon: Boxes },
            { to: '/admin/receive', label: 'Receive stock', short: 'Receive', icon: PackagePlus },
        ],
    },
    {
        title: 'Online store',
        links: [
            { to: '/admin/orderlist', label: 'Online orders', short: 'Orders', icon: ShoppingCart, also: ['/admin/order/'] },
            { to: '/admin/contact', label: 'Messages', short: 'Messages', icon: Mail },
            { to: '/admin/delivery', label: 'Delivery', short: 'Delivery', icon: Truck },
        ],
    },
    {
        title: 'People',
        links: [
            { to: '/admin/staff', label: 'Staff', short: 'Staff', icon: UserCog, also: ['/admin/user/'] },
            { to: '/admin/customers', label: 'Customers', short: 'Customers', icon: Users },
        ],
    },
    {
        title: 'Store',
        links: [
            { to: '/admin/website', label: 'Website', short: 'Website', icon: Globe },
            { to: '/admin/settings', label: 'Settings', short: 'Settings', icon: Settings },
        ],
    },
]

const DETAIL_TITLES = [
    ['/admin/product/new', 'New item'],
    ['/admin/product/', 'Edit item'],
    ['/admin/order/', 'Order details'],
    ['/admin/user/', 'Edit user'],
]

// Section and page name for the header, e.g. ["Catalog & stock", "Items"].
export function pageTrail(pathname) {
    for (const section of NAV_SECTIONS) {
        for (const link of section.links) {
            if (pathname === link.to || pathname.startsWith(`${link.to}/`)) return [section.title, link.label]
            if (link.also && link.also.some((p) => pathname.startsWith(p))) {
                const detail = DETAIL_TITLES.find(([p]) => pathname.startsWith(p))
                return [link.label, detail ? detail[1] : link.label]
            }
        }
    }
    return ['', '']
}

export const initials = (name) => (name || '?').split(/\s+/).map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase()

// Dark left navigation. `compact` shows icons only, with the label as a tooltip on hover.
function AdminSideBar({ compact, onNavigate }) {
    const dispatch = useDispatch()
    const history = useHistory()
    const { userInfo } = useSelector((state) => state.userLogin)
    const role = roleOf(userInfo)
    const name = userInfo && (userInfo.name || userInfo.email)

    // Each role only sees the pages it can use.
    const visible = NAV_SECTIONS
        .map((section) => ({ ...section, links: section.links.filter((l) => canOpen(role, l.to)) }))
        .filter((section) => section.links.length > 0)

    const logoutHandler = () => {
        dispatch(logout())
        history.push('/staff')
    }

    const renderLink = ({ to, label, icon: Icon, also }) => (
        <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            aria-label={compact ? label : undefined}
            isActive={(match, location) => Boolean(match) || Boolean(also && also.some((p) => location.pathname.startsWith(p)))}
            className={cn(
                'group relative flex items-center rounded-md text-[13px] font-medium text-slate-400 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                compact ? 'h-10 w-10 justify-center' : 'h-9 gap-3 px-2.5'
            )}
            activeClassName="!bg-white/[0.08] !text-white [&>.bar]:opacity-100"
        >
            <span className="bar absolute -left-3 top-2 bottom-2 w-[3px] rounded-full bg-brand-500 opacity-0 transition-opacity" />
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
            {!compact && <span className="truncate">{label}</span>}
            {compact && <Tooltip>{label}</Tooltip>}
        </NavLink>
    )

    return (
        <div className="flex h-full flex-col">
            {/* The narrow rail scrolls when the menu is taller than the window. Its hover labels are
                position: fixed, so the scrolling doesn't clip them. */}
            <nav aria-label="Admin" className={cn('min-h-0 flex-1 overflow-y-auto py-3', compact ? 'flex flex-col items-center px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'px-3')}>
                {visible.map((section, i) => (
                    <div key={section.title} className={cn(i > 0 && (compact ? 'mt-2 border-t border-white/[0.06] pt-2' : 'mt-5'))}>
                        {!compact && (
                            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{section.title}</p>
                        )}
                        <div className="flex flex-col gap-0.5">{section.links.map(renderLink)}</div>
                    </div>
                ))}
            </nav>

            {/* Account, kept apart from navigation */}
            <div className={cn('shrink-0 border-t border-white/[0.06]', compact ? 'flex flex-col items-center gap-1 px-2 py-3' : 'p-3')}>
                {compact ? (
                    <>
                        <span className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                            {initials(name)}
                            <Tooltip>{name}{role ? ` · ${ROLE_LABELS[role]}` : ''}</Tooltip>
                        </span>
                        <button type="button" onClick={logoutHandler} aria-label="Log out"
                            className="group relative flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300">
                            <LogOut className="h-[18px] w-[18px]" />
                            <Tooltip>Log out</Tooltip>
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">{initials(name)}</span>
                        <span className="min-w-0 flex-1 leading-tight">
                            <span className="block truncate text-[13px] font-medium text-slate-100">{name}</span>
                            <span className="block truncate text-xs text-slate-500">{ROLE_LABELS[role]}</span>
                        </span>
                        <button type="button" onClick={logoutHandler} aria-label="Log out" title="Log out"
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// A label that appears to the right of an icon in the collapsed rail.
function Tooltip({ children }) {
    return (
        // Fixed with no offsets sits where it would in the flow (centred on the icon), then moves
        // right of it; being fixed, a scrolling menu can't clip it.
        <span role="tooltip" className="pointer-events-none fixed z-50 translate-x-[calc(50%+32px)] whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100">
            {children}
        </span>
    )
}

export default AdminSideBar

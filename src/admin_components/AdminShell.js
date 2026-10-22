import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link, useHistory, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    Maximize, Minimize, Menu, X, ExternalLink, Plus, Search, Moon, Sun, Bell, ChevronDown, ChevronRight,
    PanelLeftClose, PanelLeftOpen, Store, User, LogOut, PackageX, AlertTriangle, CalendarClock, HandCoins, Truck, Mail, CheckCircle2,
    Building2, Check,
} from 'lucide-react'
import AdminSideBar, { initials, pageTrail } from './AdminSideBar'
import { Button, Modal, Toaster, cn } from '../components/ui'
import ErrorBoundary from '../components/ErrorBoundary'
import { logout, refreshBusinesses } from '../actions/userActions'
import { ROLE_LABELS, activeBusinessInfo, canOpen, homeFor, isManagerRole, roleOf, switchBusiness } from './roles'
import { StoreLogo, StoreName, useStoreBrand } from '../components/storeBrand'
import { formatINR } from '../components/ui'

// Sign out after this long without activity, so the next person at a shared
// computer can't use the previous login. A warning shows for the last minute.
const IDLE_MINUTES = 30
const WARN_SECONDS = 60
const ACTIVITY_KEY = 'staffLastActive'
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel']

// Shared across tabs through localStorage, so activity in one tab keeps the others signed in.
const readActivity = () => {
    try { return Number(localStorage.getItem(ACTIVITY_KEY)) || 0 } catch (e) { return 0 }
}
const writeActivity = (time) => {
    try { localStorage.setItem(ACTIVITY_KEY, String(time)) } catch (e) { /* storage unavailable */ }
}

function useIdleSignOut(onSignOut) {
    const [secondsLeft, setSecondsLeft] = useState(null)
    const lastWrite = useRef(0)

    useEffect(() => {
        let local = Date.now()
        writeActivity(local)
        const bump = () => {
            local = Date.now()
            // Writing on every mouse move is wasteful; every few seconds is enough.
            if (local - lastWrite.current > 5000) {
                lastWrite.current = local
                writeActivity(local)
            }
        }
        ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }))
        const timer = setInterval(() => {
            const last = Math.max(local, readActivity())
            const remaining = IDLE_MINUTES * 60 - (Date.now() - last) / 1000
            if (remaining <= 0) onSignOut()
            else setSecondsLeft(remaining <= WARN_SECONDS ? Math.ceil(remaining) : null)
        }, 1000)
        return () => {
            clearInterval(timer)
            ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump))
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const stayIn = () => { writeActivity(Date.now()); setSecondsLeft(null) }
    return { secondsLeft, stayIn }
}

// Light or dark admin, remembered in this browser. Light is the default.
const THEME_KEY = 'adminTheme'
function useAdminTheme() {
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light' } catch (e) { return 'light' }
    })
    const toggle = () => setTheme((t) => {
        const next = t === 'dark' ? 'light' : 'dark'
        try { localStorage.setItem(THEME_KEY, next) } catch (e) { /* storage unavailable */ }
        return next
    })
    return [theme, toggle]
}

// Wide or narrow sidebar, remembered in this browser.
const SIDEBAR_KEY = 'adminSidebar'
function useCollapsedSidebar() {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(SIDEBAR_KEY) === 'collapsed' } catch (e) { return false }
    })
    const toggle = () => setCollapsed((c) => {
        try { localStorage.setItem(SIDEBAR_KEY, c ? 'open' : 'collapsed') } catch (e) { /* storage unavailable */ }
        return !c
    })
    return [collapsed, toggle]
}

// A menu that opens from a button and closes on outside click or Escape.
function useDropdown() {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    useEffect(() => {
        if (!open) return undefined
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
    }, [open])
    return { open, setOpen, ref }
}

// Real alerts for the bell, depending on what each role looks after. Nothing is made up:
// every item comes from the server and links to the page that deals with it.
function useNotifications(role, token) {
    const [items, setItems] = useState(null)
    const load = useCallback(() => {
        if (!role || !token) return
        const config = { headers: { Authorization: `Bearer ${token}` } }
        const list = []
        const jobs = []
        if (isManagerRole(role)) {
            jobs.push(axios.get('/api/inventory/home/', config).then(({ data }) => {
                const a = data.alerts
                if (a.out_of_stock) list.push({ tone: 'red', icon: PackageX, text: `${a.out_of_stock} item${a.out_of_stock === 1 ? ' is' : 's are'} out of stock`, to: '/admin/stock' })
                if (a.low_stock) list.push({ tone: 'amber', icon: AlertTriangle, text: `${a.low_stock} running low`, to: '/admin/stock' })
                if (a.expiring) list.push({ tone: 'amber', icon: CalendarClock, text: `${a.expiring} batch${a.expiring === 1 ? '' : 'es'} expiring soon`, to: '/admin/stock' })
                if (a.dues_count) list.push({ tone: 'amber', icon: HandCoins, text: `${formatINR(a.dues_total)} owed by customers`, to: '/admin/sales' })
                if (a.online_to_ship) list.push({ tone: 'sky', icon: Truck, text: `${a.online_to_ship} online order${a.online_to_ship === 1 ? '' : 's'} to deliver`, to: '/admin/orderlist' })
            }))
        }
        if (role === 'stock' || role === 'cashier') {
            jobs.push(axios.get('/api/inventory/summary/', config).then(({ data }) => {
                if (role === 'stock') {
                    if (data.low_stock && data.low_stock.length) list.push({ tone: 'amber', icon: AlertTriangle, text: `${data.low_stock.length} item${data.low_stock.length === 1 ? '' : 's'} low or out of stock`, to: '/admin/stock' })
                    if (data.expiring && data.expiring.length) list.push({ tone: 'amber', icon: CalendarClock, text: `${data.expiring.length} batch${data.expiring.length === 1 ? '' : 'es'} expiring soon`, to: '/admin/stock' })
                } else if (data.dues && data.dues.count) {
                    list.push({ tone: 'amber', icon: HandCoins, text: `${formatINR(data.dues.total)} owed on ${data.dues.count} bill${data.dues.count === 1 ? '' : 's'}`, to: '/admin/sales' })
                }
            }))
        }
        if (isManagerRole(role) || role === 'orders') {
            jobs.push(axios.get('/api/contact/?status=waiting', config).then(({ data }) => {
                if (data.waiting) list.push({ tone: 'sky', icon: Mail, text: `${data.waiting} message${data.waiting === 1 ? '' : 's'} awaiting a reply`, to: '/admin/contact' })
            }))
        }
        if (role === 'orders') {
            jobs.push(axios.get('/api/orders/', config).then(({ data }) => {
                const waiting = data.filter((o) => !o.isDelivered).length
                if (waiting) list.push({ tone: 'sky', icon: Truck, text: `${waiting} online order${waiting === 1 ? '' : 's'} to deliver`, to: '/admin/orderlist' })
            }))
        }
        Promise.allSettled(jobs).then(() => {
            const order = { red: 0, amber: 1, sky: 2 }
            setItems([...list].sort((a, b) => order[a.tone] - order[b.tone]))
        })
    }, [role, token])
    useEffect(() => {
        load()
        const timer = setInterval(load, 3 * 60 * 1000)
        return () => clearInterval(timer)
    }, [load])
    return [items, load]
}

const TONE_STYLES = {
    red: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
}

function Logo({ compact, home = '/dashboard', onToggle, collapsed }) {
    const store = useStoreBrand()
    return (
        <div className={cn('flex h-14 shrink-0 items-center border-b border-white/[0.06]', compact ? 'justify-center px-2' : 'gap-2 pl-4 pr-2')}>
            <Link to={home} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={`${store.name} home`}>
                <StoreLogo className="h-8 w-8 rounded-lg" iconClassName="h-4 w-4" />
                {!compact && (
                    <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-semibold"><StoreName accentClassName="text-brand-400" /></span>
                        <span className="block truncate text-[11px] text-slate-500">Point of sale</span>
                    </span>
                )}
            </Link>
            {onToggle && !compact && (
                <button type="button" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200">
                    <PanelLeftClose className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

function HeaderIconButton({ label, onClick, children, active }) {
    return (
        <button type="button" onClick={onClick} aria-label={label} title={label}
            className={cn('relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                active && 'bg-slate-100 text-slate-900')}>
            {children}
        </button>
    )
}

// Full-window frame for every admin page: dark left menu, header, light work area.
// It replaces the storefront header, footer and chat on admin pages.
// Pages shown without the admin sidebar and top bar.
const FULL_PAGE = ['/admin/website']

function AdminShell({ children }) {
    const { pathname } = useLocation()
    const history = useHistory()
    const dispatch = useDispatch()
    const { userInfo } = useSelector((state) => state.userLogin)
    const { secondsLeft, stayIn } = useIdleSignOut(() => {
        // The admin gate sends signed-out staff to the sign-in page with a link back
        // to this page; the flag tells that page to explain why.
        try { sessionStorage.setItem('staffSignedOutIdle', '1') } catch (e) { /* ignore */ }
        dispatch(logout())
    })
    const [menuOpen, setMenuOpen] = useState(false)
    const [theme, toggleTheme] = useAdminTheme()
    const [collapsed, toggleCollapsed] = useCollapsedSidebar()
    const store = useStoreBrand()
    const [search, setSearch] = useState('')
    const searchRef = useRef(null)
    const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
    const bell = useDropdown()
    const account = useDropdown()

    // The counter needs every pixel, so it always gets the narrow rail and no page padding.
    const isCounter = pathname.startsWith('/admin/counter')
    const narrow = isCounter || collapsed

    const name = userInfo && (userInfo.name || userInfo.email)
    const role = roleOf(userInfo)
    const home = homeFor(role)
    const businesses = (userInfo && userInfo.businesses) || []
    const current = activeBusinessInfo(userInfo)
    const [notifications, reloadNotifications] = useNotifications(role, userInfo && userInfo.token)
    const [section, page] = useMemo(() => pageTrail(pathname), [pathname])

    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    // Pick up role changes made by a manager: on opening the admin area and whenever
    // the window comes back into focus. The server checks the role on every request anyway.
    useEffect(() => {
        dispatch(refreshBusinesses())
        const onFocus = () => dispatch(refreshBusinesses())
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [dispatch])

    useEffect(() => { setMenuOpen(false); bell.setOpen(false); account.setOpen(false) }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    // The counter has its own item search, so the header doesn't repeat it there.
    const canSearch = canOpen(role, '/admin/productlist') && !isCounter
    useEffect(() => {
        if (!canSearch) return undefined
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current && searchRef.current.focus() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [canSearch])

    const searchProducts = (e) => {
        e.preventDefault()
        if (!search.trim()) return
        history.push(`/admin/productlist?keyword=${encodeURIComponent(search.trim())}`)
        setSearch('')
        searchRef.current && searchRef.current.blur()
    }

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen()
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {})
    }
    const signOut = () => { dispatch(logout()); history.push('/staff') }
    const count = notifications ? notifications.length : 0

    const idleModal = (
        <Modal show={secondsLeft !== null} onClose={stayIn} title="Are you still there?" size="sm">
            <p className="text-sm text-slate-600">
                For security you'll be signed out in <strong className="text-slate-900">{secondsLeft} seconds</strong> because nothing has happened for a while.
                An open bill at the counter is kept.
            </p>
            <div className="mt-5 flex gap-2">
                <Button block variant="secondary" onClick={signOut}>Sign out now</Button>
                <Button block autoFocus onClick={stayIn}>Stay signed in</Button>
            </div>
        </Modal>
    )

    // The website editor takes the whole window, with its own top bar and an Exit button.
    if (FULL_PAGE.some((p) => pathname.startsWith(p))) {
        return (
            <div className={cn('relative h-screen overflow-hidden bg-[var(--admin-bg)] text-slate-900', theme === 'dark' && 'theme-dark')}>
                <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
                <Toaster />
                {idleModal}
            </div>
        )
    }

    return (
        <div className={cn('relative flex h-screen overflow-hidden bg-[var(--admin-bg)] text-slate-900', theme === 'dark' && 'theme-dark')}>
            <aside className={cn('keep-colors relative hidden shrink-0 flex-col bg-[var(--admin-sidebar)] transition-[width] duration-200 lg:flex', narrow ? 'w-[72px]' : 'w-60')}>
                <Logo compact={narrow} home={home} onToggle={isCounter ? null : toggleCollapsed} collapsed={collapsed} />
                <div className="min-h-0 flex-1 overflow-hidden">
                    <AdminSideBar compact={narrow} />
                </div>
                {collapsed && !isCounter && (
                    <button type="button" onClick={toggleCollapsed} aria-label="Expand sidebar"
                        className="absolute -right-3 top-[18px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm hover:text-slate-900">
                        <PanelLeftOpen className="h-3.5 w-3.5" />
                    </button>
                )}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
                    <button type="button" onClick={() => setMenuOpen(true)} className="-ml-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Where you are */}
                    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
                        {section && section !== page && <><span className="truncate text-slate-500">{section}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" /></>}
                        <span className="truncate font-semibold text-slate-900">{page || store.name}</span>
                    </nav>

                    {canSearch && (
                        <form onSubmit={searchProducts} role="search" className="relative ml-2 hidden w-full max-w-sm sm:block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items, codes…"
                                aria-label="Search items"
                                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/15" />
                            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-400">Ctrl K</kbd>
                        </form>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                        {/* This store has one location, so it is shown rather than offered as a choice. */}
                        <span className="mr-1 hidden items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 xl:flex" title="Current store">
                            <Store className="h-4 w-4 text-slate-400" />
                            <span className="max-w-[12rem] truncate font-medium">{store.name}</span>
                            {store.location && <span className="text-slate-400">· {store.location}</span>}
                        </span>

                        {isCounter && (
                            <HeaderIconButton label={isFullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen}>
                                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                            </HeaderIconButton>
                        )}

                        {/* Notifications */}
                        <div ref={bell.ref} className="relative">
                            <HeaderIconButton label={`Notifications${count ? ` (${count})` : ''}`} active={bell.open}
                                onClick={() => { bell.setOpen(!bell.open); if (!bell.open) reloadNotifications() }}>
                                <Bell className="h-4 w-4" />
                                {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">{count}</span>}
                            </HeaderIconButton>
                            {bell.open && (
                                <div className="anim-pop absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" role="menu">
                                    <div className="border-b border-slate-200/70 px-4 py-3">
                                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                                        <p className="text-xs text-slate-500">Things that need attention right now</p>
                                    </div>
                                    {!notifications ? (
                                        <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
                                    ) : notifications.length === 0 ? (
                                        <div className="flex flex-col items-center px-4 py-8 text-center">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                            <p className="mt-2 text-sm font-medium text-slate-900">All clear</p>
                                            <p className="text-xs text-slate-500">Nothing needs attention.</p>
                                        </div>
                                    ) : (
                                        <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                                            {notifications.map(({ tone, icon: Icon, text, to }) => (
                                                <li key={text}>
                                                    <Link to={to} role="menuitem" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50">
                                                        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONE_STYLES[tone])}><Icon className="h-4 w-4" /></span>
                                                        <span className="flex-1 text-slate-700">{text}</span>
                                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        <HeaderIconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </HeaderIconButton>

                        {!isCounter && canOpen(role, '/admin/counter') && (
                            <Link to="/admin/counter" className="ml-1.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
                                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New sale</span>
                            </Link>
                        )}

                        {/* Account */}
                        {name && (
                            <div ref={account.ref} className="relative ml-1.5">
                                <button type="button" onClick={() => account.setOpen(!account.open)} aria-haspopup="menu" aria-expanded={account.open}
                                    className="flex items-center gap-2 rounded-lg p-1 pr-1.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">{initials(name)}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                </button>
                                {account.open && (
                                    <div className="anim-pop absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl" role="menu">
                                        <div className="border-b border-slate-200/70 px-4 py-3">
                                            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                                            <p className="truncate text-xs text-slate-500">{userInfo.email}</p>
                                            <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                                {ROLE_LABELS[role]}{current ? ` · ${current.name}` : ''}
                                            </span>
                                        </div>
                                        {businesses.length > 1 && (
                                            <div className="border-b border-slate-200/70 py-1">
                                                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Switch business</p>
                                                {businesses.map((b) => {
                                                    const here = current && b.slug === current.slug
                                                    return (
                                                        <button key={b.slug} type="button" role="menuitemradio" aria-checked={here}
                                                            onClick={() => (here ? account.setOpen(false) : switchBusiness(userInfo, b.slug))}
                                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50">
                                                            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate font-medium text-slate-800">{b.name}</span>
                                                                <span className="block truncate text-xs text-slate-500">{ROLE_LABELS[b.role]}{b.location ? ` · ${b.location}` : ''}</span>
                                                            </span>
                                                            {here && <Check className="h-4 w-4 text-brand-600" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                        <MenuItem to="/profile" icon={User}>My account</MenuItem>
                                        <MenuItem to="/" icon={ExternalLink}>View online shop</MenuItem>
                                        <MenuItem onClick={toggleFullscreen} icon={isFullscreen ? Minimize : Maximize}>{isFullscreen ? 'Exit full screen' : 'Full screen'}</MenuItem>
                                        <div className="my-1 border-t border-slate-200/70" />
                                        <MenuItem onClick={signOut} icon={LogOut} danger>Log out</MenuItem>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* relative: hidden inputs (file pickers) stay inside the scrolling area instead of stretching the window. */}
                <main className={cn('relative min-h-0 flex-1 overflow-y-auto', !isCounter && 'px-4 py-6 sm:px-6 lg:px-8')}>
                    {/* A crash on one page leaves the menu working so staff can move on. */}
                    <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
                </main>
            </div>

            <Toaster />
            {idleModal}

            {/* Phone and tablet menu */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="anim-fade absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
                    <div className="keep-colors anim-drawer absolute inset-y-0 left-0 flex w-64 flex-col bg-[var(--admin-sidebar)] shadow-xl">
                        <div className="flex items-center pr-2">
                            <div className="min-w-0 flex-1"><Logo home={home} /></div>
                            <button type="button" onClick={() => setMenuOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close menu">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1">
                            <AdminSideBar onNavigate={() => setMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MenuItem({ to, onClick, icon: Icon, danger, children }) {
    const cls = cn('flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors', danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50')
    if (to) return <Link to={to} role="menuitem" className={cls}><Icon className="h-4 w-4 text-current opacity-70" />{children}</Link>
    return <button type="button" role="menuitem" onClick={onClick} className={cls}><Icon className="h-4 w-4 text-current opacity-70" />{children}</button>
}

export default AdminShell

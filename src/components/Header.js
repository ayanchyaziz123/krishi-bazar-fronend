import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ShoppingBag, User, LogOut, LayoutDashboard, ChevronDown, Menu, X, Sprout } from 'lucide-react'
import SearchBox from './SearchBox'
import { logout } from '../actions/userActions'
import { Container, cn } from './ui'

const navLinks = [
    { to: '/', label: 'Shop', exact: true },
    { to: '/priceRange', label: 'Shop by Budget' },
    { to: '/topReviewProductScreen', label: 'Top Reviewed' },
    { to: '/contact', label: 'Contact' },
]

export function Logo({ light }) {
    return (
        <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
                <Sprout className="h-5 w-5" />
            </span>
            <span className={cn('text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
                Krishi <span className="text-brand-600">Bazar</span>
            </span>
        </Link>
    )
}

function Header() {
    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    const cart = useSelector(state => state.cart)
    const { cartItems } = cart
    const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0)

    const dispatch = useDispatch()
    const location = useLocation()

    const [menuOpen, setMenuOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [hidden, setHidden] = useState(false)
    const menuRef = useRef(null)

    // Hide the header while scrolling down, bring it back on any scroll up.
    useEffect(() => {
        let lastY = window.scrollY
        let ticking = false
        const onScroll = () => {
            if (ticking) return
            ticking = true
            window.requestAnimationFrame(() => {
                const y = window.scrollY
                const delta = y - lastY
                if (y < 120) setHidden(false)
                else if (delta > 6) setHidden(true)
                else if (delta < -6) setHidden(false)
                if (Math.abs(delta) > 6) lastY = y
                ticking = false
            })
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        setMenuOpen(false)
        setMobileOpen(false)
    }, [location.pathname, location.search])

    useEffect(() => {
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const logoutHandler = () => {
        dispatch(logout())
    }

    return (
        <header className={cn(
            'sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-out',
            hidden && !menuOpen && !mobileOpen && '-translate-y-full'
        )}>
            <Container>
                <div className="flex h-16 items-center gap-4 lg:gap-8">
                    <Logo />

                    <SearchBox className="hidden max-w-xl flex-1 md:block" />

                    <div className="ml-auto flex items-center gap-1 sm:gap-2">
                        <Link
                            to="/cart"
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Cart"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {userInfo ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((o) => !o)}
                                    className="flex h-10 items-center gap-2 rounded-xl pl-1 pr-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold uppercase text-brand-700">
                                        {userInfo.name ? userInfo.name.charAt(0) : 'U'}
                                    </span>
                                    <span className="hidden max-w-32 truncate sm:block">{userInfo.name}</span>
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                                        <Link to="/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                            <User className="h-4 w-4 text-slate-400" /> Profile
                                        </Link>
                                        {userInfo.isAdmin && (
                                            <Link to="/dashboard" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                                <LayoutDashboard className="h-4 w-4 text-slate-400" /> Dashboard
                                            </Link>
                                        )}
                                        <div className="my-1 h-px bg-slate-100" />
                                        <button
                                            type="button"
                                            onClick={logoutHandler}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                        >
                                            <LogOut className="h-4 w-4" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                                    Log in
                                </Link>
                                <Link to="/register2" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                                    Sign up
                                </Link>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileOpen((o) => !o)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
                            aria-label="Menu"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <nav className="-mb-px hidden h-11 items-center gap-6 lg:flex">
                    {navLinks.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            exact={l.exact}
                            className="flex h-full items-center border-b-2 border-transparent text-sm font-medium text-slate-500 transition hover:text-slate-900"
                            activeClassName="!border-brand-600 !text-slate-900"
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>
            </Container>

            {mobileOpen && (
                <div className="border-t border-slate-100 bg-white lg:hidden">
                    <Container className="space-y-1 py-4">
                        <SearchBox className="mb-3 md:hidden" />
                        {navLinks.map((l) => (
                            <Link key={l.to} to={l.to} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                {l.label}
                            </Link>
                        ))}
                        {!userInfo && (
                            <div className="flex gap-2 pt-3 sm:hidden">
                                <Link to="/login" className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Log in</Link>
                                <Link to="/register2" className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white">Sign up</Link>
                            </div>
                        )}
                    </Container>
                </div>
            )}
        </header>
    )
}

export default Header

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useHistory, useLocation } from 'react-router-dom'
import { ShoppingCart, User, LogOut, LayoutDashboard, Menu, X, ArrowLeft, Search, Mic, MessageCircle, Package, MapPin } from 'lucide-react'
import { logout } from '../actions/userActions'
import { Container, cn } from './ui'
import { homeFor, isManagerRole, roleOf } from '../admin_components/roles'
import { StoreLogo, StoreName, useStoreBrand } from './storeBrand'
import { isExternal, useSiteContent } from './siteContent'
import { headerBackground } from './shop/theme'
import { itemCount } from './shop/checkout'

// A menu or announcement link: internal pages use the router, full addresses open normally.
function MenuLink({ link, className, activeClassName, children, onClick }) {
    if (isExternal(link)) return <a href={link} className={className} target="_blank" rel="noreferrer" onClick={onClick}>{children}</a>
    if (activeClassName) return <NavLink to={link} exact={link === '/'} className={className} activeClassName={activeClassName} onClick={onClick}>{children}</NavLink>
    return <Link to={link} className={className} onClick={onClick}>{children}</Link>
}

// Used by the footer, on a dark background.
export function Logo({ light }) {
    return (
        <Link to="/" className="flex items-center gap-2.5">
            <StoreLogo className="h-9 w-9 rounded-xl shadow-md shadow-brand-600/30" />
            <span className={cn('text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
                <StoreName accentClassName="text-brand-600" />
            </span>
        </Link>
    )
}

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

// The white search box on the green bar. The microphone appears only in browsers that can
// turn speech into text (e.g. Chrome on Android).
function ShopSearch({ className }) {
    const history = useHistory()
    const location = useLocation()
    const current = new URLSearchParams(location.search).get('keyword') || ''
    const [keyword, setKeyword] = useState(current)
    const [listening, setListening] = useState(false)
    useEffect(() => setKeyword(current), [current])

    const search = (text) => {
        const q = (text || '').trim()
        history.push(q ? `/?keyword=${encodeURIComponent(q)}&page=1` : '/')
    }
    const listen = () => {
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.onresult = (e) => {
            const said = e.results[0][0].transcript
            setKeyword(said)
            search(said)
        }
        recognition.onend = () => setListening(false)
        recognition.onerror = () => setListening(false)
        setListening(true)
        recognition.start()
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); search(keyword) }} role="search" className={cn('relative flex h-10 items-center rounded-xl bg-white shadow-sm md:h-11', className)}>
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
            <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} aria-label="Search products"
                placeholder={listening ? 'Listening…' : 'What are you looking for?'}
                className="h-full min-w-0 flex-1 rounded-xl bg-transparent pl-10 pr-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" />
            {SpeechRecognition && (
                <button type="button" onClick={listen} aria-label="Search by voice"
                    className={cn('mr-1 flex h-8 w-8 items-center justify-center rounded-lg', listening ? 'bg-brand-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
                    <Mic className="h-4 w-4" />
                </button>
            )}
            <button type="submit" className="mr-1 hidden h-8 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900 md:block">Search</button>
        </form>
    )
}

// Inner pages on a phone get a slim bar with a back arrow and the page title.
function pageTitle(pathname, productName) {
    if (pathname === '/') return null
    if (pathname.startsWith('/product/')) return productName || 'Product'
    const titles = [
        ['/categories', 'Category'], ['/stores', 'Our store'], ['/cart', 'My cart'], ['/profile', 'My account'],
        ['/shipping', 'Checkout'], ['/placeorder', 'Checkout'], ['/payment', 'Checkout'], ['/order/', 'Order details'],
        ['/login', 'Log in'], ['/register', 'Sign up'], ['/contact', 'Contact us'], ['/priceRange', 'Shop by budget'],
        ['/topReviewProductScreen', 'Top reviewed'], ['/compare', 'Compare'], ['/page/', ''],
    ]
    const hit = titles.find(([p]) => pathname.startsWith(p))
    return hit ? hit[1] : ''
}

function Header() {
    const site = useSiteContent()
    const store = useStoreBrand()
    const navLinks = site.menu || []
    const announcement = site.announcement || {}
    const { userInfo } = useSelector((state) => state.userLogin)
    const productName = useSelector((state) => state.productDetails.product && state.productDetails.product.name)
    const cartCount = useSelector((state) => itemCount(state.cart.cartItems))
    const dispatch = useDispatch()
    const history = useHistory()
    const { pathname, search } = useLocation()
    const [drawer, setDrawer] = useState(false)

    useEffect(() => setDrawer(false), [pathname, search])

    const title = pageTitle(pathname, productName)
    // The website editor's preview sends its draft logo; customers get the published one.
    const theme = site.theme || {}
    const logo = theme.logo || store.logo
    const showName = theme.show_name !== false
    const role = roleOf(userInfo)
    const openAssistant = () => { setDrawer(false); window.dispatchEvent(new Event('open-assistant')) }
    const back = () => (window.history.length > 1 ? history.goBack() : history.push('/'))

    return (
        <>
            <header className={cn('sticky top-0 z-40 text-white shadow-sm', headerBackground(site.theme && site.theme.header))}>
                {announcement.enabled && announcement.text && (
                    <div className="bg-brand-800 px-4 py-1.5 text-center text-xs font-medium sm:text-sm">
                        {announcement.link
                            ? <MenuLink link={announcement.link} className="hover:underline">{announcement.text}</MenuLink>
                            : announcement.text}
                    </div>
                )}

                {/* Phone: inner pages get a back arrow and the page title. */}
                {title !== null && (
                    <div className="flex h-14 items-center gap-2 px-2 md:hidden">
                        <button type="button" onClick={back} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <p className="min-w-0 flex-1 truncate text-lg font-bold">{title || store.name}</p>
                        {(pathname.startsWith('/categories') || pathname.startsWith('/product/')) && (
                            <Link to="/?search=1" aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"><Search className="h-5 w-5" /></Link>
                        )}
                    </div>
                )}

                <Container className={cn(title !== null && 'hidden md:block')}>
                    <div className="flex h-14 items-center gap-4 md:h-16 lg:gap-8">
                        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${store.name} home`}>
                            {logo && <img src={logo} alt={`${store.name} logo`} className="h-9 w-auto max-w-[8rem] shrink-0 rounded-lg bg-white object-contain p-0.5 md:h-10" />}
                            {(showName || !logo) && <span className="min-w-0 truncate text-xl font-extrabold tracking-tight md:text-2xl">{store.name}</span>}
                        </Link>
                        <ShopSearch className="hidden max-w-2xl flex-1 md:flex" />
                        <div className="ml-auto flex items-center gap-1">
                            <Link to={userInfo ? '/profile' : '/login'} className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-white/10 md:flex">
                                <User className="h-5 w-5" /> <span className="max-w-32 truncate">{userInfo ? userInfo.name : 'Log in'}</span>
                            </Link>
                            <Link to="/cart" aria-label="Cart" className="relative hidden h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10 md:flex">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold ring-2 ring-brand-600">{cartCount}</span>}
                            </Link>
                            <button type="button" onClick={() => setDrawer(true)} aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10">
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    {title === null && <ShopSearch className="mb-3 md:hidden" />}
                </Container>
            </header>

            {/* Menu drawer */}
            {drawer && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
                    <aside className="absolute inset-y-0 right-0 flex w-80 max-w-[85%] flex-col bg-white shadow-xl" aria-label="Menu">
                        <div className={cn('flex items-center justify-between px-5 py-5 text-white', headerBackground(site.theme && site.theme.header))}>
                            <div className="min-w-0">
                                <p className="truncate text-lg font-bold">{userInfo ? `Hi, ${userInfo.name}` : store.name}</p>
                                <p className="truncate text-sm text-white/80">{userInfo ? userInfo.email : 'Log in to see your orders'}</p>
                            </div>
                            <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-lg p-1.5 hover:bg-white/10"><X className="h-6 w-6" /></button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-3">
                            {navLinks.map((l, i) => (
                                <MenuLink key={`${l.link}-${i}`} link={l.link} className="block rounded-xl px-3 py-3 text-[15px] font-medium text-slate-800 hover:bg-slate-50">{l.label}</MenuLink>
                            ))}
                            <div className="my-2 h-px bg-slate-100" />
                            <Link to="/categories" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-slate-800 hover:bg-slate-50"><Package className="h-5 w-5 text-slate-400" /> All categories</Link>
                            <Link to="/stores" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-slate-800 hover:bg-slate-50"><MapPin className="h-5 w-5 text-slate-400" /> Our store</Link>
                            <button type="button" onClick={openAssistant} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-slate-800 hover:bg-slate-50"><MessageCircle className="h-5 w-5 text-slate-400" /> Ask our assistant</button>
                            <div className="my-2 h-px bg-slate-100" />
                            {userInfo ? (
                                <>
                                    <Link to="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-slate-800 hover:bg-slate-50"><User className="h-5 w-5 text-slate-400" /> My account and orders</Link>
                                    {role && (
                                        <Link to={homeFor(role)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-slate-800 hover:bg-slate-50">
                                            <LayoutDashboard className="h-5 w-5 text-slate-400" /> {isManagerRole(role) ? 'Dashboard' : 'Staff area'}
                                        </Link>
                                    )}
                                    <button type="button" onClick={() => dispatch(logout())} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-rose-600 hover:bg-rose-50"><LogOut className="h-5 w-5" /> Log out</button>
                                </>
                            ) : (
                                <div className="flex gap-2 px-1 pt-1">
                                    <Link to="/login" className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-800 ring-1 ring-slate-200">Log in</Link>
                                    <Link to="/register2" className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white">Sign up</Link>
                                </div>
                            )}
                        </nav>
                    </aside>
                </div>
            )}
        </>
    )
}

export default Header

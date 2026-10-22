import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Store, Boxes, ShoppingCart, LayoutDashboard, Building2, ChevronRight } from 'lucide-react'
import { Alert, Button, Field, Input } from '../components/ui'
import { login, logout } from '../actions/userActions'
import { ROLE_LABELS, canOpen, hasChosenBusiness, homeFor, roleOf, setActiveBusiness } from '../admin_components/roles'
import { StoreLogo, StoreName, useStoreBrand } from '../components/storeBrand'

// Sign-in for shop staff (managers, cashiers, stock keepers, online orders).
// Customers sign in from the shop header instead. Each role lands on its own page.
function StaffLoginScreen({ location, history }) {
    const params = new URLSearchParams(location.search)
    const wanted = params.get('redirect')
    // Set when the admin area signed someone out for being idle. Read once, then cleared.
    const [idle] = useState(() => {
        try {
            const flag = sessionStorage.getItem('staffSignedOutIdle') === '1'
            sessionStorage.removeItem('staffSignedOutIdle')
            return flag
        } catch (e) { return false }
    })

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [notStaff, setNotStaff] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [choosing, setChoosing] = useState(false)

    const dispatch = useDispatch()
    const store = useStoreBrand()
    const { error, loading, userInfo } = useSelector((state) => state.userLogin)

    useEffect(() => {
        if (!userInfo) return
        const role = roleOf(userInfo)
        if (!role) {
            // A customer account typed in here: sign it straight back out and explain.
            // A customer who was already signed in is only offered a sign-out below.
            if (submitted) {
                dispatch(logout())
                setNotStaff(true)
            }
            return
        }
        // Someone who works in several businesses picks one first (once per device).
        if (submitted && userInfo.businesses && userInfo.businesses.length > 1 && !hasChosenBusiness(userInfo)) {
            setChoosing(true)
            return
        }
        history.replace(wanted && canOpen(role, wanted) ? wanted : homeFor(role))
    }, [userInfo, wanted, history, dispatch, submitted])

    const choose = (business) => {
        setActiveBusiness(business.slug)
        history.replace(homeFor(business.role))
    }

    const submit = (e) => {
        e.preventDefault()
        setNotStaff(false)
        setSubmitted(true)
        dispatch(login(email.trim(), password))
    }

    return (
        <div className="theme-dark flex min-h-screen bg-[var(--admin-bg)] text-slate-900">
            {/* Brand panel, in the store's own colours */}
            <aside className="keep-colors relative hidden w-1/2 max-w-[56rem] shrink-0 flex-col justify-between overflow-hidden bg-[#0c0e13] p-12 text-white lg:flex"
                style={{ backgroundImage: 'radial-gradient(circle at 18% 12%, color-mix(in oklab, var(--brand-600) 55%, transparent) 0, transparent 46%), radial-gradient(circle at 88% 92%, color-mix(in oklab, var(--brand-800) 70%, transparent) 0, transparent 52%)' }}>
                <div className="flex items-center gap-3">
                    <StoreLogo className="h-10 w-10 rounded-xl shadow-lg shadow-black/30" />
                    <div className="leading-tight">
                        <p className="font-bold"><StoreName accentClassName="text-brand-300" /></p>
                        <p className="text-xs text-white/60">{store.tagline}</p>
                    </div>
                </div>
                <div className="max-w-md">
                    <h2 className="text-4xl font-bold leading-tight tracking-tight">Everything the shop needs, in one sign-in.</h2>
                    <ul className="mt-10 space-y-5">
                        {[
                            [Store, 'Counter', 'Cashiers go straight to the till.'],
                            [Boxes, 'Stock and deliveries', 'Batches, expiry dates and supplier receipts.'],
                            [ShoppingCart, 'Online orders', 'Website orders and customer messages.'],
                            [LayoutDashboard, 'Manager dashboard', 'Today\'s sales, profit and what needs attention.'],
                        ].map(([Icon, title, text]) => (
                            <li key={title} className="flex items-start gap-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"><Icon className="h-[18px] w-[18px]" /></span>
                                <span>
                                    <span className="block font-semibold">{title}</span>
                                    <span className="block text-sm text-white/60">{text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-xs text-white/50">{store.location ? `${store.name} · ${store.location}. ` : ''}On a shared computer you're signed out automatically after a while without activity.</p>
            </aside>

            {/* Form */}
            <main className="flex flex-1 items-center justify-center px-4 py-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 lg:hidden">
                        <StoreLogo className="mb-4 h-11 w-11 rounded-xl" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff sign-in</h1>
                    <p className="mt-1 text-sm text-slate-500">{store.name}{store.location ? ` · ${store.location}` : ''}</p>

                    {idle && !submitted && (
                        <Alert variant="info" className="mt-6">
                            You were signed out after a period without activity. Sign in again to carry on where you left off.
                        </Alert>
                    )}
                    {notStaff && (
                        <Alert variant="danger" className="mt-6">
                            This account has no staff access to an open business. If you work here, ask your manager to add you.{' '}
                            <Link to="/login" className="font-semibold underline">Customers sign in here</Link>.
                        </Alert>
                    )}
                    {error && submitted && !notStaff && <Alert variant="danger" className="mt-6">{error}</Alert>}
                    {userInfo && !roleOf(userInfo) && !submitted && (
                        <Alert variant="info" className="mt-6">
                            You're signed in as {userInfo.name}, a customer account.{' '}
                            <button type="button" onClick={() => dispatch(logout())} className="font-semibold underline">Sign out</button> to use a staff account.
                        </Alert>
                    )}

                    {choosing ? (
                        <div className="mt-6">
                            <p className="text-sm font-medium text-slate-700">You work in more than one business. Which one do you want to open?</p>
                            <ul className="mt-3 space-y-2">
                                {userInfo.businesses.map((b) => (
                                    <li key={b.slug}>
                                        <button type="button" onClick={() => choose(b)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-500 hover:bg-brand-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><Building2 className="h-4 w-4" /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-slate-900">{b.name}</span>
                                                <span className="block truncate text-xs text-slate-500">{ROLE_LABELS[b.role]}{b.location ? ` · ${b.location}` : ''}</span>
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-slate-300" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-4 text-xs text-slate-500">You can switch at any time from your account menu.</p>
                        </div>
                    ) : (
                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <Field label="Email" id="staff-email">
                            <Input id="staff-email" type="email" autoComplete="username" autoFocus required
                                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@krishibazar.com" />
                        </Field>
                        <Field label="Password" id="staff-password">
                            <Input id="staff-password" type="password" autoComplete="current-password" required
                                value={password} onChange={(e) => setPassword(e.target.value)} />
                        </Field>
                        <Button type="submit" block size="lg" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
                    </form>
                    )}

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Not staff? <Link to="/" className="font-semibold text-brand-700 hover:underline">Go to the shop</Link>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default StaffLoginScreen

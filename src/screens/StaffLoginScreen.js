import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Sprout, Store, Boxes, ShoppingCart, LayoutDashboard } from 'lucide-react'
import { Alert, Button, Field, Input } from '../components/ui'
import { login, logout } from '../actions/userActions'
import { canOpen, homeFor, roleOf } from '../admin_components/roles'

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

    const dispatch = useDispatch()
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
        history.replace(wanted && canOpen(role, wanted) ? wanted : homeFor(role))
    }, [userInfo, wanted, history, dispatch, submitted])

    const submit = (e) => {
        e.preventDefault()
        setNotStaff(false)
        setSubmitted(true)
        dispatch(login(email.trim(), password))
    }

    return (
        <div className="flex min-h-screen bg-[#f3f4f6]">
            {/* Brand panel */}
            <aside className="hidden w-[26rem] shrink-0 flex-col justify-between bg-[#16191d] p-10 text-white lg:flex">
                <div className="flex items-center gap-2.5 text-lg font-bold">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500"><Sprout className="h-5 w-5" /></span>
                    Krishi <span className="text-brand-400">Bazar</span>
                </div>
                <div>
                    <h2 className="text-3xl font-bold leading-tight">Shop staff</h2>
                    <p className="mt-3 text-slate-400">One sign-in for everyone who runs the shop. You'll go straight to the pages your role uses.</p>
                    <ul className="mt-8 space-y-3 text-sm text-slate-300">
                        <li className="flex items-center gap-3"><Store className="h-4 w-4 text-brand-400" /> Cashiers open the counter</li>
                        <li className="flex items-center gap-3"><Boxes className="h-4 w-4 text-brand-400" /> Stock keepers open stock and deliveries</li>
                        <li className="flex items-center gap-3"><ShoppingCart className="h-4 w-4 text-brand-400" /> Online orders staff open website orders</li>
                        <li className="flex items-center gap-3"><LayoutDashboard className="h-4 w-4 text-brand-400" /> Managers open the dashboard</li>
                    </ul>
                </div>
                <p className="text-xs text-slate-500">On a shared computer you're signed out automatically after a while without activity.</p>
            </aside>

            {/* Form */}
            <main className="flex flex-1 items-center justify-center px-4 py-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 lg:hidden">
                        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#16191d] text-brand-400"><Sprout className="h-5 w-5" /></span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff sign-in</h1>
                    <p className="mt-1 text-sm text-slate-500">Krishi Bazar · Sylhet</p>

                    {idle && !submitted && (
                        <Alert variant="info" className="mt-6">
                            You were signed out after a period without activity. Sign in again to carry on where you left off.
                        </Alert>
                    )}
                    {notStaff && (
                        <Alert variant="danger" className="mt-6">
                            That is a customer account. This page is for shop staff.{' '}
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

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Not staff? <Link to="/" className="font-semibold text-brand-700 hover:underline">Go to the shop</Link>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default StaffLoginScreen

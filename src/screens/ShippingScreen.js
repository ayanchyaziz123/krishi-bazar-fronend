import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { Store, Truck, MapPin, Pencil, Trash2, LogOut, Plus, Phone, AlertTriangle, Clock } from 'lucide-react'
import CheckoutSteps, { CheckoutBar, checkoutButton } from '../components/CheckoutSteps'
import { Alert, Checkbox, Container, Field, Input, Modal, Select, Spinner, cn, formatINR } from '../components/ui'
import { logout } from '../actions/userActions'
import { saveShippingAddress } from '../actions/cartActions'
import { useStoreBrand } from '../components/storeBrand'
import {
    addressLines, cartTotals, deliversTo, getCheckoutAddress, getDeliveryMethod, setCheckoutAddress, setDeliveryMethod, shippingRules,
} from '../components/shop/checkout'

const EMPTY = { label: 'Home', full_name: '', phone: '', line1: '', area: '', landmark: '', city: '', state: '', pincode: '', is_default: false }
const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || 'Something went wrong. Please try again.'

// Add or change a saved address: who receives it, how to reach them, and where.
function AddressForm({ address, states, rules, auth, onClose, onSaved }) {
    const [form, setForm] = useState({ ...EMPTY, ...(address || {}) })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    const pinOk = /^[1-9]\d{5}$/.test(form.pincode)
    const outsideArea = pinOk && !deliversTo(rules, form.pincode)

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        const req = address && address.id
            ? axios.patch(`/api/users/addresses/${address.id}/`, form, auth)
            : axios.post('/api/users/addresses/', form, auth)
        req.then(({ data }) => onSaved(data)).catch((err) => setError(errorText(err))).finally(() => setSaving(false))
    }

    return (
        <Modal show onClose={onClose} title={address && address.id ? 'Edit address' : 'Add a new address'}>
            <form onSubmit={save} className="space-y-3">
                <div className="flex gap-2" role="radiogroup" aria-label="Address type">
                    {['Home', 'Work', 'Other'].map((label) => (
                        <button key={label} type="button" role="radio" aria-checked={form.label === label} onClick={() => setForm((f) => ({ ...f, label }))}
                            className={cn('rounded-full px-4 py-1.5 text-sm font-semibold ring-1', form.label === label ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-200')}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Full name" id="a-name"><Input id="a-name" required autoComplete="name" value={form.full_name} onChange={set('full_name')} /></Field>
                    <Field label="Mobile number" id="a-phone" hint="For the delivery person to call you.">
                        <Input id="a-phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={form.phone} onChange={set('phone')} />
                    </Field>
                </div>
                <Field label="House / flat, building and street" id="a-line1">
                    <Input id="a-line1" required autoComplete="address-line1" value={form.line1} onChange={set('line1')} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Area or locality" id="a-area"><Input id="a-area" autoComplete="address-line2" value={form.area} onChange={set('area')} /></Field>
                    <Field label="Landmark (optional)" id="a-landmark"><Input id="a-landmark" placeholder="e.g. near the post office" value={form.landmark} onChange={set('landmark')} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Field label="PIN code" id="a-pin">
                        <Input id="a-pin" required inputMode="numeric" maxLength={6} autoComplete="postal-code" value={form.pincode}
                            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} />
                    </Field>
                    <Field label="Town / city" id="a-city"><Input id="a-city" required autoComplete="address-level2" value={form.city} onChange={set('city')} /></Field>
                    <Field label="State" id="a-state" className="col-span-2 sm:col-span-1">
                        <Select id="a-state" required value={form.state} onChange={set('state')}>
                            <option value="">Choose…</option>
                            {states.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </Field>
                </div>
                {outsideArea && (
                    <Alert variant="warning">We don't deliver to PIN {form.pincode} yet. You can still save it, or choose store pick-up.</Alert>
                )}
                <Checkbox id="a-default" label="Use this as my default address" checked={Boolean(form.is_default)} onChange={set('is_default')} />
                {error && <Alert variant="danger">{error}</Alert>}
                <div className="flex gap-2 pt-1">
                    <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={saving} className="h-11 flex-1 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                        {saving ? 'Saving…' : 'Save address'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

// Step 1: who is ordering, and whether it is collected from the shop or delivered (and where).
function ShippingScreen({ history }) {
    const dispatch = useDispatch()
    const store = useStoreBrand()
    const rules = shippingRules(store)
    const { userInfo } = useSelector((state) => state.userLogin)
    const { cartItems } = useSelector((state) => state.cart)

    const [method, setMethod] = useState(() => {
        const saved = getDeliveryMethod()
        if (saved === 'pickup' && !rules.pickupEnabled) return 'deliver'
        if (saved === 'deliver' && !rules.deliveryEnabled) return 'pickup'
        return saved
    })
    const [addresses, setAddresses] = useState(null)
    const [states, setStates] = useState([])
    const [selected, setSelected] = useState(() => (getCheckoutAddress() || {}).id || null)
    const [editing, setEditing] = useState(null) // null, {} for a new address, or the address
    const [error, setError] = useState('')
    const auth = { headers: { Authorization: `Bearer ${userInfo ? userInfo.token : ''}` } }

    const load = useCallback(() => {
        if (!userInfo) return
        axios.get('/api/users/addresses/', { headers: { Authorization: `Bearer ${userInfo.token}` } })
            .then(({ data }) => {
                setAddresses(data.addresses)
                setStates(data.states)
                setSelected((cur) => (data.addresses.some((a) => a.id === cur) ? cur
                    : ((data.addresses.find((a) => a.is_default) || data.addresses[0] || {}).id || null)))
            })
            .catch((e) => { setAddresses([]); setError(errorText(e)) })
    }, [userInfo])

    useEffect(() => {
        if (!userInfo) history.replace('/login?redirect=shipping')
        else if (!cartItems.length) history.replace('/cart')
        else load()
    }, [userInfo, cartItems.length, history, load])

    const pickup = method === 'pickup'
    const chosen = (addresses || []).find((a) => a.id === selected)
    const canContinue = pickup ? rules.pickupEnabled : Boolean(chosen && chosen.delivers_here && rules.deliveryEnabled)
    const totals = cartTotals(cartItems, { pickup, rules })

    const remove = (a) => {
        if (!window.confirm(`Delete the ${a.label.toLowerCase()} address?`)) return
        axios.delete(`/api/users/addresses/${a.id}/`, auth).then(load).catch((e) => setError(errorText(e)))
    }

    const next = (e) => {
        e.preventDefault()
        if (!canContinue) return
        setDeliveryMethod(method)
        if (!pickup) {
            setCheckoutAddress(chosen)
            // Older screens read the address in this shape.
            dispatch(saveShippingAddress({ address: chosen.line1, city: chosen.city, postalCode: chosen.pincode, country: chosen.country }))
        }
        history.push('/placeorder')
    }

    const option = (on) => cn('block w-full rounded-2xl bg-white p-4 text-left ring-1 transition', on ? 'ring-2 ring-brand-500' : 'ring-slate-200 hover:ring-slate-300')
    const radio = (on) => (
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-brand-600' : 'border-slate-400')}>
            {on && <span className="h-3 w-3 rounded-full bg-brand-600" />}
        </span>
    )
    const deliveryHint = [
        rules.fee ? formatINR(rules.fee) : 'Free delivery',
        rules.fee && rules.freeOver !== null ? `free over ${formatINR(rules.freeOver)}` : '',
        rules.deliveryTime,
    ].filter(Boolean).join(' · ')

    if (!userInfo) return null

    return (
        <Container className="max-w-3xl pb-28 md:pb-0">
            <CheckoutSteps current={0} />
            <form onSubmit={next} className="space-y-5">
                <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-600 text-xl font-bold uppercase text-white ring-2 ring-red-500 ring-offset-2">
                        {(userInfo.name || '?').charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-slate-900">{userInfo.name}</p>
                        <p className="truncate text-sm text-slate-500">{userInfo.email}</p>
                    </div>
                    <button type="button" onClick={() => { dispatch(logout()); history.push('/login?redirect=shipping') }} aria-label="Use another account"
                        title="Use another account" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><LogOut className="h-5 w-5" /></button>
                </section>

                <h2 className="text-lg font-bold text-slate-900">Choose your preferred way</h2>

                {rules.pickupEnabled && (
                    <button type="button" onClick={() => setMethod('pickup')} className={cn(option(pickup), 'relative')} aria-pressed={pickup}>
                        <span className="absolute -top-2.5 left-4 rounded-md bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">FREE</span>
                        <span className="flex items-center gap-3">
                            <Store className="h-5 w-5 shrink-0 text-red-500" />
                            <span className="min-w-0 flex-1">
                                <span className="block font-bold text-slate-900">Store pick-up</span>
                                <span className="block text-sm text-slate-600">Collect from {store.name}{store.location ? `, ${store.location}` : ''}</span>
                                {rules.pickupTime && <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" /> {rules.pickupTime}</span>}
                            </span>
                            {radio(pickup)}
                        </span>
                    </button>
                )}

                {rules.deliveryEnabled && (
                    <div className={option(!pickup)}>
                        <button type="button" onClick={() => setMethod('deliver')} className="flex w-full items-center gap-3 text-left" aria-pressed={!pickup}>
                            <Truck className="h-5 w-5 shrink-0 text-red-500" />
                            <span className="min-w-0 flex-1">
                                <span className="block font-bold text-slate-900">Deliver here</span>
                                <span className="block text-sm text-slate-600">{deliveryHint}</span>
                            </span>
                            {radio(!pickup)}
                        </button>

                        {!pickup && (
                            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                                {addresses === null ? <Spinner /> : addresses.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 px-4 py-6 text-center">
                                        <MapPin className="h-8 w-8 text-red-500" />
                                        <p className="text-sm text-slate-700">You haven't added an address yet. Add one to continue.</p>
                                    </div>
                                ) : addresses.map((a) => {
                                    const on = a.id === selected
                                    const [line1, line2] = addressLines(a)
                                    return (
                                        <div key={a.id} className={cn('rounded-xl p-3 ring-1 transition', on ? 'bg-brand-50/60 ring-brand-500' : 'ring-slate-200')}>
                                            <button type="button" onClick={() => setSelected(a.id)} aria-pressed={on} className="flex w-full items-start gap-3 text-left">
                                                <span className="mt-0.5">{radio(on)}</span>
                                                <span className="min-w-0 flex-1 text-sm">
                                                    <span className="flex flex-wrap items-center gap-2">
                                                        <span className="font-bold text-slate-900">{a.full_name}</span>
                                                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-slate-700">{a.label}</span>
                                                        {a.is_default && <span className="text-xs font-medium text-brand-700">Default</span>}
                                                    </span>
                                                    <span className="mt-1 block text-slate-700">{line1}</span>
                                                    <span className="block text-slate-700">{line2}</span>
                                                    <span className="mt-1 flex items-center gap-1 text-slate-500"><Phone className="h-3.5 w-3.5" /> {a.phone}</span>
                                                    {!a.delivers_here && (
                                                        <span className="mt-1.5 flex items-center gap-1 font-medium text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> We don't deliver to this PIN yet</span>
                                                    )}
                                                </span>
                                            </button>
                                            <div className="mt-2 flex gap-4 pl-9 text-sm">
                                                <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1 font-semibold text-blue-600"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                                                <button type="button" onClick={() => remove(a)} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                                            </div>
                                        </div>
                                    )
                                })}
                                <button type="button" onClick={() => setEditing({})}
                                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 font-semibold text-blue-600 hover:border-blue-400">
                                    <Plus className="h-4 w-4" /> Add new address
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                <CheckoutBar total={totals.total}>
                    <button type="submit" disabled={!canContinue} className={checkoutButton}>Continue</button>
                </CheckoutBar>
            </form>

            {editing && (
                <AddressForm address={editing.id ? editing : null} states={states} rules={rules} auth={auth} onClose={() => setEditing(null)}
                    onSaved={(saved) => { setEditing(null); setSelected(saved.id); load() }} />
            )}
        </Container>
    )
}

export default ShippingScreen

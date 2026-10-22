import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Truck, Store, Receipt, MapPin } from 'lucide-react'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Button, Card, Field, Input, Textarea, cn, formatINR, toast } from '../components/ui'
import { saveStoreBrand, useStoreBrand } from '../components/storeBrand'

const toForm = (s) => ({
    delivery_enabled: s.delivery_enabled !== false,
    pickup_enabled: s.pickup_enabled !== false,
    delivery_fee: s.delivery_fee ?? '10',
    free_delivery_over: s.free_delivery_over ?? '',
    min_order: s.min_order ?? '0',
    tax_rate: s.tax_rate ?? '5',
    delivery_time: s.delivery_time || '',
    pickup_time: s.pickup_time || '',
    delivery_pincodes: s.delivery_pincodes || '',
})
// "10.00" and "10" are the same setting.
const same = (a, b) => Object.keys(a).every((k) => (typeof a[k] === 'boolean' ? a[k] === b[k] : String(a[k]).trim() === String(b[k]).trim()
    || (a[k] !== '' && b[k] !== '' && Number(a[k]) === Number(b[k]))))

function Switch({ checked, onChange, label, hint, icon: Icon }) {
    return (
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
            className="flex w-full items-center gap-4 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{label}</span>
                <span className="block text-sm text-slate-500">{hint}</span>
            </span>
            <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-[1.375rem]' : 'left-0.5')} />
            </span>
        </button>
    )
}

// How the online shop delivers: delivery and pick-up, the delivery fee and when it is free,
// the minimum order, tax, timings and the PIN codes delivered to. Checkout uses these.
function DeliverySettingsScreen() {
    const store = useStoreBrand()
    const { userInfo } = useSelector((state) => state.userLogin)
    const saved = toForm(store.shipping || {})
    const [form, setForm] = useState(saved)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => { setForm(toForm(store.shipping || {})) }, [store.shipping])

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e && e.target ? e.target.value : e }))
    const changed = !same(form, saved)
    const fee = Number(form.delivery_fee) || 0
    const pins = form.delivery_pincodes.split(/[\s,;]+/).filter(Boolean)
    const gstRegistered = store.gst && store.gst.mode !== 'none'

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        saveStoreBrand({ shipping: form }, userInfo.token)
            .then(() => toast.success('Delivery settings saved. Checkout uses them now.'))
            .catch((err) => setError((err.response && err.response.data && err.response.data.detail) || err.message))
            .finally(() => setSaving(false))
    }

    return (
        <AdminLayout title="Delivery" subtitle="How customers get their online orders, and what delivery costs. Checkout shows and charges exactly this.">
            <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <div className="space-y-6">
                    <Card className="divide-y divide-slate-100 rounded-xl">
                        <div className="p-5">
                            <Switch icon={Truck} checked={form.delivery_enabled} onChange={set('delivery_enabled')} label="Home delivery"
                                hint="Deliver orders to the customer's address." />
                        </div>
                        <div className="p-5">
                            <Switch icon={Store} checked={form.pickup_enabled} onChange={set('pickup_enabled')} label="Store pick-up"
                                hint="Customers collect from your shop. There is never a delivery charge." />
                        </div>
                    </Card>

                    {form.delivery_enabled && (
                        <Card className="space-y-4 rounded-xl p-5">
                            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Truck className="h-4 w-4 text-slate-500" /> Delivery charges</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Delivery fee (₹)" id="d-fee" hint="0 for free delivery.">
                                    <Input id="d-fee" type="number" min="0" step="0.01" inputMode="decimal" required value={form.delivery_fee} onChange={set('delivery_fee')} />
                                </Field>
                                <Field label="Free delivery over (₹)" id="d-free" hint="Leave empty to always charge the fee.">
                                    <Input id="d-free" type="number" min="0" step="0.01" inputMode="decimal" value={form.free_delivery_over} onChange={set('free_delivery_over')} />
                                </Field>
                                <Field label="Delivery time" id="d-time" hint='Shown at checkout, e.g. "1-2 days" or "Same day".'>
                                    <Input id="d-time" maxLength={80} value={form.delivery_time} onChange={set('delivery_time')} placeholder="e.g. 1-2 days" />
                                </Field>
                            </div>
                        </Card>
                    )}

                    {form.delivery_enabled && (
                        <Card className="space-y-3 rounded-xl p-5">
                            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-4 w-4 text-slate-500" /> Where you deliver</h2>
                            <Field label="PIN codes" id="d-pins"
                                hint="Separate with commas. End with * to cover every PIN that starts the same, e.g. 7880* for all of 788001–788099. Leave empty to deliver everywhere.">
                                <Textarea id="d-pins" rows={3} value={form.delivery_pincodes} onChange={set('delivery_pincodes')} placeholder="e.g. 788001, 788005, 7881*" />
                            </Field>
                            <p className="text-sm text-slate-600">{pins.length ? `Delivering to ${pins.length} ${pins.length === 1 ? 'PIN code or area' : 'PIN codes or areas'}. Other addresses can still choose pick-up.` : 'Delivering to every PIN code.'}</p>
                        </Card>
                    )}

                    {form.pickup_enabled && (
                        <Card className="space-y-4 rounded-xl p-5">
                            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Store className="h-4 w-4 text-slate-500" /> Store pick-up</h2>
                            <Field label="When orders are ready" id="p-time" hint={`Customers collect from ${store.address || store.name}. Change the address in Settings.`}>
                                <Input id="p-time" maxLength={80} value={form.pickup_time} onChange={set('pickup_time')} placeholder="e.g. Ready in 2 hours" />
                            </Field>
                        </Card>
                    )}

                    <Card className="space-y-4 rounded-xl p-5">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Receipt className="h-4 w-4 text-slate-500" /> Order rules</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Minimum order (₹)" id="o-min" hint="0 for no minimum. Counts the goods only.">
                                <Input id="o-min" type="number" min="0" step="0.01" inputMode="decimal" required value={form.min_order} onChange={set('min_order')} />
                            </Field>
                            <Field label="Tax on online orders (%)" id="o-tax" hint={gstRegistered ? 'Not used: the shop is GST registered, so each item\'s GST rate applies (Settings).' : 'Added to the goods at checkout. Only for shops not registered for GST.'}>
                                <Input id="o-tax" type="number" min="0" max="100" step="0.01" inputMode="decimal" required value={form.tax_rate} onChange={set('tax_rate')} />
                            </Field>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                    <Card className="space-y-2 rounded-xl p-5 text-sm">
                        <p className="font-semibold text-slate-900">What customers see</p>
                        {form.delivery_enabled && (
                            <p className="text-slate-600"><strong className="text-slate-900">Delivery:</strong> {fee ? formatINR(fee) : 'Free'}
                                {fee && form.free_delivery_over !== '' ? `, free over ${formatINR(form.free_delivery_over)}` : ''}{form.delivery_time ? ` · ${form.delivery_time}` : ''}</p>
                        )}
                        {form.pickup_enabled && <p className="text-slate-600"><strong className="text-slate-900">Pick-up:</strong> Free{form.pickup_time ? ` · ${form.pickup_time}` : ''}</p>}
                        {Number(form.min_order) > 0 && <p className="text-slate-600"><strong className="text-slate-900">Minimum order:</strong> {formatINR(form.min_order)}</p>}
                        <p className="text-slate-600"><strong className="text-slate-900">Tax:</strong> {Number(form.tax_rate) || 0}%</p>
                    </Card>
                    {!form.delivery_enabled && !form.pickup_enabled && <Alert variant="danger">Turn on delivery or pick-up, or customers can't place orders.</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Button type="submit" block size="lg" disabled={saving || !changed || (!form.delivery_enabled && !form.pickup_enabled)}>
                        {saving ? 'Saving…' : changed ? 'Save delivery settings' : 'Saved'}
                    </Button>
                    {changed && <Button type="button" block variant="ghost" onClick={() => setForm(saved)}>Undo changes</Button>}
                </div>
            </form>
        </AdminLayout>
    )
}

export default DeliverySettingsScreen

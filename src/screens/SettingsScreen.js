import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Check, Palette, Store, Upload, X } from 'lucide-react'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, Field, Input, Select, cn, toast } from '../components/ui'
import { StoreLogo, previewAccent, resetPreview, saveStoreBrand, useStoreBrand } from '../components/storeBrand'
import { THEME_PRESETS, isHex, whiteContrast } from '../components/shop/theme'
import { GST_STATES, gstOf } from '../components/shop/gst'

const FIELDS = [
    ['name', 'Store name', 'e.g. Krishi Bazar', true],
    ['tagline', 'Tagline', 'One line about the store'],
    ['location', 'Location or branch', 'e.g. Sylhet'],
    ['address', 'Address', 'Shown on receipts and the contact page'],
    ['phone', 'Phone', 'e.g. +91 98765 43210'],
    ['email', 'Email', 'e.g. hello@yourstore.com'],
    ['receipt_footer', 'Receipt message', 'Printed at the bottom of every receipt'],
]

// The store's name, details and colour. Changing them re-brands the shop, the admin,
// receipts and the staff sign-in, so the same system can run a different store.
function SettingsScreen() {
    const store = useStoreBrand()
    const { userInfo } = useSelector((state) => state.userLogin)
    const [form, setForm] = useState(store)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => { setForm(store) }, [store])
    // Leaving the page without saving puts the saved colour back.
    useEffect(() => () => resetPreview(), [])

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
    const chooseColour = (hex) => {
        setForm((f) => ({ ...f, accent: hex }))
        if (isHex(hex)) previewAccent(hex)
    }
    const fileRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const uploadLogo = (file) => {
        if (!file) return
        const data = new FormData()
        data.append('image', file)
        setUploading(true)
        axios.post('/api/site/images/', data, { headers: { Authorization: `Bearer ${userInfo.token}` } })
            .then(({ data: res }) => setForm((f) => ({ ...f, logo: res.url })))
            .catch((err) => setMessage({ type: 'danger', text: (err.response && err.response.data && err.response.data.detail) || err.message }))
            .finally(() => setUploading(false))
    }
    const contrast = whiteContrast(form.accent)
    const g = gstOf(form)
    const setGst = (changes) => setForm((f) => ({ ...f, gst: { ...gstOf(f), ...changes } }))
    const changed = Object.keys(form).some((k) => (k === 'gst' ? JSON.stringify(form.gst) !== JSON.stringify(store.gst) : form[k] !== store[k]))

    const save = (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)
        // Delivery settings are saved on their own page.
        const { updatedAt, shipping, slug, ...changes } = form
        saveStoreBrand(changes, userInfo.token)
            .then(() => { setMessage({ type: 'success', text: 'Saved. The admin, counter, receipts and staff sign-in now use these details.' }); toast.success('Store settings saved') })
            .catch((err) => setMessage({ type: 'danger', text: (err.response && err.response.data && err.response.data.detail) || err.message }))
            .finally(() => setSaving(false))
    }

    return (
        <AdminLayout title="Settings" subtitle="Your store's name, details, colour and logo for the admin, counter, receipts and staff sign-in. The online shop's look is set separately in Website → Theme.">
            <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <div className="space-y-6">
                    <Card className="rounded-xl p-6">
                        <h2 className="mb-5 flex items-center gap-2 font-semibold text-slate-900"><Store className="h-4 w-4 text-slate-500" /> Store details</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {FIELDS.map(([key, label, placeholder, required]) => (
                                <Field key={key} label={label} id={`store-${key}`} className={key === 'address' || key === 'receipt_footer' || key === 'tagline' ? 'sm:col-span-2' : ''}>
                                    <Input id={`store-${key}`} required={required} value={form[key] || ''} onChange={set(key)} placeholder={placeholder} />
                                </Field>
                            ))}
                        </div>
                    </Card>

                    <Card className="rounded-xl p-6">
                        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900"><Palette className="h-4 w-4 text-slate-500" /> Admin and counter colour</h2>
                        <p className="mb-4 text-sm text-slate-500">Buttons, menus and highlights in the admin and at the counter. You see it straight away; it's kept when you save.</p>
                        <div className="flex flex-wrap gap-2.5">
                            {THEME_PRESETS.map(([label, hex]) => (
                                <button key={hex} type="button" onClick={() => chooseColour(hex)} title={label} aria-label={`${label} colour`} aria-pressed={(form.accent || '').toLowerCase() === hex}
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:scale-105 ${(form.accent || '').toLowerCase() === hex ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
                                    style={{ background: hex }}>
                                    {(form.accent || '').toLowerCase() === hex && <Check className="h-5 w-5 text-white" />}
                                </button>
                            ))}
                            <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600" title="Pick any colour">
                                <input type="color" value={isHex(form.accent) ? form.accent : '#047857'} onChange={(e) => chooseColour(e.target.value)}
                                    className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Custom colour" />
                                Custom
                            </label>
                        </div>
                        {contrast < 3 && <Alert variant="warning" className="mt-3">White text on this colour is hard to read. A darker shade keeps buttons clear.</Alert>}
                    </Card>

                    <Card className="rounded-xl p-6">
                        <h2 className="mb-1 font-semibold text-slate-900">GST</h2>
                        <p className="mb-4 text-sm text-slate-500">How the shop charges GST at the counter and online. Each item's HSN code and GST rate are set on the Items page.</p>
                        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="GST registration">
                            {[['none', 'Not registered', 'No GST on bills.'], ['regular', 'Regular GST', 'GST per item; tax invoices.'], ['composition', 'Composition scheme', 'No GST charged; bill of supply.']].map(([value, label, hint]) => (
                                <button key={value} type="button" role="radio" aria-checked={g.mode === value} onClick={() => setGst({ mode: value })}
                                    className={cn('rounded-xl p-3 text-left ring-1 transition', g.mode === value ? 'bg-brand-50 ring-2 ring-brand-600' : 'ring-slate-200 hover:ring-slate-300')}>
                                    <span className="block text-sm font-semibold text-slate-900">{label}</span>
                                    <span className="block text-xs text-slate-500">{hint}</span>
                                </button>
                            ))}
                        </div>
                        {g.mode !== 'none' && (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label="GSTIN" id="gstin" hint="15 characters, e.g. 27AAPFU0939F1ZV.">
                                    <Input id="gstin" maxLength={15} value={g.gstin} onChange={(e) => setGst({ gstin: e.target.value.toUpperCase().replace(/\s/g, '') })} className="font-mono uppercase" required />
                                </Field>
                                <Field label="State" id="gst-state" hint="Where the shop is registered. Customers in other states pay IGST.">
                                    <Select id="gst-state" value={g.state} onChange={(e) => setGst({ state: e.target.value })} required>
                                        <option value="">Choose…</option>
                                        {GST_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                </Field>
                                {g.mode === 'regular' && (
                                    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700 sm:col-span-2">
                                        <input type="checkbox" checked={g.prices_include_gst} onChange={(e) => setGst({ prices_include_gst: e.target.checked })} className="mt-0.5 accent-brand-600" />
                                        <span>Selling prices already include GST (like an MRP)
                                            <span className="block text-xs text-slate-500">Untick if GST should be added on top of your prices at the counter and online.</span>
                                        </span>
                                    </label>
                                )}
                            </div>
                        )}
                        <p className="mt-3 text-xs text-slate-500">Check GST rates and registration with your CA. Rates change; the app uses what you set.</p>
                    </Card>

                    <Card className="rounded-xl p-6">
                        <h2 className="mb-1 font-semibold text-slate-900">Store logo</h2>
                        <p className="mb-4 text-sm text-slate-500">Shown in the admin sidebar, on printed receipts and on the staff sign-in. The online shop's logo is set in Website → Theme.</p>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" aria-label="Upload store logo"
                            onChange={(e) => { uploadLogo(e.target.files[0]); e.target.value = '' }} />
                        <div className="flex flex-wrap items-center gap-3">
                            <StoreLogo src={form.logo || ''} className="h-14 w-14 rounded-xl ring-1 ring-slate-200" iconClassName="h-6 w-6" />
                            <Button type="button" variant="secondary" disabled={uploading} onClick={() => fileRef.current.click()}>
                                <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : form.logo ? 'Change logo' : 'Upload logo'}
                            </Button>
                            {form.logo && <Button type="button" variant="ghost" onClick={() => setForm((f) => ({ ...f, logo: '' }))}><X className="h-4 w-4" /> Remove</Button>}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">JPG, PNG, WEBP or GIF, up to 8 MB. Saved when you press Save settings.</p>
                    </Card>
                </div>

                {/* Live preview */}
                <div className="space-y-4">
                    <Card className="overflow-hidden rounded-xl">
                        <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-5 text-white">
                            <div className="flex items-center gap-2.5">
                                <StoreLogo src={form.logo || ''} className="h-9 w-9 rounded-xl" />
                                <div className="leading-tight">
                                    <p className="font-bold">{form.name || 'Store name'}</p>
                                    <p className="text-xs text-white/70">{form.tagline}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 p-5 text-sm">
                            <p className="font-medium text-slate-900">Preview</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white">Charge ₹450</span>
                                <Badge variant="brand">Sale</Badge>
                                <a href="#preview" onClick={(e) => e.preventDefault()} className="font-semibold text-brand-700">View items</a>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 rounded-full bg-brand-500" /></div>
                            <p className="text-xs text-slate-500">{form.address}{form.location && !String(form.address || '').includes(form.location) ? ` · ${form.location}` : ''}</p>
                        </div>
                    </Card>

                    {message && <Alert variant={message.type}>{message.text}</Alert>}
                    <Button type="submit" block size="lg" disabled={saving || !changed}>{saving ? 'Saving…' : changed ? 'Save settings' : 'Saved'}</Button>
                    {changed && (
                        <Button type="button" block variant="ghost" onClick={() => { setForm(store); resetPreview() }}>Undo changes</Button>
                    )}
                </div>
            </form>
        </AdminLayout>
    )
}

export default SettingsScreen

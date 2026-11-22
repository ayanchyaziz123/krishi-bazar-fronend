import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft, Image as ImageIcon, ImagePlus, Search, Trash2, Upload, X } from 'lucide-react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { Alert, Card, Field, Input, Label, Button, Select, cn, formatINR } from '../components/ui'
import { GST_RATES } from '../components/shop/gst'
import { useCategories } from '../components/categories'
import { useStoreBrand } from '../components/storeBrand'

const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || e.message
// One main photo and up to four more.
const MAIN_PHOTO = 'image'
const EXTRA_PHOTOS = ['image2', 'image3', 'image4', 'image5']
const PHOTO_FIELDS = [MAIN_PHOTO, ...EXTRA_PHOTOS]
const PLACEHOLDER = /placeholder/

const EMPTY = {
    name: '', category: '', brand: '', weight: '', unit: 'piece', description: '',
    price: '', online_price: '', countInStock: '', is_offer: false, offer_percentage: 0,
    sell_online: true, sell_in_shop: true, sold_by_weight: false, code: '', hsn_code: '', gst_rate: '0',
}

// Add a new product or edit one. A new product is only saved when the form is complete,
// so half-filled "Sample" products are never created.
function ProductEditScreen({ match, history, location }) {
    const productId = match.params.id
    const isNew = !productId
    // A combo: one item made of other products (Products → New combo).
    const [isCombo, setIsCombo] = useState(() => isNew && new URLSearchParams(location.search).get('combo') === '1')
    const [parts, setParts] = useState([])   // [{ product, name, unit, sold_by_weight, price, cost, qty }]
    const [available, setAvailable] = useState(null)
    const categories = useCategories()
    const store = useStoreBrand()
    const { userInfo } = useSelector((state) => state.userLogin)
    const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }), [userInfo])

    // A new combo starts in the Combos category; the owner can pick another.
    const [form, setForm] = useState(() => (isCombo ? { ...EMPTY, category: 'Combos' } : EMPTY))
    const [photos, setPhotos] = useState({})     // what is shown for each photo slot
    const [pending, setPending] = useState({})   // photos chosen for a new product, uploaded after saving
    const [loading, setLoading] = useState(!isNew)
    const [loadError, setLoadError] = useState('')
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState('')
    const [error, setError] = useState('')

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))

    useEffect(() => {
        if (isNew) return
        axios.get(`/api/products/${productId}/`, auth)
            .then(({ data }) => {
                const p = data.product
                if (p.is_combo) {
                    setIsCombo(true)
                    setAvailable(p.countInStock)
                    setParts((p.combo ? p.combo.items : []).map((i) => ({ ...i, qty: String(i.qty) })))
                }
                setForm({
                    name: p.name || '', category: p.category || '', brand: p.brand || '', weight: p.weight || '',
                    unit: p.unit || 'piece', description: p.description || '',
                    // `price` is what the website charges; the editor works with the shop price.
                    price: p.shop_price != null ? String(Number(p.shop_price)) : '',
                    online_price: p.online_price != null ? String(Number(p.online_price)) : '',
                    countInStock: String(p.stock_exact ?? p.countInStock ?? 0),
                    is_offer: Boolean(p.is_offer), offer_percentage: p.offer_percentage || 0,
                    sell_online: p.sell_online !== false, sell_in_shop: p.sell_in_shop !== false,
                    sold_by_weight: Boolean(p.sold_by_weight), code: p.code || '',
                    hsn_code: p.hsn_code || '', gst_rate: String(Number(p.gst_rate || 0)),
                })
                setPhotos(Object.fromEntries(PHOTO_FIELDS.map((f) => [f, p[f] && !PLACEHOLDER.test(p[f]) ? p[f] : null])))
            })
            .catch((e) => setLoadError(errorText(e)))
            .finally(() => setLoading(false))
    }, [isNew, productId, auth])

    // Free the previews of photos waiting to be uploaded when leaving the page.
    const pendingRef = useRef(pending)
    pendingRef.current = pending
    useEffect(() => () => Object.values(pendingRef.current).forEach((p) => URL.revokeObjectURL(p.preview)), [])
    const photoOf = (field) => (pending[field] && pending[field].preview) || photos[field] || null

    const uploadPhoto = (id, field, file) => {
        const data = new FormData()
        data.append('product_id', id)
        data.append(field, file)
        return axios.post('/api/products/upload/', data, auth).then((res) => res.data.url)
    }

    const choosePhoto = (field, file) => {
        if (!file) return Promise.resolve()
        setError('')
        if (isNew) {
            setPending((p) => {
                if (p[field]) URL.revokeObjectURL(p[field].preview)
                return { ...p, [field]: { file, preview: URL.createObjectURL(file) } }
            })
            return Promise.resolve()
        }
        setUploading(field)
        return uploadPhoto(productId, field, file)
            .then((url) => setPhotos((p) => ({ ...p, [field]: url })))
            .catch((e) => setError(errorText(e)))
            .finally(() => setUploading(''))
    }

    // Extra photos fill the free slots in order; more than four are left out.
    const addExtraPhotos = async (files) => {
        const free = EXTRA_PHOTOS.filter((f) => !photoOf(f))
        const chosen = Array.from(files || [])
        for (let k = 0; k < Math.min(free.length, chosen.length); k += 1) {
            // eslint-disable-next-line no-await-in-loop
            await choosePhoto(free[k], chosen[k])
        }
        if (chosen.length > free.length) setError(`Up to 4 more photos. ${chosen.length - free.length} were left out.`)
    }

    const removePhoto = (field) => {
        if (pending[field]) {
            URL.revokeObjectURL(pending[field].preview)
            setPending(({ [field]: _, ...rest }) => rest)
            return
        }
        setUploading(field)
        const data = new FormData()
        data.append('product_id', productId)
        data.append('remove', field)
        axios.post('/api/products/upload/', data, auth)
            .then(() => setPhotos((p) => ({ ...p, [field]: null })))
            .catch((e) => setError(errorText(e)))
            .finally(() => setUploading(''))
    }

    const submit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        const body = { ...form, offer_percentage: Number(form.offer_percentage) || 0 }
        if (isCombo) {
            body.is_combo = true
            body.combo_items = parts.map((p) => ({ product: p.product, qty: p.qty }))
            delete body.countInStock
        }
        try {
            if (isNew) {
                const { data } = await axios.post('/api/products/create/', body, auth)
                for (const [field, { file }] of Object.entries(pending)) {
                    // eslint-disable-next-line no-await-in-loop
                    await uploadPhoto(data._id, field, file)
                }
            } else {
                await axios.put(`/api/products/update/${productId}/`, body, auth)
            }
            history.push('/admin/productlist')
        } catch (err) {
            setError(errorText(err))
            setSaving(false)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    if (loading) return <Loader />
    if (loadError) return <FormContainer wide><Alert variant="danger">{loadError}</Alert></FormContainer>

    const gstOn = Boolean(store.gst && store.gst.mode !== 'none')
    const title = isCombo ? (isNew ? 'New combo' : 'Edit combo') : isNew ? 'New product' : 'Edit product'
    const saveLabel = saving ? 'Saving…' : isCombo ? (isNew ? 'Add combo' : 'Save combo') : isNew ? 'Add product' : 'Save product'
    const cantSave = saving || Boolean(uploading) || (isCombo && parts.length < 2)
    const offerOff = (n) => (form.is_offer ? n - (n * (Number(form.offer_percentage) || 0)) / 100 : n)
    const shopPrice = Number(form.price) || 0
    const webPrice = form.online_price !== '' ? Number(form.online_price) || 0 : shopPrice
    const mainPhoto = photoOf(MAIN_PHOTO)
    const extras = EXTRA_PHOTOS.filter((f) => photoOf(f))

    return (
        <div className="mx-auto w-full max-w-6xl px-4 pb-16">
            <form onSubmit={submit}>
                {/* Title bar with the save button, kept in view while scrolling. */}
                <div className="sticky -top-6 z-20 -mx-4 -mt-6 mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 pb-4 pt-10">
                    <Link to="/admin/productlist" aria-label="Back to products" title="Back to products"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{form.name.trim() || title}</h1>
                        <p className="hidden text-xs text-slate-500 sm:block">{form.name.trim() ? title : isCombo ? 'Sell a few products together at one price.' : 'Add it once; it sells at the counter and on your website.'}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button to="/admin/productlist" variant="secondary" className="hidden sm:inline-flex">Cancel</Button>
                        <Button type="submit" disabled={cantSave}>{saveLabel}</Button>
                    </div>
                </div>

                {error && <Alert variant="danger" className="mb-6">{error}</Alert>}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    {/* Main column */}
                    <div className="min-w-0 space-y-6">
                        <Section title={isCombo ? 'Combo details' : 'Product details'}>
                            <Field label="Name" id="name">
                                <Input id="name" required autoFocus={isNew} value={form.name} onChange={set('name')} placeholder={isCombo ? 'e.g. Breakfast Combo' : 'e.g. Basmati Rice'} />
                            </Field>
                            <div className="mt-4">
                                <Label>Description</Label>
                                <div className="product-description overflow-hidden rounded-lg">
                                    <CKEditor editor={ClassicEditor} data={form.description} onChange={(e, editor) => set('description')(editor.getData())} />
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">Shown on the website. What it is, where it comes from, how to use it.</p>
                            </div>
                        </Section>

                        {isCombo && <ComboParts auth={auth} parts={parts} setParts={setParts} price={form.price} selfId={productId} available={available} />}

                        <Section title="Photos" subtitle={isNew ? 'One main photo and up to 4 more. They upload when you save.' : 'One main photo and up to 4 more. Changes save straight away.'}>
                            <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <div>
                                    <p className="mb-2 text-sm font-medium text-slate-700">Main photo</p>
                                    <label htmlFor="file-main"
                                        className={cn('group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition hover:border-brand-400 hover:bg-brand-50/40',
                                            mainPhoto ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50')}>
                                        {uploading === MAIN_PHOTO ? <Loader /> : mainPhoto ? (
                                            <>
                                                <img src={mainPhoto} alt="Main" className="h-full w-full object-contain p-2" />
                                                <span className="absolute inset-x-0 bottom-0 bg-slate-900/60 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">Change photo</span>
                                            </>
                                        ) : (
                                            <span className="flex flex-col items-center gap-1.5 p-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xs ring-1 ring-slate-200"><Upload className="h-4 w-4 text-slate-500" /></span>
                                                <span className="text-sm font-semibold text-slate-700">Add main photo</span>
                                                <span className="text-xs text-slate-500">Shown in lists and at the counter</span>
                                            </span>
                                        )}
                                        <input id="file-main" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
                                            onChange={(e) => { choosePhoto(MAIN_PHOTO, e.target.files[0]); e.target.value = '' }} />
                                    </label>
                                </div>

                                <div>
                                    <p className="mb-2 flex items-baseline justify-between text-sm font-medium text-slate-700">
                                        More photos <span className="text-xs font-normal text-slate-500">{extras.length} of 4</span>
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {extras.map((field, n) => (
                                            <div key={field} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                {uploading === field ? <Loader /> : <img src={photoOf(field)} alt={`Photo ${n + 2}`} className="h-full w-full object-contain p-1.5" />}
                                                <button type="button" aria-label={`Remove photo ${n + 2}`} onClick={() => removePhoto(field)} disabled={Boolean(uploading)}
                                                    className="absolute right-1.5 top-1.5 rounded-full bg-white p-1 text-slate-500 shadow ring-1 ring-slate-200 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
                                            </div>
                                        ))}
                                        {extras.length < 4 && (
                                            <label htmlFor="file-extra"
                                                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
                                                {uploading && uploading !== MAIN_PHOTO && !extras.includes(uploading) ? <Loader /> : (
                                                    <>
                                                        <ImagePlus className="h-5 w-5 text-slate-500" />
                                                        <span className="text-xs font-semibold text-slate-700">Add</span>
                                                        <span className="text-[11px] text-slate-500">{4 - extras.length} left</span>
                                                    </>
                                                )}
                                                <input id="file-extra" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
                                                    onChange={(e) => { addExtraPhotos(e.target.files); e.target.value = '' }} />
                                            </label>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">Other angles, the pack, the label. Shown on the product page online. You can pick several at once.</p>
                                </div>
                            </div>
                        </Section>

                        <Section title="Pricing">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={isCombo ? 'Combo price at the counter' : 'Shop price'} id="price" hint={isCombo ? 'What one combo costs the customer.' : form.sold_by_weight ? `Per ${form.unit || 'kg'}.` : `Per ${form.unit || 'piece'}.`}>
                                    <Money id="price" required value={form.price} onChange={set('price')} />
                                </Field>
                                <Field label="Online price" id="online_price" hint={form.sell_online ? 'Optional. Empty means the same as the shop price.' : 'Not sold on the website.'}>
                                    <Money id="online_price" placeholder={form.price || ''} value={form.online_price} onChange={set('online_price')} disabled={!form.sell_online} />
                                </Field>
                            </div>
                            <div className="mt-5 rounded-xl border border-slate-200 p-4">
                                <Toggle id="is_offer" checked={form.is_offer} onChange={(v) => setForm((f) => ({ ...f, is_offer: v }))}
                                    label="Put on offer" description="Takes a percentage off both prices." />
                                {form.is_offer && (
                                    <div className="mt-4 flex flex-wrap items-end gap-4">
                                        <Field label="Discount" id="offerPercentage" className="w-32">
                                            <div className="relative">
                                                <Input id="offerPercentage" type="number" min="0" max="100" step="1" value={form.offer_percentage} onChange={set('offer_percentage')} className="pr-8" />
                                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                                            </div>
                                        </Field>
                                        {shopPrice > 0 && (
                                            <p className="pb-2.5 text-sm text-slate-600">
                                                Counter <span className="text-slate-400 line-through">{formatINR(shopPrice)}</span> <span className="font-semibold text-emerald-700">{formatINR(offerOff(shopPrice))}</span>
                                                {form.sell_online && <> · Online <span className="text-slate-400 line-through">{formatINR(webPrice)}</span> <span className="font-semibold text-emerald-700">{formatINR(offerOff(webPrice))}</span></>}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Section>

                        {!isCombo && (
                            <Section title="Inventory" subtitle="The counter and the website share one stock count.">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Counted in" id="unit" hint="How one unit is counted.">
                                        <Input id="unit" maxLength={40} list="unit-options" value={form.unit} onChange={set('unit')} placeholder="piece, kg, jar" />
                                        <datalist id="unit-options">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                                    </Field>
                                    <Field label={isNew ? 'Opening stock' : 'Stock'} id="countinstock"
                                        hint={isNew ? 'On the shelf now. Later deliveries go through Receive stock.' : 'A change here is saved in the stock history as a correction.'}>
                                        <div className="relative">
                                            <Input id="countinstock" type="number" min="0" step={form.sold_by_weight ? '0.001' : '1'} placeholder="0"
                                                value={form.countInStock} onChange={set('countInStock')} className="pr-16" />
                                            <span className="pointer-events-none absolute right-3 top-1/2 max-w-[3.5rem] -translate-y-1/2 truncate text-sm text-slate-400">{form.unit}</span>
                                        </div>
                                    </Field>
                                </div>
                                <div className="mt-5 rounded-xl border border-slate-200 p-4">
                                    <Toggle id="sold_by_weight" checked={form.sold_by_weight} onChange={(v) => setForm((f) => ({ ...f, sold_by_weight: v, unit: v && (!f.unit || f.unit === 'piece') ? 'kg' : f.unit }))}
                                        label="Sold loose by weight" description="Rice, dal, sugar from a sack. The counter lets you type 0.75 kg." />
                                </div>
                            </Section>
                        )}

                        {!isCombo && (gstOn || form.hsn_code || Number(form.gst_rate) > 0) && (
                            <Section title="Tax" subtitle="Printed on GST invoices.">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="HSN code" id="hsn_code" hint="4, 6 or 8 digits, e.g. 1006 for rice.">
                                        <Input id="hsn_code" inputMode="numeric" maxLength={8} value={form.hsn_code} onChange={set('hsn_code')} placeholder="e.g. 0902" />
                                    </Field>
                                    <Field label="GST rate" id="gst_rate">
                                        <Select id="gst_rate" value={form.gst_rate} onChange={set('gst_rate')}>
                                            {GST_RATES.map((r) => <option key={r} value={String(r)}>{r}%{r === 0 ? ' (exempt or nil)' : ''}</option>)}
                                        </Select>
                                    </Field>
                                </div>
                            </Section>
                        )}
                    </div>

                    {/* Side column */}
                    <div className="min-w-0 space-y-6 lg:sticky lg:top-24">
                        <Section title="Where it's sold">
                            <div className="space-y-4">
                                <Toggle id="sell_in_shop" checked={form.sell_in_shop} onChange={(v) => setForm((f) => ({ ...f, sell_in_shop: v }))}
                                    label="Shop counter" description="Shows on the counter sale screen." />
                                <Toggle id="sell_online" checked={form.sell_online} onChange={(v) => setForm((f) => ({ ...f, sell_online: v }))}
                                    label="Website" description="Customers can order it online." />
                            </div>
                            {!form.sell_online && !form.sell_in_shop && (
                                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Not for sale anywhere. It stays in stock and reports.</p>
                            )}
                        </Section>

                        <Section title="Organise">
                            <div className="space-y-4">
                                <Field label="Category" id="category">
                                    <Input id="category" required list="category-options" placeholder={isCombo ? 'e.g. Combos' : 'e.g. Spices'} value={form.category} onChange={set('category')} />
                                    <datalist id="category-options">
                                        {categories.map((c) => <option key={c.label} value={c.label} />)}
                                    </datalist>
                                </Field>
                                {/* A combo holds products from different producers, and its contents
                                    are listed in it, so producer and pack size are for single products. */}
                                {!isCombo && (
                                    <>
                                        <Field label="Producer or farm" id="brand">
                                            <Input id="brand" value={form.brand} onChange={set('brand')} placeholder="Optional, e.g. a local farm" />
                                        </Field>
                                        <Field label="Pack size" id="weight">
                                            <Input id="weight" value={form.weight} onChange={set('weight')} placeholder="Optional, e.g. 500 g jar" />
                                        </Field>
                                    </>
                                )}
                                <Field label="Counter code" id="code" hint="Optional short code cashiers type, e.g. 101.">
                                    <Input id="code" maxLength={20} placeholder="e.g. 101" value={form.code} onChange={set('code')} />
                                </Field>
                            </div>
                            {isCombo && gstOn && <p className="mt-4 text-xs text-slate-500">GST on a combo is the highest rate of the products inside it (mixed supply). It is set for you when you save.</p>}
                            {!isCombo && !gstOn && !form.hsn_code && !(Number(form.gst_rate) > 0) && (
                                <p className="mt-4 text-xs text-slate-500">GST is off, so no HSN code or rate is needed. Turn it on in <Link to="/admin/settings" className="font-semibold text-brand-700 hover:underline">Settings</Link>.</p>
                            )}
                        </Section>

                        {/* How the product will look to a customer. */}
                        <Section title="Preview">
                            <div className="flex gap-3">
                                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                    {mainPhoto ? <img src={mainPhoto} alt="" className="h-full w-full object-contain" /> : <ImageIcon className="h-6 w-6 text-slate-300" />}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">{form.name.trim() || 'Product name'}</p>
                                    <p className="truncate text-xs text-slate-500">{[form.category, !isCombo && form.weight].filter(Boolean).join(' · ') || 'Category'}</p>
                                    <p className="mt-1 text-sm">
                                        <span className="font-bold text-slate-900">{formatINR(offerOff(shopPrice))}</span>
                                        {form.is_offer && Number(form.offer_percentage) > 0 && shopPrice > 0 && <span className="ml-1.5 text-xs text-slate-400 line-through">{formatINR(shopPrice)}</span>}
                                        <span className="text-xs text-slate-500"> / {isCombo ? 'combo' : form.unit || 'piece'}</span>
                                    </p>
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>

                {/* Repeated at the end for long forms on phones. */}
                <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-6">
                    <Button to="/admin/productlist" variant="secondary">Cancel</Button>
                    <Button type="submit" disabled={cantSave}>{saveLabel}</Button>
                </div>
            </form>
        </div>
    )
}

const UNITS = ['piece', 'kg', 'g', 'litre', 'ml', 'pack', 'packet', 'dozen', 'box', 'jar', 'bottle', 'bag']

function Section({ title, subtitle, children }) {
    return (
        <Card>
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            <div className="p-5">{children}</div>
        </Card>
    )
}

// A rupee amount: number input with ₹ in front.
function Money({ className, ...props }) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span>
            <Input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" className={cn('pl-7', className)} {...props} />
        </div>
    )
}

// An on/off switch with a label and a short explanation.
function Toggle({ id, checked, onChange, label, description }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <label htmlFor={id} className="min-w-0 cursor-pointer">
                <span className="block text-sm font-medium text-slate-900">{label}</span>
                {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
            </label>
            <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
                className={cn('relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                    checked ? 'bg-brand-600' : 'bg-slate-300')}>
                <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition', checked ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
        </div>
    )
}

// What goes in a combo: pick products and how much of each, and see what the customer saves.
function ComboParts({ auth, parts, setParts, price, selfId, available }) {
    const [catalog, setCatalog] = useState([])
    const [query, setQuery] = useState('')

    useEffect(() => {
        axios.get('/api/inventory/products/', auth)
            .then(({ data }) => setCatalog(data.filter((p) => !p.is_combo && String(p._id) !== String(selfId)).sort((a, b) => a.name.localeCompare(b.name))))
            .catch(() => setCatalog([]))
    }, [auth, selfId])

    const byId = Object.fromEntries(catalog.map((p) => [p._id, p]))
    // The counter price, offer included.
    const shopPrice = (p) => Number(p.selling_price) || 0
    const matches = query.trim()
        ? catalog.filter((p) => !parts.some((x) => x.product === p._id) && `${p.name} ${p.code || ''}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
        : []
    const add = (p) => {
        setParts((list) => [...list, { product: p._id, name: p.name, unit: p.unit || 'piece', sold_by_weight: p.sold_by_weight, qty: '1' }])
        setQuery('')
    }
    const setQty = (id, qty) => setParts((list) => list.map((x) => (x.product === id ? { ...x, qty } : x)))
    const remove = (id) => setParts((list) => list.filter((x) => x.product !== id))

    // Prices and costs come from the current catalog (the saved combo's own figures until it loads).
    const separately = parts.reduce((n, x) => n + (byId[x.product] ? shopPrice(byId[x.product]) : Number(x.price) || 0) * (Number(x.qty) || 0), 0)
    const costs = parts.map((x) => (byId[x.product] && byId[x.product].cost_price != null ? Number(byId[x.product].cost_price) * (Number(x.qty) || 0) : null))
    const cost = costs.every((c) => c != null) ? costs.reduce((a, b) => a + b, 0) : null
    const combo = Number(price) || 0
    const saving = separately - combo

    return (
        <Section title="What's in the combo" subtitle="Selling one combo takes these from stock. The combo has no stock of its own.">

            {parts.length > 0 && (
                <ul className="mb-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {parts.map((x) => (
                        <li key={x.product} className="flex items-center gap-3 px-3 py-2">
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-slate-900">{x.name}</span>
                                {byId[x.product] && <span className="text-xs text-slate-500">{formatINR(shopPrice(byId[x.product]))} / {x.unit} · {Number(byId[x.product].countInStock)} in stock</span>}
                            </span>
                            <Input type="number" min={x.sold_by_weight ? '0.001' : '1'} step={x.sold_by_weight ? '0.001' : '1'} value={x.qty}
                                onChange={(e) => setQty(x.product, e.target.value)} aria-label={`Quantity of ${x.name}`} className="!h-9 !w-24 text-right" />
                            <span className="w-10 text-xs text-slate-500">{x.unit}</span>
                            <button type="button" onClick={() => remove(x.product)} aria-label={`Remove ${x.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" aria-label="Add a product to the combo"
                    placeholder={parts.length ? 'Add another product' : 'Search products to add, e.g. rice'} />
                {matches.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        {matches.map((p) => (
                            <li key={p._id}>
                                <button type="button" onClick={() => add(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-brand-50">
                                    <span className="truncate">{p.name}</span>
                                    <span className="shrink-0 text-xs text-slate-500">{formatINR(shopPrice(p))} / {p.unit || 'piece'}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {parts.length < 2 && <p className="mt-2 text-xs text-amber-700">Add at least two products.</p>}

            {parts.length > 0 && (
                <div className="mt-4 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="flex justify-between"><span className="text-slate-600">Bought separately</span><span className="font-medium">{formatINR(separately)}</span></p>
                    <p className="flex justify-between"><span className="text-slate-600">Combo price</span><span className="font-medium">{combo ? formatINR(combo) : '—'}</span></p>
                    {combo > 0 && (
                        <p className={cn('flex justify-between font-semibold', saving > 0 ? 'text-emerald-700' : 'text-amber-700')}>
                            <span>{saving > 0 ? 'Customer saves' : 'No saving for the customer'}</span>
                            <span>{saving > 0 ? `${formatINR(saving)} (${Math.round((saving / separately) * 100)}%)` : `Combo costs ${formatINR(-saving)} more`}</span>
                        </p>
                    )}
                    {cost != null && combo > 0 && (
                        <p className={cn('flex justify-between', combo < cost ? 'font-semibold text-rose-600' : 'text-slate-500')}>
                            <span>{combo < cost ? 'Sold below cost' : 'Profit per combo'}</span>
                            <span>{formatINR(combo - cost)}</span>
                        </p>
                    )}
                    {available != null && <p className="flex justify-between text-slate-500"><span>Can be made from current stock</span><span>{available}</span></p>}
                </div>
            )}
        </Section>
    )
}

export default ProductEditScreen

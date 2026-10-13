import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { Alert, Card, Field, Input, Checkbox, Button } from '../components/ui'
import { useCategories } from '../components/categories'

const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || e.message
const IMAGE_FIELDS = [['image', 'Main photo'], ['image2', 'Photo 2'], ['image3', 'Photo 3']]
const PLACEHOLDER = /placeholder/

const EMPTY = {
    name: '', category: '', brand: '', weight: '', unit: 'piece', description: '',
    price: '', online_price: '', countInStock: '', is_offer: false, offer_percentage: 0,
    sell_online: true, sell_in_shop: true, sold_by_weight: false, code: '',
}

// Add a new product or edit one. A new product is only saved when the form is complete,
// so half-filled "Sample" products are never created.
function ProductEditScreen({ match, history }) {
    const productId = match.params.id
    const isNew = !productId
    const categories = useCategories()
    const { userInfo } = useSelector((state) => state.userLogin)
    const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }), [userInfo])

    const [form, setForm] = useState(EMPTY)
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
                })
                setPhotos(Object.fromEntries(IMAGE_FIELDS.map(([f]) => [f, p[f] && !PLACEHOLDER.test(p[f]) ? p[f] : null])))
            })
            .catch((e) => setLoadError(errorText(e)))
            .finally(() => setLoading(false))
    }, [isNew, productId, auth])

    // Free the previews of photos waiting to be uploaded.
    useEffect(() => () => Object.values(pending).forEach((p) => URL.revokeObjectURL(p.preview)), [pending])

    const uploadPhoto = (id, field, file) => {
        const data = new FormData()
        data.append('product_id', id)
        data.append(field, file)
        return axios.post('/api/products/upload/', data, auth).then((res) => res.data.url)
    }

    const choosePhoto = (field, file) => {
        if (!file) return
        setError('')
        if (isNew) {
            setPending((p) => ({ ...p, [field]: { file, preview: URL.createObjectURL(file) } }))
            return
        }
        setUploading(field)
        uploadPhoto(productId, field, file)
            .then((url) => setPhotos((p) => ({ ...p, [field]: url })))
            .catch((e) => setError(errorText(e)))
            .finally(() => setUploading(''))
    }

    const submit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        const body = { ...form, offer_percentage: Number(form.offer_percentage) || 0 }
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

    return (
        <FormContainer wide>
            <Link to='/admin/productlist' className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Back to products
            </Link>

            <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">{isNew ? 'New product' : 'Edit product'}</h1>
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            <form onSubmit={submit} className="space-y-6">
                <Card className="p-6">
                    <h2 className="mb-5 font-semibold text-slate-900">Basics</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" id="name">
                            <Input id="name" required autoFocus={isNew} value={form.name} onChange={set('name')} placeholder="e.g. Sundarbans Honey" />
                        </Field>
                        <Field label="Category" id="category">
                            <Input id="category" required list="category-options" placeholder="e.g. Spices" value={form.category} onChange={set('category')} />
                            <datalist id="category-options">
                                {categories.map((c) => <option key={c.label} value={c.label} />)}
                            </datalist>
                        </Field>
                        <Field label="Producer or farm" id="brand">
                            <Input id="brand" value={form.brand} onChange={set('brand')} placeholder="Optional, e.g. a local farm" />
                        </Field>
                        <Field label="Pack size" id="weight">
                            <Input id="weight" value={form.weight} onChange={set('weight')} placeholder="e.g. 500 g jar" />
                        </Field>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="mb-1 font-semibold text-slate-900">Where it's sold</h2>
                    <p className="mb-4 text-sm text-slate-500">The shop and the website share one stock count.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Checkbox id="sell_online" label="Sell on the website" checked={form.sell_online} onChange={set('sell_online')} />
                        <Checkbox id="sell_in_shop" label="Sell at the shop counter" checked={form.sell_in_shop} onChange={set('sell_in_shop')} />
                    </div>
                    {!form.sell_online && !form.sell_in_shop && (
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">This product is not for sale anywhere. It stays in stock and reports.</p>
                    )}
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <Field label="Counter code" id="code" hint="Optional. Cashiers type it, e.g. 101.">
                            <Input id="code" maxLength={20} placeholder="e.g. 101" value={form.code} onChange={set('code')} />
                        </Field>
                        <Field label="Counted in" id="unit" hint="How one unit is counted.">
                            <Input id="unit" maxLength={40} value={form.unit} onChange={set('unit')} placeholder="piece, kg, jar" />
                        </Field>
                        <div className="sm:pt-7">
                            <Checkbox id="sold_by_weight" label="Sold loose by weight" checked={form.sold_by_weight} onChange={set('sold_by_weight')} />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="mb-5 font-semibold text-slate-900">Pricing and stock</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Shop price (৳)" id="price">
                            <Input id="price" type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} />
                        </Field>
                        <Field label="Online price (৳)" id="online_price" hint="Optional. Leave empty to use the shop price on the website.">
                            <Input id="online_price" type="number" min="0" step="0.01" placeholder={form.price || ''}
                                value={form.online_price} onChange={set('online_price')} disabled={!form.sell_online} />
                        </Field>
                        <Field label={isNew ? 'Opening stock' : 'Stock'} id="countinstock"
                            hint={isNew ? 'What is on the shelf now. Later deliveries go through Receive stock.' : 'A change here is saved in the stock history as a correction.'}>
                            <Input id="countinstock" type="number" min="0" step={form.sold_by_weight ? '0.001' : '1'} placeholder="0"
                                value={form.countInStock} onChange={set('countInStock')} />
                        </Field>
                        <Field label="Offer percentage" id="offerPercentage">
                            <Input id="offerPercentage" type="number" min="0" max="100" step="1" value={form.offer_percentage}
                                onChange={set('offer_percentage')} disabled={!form.is_offer} />
                        </Field>
                    </div>
                    <Checkbox id="is_offer" label="This product is on offer" className="mt-4" checked={form.is_offer} onChange={set('is_offer')} />
                </Card>

                <Card className="p-6">
                    <h2 className="mb-1 font-semibold text-slate-900">Photos</h2>
                    <p className="mb-4 text-sm text-slate-500">{isNew ? 'Photos upload when you save the product.' : 'Photos upload as soon as you choose them.'}</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {IMAGE_FIELDS.map(([field, label]) => {
                            const src = (pending[field] && pending[field].preview) || photos[field]
                            return (
                                <label key={field} htmlFor={`file-${field}`} className="group relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
                                    <span className="flex h-24 w-full items-center justify-center">
                                        {uploading === field ? <Loader /> : src
                                            ? <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                                            : <Upload className="h-6 w-6 text-slate-300" />}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                                    <span className="text-xs text-brand-600">{src ? 'Change' : 'Choose photo'}</span>
                                    {pending[field] && (
                                        <button type="button" aria-label={`Remove ${label}`} onClick={(e) => { e.preventDefault(); setPending(({ [field]: _, ...rest }) => rest) }}
                                            className="absolute right-2 top-2 rounded-full bg-white p-1 text-slate-500 shadow hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
                                    )}
                                    <input id={`file-${field}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
                                        onChange={(e) => { choosePhoto(field, e.target.files[0]); e.target.value = '' }} />
                                </label>
                            )
                        })}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="mb-5 font-semibold text-slate-900">Description</h2>
                    <CKEditor editor={ClassicEditor} data={form.description} onChange={(e, editor) => set('description')(editor.getData())} />
                </Card>

                <div className="flex justify-end gap-3">
                    <Button to="/admin/productlist" variant="secondary">Cancel</Button>
                    <Button type="submit" disabled={saving || Boolean(uploading)}>{saving ? 'Saving…' : isNew ? 'Add product' : 'Save product'}</Button>
                </div>
            </form>
        </FormContainer>
    )
}

export default ProductEditScreen

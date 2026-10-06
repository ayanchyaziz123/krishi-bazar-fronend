import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { ArrowLeft, Upload } from 'lucide-react'
import { Card, Field, Input, Checkbox, Button } from '../components/ui'
import categories from '../components/categories'
import { listProductDetails, updateProduct } from '../actions/productActions'
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants'
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';


function ProductEditScreen({ match, history }) {

    const productId = match.params.id

    
    const [category, setCategory] = useState('')
    const [brand, setBrand] = useState('')
    const [name, setName] = useState('')
    const [model, setModel] = useState('')
    const [processor, setProcessor] = useState('')
    const [display, setDisplay] = useState('')
    const [graphics_card, setGraphics_card] = useState('')
    const [ram_memory, setRam_memory] = useState('')
    const [storage, setStorage] = useState('')
    const [operating_system, setOperating_system] = useState('')
    const [web_cam, setWeb_cam] = useState('')
    const [weight, setWeight] = useState('')
    const [color, setColor] = useState('')
    const [battery, setBattery] = useState('')
    const [warranty, setWarranty] = useState('')
    const [price, setPrice] = useState(0)
    const [image, setImage] = useState('')
    const [image2, setImage2] = useState('')
    const [image3, setImage3] = useState('')
    const [countInStock, setCountInStock] = useState(0)
    const [description, setDescription] = useState('')
    const [is_offer, setIsOffer] = useState('')
    const [offer_percentage, setOfferPercentage] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [sellOnline, setSellOnline] = useState(true)
    const [sellInShop, setSellInShop] = useState(true)
    const [onlinePrice, setOnlinePrice] = useState('')
    const [soldByWeight, setSoldByWeight] = useState(false)
    const [code, setCode] = useState('')

    const dispatch = useDispatch()

    const productDetails = useSelector(state => state.productDetails)
    const { error, loading, product } = productDetails

    const productUpdate = useSelector(state => state.productUpdate)
    const { error: errorUpdate, loading: loadingUpdate, success: successUpdate } = productUpdate


    useEffect(() => {
        if (successUpdate) {
            dispatch({ type: PRODUCT_UPDATE_RESET })

            history.push('/admin/productlist')
        } else {
            if (!product.name || product._id !== Number(productId)) {
                dispatch(listProductDetails(productId))
            } else {
                setCategory(product.category)
                setBrand(product.brand)
                setName(product.name)
                setModel(product.model)
                setProcessor(product.processor)
                setDisplay(product.display)
                setGraphics_card(product.graphics_card)
                setRam_memory(product.ram_memory)
                setStorage(product.storage)
                setOperating_system(product.operating_system)
                setWeb_cam(product.web_cam)
                setWeight(product.weight)
                setColor(product.color)
                setBattery(product.battery)
                setWarranty(product.warranty)
                // `price` is what the website charges; the editor works with the shop price.
                setPrice(Number(product.shop_price ?? product.price))
                setSellOnline(product.sell_online !== false)
                setSellInShop(product.sell_in_shop !== false)
                setOnlinePrice(product.online_price != null ? String(Number(product.online_price)) : '')
                setSoldByWeight(Boolean(product.sold_by_weight))
                setCode(product.code || '')
                setImage(product.image)
                setImage2(product.image2)
                setImage3(product.image3)
                
                setCountInStock(product.stock_exact ?? product.countInStock)
                setDescription(product.description)
                setIsOffer(product.is_offer)
                setOfferPercentage(product.offer_percentage)

            }
        }



    }, [dispatch, product, productId, history, successUpdate])

    const submitHandler = (e) => {
        e.preventDefault()
        if (is_offer == 'True' && offer_percentage >= 0) {
            alert("something went wrong");
            return;
        }
        dispatch(updateProduct({
            _id: productId,
            category,
            brand,
            name,
            model,
            processor,
            display,
            graphics_card,
            ram_memory,
            storage,
            operating_system,
            web_cam,
            weight,
            color,
            battery,
            warranty,
            price,
            image,
            image2,
            image3,
            countInStock,
            description,
            is_offer,
            offer_percentage,
            sell_online: sellOnline,
            sell_in_shop: sellInShop,
            online_price: onlinePrice,
            sold_by_weight: soldByWeight,
            code,
        }))
    }

    const uploadFileHandler = async (e) => {

        const file = e.target.files[0]
        const formData = new FormData()

        formData.append('image', file)
        formData.append('product_id', productId)

        setUploading(true)

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }

            const { data } = await axios.post('/api/products/upload/', formData, config)


            setImage(data)
            setUploading(false)

        } catch (error) {
            setUploading(false)
        }
    }

    const uploadFileHandler2 = async (e) => {

        const file = e.target.files[0]
        const formData = new FormData()

        formData.append('image2', file)
        formData.append('product_id', productId)

        setUploading(true)

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }

            const { data } = await axios.post('/api/products/upload/', formData, config)


            setImage2(data)
            setUploading(false)

        } catch (error) {
            setUploading(false)
        }
    }

    const uploadFileHandler3 = async (e) => {

        const file = e.target.files[0]
        const formData = new FormData()

        formData.append('image3', file)
        formData.append('product_id', productId)

        setUploading(true)

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }

            const { data } = await axios.post('/api/products/upload/', formData, config)


            setImage3(data)
            setUploading(false)

        } catch (error) {
            setUploading(false)
        }
    }

    const text = (label, id, value, setter, type = 'text', placeholder) => (
        <Field label={label} id={id}>
            <Input id={id} type={type} placeholder={placeholder || label} value={value || ''} onChange={(e) => setter(e.target.value)} />
        </Field>
    )

    const uploaders = [
        ['image-file', 'Main image', image, uploadFileHandler],
        ['image-file2', 'Image 2', image2, uploadFileHandler2],
        ['image-file3', 'Image 3', image3, uploadFileHandler3],
    ]

    return (
        <FormContainer wide>
            <Link to='/admin/productlist' className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Back to products
            </Link>

            <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Edit product</h1>
            {loadingUpdate && <Loader />}
            {errorUpdate && <Message variant='danger' className="mb-4">{errorUpdate}</Message>}

            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message>
                : (
                    <form onSubmit={submitHandler} className="space-y-6">
                        <Card className="p-6">
                            <h2 className="mb-5 font-semibold text-slate-900">Basics</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {text('Name', 'name', name, setName)}
                                <Field label="Category" id="category">
                                    <Input id="category" list="category-options" placeholder="e.g. Spices" value={category || ''} onChange={(e) => setCategory(e.target.value)} />
                                    <datalist id="category-options">
                                        {categories.map((c) => <option key={c.label} value={c.label} />)}
                                    </datalist>
                                </Field>
                                {text('Producer or farm', 'brand', brand, setBrand, 'text', 'e.g. a local farm or artisan')}
                                {text('Pack size', 'weight', weight, setWeight, 'text', 'e.g. 500 g pack')}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h2 className="mb-1 font-semibold text-slate-900">Where it's sold</h2>
                            <p className="mb-4 text-sm text-slate-500">The shop and the website share one stock count.</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Checkbox id="sell_online" label="Sell on the website" checked={sellOnline} onChange={(e) => setSellOnline(e.target.checked)} />
                                <Checkbox id="sell_in_shop" label="Sell at the shop counter" checked={sellInShop} onChange={(e) => setSellInShop(e.target.checked)} />
                            </div>
                            {!sellOnline && !sellInShop && (
                                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">This product is not for sale anywhere. It stays in stock and reports.</p>
                            )}
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <Field label="Counter code" id="code" hint="Optional. Cashiers type it at the counter, e.g. 101.">
                                    <Input id="code" maxLength={20} placeholder="e.g. 101" value={code} onChange={(e) => setCode(e.target.value)} />
                                </Field>
                                <div className="sm:pt-7">
                                    <Checkbox id="sold_by_weight" label="Sold loose by weight (allows 1.5, 0.25 …)" checked={soldByWeight} onChange={(e) => setSoldByWeight(e.target.checked)} />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h2 className="mb-5 font-semibold text-slate-900">Pricing and stock</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Shop price (৳)" id="price">
                                    <Input id="price" type="number" min="0" step="0.01" value={price ?? ''} onChange={(e) => setPrice(e.target.value)} required />
                                </Field>
                                <Field label="Online price (৳)" id="online_price" hint="Optional. Leave empty to use the shop price on the website.">
                                    <Input id="online_price" type="number" min="0" step="0.01" placeholder={price ? String(Number(price)) : ''}
                                        value={onlinePrice} onChange={(e) => setOnlinePrice(e.target.value)} disabled={!sellOnline} />
                                </Field>
                                <Field label={soldByWeight ? 'Stock (kg or unit, decimals allowed)' : 'Stock'} id="countinstock" hint="A change here is saved in the stock history as a correction.">
                                    <Input id="countinstock" type="number" min="0" step={soldByWeight ? '0.001' : '1'} value={countInStock ?? ''} onChange={(e) => setCountInStock(e.target.value)} />
                                </Field>
                                {text('Offer percentage', 'offerPercentage', offer_percentage, setOfferPercentage, 'number')}
                            </div>
                            <Checkbox id="is_offer" label="This product is on offer" className="mt-4" checked={!!is_offer} onChange={(e) => setIsOffer(e.target.checked)} />
                        </Card>

                        <Card className="p-6">
                            <h2 className="mb-5 font-semibold text-slate-900">Images</h2>
                            {text('Main image path', 'image', image, setImage)}
                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                {uploaders.map(([id, label, src, handler]) => (
                                    <label key={id} htmlFor={id} className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
                                        <span className="flex h-24 w-full items-center justify-center">
                                            {src ? <img src={src} alt="" className="max-h-full max-w-full object-contain" /> : <Upload className="h-6 w-6 text-slate-300" />}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700">{label}</span>
                                        <span className="text-xs text-brand-600">Choose file</span>
                                        <input id={id} type="file" accept="image/*" className="sr-only" onChange={handler} />
                                    </label>
                                ))}
                            </div>
                            {uploading && <Loader />}
                        </Card>

                        <Card className="p-6">
                            <h2 className="mb-5 font-semibold text-slate-900">Description</h2>
                            <CKEditor
                                editor={ClassicEditor}
                                data={description || ''}
                                onChange={(e, editor) => setDescription(editor.getData())}
                            />
                        </Card>

                        <div className="flex justify-end gap-3">
                            <Button to="/admin/productlist" variant="secondary">Cancel</Button>
                            <Button type='submit'>Save product</Button>
                        </div>
                    </form>
                )}
        </FormContainer>
    )
}

export default ProductEditScreen

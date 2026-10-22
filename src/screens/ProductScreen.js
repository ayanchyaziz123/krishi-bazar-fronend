import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import ReactHtmlParser from 'react-html-parser'
import axios from 'axios'
import { TrendingUp, Check, X as XIcon, MessageSquare, Minus, Plus, ShoppingCart } from 'lucide-react'
import Rating from '../components/Rating'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Coupon from '../components/Coupon'
import Product from '../components/Product'
import SlideShow from '../components/shop/SlideShow'
import { getRecentlyViewed, rememberViewed } from '../components/shop/recentlyViewed'
import { qtyStep, qtyText } from '../components/shop/checkout'
import { SectionHeading, ViewAll } from '../components/SiteSections'
import { addToCart } from '../actions/cartActions'
import { listProductDetails, createProductReview } from '../actions/productActions'
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants'
import { Container, Card, Button, Select, Textarea, Input, Field, Badge, Modal, cn, formatINR, finalPrice, toast } from '../components/ui'

// The price chart library is large, so it only loads when the chart is shown.
const ProductChart = React.lazy(() => import('../components/ProductChart'))

const baseURL = '/api/products/predict_history_price/'

// Whole units, or 0.5 kg steps for loose items.
function QtyStepper({ value, max, onChange, item }) {
    const step = qtyStep(item)
    return (
        <div className="inline-flex h-11 items-center rounded-xl bg-white ring-1 ring-slate-200">
            <button type="button" onClick={() => onChange(Math.max(step, value - step))} disabled={value <= step} aria-label="Less"
                className="flex h-full w-11 items-center justify-center text-slate-700 disabled:text-slate-300"><Minus className="h-4 w-4" /></button>
            <span className="min-w-8 px-1 text-center font-semibold tabular-nums" aria-live="polite">{qtyText(value, item)}</span>
            <button type="button" onClick={() => onChange(Math.min(max, value + step))} disabled={value + step > max} aria-label="More"
                className="flex h-full w-11 items-center justify-center text-slate-700 disabled:text-slate-300"><Plus className="h-4 w-4" /></button>
        </div>
    )
}

function ProductScreen({ match, history }) {
    const [qty, setQty] = useState(1)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [show, setShow] = useState(false)
    const [date, setDate] = useState(null)
    const [predictPrice, setPredict_price] = useState(null)
    const [adding, setAdding] = useState('')
    const [recent, setRecent] = useState([])

    const dispatch = useDispatch()
    const { loading, error, product, price_history } = useSelector(state => state.productDetails)
    const { userInfo } = useSelector(state => state.userLogin)
    const inCart = useSelector(state => state.cart.cartItems.find((x) => x.product === product._id))
    const { loading: loadingProductReview, error: errorProductReview, success: successProductReview } = useSelector(state => state.productReviewCreate)

    useEffect(() => {
        if (successProductReview) {
            setRating(0)
            setComment('')
            dispatch({ type: PRODUCT_CREATE_REVIEW_RESET })
        }
        dispatch(listProductDetails(match.params.id))
    }, [dispatch, match, successProductReview])

    useEffect(() => { setQty(1); window.scrollTo(0, 0) }, [match.params.id])

    // Remember this product on this device, and show the others looked at recently.
    useEffect(() => {
        if (product && String(product._id) === String(match.params.id)) {
            setRecent(getRecentlyViewed().filter((p) => p._id !== product._id))
            rememberViewed(product)
        }
    }, [product, match.params.id])

    const stock = product.countInStock || 0
    const inStock = stock > 0
    const inCartQty = inCart ? Number(inCart.qty) : 0
    const canAdd = Math.max(0, stock - inCartQty)

    const add = async (thenCheckout) => {
        if (!inStock || adding) return
        setAdding(thenCheckout ? 'buy' : 'cart')
        try {
            const wanted = Math.min(stock, inCartQty + (canAdd ? qty : 0))
            await dispatch(addToCart(product._id, wanted || inCartQty))
            if (thenCheckout) {
                history.push('/login?redirect=shipping')
            } else {
                toast.success(canAdd ? `${product.name} added to your cart.` : `All ${stock} in stock are already in your cart.`)
            }
        } catch (e) {
            toast.error('Could not add it to your cart. Please try again.')
        } finally {
            setAdding('')
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(createProductReview(match.params.id, { rating, comment }))
    }

    const predict_future_price_submit = (e) => {
        e.preventDefault()
        if (product._id && date) {
            axios.post(baseURL, { date, product_id: product._id }).then((response) => setPredict_price(response.data))
        }
    }

    const specs = [
        ['Category', product.category],
        ['Producer', product.brand],
        ['Pack size', product.weight],
        ['Available', inStock ? `${stock} in stock` : null],
    ].filter(([, value]) => value && value !== '0')

    // Future-price prediction fits a trend line, so it needs recorded price changes.
    const canPredict = price_history && price_history.length >= 2
    const images = [product.image, product.image2, product.image3].filter(Boolean)
    const offer = product.is_offer && product.offer_percentage > 0

    const buttons = (
        <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => add(false)} disabled={!inStock || Boolean(adding)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-800 bg-white text-[15px] font-bold text-slate-900 transition hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-300">
                <ShoppingCart className="h-4 w-4" /> {adding === 'cart' ? 'Adding…' : 'Add to Cart'}
            </button>
            <button type="button" onClick={() => add(true)} disabled={!inStock || Boolean(adding)}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-red-600 text-[15px] font-bold text-white transition hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400">
                {adding === 'buy' ? 'One moment…' : 'Buy Now'}
            </button>
        </div>
    )

    if (loading) return <Loader />
    if (error) return <Container><Message variant='danger'>{error}</Message></Container>

    return (
        <>
            <Container className="space-y-10 pb-24 md:pb-0">
                <Coupon />

                <div className="grid gap-6 md:grid-cols-2 md:gap-10">
                    <div>
                        {images.length > 0 && (
                            <SlideShow items={images} interval={6000} render={(src) => (
                                <div className="aspect-[16/10] bg-white md:aspect-square">
                                    <img src={src} alt={product.name} className="h-full w-full object-cover" />
                                </div>
                            )} />
                        )}
                        {product.image_credit && (
                            <p className="mt-2 text-xs text-slate-400">
                                {product.image_credit_url
                                    ? <a href={product.image_credit_url} target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 hover:underline">{product.image_credit}</a>
                                    : product.image_credit}
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-3xl font-extrabold text-red-600">{formatINR(finalPrice(product))}{product.sold_by_weight && <span className="text-lg font-semibold text-slate-500"> / {product.unit || 'kg'}</span>}</span>
                            {offer && (
                                <>
                                    <span className="text-lg font-semibold text-slate-400 line-through">{formatINR(product.price)}</span>
                                    <Badge variant="red">-{product.offer_percentage}%</Badge>
                                </>
                            )}
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{product.name}</h1>
                        {product.brand && <p className="mt-1 text-sm font-medium text-slate-500">by {product.brand}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <a href="#reviews"><Rating value={product.rating} text={`${product.numReviews} reviews`} /></a>
                            {inStock
                                ? <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> In stock{product.sold_by_weight ? ` · sold loose, in steps of 0.5 ${product.unit || 'kg'}` : ''}</span>
                                : <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-600"><XIcon className="h-4 w-4" /> Out of stock</span>}
                        </div>

                        {inStock && (
                            <div className="mt-5 flex items-center gap-3">
                                <QtyStepper item={product} value={Math.min(qty, Math.max(canAdd, qtyStep(product)))} max={Math.max(canAdd, qtyStep(product))} onChange={setQty} />
                                {inCartQty > 0 && <Link to="/cart" className="text-sm font-medium text-brand-700 hover:underline">{qtyText(inCartQty, product)} in your cart</Link>}
                            </div>
                        )}

                        <div className="mt-5 hidden md:block">{buttons}</div>

                        {canPredict && (
                            <button type="button" onClick={() => setShow(true)}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100">
                                <TrendingUp className="h-4 w-4" /> Predict future price
                            </button>
                        )}

                        {product.description && (
                            <div className="mt-6">
                                <h2 className="mb-2 text-lg font-bold text-slate-900">About this product</h2>
                                <div className="prose-content text-[15px] leading-relaxed text-slate-600">{ReactHtmlParser(product.description)}</div>
                            </div>
                        )}

                        {specs.length > 0 && (
                            <div className="mt-6">
                                <h2 className="mb-2 text-lg font-bold text-slate-900">Product details</h2>
                                <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-600">
                                    {specs.map(([label, value]) => <li key={label}><span className="text-slate-500">{label}:</span> <span className="font-medium text-slate-800">{value}</span></li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <Modal show={show} onClose={() => setShow(false)} title={`Predict the future price of ${product.name}`}>
                    <p className="text-sm text-slate-500">Pick a date to estimate what this product will cost then.</p>
                    <form onSubmit={predict_future_price_submit} className="mt-4 space-y-4">
                        <Input type="date" name="date" onChange={(e) => setDate(e.target.value)} />
                        {predictPrice && (
                            <div className="rounded-xl bg-brand-50 p-4">
                                <p className="text-sm text-brand-700">Predicted price</p>
                                <p className="text-2xl font-bold text-brand-900">{formatINR(parseFloat(predictPrice).toFixed(2))}</p>
                            </div>
                        )}
                        <Button type="submit" block>Predict</Button>
                    </form>
                </Modal>

                {recent.length > 0 && (
                    <section>
                        <SectionHeading title="Recently Viewed" action={<ViewAll />} />
                        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                            {recent.map((p) => <div key={p._id} className="w-40 shrink-0 snap-start sm:w-48"><Product product={p} compact /></div>)}
                        </div>
                    </section>
                )}

                {price_history && price_history.length > 0 && (
                    <Card className="rounded-2xl p-5 sm:p-6">
                        <React.Suspense fallback={<div className="h-48" />}><ProductChart price_history={price_history} product_id={product._id} /></React.Suspense>
                    </Card>
                )}

                <Card id="reviews" className="scroll-mt-24 rounded-2xl p-5 sm:p-8">
                    <div className="grid gap-10 lg:grid-cols-2">
                        <div>
                            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
                                <MessageSquare className="h-5 w-5 text-slate-400" /> Reviews ({product.reviews.length})
                            </h3>
                            {product.reviews.length === 0 && <Message variant='info'>No reviews yet. Be the first to share your thoughts.</Message>}
                            <ul className="space-y-5">
                                {product.reviews.map((review) => (
                                    <li key={review._id} className="flex gap-4">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold uppercase text-slate-600">
                                            {review.name ? review.name.charAt(0) : '?'}
                                        </span>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <strong className="text-sm text-slate-900">{review.name}</strong>
                                                {review.is_sample && <Badge variant="amber">Sample review</Badge>}
                                                <span className="text-xs text-slate-400">{review.createdAt.substring(0, 10)}</span>
                                            </div>
                                            <div className="mt-1"><Rating value={review.rating} /></div>
                                            <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="lg:border-l lg:border-slate-100 lg:pl-10">
                            <h3 className="mb-5 text-lg font-bold text-slate-900">Write a review</h3>
                            {loadingProductReview && <Loader />}
                            {successProductReview && <Message variant='success' className="mb-4">Review submitted</Message>}
                            {errorProductReview && <Message variant='danger' className="mb-4">{errorProductReview}</Message>}
                            {userInfo ? (
                                <form onSubmit={submitHandler} className="space-y-4">
                                    <Field label="Rating" id="rating">
                                        <Select id="rating" value={rating} onChange={(e) => setRating(e.target.value)}>
                                            <option value=''>Select...</option>
                                            <option value='1'>1 - Poor</option>
                                            <option value='2'>2 - Fair</option>
                                            <option value='3'>3 - Good</option>
                                            <option value='4'>4 - Very Good</option>
                                            <option value='5'>5 - Excellent</option>
                                        </Select>
                                    </Field>
                                    <Field label="Review" id="comment">
                                        <Textarea id="comment" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like or dislike?" />
                                    </Field>
                                    <Button disabled={loadingProductReview} type='submit'>Submit review</Button>
                                </form>
                            ) : (
                                <Message variant='info'>Please <Link to='/login' className="font-semibold underline">log in</Link> to write a review.</Message>
                            )}
                        </div>
                    </div>
                </Card>
            </Container>

            {/* Phone: the buy buttons stay at the bottom of the screen. */}
            <div className={cn('fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden')}>
                {buttons}
            </div>
        </>
    )
}

export default ProductScreen

import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import ReactHtmlParser from 'react-html-parser';
import axios from 'axios';
import { ArrowLeft, ShoppingBag, TrendingUp, Check, X as XIcon, MessageSquare } from 'lucide-react'
import Rating from '../components/Rating'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Coupon from '../components/Coupon';
import ProductChart from '../components/ProductChart';
import { listProductDetails, createProductReview } from '../actions/productActions'
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants'
import { Container, Card, Button, Select, Textarea, Input, Field, Badge, Modal, cn, formatTk, finalPrice } from '../components/ui'

const baseURL = "/api/products/predict_history_price/";

function Gallery({ images, name }) {
    const list = images.filter(Boolean)
    const [active, setActive] = useState(0)
    useEffect(() => setActive(0), [list.length])
    if (!list.length) return null
    return (
        <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-100">
                <img src={list[active]} alt={name} className="absolute inset-0 h-full w-full object-contain p-6" />
            </div>
            {list.length > 1 && (
                <div className="mt-4 flex gap-3">
                    {list.map((src, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setActive(i)}
                            className={cn(
                                'flex h-20 w-24 items-center justify-center rounded-xl border bg-white p-2 transition',
                                i === active ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-slate-200 hover:border-slate-300'
                            )}
                        >
                            <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function ProductScreen({ match, history }) {
    const [qty, setQty] = useState(1)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [show, setShow] = useState(false);
    const [date, setDate] = useState(null)
    const [predictPrice, setPredict_price] = useState(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const dispatch = useDispatch()

    const productDetails = useSelector(state => state.productDetails)
    const { loading, error, product, price_history } = productDetails

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    const productReviewCreate = useSelector(state => state.productReviewCreate)
    const {
        loading: loadingProductReview,
        error: errorProductReview,
        success: successProductReview,
    } = productReviewCreate

    const product_id = product._id;

    useEffect(() => {
        if (successProductReview) {
            setRating(0)
            setComment('')
            dispatch({ type: PRODUCT_CREATE_REVIEW_RESET })
        }

        dispatch(listProductDetails(match.params.id))

    }, [dispatch, match, successProductReview])

    const addToCartHandler = () => {
        history.push(`/cart/${match.params.id}?qty=${qty}`)
    }

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(createProductReview(
            match.params.id, {
            rating,
            comment
        }
        ))
    }

    const predict_future_price_submit = (e) => {
        e.preventDefault()
        if (product._id && date) {
            axios.post(baseURL, {
                date,
                product_id
            }).then((response) => {
                setPredict_price(response.data);
            })
        }
    }

    const specs = [
        ['Category', product.category],
        ['Producer', product.brand],
        ['Pack size', product.weight],
        ['Available', product.countInStock > 0 ? `${product.countInStock} in stock` : null],
    ].filter(([, value]) => value && value !== '0')

    // Future-price prediction fits a trend line, so it needs recorded price changes.
    const canPredict = price_history && price_history.length >= 2

    const inStock = product.countInStock > 0

    return (
        <Container>
            <Coupon />

            <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Back to shop
            </Link>

            {loading ?
                <Loader />
                : error
                    ? <Message variant='danger'>{error}</Message>
                    : (
                        <div className="space-y-10">
                            <div className="grid gap-10 lg:grid-cols-2">
                                <div>
                                    <Gallery images={[product.image, product.image2, product.image3]} name={product.name} />
                                    {product.image_credit && (
                                        <p className="mt-3 text-xs text-slate-400">
                                            {product.image_credit_url
                                                ? <a href={product.image_credit_url} target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 hover:underline">{product.image_credit}</a>
                                                : product.image_credit}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    {product.brand && <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{product.brand}</p>}
                                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{product.name}</h1>
                                    <div className="mt-3">
                                        <Rating value={product.rating} text={`${product.numReviews} reviews`} />
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-baseline gap-3">
                                        <span className="text-3xl font-bold text-slate-900">{formatTk(finalPrice(product))}</span>
                                        {product.is_offer && (
                                            <>
                                                <span className="text-lg text-slate-400 line-through">{formatTk(product.price)}</span>
                                                <Badge variant="red">-{product.offer_percentage}%</Badge>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-2">
                                        {inStock ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> In stock</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600"><XIcon className="h-4 w-4" /> Out of stock</span>
                                        )}
                                    </div>

                                    <Card className="mt-6 p-5">
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            {inStock && (
                                                <Select
                                                    value={qty}
                                                    onChange={(e) => setQty(e.target.value)}
                                                    className="sm:w-28"
                                                    aria-label="Quantity"
                                                >
                                                    {[...Array(product.countInStock).keys()].map((x) => (
                                                        <option key={x + 1} value={x + 1}>Qty {x + 1}</option>
                                                    ))}
                                                </Select>
                                            )}
                                            <Button
                                                onClick={addToCartHandler}
                                                disabled={!inStock}
                                                size="lg"
                                                className="flex-1"
                                            >
                                                <ShoppingBag className="h-5 w-5" /> Add to cart
                                            </Button>
                                        </div>
                                        {canPredict && <button
                                            type="button"
                                            onClick={handleShow}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                                        >
                                            <TrendingUp className="h-4 w-4" /> Predict future price
                                        </button>}
                                    </Card>

                                    <Modal show={show} onClose={handleClose} title={`Predict the future price of ${product.name}`}>
                                        <p className="text-sm text-slate-500">Pick a date to estimate what this product will cost then.</p>
                                        <form onSubmit={predict_future_price_submit} className="mt-4 space-y-4">
                                            <Input type="date" name="date" onChange={(e) => { setDate(e.target.value) }} />
                                            {predictPrice && (
                                                <div className="rounded-xl bg-brand-50 p-4">
                                                    <p className="text-sm text-brand-700">Predicted price</p>
                                                    <p className="text-2xl font-bold text-brand-900">{formatTk(parseFloat(predictPrice).toFixed(2))}</p>
                                                </div>
                                            )}
                                            <Button type="submit" block>Predict</Button>
                                        </form>
                                    </Modal>

                                    {specs.length > 0 && <dl className="mt-8 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
                                        {specs.map(([label, value]) => (
                                            <div key={label} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                                                <dt className="text-slate-500">{label}</dt>
                                                <dd className="col-span-2 font-medium text-slate-900">{value}</dd>
                                            </div>
                                        ))}
                                    </dl>}
                                </div>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card className="p-6">
                                    <h3 className="mb-3 font-semibold text-slate-900">Description</h3>
                                    <div className="prose-content text-sm text-slate-600">{ReactHtmlParser(product.description)}</div>
                                </Card>
                                <Card className="p-6">
                                    <ProductChart price_history={price_history} product_id={product._id} />
                                </Card>
                            </div>

                            <Card className="p-6 sm:p-8">
                                <div className="grid gap-10 lg:grid-cols-2">
                                    <div>
                                        <h3 className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
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
                                        <h3 className="mb-5 font-semibold text-slate-900">Write a review</h3>

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
                        </div>
                    )
            }
        </Container>
    )
}

export default ProductScreen

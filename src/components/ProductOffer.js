import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Loader from './Loader'
import Message from './Message'
import OfferSlide from './OfferSlide'
import { Carousel } from './ui'
import { listOfferProducts } from '../actions/productActions'

function ProductOffer() {
    const dispatch = useDispatch()

    const productOfferRated = useSelector(state => state.productOfferRated)
    const { error, loading, products } = productOfferRated

    useEffect(() => {
        dispatch(listOfferProducts())
    }, [dispatch])

    return (loading ? <Loader />
        : error
            ? <Message variant='danger'>{error}</Message>
            : (
                <Carousel
                    slides={products}
                    className="h-full min-h-[22rem] rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 shadow-xl shadow-slate-900/10"
                    renderSlide={(product) => <OfferSlide product={product} />}
                />
            )
    )
}

export default ProductOffer

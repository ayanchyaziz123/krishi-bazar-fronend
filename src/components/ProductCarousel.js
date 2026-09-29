import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Loader from './Loader'
import Message from './Message'
import OfferSlide from './OfferSlide'
import { Carousel } from './ui'
import { listTopProducts } from '../actions/productActions'

function ProductCarousel() {
    const dispatch = useDispatch()

    const productTopRated = useSelector(state => state.productTopRated)
    const { error, loading, products } = productTopRated

    useEffect(() => {
        dispatch(listTopProducts())
    }, [dispatch])

    return (loading ? <Loader />
        : error
            ? <Message variant='danger'>{error}</Message>
            : (
                <Carousel
                    slides={products}
                    className="min-h-[22rem] rounded-3xl bg-gradient-to-br from-slate-900 to-brand-900"
                    renderSlide={(product) => <OfferSlide product={product} label="Top rated" />}
                />
            )
    )
}

export default ProductCarousel

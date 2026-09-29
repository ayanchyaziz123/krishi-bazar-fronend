import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Loader from './Loader'
import Message from './Message'
import OfferSlide from './OfferSlide'
import HomeHero from './HomeHero'
import { Carousel } from './ui'
import { listOfferProducts } from '../actions/productActions'

function ProductOffer2() {
    const dispatch = useDispatch()

    const productOfferRated = useSelector(state => state.productOfferRated)
    const { error, loading, products } = productOfferRated

    useEffect(() => {
        dispatch(listOfferProducts())
    }, [dispatch])

    if (!loading && !error && (!products || products.length === 0)) return <HomeHero />

    return (loading ? <Loader />
        : error
            ? <Message variant='danger'>{error}</Message>
            : (
                <Carousel
                    slides={products}
                    className="h-full min-h-[22rem] rounded-3xl bg-gradient-to-br from-brand-900 via-slate-900 to-brand-800 shadow-xl shadow-slate-900/10"
                    renderSlide={(product) => <OfferSlide product={product} />}
                />
            )
    )
}

export default ProductOffer2

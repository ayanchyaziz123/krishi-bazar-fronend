import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Product from '../components/Product'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Paginate from '../components/Paginate'
import { listProducts } from '../actions/productActions'
import ProductOffer from '../components/ProductOffer'
import Navs from '../components/Navs'
import { Container, PageHeader } from '../components/ui'

function TopReviewProductScreen({ history }) {
    const dispatch = useDispatch()
    const productList = useSelector(state => state.productList)
    const { error, loading, products, page, pages } = productList

    let keyword = history.location.search

    useEffect(() => {
        dispatch(listProducts(keyword))
    }, [dispatch, keyword])

    return (
        <Container className="space-y-12">
            {!keyword && <ProductOffer />}

            <Navs />

            <section>
                <PageHeader title="Top reviewed products" subtitle="Products our customers have rated and reviewed." />
                {loading ? <Loader />
                    : error ? <Message variant='danger'>{error}</Message>
                        : (
                            <>
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {products.filter(product => product.numReviews > 0).map(product => (
                                        <Product key={product._id} product={product} />
                                    ))}
                                </div>
                                <Paginate page={page} pages={pages} keyword={keyword} />
                            </>
                        )
                }
            </section>
        </Container>
    )
}

export default TopReviewProductScreen;

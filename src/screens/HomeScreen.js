import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { X, PackageSearch } from 'lucide-react'
import Product from '../components/Product'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Paginate from '../components/Paginate'
import { listProducts } from '../actions/productActions'
import Navs2 from '../components/Navs2'
import SearchCategory from '../components/SearchCategory'
import { Container } from '../components/ui'

function HomeScreen({ history }) {
    const dispatch = useDispatch()
    const productList = useSelector(state => state.productList)

    const { error, loading, products, page, pages } = productList

    let keyword = history.location.search
    const activeKeyword = new URLSearchParams(keyword).get('keyword')

    useEffect(() => {
        dispatch(listProducts(keyword))
    }, [dispatch, keyword])

    return (
        <Container className="space-y-14">
            <Navs2 />

            <section id="products">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                            {activeKeyword ? 'Search results' : 'Fresh from the farm'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {activeKeyword ? <>Showing products matching “{activeKeyword}”</> : 'New harvests and handmade goods, added as they arrive.'}
                        </p>
                    </div>
                    {activeKeyword && (
                        <Link to="/" className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                            {activeKeyword} <X className="h-3.5 w-3.5" />
                        </Link>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-[12rem_1fr]">
                    <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
                        <SearchCategory />
                    </aside>

                    <div>
                        {loading ? <Loader />
                            : error ? <Message variant='danger'>{error}</Message>
                                : products.length === 0 ? (
                                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                                        <PackageSearch className="h-10 w-10 text-slate-300" />
                                        <p className="mt-3 font-semibold text-slate-900">No products found</p>
                                        <p className="mt-1 text-sm text-slate-500">Try another search or clear the filter.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                            {products.map(product => (
                                                <Product key={product._id} product={product} />
                                            ))}
                                        </div>
                                        <Paginate page={page} pages={pages} keyword={keyword} />
                                    </>
                                )
                        }
                    </div>
                </div>
            </section>
        </Container>
    )
}

export default HomeScreen

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import Paginate from '../components/Paginate'
import AdminLayout from '../admin_components/AdminLayout'
import { Table, Th, Td, Button, formatTk } from '../components/ui'
import { listProducts, deleteProduct, createProduct } from '../actions/productActions'
import { PRODUCT_CREATE_RESET } from '../constants/productConstants'

function ProductListScreen({ history }) {

    const dispatch = useDispatch()

    const productList = useSelector(state => state.productList)
    const { loading, error, products, pages, page } = productList

    const productDelete = useSelector(state => state.productDelete)
    const { loading: loadingDelete, error: errorDelete, success: successDelete } = productDelete

    const productCreate = useSelector(state => state.productCreate)
    const { loading: loadingCreate, error: errorCreate, success: successCreate, product: createdProduct } = productCreate

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    let keyword = history.location.search

    useEffect(() => {
        dispatch({ type: PRODUCT_CREATE_RESET })

        if (!userInfo || !userInfo.isAdmin) {
            history.push('/login')
            return
        }

        if (successCreate) {
            history.push(`/admin/product/${createdProduct._id}/edit`)
        } else {
            dispatch(listProducts(keyword))
        }
    }, [dispatch, history, userInfo, successDelete, successCreate, createdProduct, keyword])

    const deleteHandler = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            dispatch(deleteProduct(id))
        }
    }

    const createProductHandler = () => {
        dispatch(createProduct())
    }

    return (
        <AdminLayout
            title="Products"
            subtitle="Add, edit and remove products from the store."
            action={<Button onClick={createProductHandler}><Plus className="h-4 w-4" /> Create product</Button>}
        >
            {loadingDelete && <Loader />}
            {errorDelete && <Message variant='danger' className="mb-4">{errorDelete}</Message>}
            {loadingCreate && <Loader />}
            {errorCreate && <Message variant='danger' className="mb-4">{errorCreate}</Message>}

            {loading
                ? (<Loader />)
                : error
                    ? (<Message variant='danger'>{error}</Message>)
                    : (
                        <>
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Product</Th>
                                        <Th>Price</Th>
                                        <Th>Category</Th>
                                        <Th>Brand</Th>
                                        <Th className="text-right">Actions</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map(product => (
                                        <tr key={product._id} className="hover:bg-slate-50/60">
                                            <Td>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1">
                                                        <img src={product.image} alt="" className="max-h-full max-w-full object-contain" />
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{product.name}</p>
                                                        <p className="text-xs text-slate-400">#{product._id}</p>
                                                    </div>
                                                </div>
                                            </Td>
                                            <Td className="font-medium text-slate-900">{formatTk(product.price)}</Td>
                                            <Td>{product.category}</Td>
                                            <Td>{product.brand}</Td>
                                            <Td className="text-right">
                                                <div className="inline-flex gap-1">
                                                    <Button to={`/admin/product/${product._id}/edit`} variant="ghost" size="icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="danger-soft" size="icon" onClick={() => deleteHandler(product._id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <Paginate pages={pages} page={page} isAdmin={true} />
                        </>
                    )}
        </AdminLayout>
    )
}

export default ProductListScreen

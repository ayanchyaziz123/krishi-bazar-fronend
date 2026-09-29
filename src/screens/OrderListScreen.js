import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronRight } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AdminLayout from '../admin_components/AdminLayout'
import { Table, Th, Td, Button, Badge, formatTk } from '../components/ui'
import { listOrders } from '../actions/orderActions'

function OrderListScreen({ history }) {

    const dispatch = useDispatch()

    const orderList = useSelector(state => state.orderList)
    const { loading, error, orders } = orderList

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listOrders())
        } else {
            history.push('/login')
        }
    }, [dispatch, history, userInfo])

    return (
        <AdminLayout title="Orders" subtitle="Every order placed in the store.">
            {loading
                ? (<Loader />)
                : error
                    ? (<Message variant='danger'>{error}</Message>)
                    : (
                        <Table>
                            <thead>
                                <tr>
                                    <Th>ID</Th>
                                    <Th>Customer</Th>
                                    <Th>Date</Th>
                                    <Th>Total</Th>
                                    <Th>Paid</Th>
                                    <Th>Delivered</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map(order => (
                                    <tr key={order._id} className="hover:bg-slate-50/60">
                                        <Td className="font-semibold text-slate-900">#{order._id}</Td>
                                        <Td>{order.user && order.user.name}</Td>
                                        <Td>{order.createdAt.substring(0, 10)}</Td>
                                        <Td>{formatTk(order.totalPrice)}</Td>
                                        <Td>{order.isPaid
                                            ? <Badge variant="green">{order.paidAt.substring(0, 10)}</Badge>
                                            : <Badge variant="red">Unpaid</Badge>}
                                        </Td>
                                        <Td>{order.isDelivered
                                            ? <Badge variant="green">{order.deliveredAt.substring(0, 10)}</Badge>
                                            : <Badge variant="amber">Pending</Badge>}
                                        </Td>
                                        <Td className="text-right">
                                            <Button to={`/order/${order._id}`} variant="secondary" size="sm">Details <ChevronRight className="h-3.5 w-3.5" /></Button>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
        </AdminLayout>
    )
}

export default OrderListScreen

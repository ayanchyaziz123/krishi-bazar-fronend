import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronRight, Store, Truck } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AdminLayout from '../admin_components/AdminLayout'
import { Table, Th, Td, Button, Badge, cn, formatINR } from '../components/ui'
import { listOrders } from '../actions/orderActions'
import { handlesOrders } from '../admin_components/roles'
import { STATUS_TONES, statusLabel } from '../components/shop/checkout'

// Which orders each tab shows.
const TABS = [
    ['todo', 'To do', (o) => ['placed', 'confirmed', 'packed'].includes(o.order_status)],
    ['moving', 'On the way / ready', (o) => ['out_for_delivery', 'ready_for_pickup'].includes(o.order_status)],
    ['done', 'Done', (o) => o.order_status === 'delivered'],
    ['cancelled', 'Cancelled', (o) => o.order_status === 'cancelled'],
    ['all', 'All', () => true],
]

function OrderListScreen({ history }) {
    const dispatch = useDispatch()
    const { loading, error, orders } = useSelector(state => state.orderList)
    const { userInfo } = useSelector(state => state.userLogin)
    const [tab, setTab] = useState('todo')

    useEffect(() => {
        if (handlesOrders(userInfo)) dispatch(listOrders())
        else history.push('/login')
    }, [dispatch, history, userInfo])

    const all = [...(orders || [])].sort((a, b) => b._id - a._id)
    const [, , show] = TABS.find(([key]) => key === tab)
    const shown = all.filter(show)

    return (
        <AdminLayout title="Online orders" subtitle="Orders from the website. Open one to move it to its next step.">
            <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-sm">
                {TABS.map(([key, label, test]) => (
                    <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key}
                        className={cn('rounded-lg px-3 py-1.5 font-medium transition', tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900')}>
                        {label} <span className="text-slate-400">{all.filter(test).length}</span>
                    </button>
                ))}
            </div>
            {loading ? <Loader /> : error ? <Message variant='danger'>{error}</Message> : shown.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No orders here.</p>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <Th>Order</Th>
                            <Th>Customer</Th>
                            <Th>How</Th>
                            <Th>Total</Th>
                            <Th>Payment</Th>
                            <Th>Status</Th>
                            <Th></Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {shown.map(order => {
                            const pickup = order.delivery_method === 'pickup'
                            const a = order.shippingAddress || {}
                            return (
                                <tr key={order._id} className="cursor-pointer hover:bg-slate-50/60" onClick={() => history.push(`/admin/order/${order._id}`)}>
                                    <Td>
                                        <p className="font-semibold text-slate-900">#{order._id}</p>
                                        <p className="text-xs text-slate-400">{(order.createdAt || '').substring(0, 10)}</p>
                                    </Td>
                                    <Td>
                                        <p className="text-slate-900">{a.full_name || (order.user && order.user.name)}</p>
                                        {a.phone && <p className="text-xs text-slate-400">{a.phone}</p>}
                                    </Td>
                                    <Td>
                                        {pickup
                                            ? <span className="inline-flex items-center gap-1 text-slate-700"><Store className="h-4 w-4 text-slate-400" /> Pick-up</span>
                                            : <span className="inline-flex items-center gap-1 text-slate-700"><Truck className="h-4 w-4 text-slate-400" /> {[a.city, a.postalCode].filter((x) => x && x !== '-').join(' ') || 'Delivery'}</span>}
                                    </Td>
                                    <Td>{formatINR(order.totalPrice)}</Td>
                                    <Td>
                                        {order.isPaid ? <Badge variant="green">{order.payment_id ? 'Paid online' : 'Paid'}</Badge> : <Badge variant="amber">Not paid</Badge>}
                                    </Td>
                                    <Td><Badge variant={STATUS_TONES[order.order_status] || 'slate'}>{statusLabel(order.order_status, pickup)}</Badge></Td>
                                    <Td className="text-right">
                                        <Button to={`/admin/order/${order._id}`} variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>Open <ChevronRight className="h-3.5 w-3.5" /></Button>
                                    </Td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            )}
        </AdminLayout>
    )
}

export default OrderListScreen

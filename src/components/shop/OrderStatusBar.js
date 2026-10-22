import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Truck, Store, ChevronRight, X } from 'lucide-react'
import { statusLabel } from './checkout'

const DISMISS_KEY = 'orderBarDismissed'

// The customer's most recent order that hasn't been delivered yet, as a strip on the home
// page. It only shows real order details: placed, paid or not, and how it is delivered.
function OrderStatusBar() {
    const { userInfo } = useSelector((state) => state.userLogin)
    const [order, setOrder] = useState(null)
    const [dismissed, setDismissed] = useState(() => {
        try { return sessionStorage.getItem(DISMISS_KEY) } catch (e) { return null }
    })

    useEffect(() => {
        if (!userInfo || !userInfo.token) { setOrder(null); return undefined }
        let alive = true
        axios.get('/api/orders/myorders/', { headers: { Authorization: `Bearer ${userInfo.token}` } })
            .then(({ data }) => {
                if (!alive) return
                const open = (data || []).filter((o) => !o.isDelivered && o.order_status !== 'cancelled').sort((a, b) => b._id - a._id)
                setOrder(open[0] || null)
            })
            .catch(() => {})
        return () => { alive = false }
    }, [userInfo])

    if (!order || String(order._id) === dismissed) return null

    const pickup = order.delivery_method === 'pickup'
    const items = order.orderItems || []
    const Icon = pickup ? Store : Truck
    const title = order.order_status && order.order_status !== 'placed'
        ? statusLabel(order.order_status, pickup)
        : (pickup ? 'Pick-up order placed' : 'Order placed')
    const detail = `${items[0] ? items[0].name : 'Your items'}${items.length > 1 ? ` + ${items.length - 1} more` : ''}`
    const dismiss = () => {
        try { sessionStorage.setItem(DISMISS_KEY, String(order._id)) } catch (e) { /* ignore */ }
        setDismissed(String(order._id))
    }

    return (
        <div className="fixed inset-x-3 bottom-[5.25rem] z-30 md:static md:inset-auto">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 shadow-lg shadow-emerald-900/10 md:shadow-none">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white"><Icon className="h-6 w-6" /></span>
                <Link to={`/order/${order._id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-900">
                        <span className="font-bold">{title}</span>
                        <span className="text-slate-500"> | #{order._id}</span>
                    </p>
                    <p className="truncate text-xs text-slate-600">{detail}</p>
                </Link>
                <Link to={`/order/${order._id}`} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-blue-600">
                    View <ChevronRight className="h-4 w-4" />
                </Link>
                <button type="button" onClick={dismiss} aria-label="Hide" className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

export default OrderStatusBar

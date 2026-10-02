import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'

// Helpers shared by the shop back-office screens (counter sale, stock, receiving, sales).

export function useAdminGuard(history) {
    const { userInfo } = useSelector((state) => state.userLogin)
    const isAdmin = Boolean(userInfo && userInfo.isAdmin)
    useEffect(() => {
        if (!isAdmin) history.push('/login')
    }, [isAdmin, history])
    return { userInfo, isAdmin }
}

export function inventoryApi(userInfo) {
    const config = { headers: { Authorization: `Bearer ${userInfo ? userInfo.token : ''}` } }
    return {
        get: (path) => axios.get(`/api/inventory/${path}`, config).then((r) => r.data),
        post: (path, body) => axios.post(`/api/inventory/${path}`, body, config).then((r) => r.data),
        patch: (path, body) => axios.patch(`/api/inventory/${path}`, body, config).then((r) => r.data),
    }
}

export function errorText(error) {
    return (error.response && error.response.data && error.response.data.detail) || error.message
}

export const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'card', label: 'Card' },
    { value: 'due', label: 'Due' },
]

export function todayInDhaka() {
    // en-CA formats dates as YYYY-MM-DD.
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
}

export function formatDateTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    })
}

export function formatTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' })
}

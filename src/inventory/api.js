import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { roleOf } from '../admin_components/roles'

// Helpers shared by the shop back-office screens (counter sale, stock, receiving, sales).

// `isAdmin` here means any staff role; AdminGate already checked the role may open the page.
export function useAdminGuard(history) {
    const { userInfo } = useSelector((state) => state.userLogin)
    const isAdmin = Boolean(roleOf(userInfo))
    useEffect(() => {
        if (!isAdmin) history.push('/staff')
    }, [isAdmin, history])
    return { userInfo, isAdmin }
}

export function inventoryApi(userInfo) {
    const config = { headers: { Authorization: `Bearer ${userInfo ? userInfo.token : ''}` } }
    return {
        get: (path) => axios.get(`/api/inventory/${path}`, config).then((r) => r.data),
        post: (path, body) => axios.post(`/api/inventory/${path}`, body, config).then((r) => r.data),
        patch: (path, body) => axios.patch(`/api/inventory/${path}`, body, config).then((r) => r.data),
        // A form with a file in it, such as a delivery with its receipt.
        postForm: (path, form) => axios.post(`/api/inventory/${path}`, form, config).then((r) => r.data),
        // A private file, fetched with the login so it can be shown or opened.
        blob: (path) => axios.get(`/api/inventory/${path}`, { ...config, responseType: 'blob' }).then((r) => r.data),
    }
}

export function errorText(error) {
    return (error.response && error.response.data && error.response.data.detail) || error.message
}

// Payment types offered at the counter. Older sales may still show bKash, Nagad or Due.
export const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
]

export function todayInShop() {
    // en-CA formats dates as YYYY-MM-DD.
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export function formatDateTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    })
}

export function formatTime(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })
}

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import Countdown from 'react-countdown'
import { Ticket, Timer } from 'lucide-react'
import { formatINR } from './ui'

// The signed-in customer's own unused coupons for this shop, as a banner with a countdown.
function Coupon() {
    const { userInfo } = useSelector(state => state.userLogin)
    const [mine, setMine] = useState([])

    useEffect(() => {
        if (!userInfo || !userInfo.token) { setMine([]); return undefined }
        let alive = true
        axios.get('/api/products/coupons/mine/', { headers: { Authorization: `Bearer ${userInfo.token}` } })
            .then(({ data }) => alive && setMine(data || []))
            .catch(() => alive && setMine([]))
        return () => { alive = false }
    }, [userInfo])

    if (!mine.length) return null
    return (
        <div className="mb-6 space-y-3">
            {mine.map((coupon) => (
                <div key={coupon.id} className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-4 text-slate-900 shadow-lg shadow-amber-500/20 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/40"><Ticket className="h-5 w-5" /></span>
                        <div>
                            <p className="font-semibold">You have a {formatINR(coupon.total_discount)} discount</p>
                            <p className="text-sm text-slate-800">
                                Use code <span className="rounded-md bg-white/60 px-1.5 py-0.5 font-mono font-bold">{coupon.coupon_code}</span> at checkout
                            </p>
                        </div>
                    </div>
                    {new Date(coupon.redemption_date) > new Date() && (
                        <div className="flex items-center gap-2 font-mono text-lg font-bold">
                            <Timer className="h-5 w-5" />
                            <Countdown date={coupon.redemption_date} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default Coupon

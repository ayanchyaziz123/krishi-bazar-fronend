import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Countdown from 'react-countdown';
import { Ticket, Timer } from 'lucide-react'
import Loader from './Loader'
import Message from './Message'
import { listCoupons } from '../actions/productActions'

function Coupon() {
    const dispatch = useDispatch()
    const couponList = useSelector(state => state.couponList)
    const { coupon_redemptions, loading, error } = couponList
    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    useEffect(() => {
        dispatch(listCoupons());
    }, [dispatch])

    if (!couponList.coupons || !userLogin.userInfo) return null;

    const mine = (coupon_redemptions || []).filter(coupon => coupon.user_id == userInfo._id) // eslint-disable-line eqeqeq

    return (loading ? <Loader />
        : error
            ? <Message variant='danger'>{error}</Message>
            : mine.length > 0 && (
                <div className="mb-6 space-y-3">
                    {mine.map((coupon, i) => (
                        <div key={i} className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-4 text-slate-900 shadow-lg shadow-amber-500/20 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/40">
                                    <Ticket className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="font-semibold">You have a ৳{coupon.total_discount} discount</p>
                                    <p className="text-sm text-slate-800">
                                        Use code <span className="rounded-md bg-white/60 px-1.5 py-0.5 font-mono font-bold">{coupon.coupon_code}</span> before {coupon.redemption_date}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-lg font-bold">
                                <Timer className="h-5 w-5" />
                                <Countdown date={coupon.redemption_date} />
                            </div>
                        </div>
                    ))}
                </div>
            )
    )
}

export default Coupon

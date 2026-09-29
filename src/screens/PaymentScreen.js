import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CreditCard } from 'lucide-react'
import FormContainer from '../components/FormContainer'
import CheckoutSteps from '../components/CheckoutSteps'
import { Card, Button } from '../components/ui'
import { savePaymentMethod } from '../actions/cartActions'

function PaymentScreen({ history }) {

    const cart = useSelector(state => state.cart)
    const { shippingAddress } = cart

    const dispatch = useDispatch()

    const [paymentMethod, setPaymentMethod] = useState('PayPal')

    if (!shippingAddress.address) {
        history.push('/shipping')
    }

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(savePaymentMethod(paymentMethod))
        history.push('/placeorder')
    }

    return (
        <FormContainer>
            <CheckoutSteps step1 step2 step3 />
            <Card className="p-6 sm:p-8">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Payment method</h1>
                <p className="mt-1 text-sm text-slate-500">Choose how you'd like to pay.</p>
                <form onSubmit={submitHandler} className="mt-6 space-y-6">
                    <label htmlFor="paypal" className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-brand-600 bg-brand-50/50 p-4">
                        <input
                            type='radio'
                            id='paypal'
                            name='paymentMethod'
                            value='PayPal'
                            checked={paymentMethod === 'PayPal'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 accent-brand-600"
                        />
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                            <CreditCard className="h-5 w-5" />
                        </span>
                        <span>
                            <span className="block font-semibold text-slate-900">PayPal or credit card</span>
                            <span className="block text-sm text-slate-500">Pay securely through PayPal</span>
                        </span>
                    </label>
                    <Button type='submit' block size="lg">Continue</Button>
                </form>
            </Card>
        </FormContainer>
    )
}

export default PaymentScreen

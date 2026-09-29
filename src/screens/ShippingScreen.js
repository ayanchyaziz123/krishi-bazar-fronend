import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FormContainer from '../components/FormContainer'
import CheckoutSteps from '../components/CheckoutSteps'
import { Card, Field, Input, Button } from '../components/ui'
import { saveShippingAddress } from '../actions/cartActions'

function ShippingScreen({ history }) {

    const cart = useSelector(state => state.cart)
    const { shippingAddress } = cart

    const dispatch = useDispatch()

    const [address, setAddress] = useState(shippingAddress.address)
    const [city, setCity] = useState(shippingAddress.city)
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode)
    const [country, setCountry] = useState(shippingAddress.country)

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(saveShippingAddress({ address, city, postalCode, country }))
        history.push('/payment')
    }

    return (
        <FormContainer>
            <CheckoutSteps step1 step2 />
            <Card className="p-6 sm:p-8">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Shipping address</h1>
                <p className="mt-1 text-sm text-slate-500">Where should we deliver your order?</p>
                <form onSubmit={submitHandler} className="mt-6 space-y-4">
                    <Field label="Address" id="address">
                        <Input id="address" required type='text' placeholder='Street and house number' value={address ? address : ''} onChange={(e) => setAddress(e.target.value)} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="City" id="city">
                            <Input id="city" required type='text' placeholder='City' value={city ? city : ''} onChange={(e) => setCity(e.target.value)} />
                        </Field>
                        <Field label="Postal code" id="postalCode">
                            <Input id="postalCode" required type='text' placeholder='Postal code' value={postalCode ? postalCode : ''} onChange={(e) => setPostalCode(e.target.value)} />
                        </Field>
                    </div>
                    <Field label="Country" id="country">
                        <Input id="country" required type='text' placeholder='Country' value={country ? country : ''} onChange={(e) => setCountry(e.target.value)} />
                    </Field>
                    <Button type='submit' block size="lg" className="mt-2">Continue to payment</Button>
                </form>
            </Card>
        </FormContainer>
    )
}

export default ShippingScreen

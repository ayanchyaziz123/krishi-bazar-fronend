import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AuthCard from '../components/AuthCard'
import { Field, Input, Button } from '../components/ui'
import { register } from '../actions/userActions'

function OTPScreen({ location, history }) {

    const [otp, setOtp] = useState('')
    const [email, setEmail] = useState('')

    const dispatch = useDispatch()

    const redirect = location.search ? location.search.split('=')[1] : '/'

    const userRegister = useSelector(state => state.userRegister)
    const { error, loading, userInfo } = userRegister

    useEffect(() => {
        if (localStorage.getItem('data_tkn')) {
            setEmail(localStorage.getItem('data_tkn'));
        }
        if (userInfo) {
            localStorage.removeItem('data_tkn');
            history.push(redirect)
        }
    }, [history, userInfo, redirect])

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(register(otp, email))
    }

    return (
        <AuthCard
            title="Check your email"
            subtitle={email ? <>Enter the code we sent to <span className="font-semibold text-slate-700">{email}</span>.</> : 'Enter the one-time code we emailed you.'}
            footer={<>Have an account?{' '}
                <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
            </>}
        >
            {error && <Message variant='danger' className="mb-5">{error}</Message>}
            {loading && <Loader />}
            <form onSubmit={submitHandler} className="space-y-5">
                <Field label="One-time code" id="otp">
                    <Input
                        id="otp"
                        required
                        type='text'
                        inputMode="numeric"
                        placeholder='••••••'
                        className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
                        onChange={(e) => setOtp(e.target.value)}
                    />
                </Field>
                <Button type='submit' block size="lg">Verify</Button>
            </form>
        </AuthCard>
    )
}

export default OTPScreen;

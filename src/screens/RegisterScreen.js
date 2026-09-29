import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AuthCard from '../components/AuthCard'
import { Field, Input, Button } from '../components/ui'
import { register } from '../actions/userActions'

function RegisterScreen({ location, history }) {

    const [name, setName] = useState('')
    const [mobile, setMobile] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')

    const dispatch = useDispatch()

    const redirect = location.search ? location.search.split('=')[1] : '/'

    const userRegister = useSelector(state => state.userRegister)
    const { error, loading, userInfo } = userRegister

    useEffect(() => {
        if (userInfo) {
            history.push(redirect)
        }
    }, [history, userInfo, redirect])

    const submitHandler = (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setMessage('Passwords do not match')
        } else {
            dispatch(register(name, email, password, mobile))
        }
    }

    return (
        <AuthCard
            title="Create your account"
            footer={<>Have an account?{' '}
                <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
            </>}
        >
            {message && <Message variant='danger' className="mb-5">{message}</Message>}
            {error && <Message variant='danger' className="mb-5">{error}</Message>}
            {loading && <Loader />}
            <form onSubmit={submitHandler} className="space-y-4">
                <Field label="Name" id="name">
                    <Input id="name" required type='text' placeholder='Your name' value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Mobile" id="mobile">
                    <Input id="mobile" required type='text' placeholder='019*******' value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </Field>
                <Field label="Email address" id="email">
                    <Input id="email" required type='email' placeholder='you@example.com' value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Password" id="password">
                        <Input id="password" required type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
                    </Field>
                    <Field label="Confirm password" id="passwordConfirm">
                        <Input id="passwordConfirm" required type='password' placeholder='Confirm' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </Field>
                </div>
                <Button type='submit' block size="lg" className="mt-2">Register</Button>
            </form>
        </AuthCard>
    )
}

export default RegisterScreen;

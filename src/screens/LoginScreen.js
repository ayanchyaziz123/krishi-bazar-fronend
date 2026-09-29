import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AuthCard from '../components/AuthCard'
import { Field, Input, Button } from '../components/ui'
import { login } from '../actions/userActions'

function LoginScreen({ location, history }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const dispatch = useDispatch()

    const redirect = location.search ? location.search.split('=')[1] : '/'

    const userLogin = useSelector(state => state.userLogin)
    const { error, loading, userInfo } = userLogin

    useEffect(() => {
        if (userInfo) {
            history.push(redirect)
        }
    }, [history, userInfo, redirect])

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(login(email.trim().toLowerCase(), password))
    }

    return (
        <AuthCard
            title="Welcome back"
            subtitle="Sign in to your account to continue."
            footer={<>New customer?{' '}
                <Link to={redirect ? `/register2?redirect=${redirect}` : '/register2'} className="font-semibold text-brand-600 hover:text-brand-700">
                    Create an account
                </Link>
            </>}
        >
            {error && <Message variant='danger' className="mb-5">{error}</Message>}
            {loading && <Loader />}
            <form onSubmit={submitHandler} className="space-y-5">
                <Field label="Email address" id="email">
                    <Input id="email" type='email' autoComplete="username" autoCapitalize="none" placeholder='you@example.com' value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>

                <Field label={
                    <span className="flex items-center justify-between">
                        Password
                        <Link to={redirect ? `/reset_password?redirect=${redirect}` : '/reset_password'} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                            Forgot password?
                        </Link>
                    </span>
                } id="password">
                    <Input id="password" type='password' autoComplete="current-password" placeholder='Enter your password' value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>

                <Button type='submit' block size="lg">Sign in</Button>
            </form>
        </AuthCard>
    )
}

export default LoginScreen

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AuthCard from '../components/AuthCard'
import { Field, Input, Button } from '../components/ui'

const baseURL = "/api/users/temp_register/";

function RegisterScreen2({ location, history }) {

    const [name, setName] = useState('')
    const [mobile, setMobile] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState(null);
    const [loading, setLoadding] = useState(false)
    const [success, setSuccess] = useState(false);

    const redirect = location.search ? location.search.split('=')[1] : '/'

    useEffect(() => {
        if (success) {
            history.push('/otp_screen');
        }
    }, [success, history]);

    const submitHandler = (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Passwords do not match')
        } else {
            setLoadding(true)
            axios.post(baseURL, {
                name,
                email,
                mobile,
                password
            }).then((response) => {
                localStorage.setItem('data_tkn', response.data);
                setSuccess(true);
            }).catch(error => {
                setError(error.response ? error.response.data : error.message);
            }).finally(() => setLoadding(false))
        }
    }

    const errorText = error && (typeof error === 'string' ? error : error.detail || JSON.stringify(error))

    return (
        <AuthCard
            title="Create your account"
            subtitle="We'll email you a one-time code to confirm it's you."
            footer={<>Have an account?{' '}
                <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
            </>}
        >
            {errorText && <Message variant='danger' className="mb-5">{errorText}</Message>}
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
                <Button type='submit' block size="lg" className="mt-2" disabled={loading}>Create account</Button>
            </form>
        </AuthCard>
    )
}

export default RegisterScreen2;

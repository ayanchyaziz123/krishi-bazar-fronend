import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import Message from '../components/Message';
import { Field, Input, Button } from '../components/ui';

const baseUrl = "/api/users/resetPassword/";

const ResetPassword = ({ history }) => {

    const [success, setSuccess] = useState(3);
    const [email, setEmail] = useState(null);

    useEffect(() => {
        if (Number(success) === 1) {
            history.push('/otp_screen');
        }
    }, [success, history])

    const form_handeler = (e) => {
        e.preventDefault();
        if (email) {
            axios.post(baseUrl, { email }).then(response => {
                setEmail(response.data.email);
                setSuccess(response.data.result)
            })
        }
    }

    return (
        <AuthCard
            title="Reset your password"
            subtitle="Enter your email and we'll send you a code."
            footer={<Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Back to sign in</Link>}
        >
            {Number(success) !== 3 && <Message variant="danger" className="mb-5">This email is not registered.</Message>}
            <form onSubmit={form_handeler} className="space-y-5">
                <Field label="Email address" id="email">
                    <Input id="email" type='email' placeholder='you@example.com' onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Button type="submit" block size="lg">Send code</Button>
            </form>
        </AuthCard>
    )
}
export default ResetPassword;

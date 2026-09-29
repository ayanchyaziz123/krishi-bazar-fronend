import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X as XIcon, ChevronRight } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import { Container, PageHeader, Card, Field, Input, Button, Badge, Table, Th, Td, formatTk } from '../components/ui'
import { getUserDetails, updateUserProfile } from '../actions/userActions'
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants'
import { listMyOrders } from '../actions/orderActions'

function ProfileScreen({ history }) {

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')

    const dispatch = useDispatch()

    const userDetails = useSelector(state => state.userDetails)
    const { error, loading, user } = userDetails

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    const userUpdateProfile = useSelector(state => state.userUpdateProfile)
    const { success } = userUpdateProfile

    const orderListMy = useSelector(state => state.orderListMy)
    const { loading: loadingOrders, error: errorOrders, orders } = orderListMy

    useEffect(() => {
        if (!userInfo) {
            history.push('/login')
        } else {
            if (!user || !user.name || success || userInfo._id !== user._id) {
                dispatch({ type: USER_UPDATE_PROFILE_RESET })
                dispatch(getUserDetails('profile'))
                dispatch(listMyOrders())
            } else {
                setName(user.name)
                setEmail(user.email)
            }
        }
    }, [dispatch, history, userInfo, user, success])

    const submitHandler = (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setMessage('Passwords do not match')
        } else {
            dispatch(updateUserProfile({
                'id': user._id,
                'name': name,
                'email': email,
                'password': password
            }))
            setMessage('')
        }
    }

    return (
        <Container>
            <PageHeader eyebrow="Account" title={userInfo && userInfo.name ? `Hi, ${userInfo.name}` : 'Your profile'} subtitle="Manage your details and track your orders." />
            <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
                <div className="space-y-6">

                    <Card className="p-6">
                        <h2 className="font-semibold text-slate-900">Profile details</h2>
                        {message && <Message variant='danger' className="mt-4">{message}</Message>}
                        {error && <Message variant='danger' className="mt-4">{error}</Message>}
                        {loading && <Loader />}
                        <form onSubmit={submitHandler} className="mt-5 space-y-4">
                            <Field label="Name" id="name">
                                <Input id="name" required type='text' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)} />
                            </Field>
                            <Field label="Email address" id="email">
                                <Input id="email" required type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)} />
                            </Field>
                            <Field label="New password" id="password">
                                <Input id="password" type='password' placeholder='Leave blank to keep' value={password} onChange={(e) => setPassword(e.target.value)} />
                            </Field>
                            <Field label="Confirm password" id="passwordConfirm">
                                <Input id="passwordConfirm" type='password' placeholder='Confirm new password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </Field>
                            <Button type='submit' block>Save changes</Button>
                        </form>
                    </Card>
                </div>

                <div>
                    <h2 className="mb-4 font-semibold text-slate-900">Recent orders</h2>
                    {loadingOrders ? (
                        <Loader />
                    ) : errorOrders ? (
                        <Message variant='danger'>{errorOrders}</Message>
                    ) : orders.length === 0 ? (
                        <Card className="p-10 text-center text-sm text-slate-500">You haven't placed any orders yet.</Card>
                    ) : (
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Order</Th>
                                    <Th>Date</Th>
                                    <Th>Total</Th>
                                    <Th>Paid</Th>
                                    <Th></Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map(order => (
                                    <tr key={order._id} className="hover:bg-slate-50/60">
                                        <Td className="font-semibold text-slate-900">#{order._id}</Td>
                                        <Td>{order.createdAt.substring(0, 10)}</Td>
                                        <Td>{formatTk(order.totalPrice)}</Td>
                                        <Td>{order.isPaid
                                            ? <Badge variant="green">{order.paidAt.substring(0, 10)}</Badge>
                                            : <Badge variant="red"><XIcon className="h-3 w-3" /> Unpaid</Badge>}
                                        </Td>
                                        <Td className="text-right">
                                            <Button to={`/order/${order._id}`} variant="secondary" size="sm">Details <ChevronRight className="h-3.5 w-3.5" /></Button>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </div>
            </div>
        </Container>
    )
}

export default ProfileScreen

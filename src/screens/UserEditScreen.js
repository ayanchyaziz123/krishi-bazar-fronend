import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { Card, Field, Input, Button, cn } from '../components/ui'
import { ROLE_OPTIONS, roleOf } from '../admin_components/roles'
import { getUserDetails, refreshBusinesses, updateUser } from '../actions/userActions'
import { USER_UPDATE_RESET } from '../constants/userConstants'

function UserEditScreen({ match, history }) {

    const userId = match.params.id

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('customer')
    const [active, setActive] = useState(true)

    const dispatch = useDispatch()

    const userDetails = useSelector(state => state.userDetails)
    const { error, loading, user } = userDetails

    const { userInfo } = useSelector(state => state.userLogin)
    const iAmOwner = roleOf(userInfo) === 'owner'
    const isMe = userInfo && user && user._id === userInfo._id

    const userUpdate = useSelector(state => state.userUpdate)
    const { error: errorUpdate, loading: loadingUpdate, success: successUpdate } = userUpdate

    useEffect(() => {
        if (successUpdate) {
            dispatch({ type: USER_UPDATE_RESET })
            // Handing over the business changes my own role too.
            dispatch(refreshBusinesses())
            history.push(role === 'customer' ? '/admin/customers' : '/admin/staff')
        } else {
            if (!user.name || user._id !== Number(userId)) {
                dispatch(getUserDetails(userId))
            } else {
                setName(user.name)
                setEmail(user.email)
                setRole(user.role || (user.isAdmin ? 'manager' : 'customer'))
                setActive(user.active !== false)
            }
        }
    }, [user, userId, successUpdate, history, dispatch])

    const submitHandler = (e) => {
        e.preventDefault()
        const isStaff = role !== 'customer'
        dispatch(updateUser({ _id: user._id, name, email, role, ...(isStaff && user.role ? { active } : {}) }))
    }

    return (
        <FormContainer>
            <Link to={user && (user.role || user.isAdmin) ? '/admin/staff' : '/admin/customers'} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <Card className="p-6 sm:p-8">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Edit user</h1>
                {loadingUpdate && <Loader />}
                {errorUpdate && <Message variant='danger' className="mt-4">{errorUpdate}</Message>}

                {loading ? <Loader /> : error ? <Message variant='danger' className="mt-4">{error}</Message>
                    : (
                        <form onSubmit={submitHandler} className="mt-6 space-y-4">
                            <Field label="Name" id="name">
                                <Input id="name" type='text' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)} />
                            </Field>
                            <Field label="Email address" id="email">
                                <Input id="email" type='email' placeholder='Enter email' value={email} onChange={(e) => setEmail(e.target.value)} />
                            </Field>
                            <fieldset>
                                <legend className="mb-2 text-sm font-medium text-slate-700">Access</legend>
                                {user.role === 'owner' ? (
                                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                        <span className="font-semibold text-slate-900">Owner.</span> The owner always has full access to this business.
                                    </p>
                                ) : (
                                <div className="space-y-2">
                                    {[...ROLE_OPTIONS, ...(iAmOwner && !isMe && user.role ? [{ value: 'owner', label: 'Owner',
                                        hint: 'Hand this business over. They get full control and you stay on as a manager.' }] : [])].map((r) => (
                                        <label key={r.value} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                                            role === r.value ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 hover:bg-slate-50')}>
                                            <input type="radio" name="role" value={r.value} checked={role === r.value}
                                                onChange={() => setRole(r.value)} className="mt-0.5 accent-brand-600" />
                                            <span>
                                                <span className="block text-sm font-semibold text-slate-900">{r.label}</span>
                                                <span className="block text-xs text-slate-500">{r.hint}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                )}
                                {role === 'owner' && user.role !== 'owner' && (
                                    <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                                        You are handing over the business. After saving, {user.name} is the owner and you become a manager.
                                    </p>
                                )}
                            </fieldset>
                            {user.role && user.role !== 'owner' && !isMe && role !== 'customer' && (
                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mt-0.5 accent-brand-600" />
                                    <span>
                                        <span className="block text-sm font-semibold text-slate-900">Can sign in to this business</span>
                                        <span className="block text-xs text-slate-500">Untick to pause their access, for example while they are on leave. Their role is kept.</span>
                                    </span>
                                </label>
                            )}
                            <Button type='submit' block>Update user</Button>
                        </form>
                    )}
            </Card>
        </FormContainer>
    )
}

export default UserEditScreen

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import FormContainer from '../components/FormContainer'
import { Card, Field, Input, Checkbox, Button } from '../components/ui'
import { getUserDetails, updateUser } from '../actions/userActions'
import { USER_UPDATE_RESET } from '../constants/userConstants'

function UserEditScreen({ match, history }) {

    const userId = match.params.id

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    const dispatch = useDispatch()

    const userDetails = useSelector(state => state.userDetails)
    const { error, loading, user } = userDetails

    const userUpdate = useSelector(state => state.userUpdate)
    const { error: errorUpdate, loading: loadingUpdate, success: successUpdate } = userUpdate

    useEffect(() => {
        if (successUpdate) {
            dispatch({ type: USER_UPDATE_RESET })
            history.push('/admin/userlist')
        } else {
            if (!user.name || user._id !== Number(userId)) {
                dispatch(getUserDetails(userId))
            } else {
                setName(user.name)
                setEmail(user.email)
                setIsAdmin(user.isAdmin)
            }
        }
    }, [user, userId, successUpdate, history, dispatch])

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(updateUser({ _id: user._id, name, email, isAdmin }))
    }

    return (
        <FormContainer>
            <Link to='/admin/userlist' className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Back to users
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
                            <Checkbox id="isadmin" label="Is admin" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                            <Button type='submit' block>Update user</Button>
                        </form>
                    )}
            </Card>
        </FormContainer>
    )
}

export default UserEditScreen

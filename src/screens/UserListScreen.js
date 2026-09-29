import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Pencil, Trash2, Check, X as XIcon } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AdminLayout from '../admin_components/AdminLayout'
import { Table, Th, Td, Button, Badge } from '../components/ui'
import { listUsers, deleteUser } from '../actions/userActions'

function UserListScreen({ history }) {

    const dispatch = useDispatch()

    const userList = useSelector(state => state.userList)
    const { loading, error, users } = userList

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    const userDelete = useSelector(state => state.userDelete)
    const { success: successDelete } = userDelete

    useEffect(() => {
        if (userInfo && userInfo.isAdmin) {
            dispatch(listUsers())
        } else {
            history.push('/login')
        }
    }, [dispatch, history, successDelete, userInfo])

    const deleteHandler = (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            dispatch(deleteUser(id))
        }
    }

    return (
        <AdminLayout title="Users" subtitle="Everyone with an account in the store.">
            {loading
                ? (<Loader />)
                : error
                    ? (<Message variant='danger'>{error}</Message>)
                    : (
                        <Table>
                            <thead>
                                <tr>
                                    <Th>ID</Th>
                                    <Th>Name</Th>
                                    <Th>Email</Th>
                                    <Th>Role</Th>
                                    <Th className="text-right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-slate-50/60">
                                        <Td className="text-slate-400">#{user._id}</Td>
                                        <Td className="font-medium text-slate-900">{user.name}</Td>
                                        <Td>{user.email}</Td>
                                        <Td>{user.isAdmin
                                            ? <Badge variant="brand"><Check className="h-3 w-3" /> Admin</Badge>
                                            : <Badge variant="slate"><XIcon className="h-3 w-3" /> Customer</Badge>}
                                        </Td>
                                        <Td className="text-right">
                                            <div className="inline-flex gap-1">
                                                <Button to={`/admin/user/${user._id}/edit`} variant="ghost" size="icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="danger-soft" size="icon" onClick={() => deleteHandler(user._id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
        </AdminLayout>
    )
}

export default UserListScreen

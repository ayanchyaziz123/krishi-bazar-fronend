import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import Loader from '../components/Loader'
import Message from '../components/Message'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Table, Th, Td, Button, Badge, ConfirmDialog, Field, Input, Modal, cn, toast } from '../components/ui'
import { listUsers, deleteUser } from '../actions/userActions'
import { ROLE_LABELS, ROLE_OPTIONS, isManagerRole, roleOf } from '../admin_components/roles'

const ROLE_BADGE = { owner: 'brand', manager: 'brand', cashier: 'green', stock: 'amber', orders: 'sky' }
// The same list serves two pages: /admin/staff and /admin/customers.
function UserListScreen({ history, location }) {
    const staffPage = location.pathname.startsWith('/admin/staff')

    const dispatch = useDispatch()

    const userList = useSelector(state => state.userList)
    const { loading, error, users } = userList

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin

    const userDelete = useSelector(state => state.userDelete)
    const { success: successDelete, error: errorDelete } = userDelete

    const [adding, setAdding] = useState(false)
    const [notice, setNotice] = useState('')

    useEffect(() => {
        if (isManagerRole(roleOf(userInfo))) {
            dispatch(listUsers())
        } else {
            history.push('/login')
        }
    }, [dispatch, history, successDelete, userInfo])

    const [deleting, setDeleting] = useState(null)
    const deleteHandler = (id) => setDeleting((users || []).find((u) => u._id === id) || null)
    const confirmDelete = () => {
        dispatch(deleteUser(deleting._id))
        toast.success(`${deleting.name} was removed from your staff.`)
        setDeleting(null)
    }

    const roleOfRow = (u) => u.role || (u.isAdmin ? 'manager' : null)
    const shown = (users || []).filter((u) => (staffPage ? roleOfRow(u) : !roleOfRow(u)))

    return (
        <AdminLayout
            title={staffPage ? 'Staff' : 'Customers'}
            subtitle={staffPage
                ? 'Managers, cashiers, stock keepers and online-orders staff. Each person only sees the pages their role needs.'
                : 'People with a customer account on the website. Make someone staff from their edit page.'}
            action={staffPage && <Button onClick={() => setAdding(true)}><UserPlus className="h-4 w-4" /> Add staff</Button>}
        >
            {notice && <Alert variant="success" className="mb-4">{notice}</Alert>}
            {errorDelete && <Message variant='danger' className="mb-4">{errorDelete}</Message>}

            {loading
                ? (<Loader />)
                : error
                    ? (<Message variant='danger'>{error}</Message>)
                    : (
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Name</Th>
                                    <Th>Email</Th>
                                    <Th>Access</Th>
                                    <Th className="text-right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {shown.map(user => {
                                    const role = roleOfRow(user)
                                    const isMe = userInfo && user._id === userInfo._id
                                    return (
                                        <tr key={user._id} className="hover:bg-slate-50/60">
                                            <Td>
                                                <p className="font-medium text-slate-900">{user.name}{isMe && <span className="ml-1.5 text-xs font-normal text-slate-500">(you)</span>}</p>
                                                <p className="text-xs text-slate-400">#{user._id}</p>
                                            </Td>
                                            <Td>{user.email}</Td>
                                            <Td>{role
                                                ? <span className="inline-flex flex-wrap gap-1.5">
                                                    <Badge variant={ROLE_BADGE[role]}>{ROLE_LABELS[role]}</Badge>
                                                    {user.active === false && <Badge variant="slate">Access paused</Badge>}
                                                </span>
                                                : <Badge variant="slate">Customer</Badge>}
                                            </Td>
                                            <Td className="text-right">
                                                <div className="inline-flex gap-1">
                                                    <Button to={`/admin/user/${user._id}/edit`} variant="ghost" size="icon" aria-label={`Edit ${user.name}`}><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="danger-soft" size="icon" onClick={() => deleteHandler(user._id)} aria-label={`Remove ${user.name}`} disabled={isMe || !role || role === 'owner'}
                                                        title={isMe ? "You can't remove yourself" : role === 'owner' ? "The owner can't be removed"
                                                            : !role ? "Customer accounts belong to the customer" : undefined}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </Td>
                                        </tr>
                                    )
                                })}
                                {shown.length === 0 && (
                                    <tr><Td colSpan={4} className="py-10 text-center text-slate-500">
                                        {staffPage ? 'No staff yet. Use “Add staff” to create a cashier or stock keeper.' : 'No customers yet.'}
                                    </Td></tr>
                                )}
                            </tbody>
                        </Table>
                    )}

            <ConfirmDialog show={Boolean(deleting)} title={deleting ? `Remove ${deleting.name} from your staff?` : ''} confirmLabel="Remove" danger
                onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
                They lose access to this business straight away. Their account, past sales and orders are kept.
                To stop access for a while instead, pause it from their edit page.
            </ConfirmDialog>

            {adding && (
                <AddStaff
                    token={userInfo.token}
                    onClose={() => setAdding(false)}
                    onAdded={(user) => {
                        setAdding(false)
                        setNotice(`${user.name} can now sign in as ${ROLE_LABELS[user.role].toLowerCase()} with ${user.email}.`)
                        toast.success(`${user.name} was added as ${ROLE_LABELS[user.role].toLowerCase()}.`)
                        dispatch(listUsers())
                    }}
                />
            )}
        </AdminLayout>
    )
}

function AddStaff({ token, onClose, onAdded }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('cashier')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const submit = (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        axios.post('/api/users/staff/', { name, email, password, role }, { headers: { Authorization: `Bearer ${token}` } })
            .then(({ data }) => onAdded(data))
            .catch((err) => {
                setError((err.response && err.response.data && err.response.data.detail) || err.message)
                setSaving(false)
            })
    }

    return (
        <Modal show onClose={onClose} title="Add staff">
            <form onSubmit={submit} className="space-y-4">
                <Field label="Name" id="staff-name">
                    <Input id="staff-name" autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahim Uddin" />
                </Field>
                <Field label="Email (used to sign in)" id="staff-email">
                    <Input id="staff-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rahim@krishibazar.com" />
                </Field>
                <Field label="Password" id="staff-password" hint="At least 8 characters. Give it to them in person; they can change it on their profile page.">
                    <Input id="staff-password" type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </Field>
                <fieldset>
                    <legend className="mb-2 text-sm font-medium text-slate-700">Role</legend>
                    <div className="space-y-2">
                        {ROLE_OPTIONS.filter((r) => r.value !== 'customer').map((r) => (
                            <label key={r.value} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                                role === r.value ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 hover:bg-slate-50')}>
                                <input type="radio" name="staff-role" value={r.value} checked={role === r.value}
                                    onChange={() => setRole(r.value)} className="mt-0.5 accent-brand-600" />
                                <span>
                                    <span className="block text-sm font-semibold text-slate-900">{r.label}</span>
                                    <span className="block text-xs text-slate-500">{r.hint}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                {error && <Alert variant="danger">{error}</Alert>}
                <div className="flex gap-2 pt-1">
                    <Button block type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button block type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add staff'}</Button>
                </div>
            </form>
        </Modal>
    )
}

export default UserListScreen

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { logout } from '../actions/userActions'
import { Button, Card, Container } from '../components/ui'
import { canOpen, homeFor, roleOf } from '../admin_components/roles'

// Wraps every admin page.
// Signed out: go to login and come back here afterwards.
// Signed in without a staff role: explain and offer to switch account,
// instead of bouncing to login, which would send a signed-in user to the home page.
// Staff opening a page their role doesn't cover go to their own start page.
export default function withAdminGate(Screen) {
    return function AdminGate(props) {
        const { history, location } = props
        const dispatch = useDispatch()
        const { userInfo } = useSelector((state) => state.userLogin)
        const here = location.pathname

        useEffect(() => {
            if (!userInfo) history.push(`/staff?redirect=${here}`)
        }, [userInfo, history, here])

        if (!userInfo) return null
        const role = roleOf(userInfo)
        if (role && !canOpen(role, here)) return <Redirect to={homeFor(role)} />
        if (!role) {
            const switchAccount = () => {
                dispatch(logout())
                history.push(`/staff?redirect=${here}`)
            }
            return (
                <Container className="flex min-h-screen items-center justify-center bg-slate-50 py-10">
                    <Card className="w-full max-w-md p-8 text-center">
                        <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
                        <h1 className="mt-3 text-xl font-bold text-slate-900">This page is for shop staff</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            You are signed in as <strong>{userInfo.name || userInfo.email}</strong>, which is a customer account.
                            Sign in with a staff account to use the shop tools.
                        </p>
                        <div className="mt-6 flex flex-col gap-2">
                            <Button onClick={switchAccount}>Sign in as staff</Button>
                            <Button variant="ghost" to="/">Back to the shop</Button>
                        </div>
                    </Card>
                </Container>
            )
        }
        return <Screen {...props} />
    }
}

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ShieldAlert } from 'lucide-react'
import { logout } from '../actions/userActions'
import { Button, Card, Container } from '../components/ui'

// Wraps every admin page.
// Signed out: go to login and come back here afterwards.
// Signed in without admin rights: explain and offer to switch account,
// instead of bouncing to login, which would send a signed-in user to the home page.
export default function withAdminGate(Screen) {
    return function AdminGate(props) {
        const { history, location } = props
        const dispatch = useDispatch()
        const { userInfo } = useSelector((state) => state.userLogin)
        const here = location.pathname

        useEffect(() => {
            if (!userInfo) history.push(`/login?redirect=${here}`)
        }, [userInfo, history, here])

        if (!userInfo) return null
        if (!userInfo.isAdmin) {
            const switchAccount = () => {
                dispatch(logout())
                history.push(`/login?redirect=${here}`)
            }
            return (
                <Container className="flex min-h-screen items-center justify-center bg-slate-50 py-10">
                    <Card className="w-full max-w-md p-8 text-center">
                        <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
                        <h1 className="mt-3 text-xl font-bold text-slate-900">This page is for shop staff</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            You are signed in as <strong>{userInfo.name || userInfo.email}</strong>, which is a customer account.
                            Sign in with an admin account to use the shop tools.
                        </p>
                        <div className="mt-6 flex flex-col gap-2">
                            <Button onClick={switchAccount}>Sign in as admin</Button>
                            <Button variant="ghost" to="/">Back to the shop</Button>
                        </div>
                    </Card>
                </Container>
            )
        }
        return <Screen {...props} />
    }
}

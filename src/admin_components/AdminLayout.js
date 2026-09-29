import React from 'react'
import AdminSideBar from './AdminSideBar'
import { Container, PageHeader } from '../components/ui'

// Page frame shared by the admin screens: sidebar on the left, content on the right.
function AdminLayout({ title, subtitle, action, children }) {
    return (
        <Container>
            <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
                <aside>
                    <AdminSideBar />
                </aside>
                <div className="min-w-0">
                    <PageHeader eyebrow="Admin" title={title} subtitle={subtitle} action={action} />
                    {children}
                </div>
            </div>
        </Container>
    )
}

export default AdminLayout

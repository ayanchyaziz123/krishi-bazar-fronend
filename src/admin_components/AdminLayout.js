import React from 'react'
import { PageHeader } from '../components/ui'

// Page heading and width for admin screens. The frame around it comes from AdminShell.
function AdminLayout({ title, subtitle, action, children }) {
    return (
        <div className="mx-auto w-full max-w-7xl">
            <PageHeader eyebrow="Admin" title={title} subtitle={subtitle} action={action} />
            {children}
        </div>
    )
}

export default AdminLayout

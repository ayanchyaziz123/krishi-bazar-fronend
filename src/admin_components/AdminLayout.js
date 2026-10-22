import React from 'react'

// Page heading and width for admin screens. The frame around it comes from AdminShell.
function AdminLayout({ title, subtitle, action, children }) {
    return (
        <div className="mx-auto w-full max-w-7xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    )
}

export default AdminLayout

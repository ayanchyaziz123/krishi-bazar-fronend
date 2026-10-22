import React from 'react'
import { StoreLogo } from './storeBrand'
import { Card } from './ui'

// Centered card used by the sign-in, sign-up and password screens.
function AuthCard({ title, subtitle, children, footer }) {
    return (
        <div className="mx-auto w-full max-w-md px-4 py-6">
            <div className="mb-8 text-center">
                <StoreLogo className="mx-auto mb-5 h-12 w-12 rounded-2xl shadow-lg shadow-brand-600/30" iconClassName="h-6 w-6" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <Card className="p-6 sm:p-8">{children}</Card>
            {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
    )
}

export default AuthCard

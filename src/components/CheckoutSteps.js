import React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { cn } from './ui'

function CheckoutSteps({ step1, step2, step3, step4 }) {
    const steps = [
        { label: 'Login', to: '/login', done: step1 },
        { label: 'Shipping', to: '/shipping', done: step2 },
        { label: 'Payment', to: '/payment', done: step3 },
        { label: 'Place Order', to: '/placeorder', done: step4 },
    ]
    const current = steps.filter((s) => s.done).length - 1

    return (
        <ol className="mx-auto mb-10 flex max-w-2xl items-center">
            {steps.map((s, i) => {
                const content = (
                    <span className="flex flex-col items-center gap-2">
                        <span
                            className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-slate-50 transition',
                                i < current && 'bg-brand-600 text-white',
                                i === current && 'bg-brand-600 text-white shadow-lg shadow-brand-600/30',
                                i > current && 'bg-white text-slate-400 ring-1 ring-slate-200'
                            )}
                        >
                            {i < current ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className={cn('text-xs font-medium', s.done ? 'text-slate-900' : 'text-slate-400')}>{s.label}</span>
                    </span>
                )
                return (
                    <li key={s.label} className="flex flex-1 items-center last:flex-none">
                        {s.done ? <Link to={s.to}>{content}</Link> : content}
                        {i < steps.length - 1 && (
                            <span className={cn('mx-2 mb-6 h-0.5 flex-1 rounded-full', i < current ? 'bg-brand-600' : 'bg-slate-200')} />
                        )}
                    </li>
                )
            })}
        </ol>
    )
}

export default CheckoutSteps

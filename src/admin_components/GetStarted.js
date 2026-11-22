import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronRight, X } from 'lucide-react'
import { activeBusiness } from './roles'
import { cn } from '../components/ui'

// First steps for a new store, in the order an owner usually does them.
const STEPS = {
    products: { label: 'Add your first product', hint: 'Name, price, photo and stock.', to: '/admin/product/new' },
    details: { label: 'Add your shop address and phone', hint: 'Shown on receipts and the online shop.', to: '/admin/settings' },
    logo: { label: 'Upload your logo', hint: 'For the admin, the counter and receipts.', to: '/admin/settings' },
    website: { label: 'Set up and publish your online shop', hint: 'Colours, logo and banner. Publish to make it live.', to: '/admin/website' },
    staff: { label: 'Add your staff', hint: 'Each person gets their own login and role.', to: '/admin/staff' },
    first_sale: { label: 'Make your first sale', hint: 'Ring up a bill at the counter.', to: '/admin/counter' },
}

const dismissKey = (slug) => `getStartedHidden:${slug || ''}`

// The new-store checklist on the dashboard. Hidden once every step is done or the owner
// closes it; only managers see it.
function GetStarted({ userInfo }) {
    const slug = activeBusiness(userInfo)
    const [steps, setSteps] = useState(null)
    const [hidden, setHidden] = useState(() => {
        try { return localStorage.getItem(dismissKey(slug)) === '1' } catch (e) { return false }
    })

    useEffect(() => {
        if (hidden) return
        axios.get('/api/store/setup/', { headers: { Authorization: `Bearer ${userInfo ? userInfo.token : ''}` } })
            .then(({ data }) => setSteps(data.steps.filter((s) => STEPS[s.key])))
            .catch(() => setSteps(null))
    }, [userInfo, hidden])

    if (hidden || !steps) return null
    const done = steps.filter((s) => s.done).length
    if (done === steps.length) return null

    const hide = () => {
        try { localStorage.setItem(dismissKey(slug), '1') } catch (e) { /* storage blocked */ }
        setHidden(true)
    }

    return (
        <section className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 sm:p-5" aria-labelledby="get-started">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <h2 id="get-started" className="text-base font-semibold text-slate-900">Get your store ready</h2>
                    <p className="mt-0.5 text-sm text-slate-600">{done} of {steps.length} done. Click a step to do it now.</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}>
                        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
                    </div>
                </div>
                <button type="button" onClick={hide} className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900" aria-label="Hide this checklist" title="Hide this checklist">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {steps.map((s) => {
                    const step = STEPS[s.key]
                    return (
                        <li key={s.key}>
                            <Link to={step.to}
                                className={cn('group flex h-full items-start gap-3 rounded-lg border bg-white px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                                    s.done ? 'border-slate-200 opacity-70' : 'border-slate-200 hover:border-brand-400')}>
                                {s.done
                                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-label="Done" />
                                    : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" aria-label="Not done yet" />}
                                <span className="min-w-0 flex-1">
                                    <span className={cn('block text-sm font-semibold', s.done ? 'text-slate-500 line-through' : 'text-slate-900')}>{step.label}</span>
                                    <span className="block text-xs text-slate-500">{step.hint}</span>
                                </span>
                                {!s.done && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-600" />}
                            </Link>
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}

export default GetStarted

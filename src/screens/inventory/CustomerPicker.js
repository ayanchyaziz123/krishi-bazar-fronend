import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookUser } from 'lucide-react'
import { Input, cn, formatINR } from '../../components/ui'

// Phone digits as the server keeps them: +91 and a leading 0 dropped.
export const phoneKey = (phone) => {
    let d = String(phone || '').replace(/\D/g, '')
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
    else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
    return d
}

export const formatPhone = (p) => (p && p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : p || '')

// The counter's customer fields. Typing part of a phone number or name finds customers
// who have bought before; picking one fills both fields and shows what they already owe.
function CustomerPicker({ api, name, phone, onName, onPhone, required }) {
    const [matches, setMatches] = useState([])
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const [picked, setPicked] = useState(null)
    const boxRef = useRef(null)
    const typed = useRef('')

    // Look up as the cashier types (a short pause first, so each key doesn't ask the server).
    useEffect(() => {
        const q = typed.current === 'phone' ? phoneKey(phone) : typed.current === 'name' ? name.trim() : ''
        if (!q || q.length < (typed.current === 'phone' ? 3 : 2)) { setMatches([]); return undefined }
        const timer = setTimeout(() => {
            api.get(`customers/?q=${encodeURIComponent(q)}`)
                .then((data) => { setMatches(data.customers); setActive(0); setOpen(data.customers.length > 0) })
                .catch(() => setMatches([]))
        }, 250)
        return () => clearTimeout(timer)
    }, [api, phone, name])

    // A customer stays picked only while the phone number is still theirs.
    useEffect(() => {
        if (picked && phoneKey(phone) !== picked.phone) setPicked(null)
        if (!phone && !name) { setPicked(null); setMatches([]) }
    }, [phone, name, picked])

    // The exact number typed in full also counts as picking that customer.
    useEffect(() => {
        if (picked) return
        const exact = matches.find((m) => m.phone === phoneKey(phone))
        if (exact && phoneKey(phone).length >= 10) setPicked(exact)
    }, [matches, phone, picked])

    useEffect(() => {
        const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    const choose = (c) => {
        setPicked(c)
        onName(c.name || name)
        onPhone(formatPhone(c.phone))
        setOpen(false)
        typed.current = ''
    }

    const onKeyDown = (e) => {
        if (!open || !matches.length) return
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % matches.length) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + matches.length) % matches.length) }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); choose(matches[active]) }
        else if (e.key === 'Escape') setOpen(false)
    }

    const limitLeft = picked && picked.credit_limit != null ? picked.credit_limit - picked.owed : null

    return (
        <div ref={boxRef} className="relative">
            <div className="grid grid-cols-2 gap-2">
                <Input value={name} onKeyDown={onKeyDown}
                    onChange={(e) => { typed.current = 'name'; onName(e.target.value) }}
                    onFocus={() => matches.length && setOpen(true)}
                    placeholder={required ? 'Customer name (required)' : 'Customer name'}
                    aria-label="Customer name" autoComplete="off"
                    className={cn('!h-8 text-xs', required && !name.trim() && '!border-amber-400')} />
                <Input type="tel" inputMode="tel" value={phone} onKeyDown={onKeyDown}
                    onChange={(e) => { typed.current = 'phone'; onPhone(e.target.value) }}
                    onFocus={() => matches.length && setOpen(true)}
                    placeholder={required ? 'Phone (required)' : 'Phone, to find a customer'}
                    aria-label="Customer phone" autoComplete="off"
                    className={cn('!h-8 text-xs', required && !phone.trim() && '!border-amber-400')} />
            </div>

            {open && matches.length > 0 && (
                <ul role="listbox" aria-label="Saved customers"
                    className="absolute inset-x-0 bottom-full z-20 mb-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    {matches.map((c, i) => (
                        <li key={c.id} role="option" aria-selected={i === active}>
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(c)} onMouseEnter={() => setActive(i)}
                                className={cn('flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs', i === active ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold text-slate-900">{c.name || 'No name'}</span>
                                    <span className="block text-slate-500">{formatPhone(c.phone)}</span>
                                </span>
                                {c.owed > 0
                                    ? <span className="shrink-0 font-semibold text-amber-700">Owes {formatINR(c.owed)}</span>
                                    : <span className="shrink-0 text-slate-400">Nothing owed</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {picked && (
                <div className={cn('mt-1.5 flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs',
                    picked.owed > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800')}>
                    <span>
                        {picked.owed > 0
                            ? <>Already owes <strong>{formatINR(picked.owed)}</strong> on {picked.bills_owing} bill{picked.bills_owing === 1 ? '' : 's'}</>
                            : <>Saved customer · nothing owed</>}
                        {limitLeft != null && <> · limit {formatINR(picked.credit_limit)}{limitLeft <= 0 ? ' (reached)' : `, ${formatINR(limitLeft)} left`}</>}
                    </span>
                    <Link to={`/admin/khata/${picked.id}`} className="inline-flex shrink-0 items-center gap-1 font-semibold hover:underline" title="Open their khata">
                        <BookUser className="h-3.5 w-3.5" /> Khata
                    </Link>
                </div>
            )}
        </div>
    )
}

export default CustomerPicker

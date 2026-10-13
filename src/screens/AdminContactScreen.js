import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Mail, Phone, CheckCircle2, Inbox, RotateCcw } from 'lucide-react'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Badge, Button, Card, Modal, Spinner, Textarea, cn } from '../components/ui'

const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || e.message
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')

const TABS = [
    { key: 'waiting', label: 'Awaiting reply' },
    { key: 'replied', label: 'Replied' },
    { key: '', label: 'All' },
]

// Messages from the shop's contact form. Reply by email or phone, then mark it replied.
function AdminContactScreen() {
    const { userInfo } = useSelector((state) => state.userLogin)
    const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }), [userInfo])
    const [tab, setTab] = useState('waiting')
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [open, setOpen] = useState(null)

    const load = () => axios.get(`/api/contact/?status=${tab}`, auth)
        .then((res) => { setData(res.data); setError('') })
        .catch((e) => setError(errorText(e)))

    useEffect(() => { setData(null); load() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AdminLayout title="Contact messages" subtitle="Messages sent through the shop's contact form.">
            <div className="mb-4 flex gap-1 rounded-xl bg-slate-200/60 p-1 sm:w-fit">
                {TABS.map((t) => (
                    <button key={t.key || 'all'} type="button" onClick={() => setTab(t.key)}
                        className={cn('flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition sm:flex-none',
                            tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
                        {t.label}{t.key === 'waiting' && data ? ` (${data.waiting})` : ''}
                    </button>
                ))}
            </div>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
            {!data ? <Spinner /> : data.messages.length === 0 ? (
                <Card className="rounded-xl px-6 py-14 text-center">
                    <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">{tab === 'waiting' ? 'All caught up. No messages are waiting.' : 'No messages here yet.'}</p>
                    <p className="mt-1 text-sm text-slate-500">New messages from the website's contact page appear here.</p>
                </Card>
            ) : (
                <Card className="overflow-hidden rounded-xl">
                    <ul className="divide-y divide-slate-100">
                        {data.messages.map((m) => (
                            <li key={m.id}>
                                <button type="button" onClick={() => setOpen(m)} className="flex w-full items-start gap-4 px-5 py-3.5 text-left hover:bg-slate-50">
                                    <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', m.replied ? 'bg-slate-200' : 'bg-brand-500')} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className={cn('truncate text-sm', m.replied ? 'text-slate-700' : 'font-semibold text-slate-900')}>{m.name}</p>
                                            <span className="shrink-0 text-xs text-slate-500">{when(m.createdAt)}</span>
                                        </div>
                                        <p className="truncate text-xs text-slate-500">{[m.email, m.phone].filter(Boolean).join(' · ')}</p>
                                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{m.message}</p>
                                    </div>
                                    {m.replied ? <Badge variant="green">Replied</Badge> : <Badge variant="amber">Awaiting reply</Badge>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {open && <MessageModal message={open} auth={auth} onClose={() => setOpen(null)} onSaved={(m) => { setOpen(m); load() }} />}
        </AdminLayout>
    )
}

function MessageModal({ message: m, auth, onClose, onSaved }) {
    const [note, setNote] = useState(m.reply_note || '')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const subject = encodeURIComponent('Re: your message to Krishi Bazar')
    const quoted = encodeURIComponent(`\n\n---\nYou wrote:\n${m.message}`)

    const save = (replied) => {
        setBusy(true)
        axios.patch(`/api/contact/${m.id}/`, { replied, reply_note: note }, auth)
            .then((res) => { setError(''); onSaved(res.data) })
            .catch((e) => setError(errorText(e)))
            .finally(() => setBusy(false))
    }

    return (
        <Modal show onClose={onClose} title={`Message from ${m.name}`}>
            <div className="space-y-4">
                <div className="text-sm text-slate-600">
                    <p>Sent {when(m.createdAt)}{m.wants_contact ? ` · prefers ${m.contact_by === 'tel' ? 'a phone call' : 'email'}` : ''}</p>
                </div>
                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800">{m.message}</p>
                <div className="grid grid-cols-2 gap-2">
                    {m.email && (
                        <Button variant="secondary" onClick={() => { window.location.href = `mailto:${m.email}?subject=${subject}&body=${quoted}` }}>
                            <Mail className="h-4 w-4" /> Reply by email
                        </Button>
                    )}
                    {m.phone && (
                        <Button variant="secondary" onClick={() => { window.location.href = `tel:${m.phone.replace(/\s+/g, '')}` }}>
                            <Phone className="h-4 w-4" /> Call {m.phone}
                        </Button>
                    )}
                </div>
                <div>
                    <label htmlFor="reply-note" className="mb-1.5 block text-sm font-medium text-slate-700">Note for the team <span className="font-normal text-slate-500">(optional)</span></label>
                    <Textarea id="reply-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called back, she'll order on Friday" />
                </div>
                {m.replied && (
                    <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Replied{m.replied_by ? ` by ${m.replied_by}` : ''} {when(m.replied_at)}
                    </p>
                )}
                {error && <Alert variant="danger">{error}</Alert>}
                <div className="flex gap-2 pt-1">
                    {m.replied ? (
                        <>
                            <Button block variant="secondary" disabled={busy} onClick={() => save(false)}><RotateCcw className="h-4 w-4" /> Mark as waiting</Button>
                            <Button block disabled={busy} onClick={() => save(true)}>Save note</Button>
                        </>
                    ) : (
                        <Button block disabled={busy} onClick={() => save(true)}><CheckCircle2 className="h-4 w-4" /> Mark as replied</Button>
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default AdminContactScreen

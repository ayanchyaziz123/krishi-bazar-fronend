import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Navigation, MessageSquare, Store } from 'lucide-react'
import { Container, Card } from '../components/ui'
import { useStoreBrand } from '../components/storeBrand'

// The shop's own address and contact details, with directions. Customers can choose
// "Store pick-up" at checkout and collect here.
function StoreScreen() {
    const store = useStoreBrand()
    const where = [store.address, store.location].filter(Boolean).join(', ')
    const maps = where ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name}, ${where}`)}` : null
    const row = 'flex items-start gap-3 rounded-xl px-1 py-3 text-[15px] text-slate-700'

    return (
        <Container className="max-w-2xl">
            <h1 className="mb-5 hidden text-2xl font-bold tracking-tight text-slate-900 md:block">Our store</h1>
            <Card className="overflow-hidden rounded-2xl">
                <div className="flex items-center gap-4 bg-brand-600 p-5 text-white">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Store className="h-7 w-7" /></span>
                    <div className="min-w-0">
                        <p className="truncate text-xl font-bold">{store.name}</p>
                        {store.location && <p className="text-sm text-white/80">{store.location}</p>}
                    </div>
                </div>
                <div className="divide-y divide-slate-100 px-4">
                    {where && <p className={row}><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /> {where}</p>}
                    {store.phone && <a href={`tel:${store.phone.replace(/\s+/g, '')}`} className={row}><Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /> {store.phone}</a>}
                    {store.email && <a href={`mailto:${store.email}`} className={row}><Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /> {store.email}</a>}
                </div>
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                    {maps && (
                        <a href={maps} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700">
                            <Navigation className="h-4 w-4" /> Get directions
                        </a>
                    )}
                    <Link to="/contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                        <MessageSquare className="h-4 w-4" /> Send us a message
                    </Link>
                </div>
            </Card>
            <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                Order online and choose <strong>Store pick-up</strong> at checkout to collect it here. There is no delivery charge for pick-up.
            </p>
        </Container>
    )
}

export default StoreScreen

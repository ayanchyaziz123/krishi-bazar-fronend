import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { HandHeart, MapPin, Quote } from 'lucide-react'
import { Card, formatTk } from './ui'

function Avatar({ farmer }) {
    if (farmer.photo) {
        return <img src={farmer.photo} alt={farmer.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-4 ring-brand-50" />
    }
    const initials = farmer.name.split(' ').map((w) => w[0]).slice(0, 2).join('')
    return (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white ring-4 ring-brand-50">
            {initials}
        </span>
    )
}

// Homepage card that introduces one of the farmers or artisans behind the products.
function MeetTheFarmer() {
    const [farmer, setFarmer] = useState(undefined)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        axios.get('/api/farmers/featured/')
            .then(({ data }) => setFarmer(data))
            .catch(() => setFarmer(null))
    }, [])

    if (farmer === undefined) {
        return <Card className="h-72 animate-pulse bg-slate-100" />
    }
    if (!farmer) return null

    const long = farmer.story.length > 180

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-brand-50/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                <HandHeart className="h-4 w-4" /> Meet the farmer
            </div>

            <div className="p-5">
                <div className="flex items-center gap-4">
                    <Avatar farmer={farmer} />
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">{farmer.name}</h3>
                        <p className="text-sm text-slate-500">{farmer.role}</p>
                        {farmer.location && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3" /> {farmer.location}
                            </p>
                        )}
                    </div>
                </div>

                <div className="relative mt-4">
                    <Quote className="absolute -left-1 -top-1 h-5 w-5 text-brand-200" />
                    <p className={`pl-6 text-sm leading-relaxed text-slate-600 ${expanded ? '' : 'line-clamp-4'}`}>
                        {farmer.story}
                    </p>
                    {long && (
                        <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-1 pl-6 text-xs font-semibold text-brand-600 hover:text-brand-700">
                            {expanded ? 'Show less' : 'Read more'}
                        </button>
                    )}
                </div>

                {farmer.products.length > 0 && (
                    <div className="mt-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Grows for us</p>
                        <div className="space-y-2">
                            {farmer.products.map((p) => (
                                <Link
                                    key={p._id}
                                    to={`/product/${p._id}`}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-1.5 pr-3 transition hover:border-brand-300 hover:bg-brand-50/40"
                                >
                                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                        {p.image && <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">{p.name}</span>
                                    <span className="text-xs font-semibold text-slate-900">{formatTk(p.price)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default MeetTheFarmer

import React from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, Award, MessageSquare, ArrowUpRight } from 'lucide-react'

const items = [
    {
        to: '/priceRange',
        icon: SlidersHorizontal,
        title: 'Shop by budget',
        text: 'Slide to your price range and see what fits.',
        color: 'bg-emerald-100 text-emerald-600',
    },
    {
        to: '/topReviewProductScreen',
        icon: Award,
        title: 'Customer favourites',
        text: 'The products our customers rate the highest.',
        color: 'bg-brand-100 text-brand-600',
    },
    {
        to: '/contact',
        icon: MessageSquare,
        title: 'Talk to us',
        text: 'Bulk orders or questions? Our team can help.',
        color: 'bg-amber-100 text-amber-600',
    },
]

function Navs() {
    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {items.map(({ to, icon: Icon, title, text, color }) => (
                <Link
                    key={to}
                    to={to}
                    className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
                >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="pr-6">
                        <h3 className="font-semibold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{text}</p>
                    </div>
                    <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 transition group-hover:text-slate-900" />
                </Link>
            ))}
        </div>
    )
}

export default Navs

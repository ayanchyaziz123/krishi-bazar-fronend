import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sprout, Truck, ShieldCheck } from 'lucide-react'

// Static welcome banner shown when there are no products on offer.
function HomeHero() {
    return (
        <div className="relative flex h-full min-h-[22rem] flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-8 py-12 text-white shadow-xl shadow-brand-900/20 sm:px-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
            <Sprout className="pointer-events-none absolute -bottom-6 right-6 h-56 w-56 text-white/5" strokeWidth={1.25} />

            <p className="relative inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-white/15">
                <Sprout className="h-3.5 w-3.5" /> Straight from local farms
            </p>
            <h1 className="relative mt-5 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Fresh, honest food from the people who grow it
            </h1>
            <p className="relative mt-4 max-w-md text-brand-100">
                Rice, spices, pickles, tea and handcrafted goods, sourced directly from farmers and artisans in Sylhet.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center gap-4">
                <a href="#products" onClick={(e) => { e.preventDefault(); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50">
                    Shop now <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/topReviewProductScreen" className="text-sm font-semibold text-white/90 hover:text-white">
                    See top reviewed
                </Link>
            </div>
            <div className="relative mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-100">
                <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> Delivery across Bangladesh</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Quality checked</span>
            </div>
        </div>
    )
}

export default HomeHero

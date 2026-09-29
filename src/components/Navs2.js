import React from 'react'
import { useHistory } from 'react-router-dom'
import categories from './categories'

const Navs2 = () => {
    let history = useHistory()

    return (
        <div>
            <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Shop by category</h2>
                <p className="mt-1 text-sm text-slate-500">Everything from the field, the garden and the craftsman's bench.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                {categories.map(({ keyword, label, icon: Icon, tint }) => (
                    <button
                        key={keyword}
                        type="button"
                        onClick={() => history.push(`/?keyword=${keyword}&page=1`)}
                        className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-600/5"
                    >
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint} transition group-hover:scale-110`}>
                            <Icon className="h-6 w-6" />
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Navs2;

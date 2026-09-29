import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ProductChart = (props) => {
    const pdata = (props.price_history || []).map((d) => ({ ...d, price: Number(d.price) }));

    return (
        <div>
            <h3 className="mb-1 font-semibold text-slate-900">Price history</h3>
            <p className="mb-5 text-sm text-slate-500">How this product's price has changed over time.</p>
            {pdata.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No price changes recorded yet.</p>
            ) : (
            <ResponsiveContainer width="100%" aspect={2.6}>
                <AreaChart data={pdata} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="createdAt" interval={'preserveStartEnd'} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="price" stroke="#059669" strokeWidth={2.5} fill="url(#priceFill)" activeDot={{ r: 6 }} />
                </AreaChart>
            </ResponsiveContainer>
            )}
        </div>
    )
}

export default ProductChart;

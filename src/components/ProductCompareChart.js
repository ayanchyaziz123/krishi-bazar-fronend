import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ProductCompareChart = (props) => {
    const data1 = props.price_history1;
    const data2 = props.price_history2;
    let transformed_data1;
    let transformed_data2;
    if (data1) {
        transformed_data1 = data1.map(({ id, price, createdAt, product }) => ({ id: id, laptop_1: Number(price), createdAt: createdAt, product: product }));
    }
    if (data2) {
        transformed_data2 = data2.map(({ id, price, createdAt, product }) => ({ id: id, laptop_2: Number(price), createdAt: createdAt, product: product }));
    }
    return (
        <div>
            <h3 className="mb-1 font-semibold text-slate-900">Price history</h3>
            <p className="mb-5 text-sm text-slate-500">Recorded prices for both products.</p>
            <ResponsiveContainer width="100%" aspect={2.4}>
                <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="createdAt" allowDuplicatedCategory={false} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Legend />
                    <Line type="monotone" data={transformed_data1} dataKey="laptop_1" name="Product 1" stroke="#059669" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" data={transformed_data2} dataKey="laptop_2" name="Product 2" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default ProductCompareChart;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../components/Loader'
import Product from '../components/Product'
import { Container, PageHeader, Card, formatTk } from '../components/ui'

const baseURL = "/api/products/all/";
const MIN = 0
const MAX = 5000

const PriceRangeScreen = () => {
    const [value, setValue] = useState(1500);
    const [p, setP] = useState(null);

    useEffect(() => {
        axios.get(baseURL).then((response) => {
            setP(response.data)
        }).catch((error) => console.log(error));
    }, []);

    const matches = p ? p.filter(product => product.price <= value) : []

    return (
        <Container>
            <PageHeader eyebrow="Shop by budget" title="Find products in your budget" subtitle="Drag the slider to set your maximum budget." />

            <Card className="mb-10 p-6 sm:p-8">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Budget</p>
                        <p className="text-3xl font-bold tracking-tight text-slate-900">
                            {formatTk(MIN)} <span className="text-slate-300">–</span> {formatTk(value)}
                        </p>
                    </div>
                    <p className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                        {matches.length} {matches.length === 1 ? 'product' : 'products'}
                    </p>
                </div>
                <input
                    type="range"
                    className="range"
                    min={MIN}
                    max={MAX}
                    step={50}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                />
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>{formatTk(MIN)}</span>
                    <span>{formatTk(MAX)}</span>
                </div>
            </Card>

            {!p ? <Loader /> : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {matches.map(product => (
                        <Product key={product._id} product={product} />
                    ))}
                </div>
            )}
        </Container>
    );
}

export default PriceRangeScreen;

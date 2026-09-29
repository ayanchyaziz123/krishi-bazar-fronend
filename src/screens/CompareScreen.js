import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import ProductCompareChart from '../components/ProductCompareChart';
import { Container, PageHeader, Card, Button, formatTk } from '../components/ui';

const baseURL = "/api/products/all/";

const rows = [
    ['Price', 'price'],
    ['Category', 'category'],
    ['Producer', 'brand'],
    ['Pack size', 'weight'],
    ['In stock', 'countInStock'],
    ['Rating', 'rating'],
]

function CompareScreen(props) {
    const state = props.location.state
    const [prod, setProd] = useState(null);
    const [price_history1, set_price_history1] = useState(null);
    const [price_history2, set_price_history2] = useState(null);

    useEffect(() => {
        if (!state) return
        axios.post(baseURL, { 'id_1': state.lep1, 'id_2': state.lep2 }).then((response) => {
            setProd(response.data.products);
            set_price_history1(response.data.price_history1);
            set_price_history2(response.data.price_history2);
        }).catch((error) => console.log(error));
    }, [state]);

    if (!state) {
        return (
            <Container>
                <Message variant="info">Pick two products on the home page to compare them. <Link to="/" className="font-semibold underline">Go to the shop</Link></Message>
            </Container>
        )
    }

    // eslint-disable-next-line eqeqeq
    const find = (id) => prod && prod.find((pr) => pr._id == id)
    const laptops = [find(state.lep1), find(state.lep2)]

    return (
        <Container>
            <PageHeader eyebrow="Compare" title="Compare two products" subtitle="Details and price history side by side." />

            {!prod ? <Loader /> : (
                <div className="space-y-8">
                    <Card className="overflow-hidden">
                        <div className="grid grid-cols-[8rem_1fr_1fr] sm:grid-cols-[12rem_1fr_1fr]">
                            <div className="border-b border-slate-100 bg-slate-50/60" />
                            {laptops.map((pr, i) => (
                                <div key={i} className="border-b border-l border-slate-100 p-5 text-center">
                                    {pr && (
                                        <>
                                            <Link to={`/product/${pr._id}`} className="mx-auto flex h-32 items-center justify-center">
                                                <img src={pr.image} alt={pr.name} className="max-h-full max-w-full object-contain" />
                                            </Link>
                                            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brand-600">Product {i + 1}</p>
                                            <Link to={`/product/${pr._id}`} className="mt-1 block font-semibold text-slate-900 hover:text-brand-600">{pr.name}</Link>
                                            <Button to={`/product/${pr._id}`} variant="secondary" size="sm" className="mt-3">View product</Button>
                                        </>
                                    )}
                                </div>
                            ))}
                            {rows.map(([label, key]) => (
                                <React.Fragment key={key}>
                                    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-sm text-slate-500">{label}</div>
                                    {laptops.map((pr, i) => (
                                        <div key={i} className="border-b border-l border-slate-100 px-5 py-3 text-sm font-medium text-slate-900">
                                            {pr ? (key === 'price' ? formatTk(pr[key]) : pr[key] || '—') : '—'}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <ProductCompareChart price_history1={price_history1} price_history2={price_history2} />
                    </Card>
                </div>
            )}
        </Container>
    )
}
export default CompareScreen;

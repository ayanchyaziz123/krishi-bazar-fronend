import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import AdminLayout from '../admin_components/AdminLayout';
import { Card } from '../components/ui';
import categories from '../components/categories';

// Categories are set on each product. This page lists the ones the storefront uses.
const BrandScreen = () => {
    return (
        <AdminLayout title="Categories" subtitle="Product categories shown on the storefront.">
            <Card>
                <ul className="divide-y divide-slate-100">
                    {categories.map(({ keyword, label, icon: Icon, tint }) => (
                        <li key={keyword} className="flex items-center gap-4 px-5 py-3.5">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}><Icon className="h-4 w-4" /></span>
                            <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
                            <Link to={`/?keyword=${keyword}&page=1`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                                View products <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </li>
                    ))}
                </ul>
                <p className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                    To put a product in a category, set its category on the product edit page.
                </p>
            </Card>
        </AdminLayout>
    )
}

export default BrandScreen;

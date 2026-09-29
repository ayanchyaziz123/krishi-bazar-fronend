import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux'
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Wallet, ShoppingCart, Users } from 'lucide-react';
import AdminLayout from '../admin_components/AdminLayout';
import Todolist from '../admin_components/Todolist';
import { Card, CardHeader } from '../components/ui';

const baseURL = "/api/products/dashboard/";

function StatCard({ icon: Icon, label, value, tint }) {
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </Card>
    )
}

const DashboardScreen = ({ history }) => {

    const userLogin = useSelector(state => state.userLogin)
    const { userInfo } = userLogin
    const [newCustomers, setNewCustomers] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [revenue, setRevenue] = useState(0);
    const [profit, setProfit] = useState(null);

    useEffect(() => {
        if (!userInfo) {
            history.push('/login')
        }
        else {
            if (!userInfo.isAdmin) {
                history.push('/')
            }
            axios.get(baseURL).then(response => {
                setNewCustomers(response.data.new_users);
                setPendingOrders(response.data.pending_orders);
                setRevenue(response.data.revenue);
                setProfit(response.data.profit);
            })
        }
    }, [history, userInfo])

    return (
        <AdminLayout title="Dashboard" subtitle="A snapshot of how the store is doing.">
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={Wallet} label="Revenue" value={revenue} tint="bg-brand-100 text-brand-600" />
                <StatCard icon={ShoppingCart} label="Pending orders" value={pendingOrders} tint="bg-amber-100 text-amber-600" />
                <StatCard icon={Users} label="New customers" value={newCustomers} tint="bg-emerald-100 text-emerald-600" />
            </div>

            <Card className="mt-6">
                <CardHeader title="Profit over the past few years" subtitle="Revenue, expenses and profit by year" />
                <div className="p-4 sm:p-6">
                    <ResponsiveContainer width="100%" aspect={2.4}>
                        <LineChart data={profit} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                            <Legend />
                            <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2.5} />
                            <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} />
                            <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2.5} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="mt-6">
                <Todolist />
            </div>
        </AdminLayout>
    )
}

export default DashboardScreen;

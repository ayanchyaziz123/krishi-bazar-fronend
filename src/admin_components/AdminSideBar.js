import React from "react";
import { useDispatch } from 'react-redux'
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Tag, Package, ShoppingCart, Mail, LogOut } from 'lucide-react';
import { logout } from '../actions/userActions'

const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/userlist', label: 'Users', icon: Users },
    { to: '/brand', label: 'Categories', icon: Tag },
    { to: '/admin/productlist', label: 'Products', icon: Package },
    { to: '/admin/orderlist', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/contact', label: 'Contacts', icon: Mail },
]

const AdminSideBar = () => {
    const dispatch = useDispatch()

    const logoutHandler = () => {
        dispatch(logout())
    }

    return (
        <nav className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm lg:sticky lg:top-32">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</p>
            <div className="flex gap-1 overflow-x-auto lg:flex-col">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        exact
                        className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        activeClassName="!bg-brand-50 !text-brand-700"
                    >
                        <Icon className="h-4 w-4" /> {label}
                    </NavLink>
                ))}
                <div className="my-1 hidden h-px bg-slate-100 lg:block" />
                <Link
                    to="/"
                    onClick={logoutHandler}
                    className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                    <LogOut className="h-4 w-4" /> Logout
                </Link>
            </div>
        </nav>
    );
};

export default AdminSideBar;

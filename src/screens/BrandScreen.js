import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import AdminLayout from '../admin_components/AdminLayout'
import { Alert, Button, Card, Field, Input, Modal, Spinner, cn } from '../components/ui'
import { CATEGORY_ICONS, loadCategories, useCategories } from '../components/categories'

const errorText = (e) => (e.response && e.response.data && e.response.data.detail) || e.message

// Manage product categories: add, rename, change icon, delete, and see their products.
function BrandScreen() {
    const { userInfo } = useSelector((state) => state.userLogin)
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${userInfo.token}` } }), [userInfo])
    const categories = useCategories()
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null) // a category, or {} for a new one
    const [deleting, setDeleting] = useState(null)
    const [notice, setNotice] = useState('')

    // Load with the admin login so each category comes back with its product count.
    const refresh = () => loadCategories(config).finally(() => setLoading(false))
    useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const saved = (message) => {
        setEditing(null)
        setDeleting(null)
        setNotice(message)
        refresh()
    }

    return (
        <AdminLayout
            title="Categories"
            subtitle="Used by the shop's menu, the counter and the product editor."
            action={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Add category</Button>}
        >
            {notice && <Alert variant="success" className="mb-4">{notice}</Alert>}
            <Card>
                {loading && categories.every((c) => c.productCount === undefined) ? <Spinner /> : (
                    <ul className="divide-y divide-slate-100">
                        {categories.map((c) => {
                            const Icon = c.icon
                            return (
                                <li key={c.id || c.keyword} className="flex flex-wrap items-center gap-3 px-5 py-3">
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.tint}`}><Icon className="h-4 w-4" /></span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                                        <p className="text-xs text-slate-500">
                                            {c.productCount === undefined ? '' : `${c.productCount} product${c.productCount === 1 ? '' : 's'} · `}
                                            matches categories containing “{c.keyword}”
                                        </p>
                                    </div>
                                    <Link to={`/admin/productlist?keyword=${encodeURIComponent(c.keyword)}`}
                                        className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                                        View products <ChevronRight className="h-3.5 w-3.5" />
                                    </Link>
                                    <Button variant="ghost" size="icon" aria-label={`Edit ${c.label}`} onClick={() => setEditing(c)} disabled={!c.id}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="danger-soft" size="icon" aria-label={`Delete ${c.label}`} onClick={() => setDeleting(c)} disabled={!c.id}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            )
                        })}
                    </ul>
                )}
                <p className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                    To put a product in a category, choose the category on the product edit page.
                </p>
            </Card>

            {editing && <CategoryForm category={editing} config={config} onClose={() => setEditing(null)} onSaved={saved} />}
            {deleting && <DeleteCategory category={deleting} config={config} onClose={() => setDeleting(null)} onDeleted={saved} />}
        </AdminLayout>
    )
}

function CategoryForm({ category, config, onClose, onSaved }) {
    const isNew = !category.id
    const [name, setName] = useState(category.label || '')
    const [keyword, setKeyword] = useState(category.keyword || '')
    const [icon, setIcon] = useState(category.iconKey || 'tag')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const submit = (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        const body = { name, keyword, icon }
        const request = isNew
            ? axios.post('/api/categories/', body, config)
            : axios.patch(`/api/categories/${category.id}/`, body, config)
        request
            .then(() => onSaved(isNew ? `Added “${name.trim()}”.` : `Saved “${name.trim()}”.`))
            // On success the form closes, so only reset it after an error.
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={isNew ? 'Add category' : `Edit ${category.label}`}>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Name" id="cat-name">
                    <Input id="cat-name" autoFocus required maxLength={60} placeholder="e.g. Honey" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Match word" id="cat-keyword"
                    hint={isNew
                        ? 'Optional. Products whose category contains this word belong here. Leave empty to use the name.'
                        : 'Products whose category contains this word belong here. Renaming also moves products labelled with the old name.'}>
                    <Input id="cat-keyword" maxLength={60} placeholder={name.trim().toLowerCase() || 'e.g. honey'} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </Field>
                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Icon</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                            <button key={key} type="button" onClick={() => setIcon(key)} aria-label={`Icon ${key}`} aria-pressed={icon === key}
                                className={cn('flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset transition',
                                    icon === key ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')}>
                                <Icon className="h-4 w-4" />
                            </button>
                        ))}
                    </div>
                </div>
                {error && <Alert variant="danger">{error}</Alert>}
                <div className="flex gap-2 pt-1">
                    <Button block variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button block type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : isNew ? 'Add category' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    )
}

function DeleteCategory({ category, config, onClose, onDeleted }) {
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const inUse = category.productCount > 0

    const remove = () => {
        setSaving(true)
        axios.delete(`/api/categories/${category.id}/`, config)
            .then(() => onDeleted(`Deleted “${category.label}”.`))
            .catch((err) => { setError(errorText(err)); setSaving(false) })
    }

    return (
        <Modal show onClose={onClose} title={`Delete ${category.label}?`} size="sm">
            {inUse ? (
                <p className="text-sm text-slate-600">
                    {category.productCount} product{category.productCount === 1 ? '' : 's'} still use this category.
                    Move {category.productCount === 1 ? 'it' : 'them'} to another category on the product edit page first.
                </p>
            ) : (
                <p className="text-sm text-slate-600">It will be removed from the shop's menu, the counter and the product editor.</p>
            )}
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            <div className="mt-5 flex gap-2">
                <Button block variant="secondary" autoFocus onClick={onClose}>{inUse ? 'Close' : 'Keep it'}</Button>
                {!inUse && <Button block variant="danger" disabled={saving} onClick={remove}>Delete</Button>}
            </div>
        </Modal>
    )
}

export default BrandScreen

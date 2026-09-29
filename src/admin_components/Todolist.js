import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, Input, Field, Checkbox, Button, Badge } from '../components/ui';

const todos = [
    { id: 1, text: 'To add some user', deadline: '2020-1-10', done: true },
    { id: 2, text: 'delete some user', deadline: '2022-1-10', done: false },
]

const Todolist = () => {
    return (
        <Card>
            <CardHeader title="To do list" subtitle="Keep track of admin tasks" />
            <form className="grid gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
                <Field label="What to do" id="todo-text">
                    <Input id="todo-text" type="text" placeholder="What to do" className="h-10" />
                </Field>
                <Field label="Deadline" id="todo-deadline">
                    <Input id="todo-deadline" type="date" className="h-10" />
                </Field>
                <Button type="submit" className="h-10">Add task</Button>
                <Checkbox id="todo-done" label="Completed" />
            </form>
            <ul className="divide-y divide-slate-100">
                {todos.map((t) => (
                    <li key={t.id} className="flex items-center gap-4 px-6 py-3.5">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{t.text}</p>
                            <p className="text-xs text-slate-500">Due {t.deadline}</p>
                        </div>
                        <Badge variant={t.done ? 'green' : 'amber'}>{t.done ? 'Completed' : 'Pending'}</Badge>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="danger-soft" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    )
}

export default Todolist;

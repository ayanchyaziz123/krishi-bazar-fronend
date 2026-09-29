import React, { useState } from 'react';
import AdminLayout from '../admin_components/AdminLayout';
import { Table, Th, Td, Button, Badge, Modal, Textarea } from '../components/ui';

const messages = [
    { id: 1, name: 'Mark', email: 'aadmin@.com', message: 'Use size="sm" to make tables compact by cutting cell padding in half.', replied: true },
    { id: 2, name: 'Jacob', email: 'Thornton@gmail.com', message: 'abc Use size="sm" to make tables compact by cutting cell padding in half.', replied: false },
    { id: 3, name: 'Ajx Aacob', email: 'Ajx@mail.com', message: 'Ucompact by cutting cell padding in half.', replied: false },
]

const AdminContactScreen = () => {
    const [replyTo, setReplyTo] = useState(null);

    return (
        <AdminLayout title="Contacts" subtitle="Messages sent through the contact form.">
            <Table>
                <thead>
                    <tr>
                        <Th>#</Th>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Message</Th>
                        <Th>Status</Th>
                        <Th></Th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {messages.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                            <Td className="text-slate-400">{m.id}</Td>
                            <Td className="font-medium text-slate-900">{m.name}</Td>
                            <Td>{m.email}</Td>
                            <Td className="max-w-xs truncate">{m.message}</Td>
                            <Td>{m.replied ? <Badge variant="green">Replied</Badge> : <Badge variant="amber">Awaiting reply</Badge>}</Td>
                            <Td className="text-right"><Button size="sm" variant="secondary" onClick={() => setReplyTo(m)}>Reply</Button></Td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={!!replyTo} onClose={() => setReplyTo(null)} title={replyTo ? `Reply to ${replyTo.name}` : 'Reply'}>
                <Textarea rows={4} placeholder="Write your reply…" />
                <Button block className="mt-4" onClick={() => setReplyTo(null)}>Send reply</Button>
            </Modal>
        </AdminLayout>
    )
}

export default AdminContactScreen;

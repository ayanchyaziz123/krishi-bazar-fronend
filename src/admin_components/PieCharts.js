import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#059669', '#34d399', '#f59e0b', '#10b981'];

const PieCharts = () => {

    // Sample data
    const data = [
        { name: 'Geeksforgeeks', students: 400 },
        { name: 'Technical scripter', students: 700 },
        { name: 'Geek-i-knack', students: 200 },
        { name: 'Geek-o-mania', students: 1000 }
    ];

    return (
        <ResponsiveContainer width="100%" aspect={1}>
            <PieChart>
                <Pie data={data} dataKey="students" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}

export default PieCharts;

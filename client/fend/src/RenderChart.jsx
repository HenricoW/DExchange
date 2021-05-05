import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

const RenderChart = ({ trades }) => {
    if(trades.length === 0){
        return "No data present"
    } else {
        const prices = trades.map(trade => Number(trade.price));
        const max = prices.reduce((prev, curr) => ( curr > prev ? curr : prev ), 0);
        return (
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trades}>
                <Line type="monotone" dataKey="price" stroke="#741cd7" />
                <CartesianGrid stroke="#000000" />
                <XAxis dataKey="timestamp" tickFormatter={dateStr => {
                const date = new Date(parseInt(dateStr) * 1000); 
                return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
                }} />
                <YAxis dataKey="price" type="number" domain={[0, max]} />
            </LineChart>
            </ResponsiveContainer> 
        );
    }
}

export default RenderChart

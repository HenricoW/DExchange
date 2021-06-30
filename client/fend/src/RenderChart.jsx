import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";

const RenderChart = ({ trades, priceDigits }) => {
    if (trades.length === 0) {
        return "No data present";
    } else {
        const adjTrades = trades.map((trade) => ({ ...trade, price: Number(trade.price) / 10 ** priceDigits }));
        const max = trades.reduce((acc, trade) => (trade.price > acc ? trade.price : acc), 0);
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adjTrades}>
                    <Line type="monotone" dataKey="price" stroke="#741cd7" />
                    <CartesianGrid stroke="#000000" />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(dateStr) => {
                            const date = new Date(parseInt(dateStr) * 1000);
                            return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
                        }}
                    />
                    <YAxis dataKey="price" type="number" domain={[0, max]} />
                </LineChart>
            </ResponsiveContainer>
        );
    }
};

export default RenderChart;

import React from "react";
import Moment from "react-moment";
import RenderChart from "./RenderChart";

const AllTrades = ({ trades, displayVal, priceDigits }) => {
    // check trades for erroneous duplicates (on recent trade)
    const removeDuplicates = (tradeList) => {
        let set = {};
        return tradeList.filter((trade) => {
            return set.hasOwnProperty(trade.tradeId) ? false : (set[trade.tradeId] = true);
        });
    };

    const filteredTrades = removeDuplicates(trades);

    const renderList = (trades, className) => {
        const revTrades = [];
        for (let i = trades.length - 1; i >= 0; i--) revTrades.push(trades[i]);

        return (
            <>
                <table className={`table table-striped trade-list mb-0 ${className}`}>
                    <thead>
                        <tr>
                            <th>amount</th>
                            <th>price</th>
                            <th>date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {revTrades.map((trade) => (
                            <tr key={trade.tradeId}>
                                <td>{displayVal(trade.amount)}</td>
                                <td>{Number(trade.price) / 10 ** priceDigits}</td>
                                <td>
                                    <Moment fromNow>{parseInt(trade.timestamp) * 1000}</Moment>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    return (
        <div className="card">
            <h2 className="card-title">All trades</h2>
            <div className="row">
                <div className="col-sm-12">
                    <RenderChart trades={filteredTrades} priceDigits={priceDigits} />
                    {renderList(filteredTrades, "trade-list")}
                </div>
            </div>
        </div>
    );
};

export default AllTrades;

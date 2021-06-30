import React from "react";
import Moment from "react-moment";

const AllOrders = ({ orders, displayVal, priceDigits }) => {
    const renderList = (orderList, side, className) => {
        return (
            <>
                <table className={`table table-striped mb-0 order-list ${className}`}>
                    <thead>
                        <tr className="table-title order-list-title">
                            <th colSpan="3">{side}</th>
                        </tr>
                        <tr>
                            <th>amount</th>
                            <th>price</th>
                            <th>date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderList.map((order) => (
                            <tr key={order.id}>
                                <td>{displayVal(order.remaining)}</td>
                                <td>{Number(order.price) / 10 ** priceDigits}</td>
                                <td>
                                    <Moment fromNow>{parseInt(order.date) * 1000}</Moment>
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
            <h2 className="card-title">All orders</h2>
            <div className="row">
                <div className="col-sm-6">{renderList(orders.buy, "Buy", "order-list-buy")}</div>
                <div className="col-sm-6">{renderList(orders.sell, "Sell", "order-list-sell")}</div>
            </div>
        </div>
    );
};

export default AllOrders;

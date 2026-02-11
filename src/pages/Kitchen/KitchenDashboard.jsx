import React, { useContext, useEffect, useState } from "react";
import "./KitchenDashboard.css";
import io from "socket.io-client";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { StoreContext } from "../../context/StoreContext";

const socket = io(API_BASE_URL);

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const { token } = useContext(StoreContext);

  useEffect(() => {
    fetchAllOrders();

    socket.on("kds-new-order", (order) => {
      setOrders((prev) => [order, ...prev]);
    });

    socket.on("kds-status-updated", (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
      );
    });

    return () => {
      socket.off("kds-new-order");
      socket.off("kds-status-updated");
    };
  }, []);

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/order/allOrders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const updateStatus = async (id, status) => {
    await axios.put(
      `${API_BASE_URL}/order/status/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    fetchAllOrders(); 
  };

  return (
    <div className="kds-container">
      <h1 className="kds-title">👨‍🍳 Kitchen Dashboard</h1>

      <div className="kds-grid">
        {orders
          .filter((order) => order.status !== "delivered")
          .map((order) => (
            <div key={order._id} className={`kds-card ${order.status}`}>
              <div className="kds-header">
                <h3>Order #{order._id.slice(-5)}</h3>
                <p>Table: {order.tableNumber}</p>
                <span className="kds-status">{order.status}</span>
              </div>

              <ul className="kds-items">
                {order.items.map((i) => (
                  <li key={i._id}>
                    {i.quantity}× {i.food?.name} — ₹{i.price}
                  </li>
                ))}
              </ul>

              <div className="kds-actions">
                {order.status === "pending" && (
                  <button
                    className="btn preparing"
                    onClick={() => updateStatus(order._id, "preparing")}
                  >
                    Start Preparing
                  </button>
                )}

                {order.status === "preparing" && (
                  <button
                    className="btn ready"
                    onClick={() => updateStatus(order._id, "ready")}
                  >
                    Mark Ready
                  </button>
                )}

                {order.status === "ready" && (
                  <button
                    className="btn served"
                    onClick={() => updateStatus(order._id, "delivered")}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default KitchenDashboard;

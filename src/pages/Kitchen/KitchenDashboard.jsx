import React, { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { StoreContext } from "../../context/StoreContext";
import "./KitchenDashboard.css";

const socket = io(API_BASE_URL);

const KitchenDashboard = () => {
  const { token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);

  const fetchKDSOrders = async () => {
    const res = await axios.get(`${API_BASE_URL}/order/kds`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success) setOrders(res.data.data);
  };

  useEffect(() => {
    fetchKDSOrders();

    socket.on("kds-new-order", (order) => {
      setOrders((prev) => [...prev, order]);
      // playSound();
    });

    socket.on("kds-status-updated", (updated) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
    });

    return () => {
      socket.off("kds-new-order");
      socket.off("kds-status-updated");
    };
  }, []);

  // const playSound = () => {
  //   const audio = new Audio("/notification.mp3");
  //   audio.play();
  // };

  const updateStatus = async (id, status) => {
    await axios.put(
      `${API_BASE_URL}/order/status/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  };

  return (
    <div className="kds-container">
      <h1>👨‍🍳 Kitchen Dashboard</h1>

      <div className="kds-grid">
        {orders.map((order) => (
          <div
            key={order._id}
            className={`kds-card ${order.status === "pending" ? "blink" : ""}`}
          >
            <div className="kds-header">
              <h3>Order #{order._id.slice(-4)}</h3>
              <p className="time">
                {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="kds-items">
              {order.items.map((i, index) => (
                <p key={index}>
                  {i.food.name} × {i.quantity}
                </p>
              ))}
            </div>

            <select
              value={order.status}
              onChange={(e) => updateStatus(order._id, e.target.value)}
              className="kds-select"
            >
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenDashboard;

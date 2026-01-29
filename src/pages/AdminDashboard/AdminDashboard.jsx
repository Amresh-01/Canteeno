import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../config";
import { StoreContext } from "../../context/StoreContext";
import "./AdminDashboard.css";

const socket = io(API_BASE_URL, { transports: ["websocket"] });

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const { token } = useContext(StoreContext);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/order/allOrders`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchOrders();

    // Listen for real-time updates
    socket.on("new-order", fetchOrders);
    socket.on("order-updated", fetchOrders);

    return () => {
      socket.off("new-order");
      socket.off("order-updated");
    };
  }, [token]);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API_BASE_URL}/order/status/${orderId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        },
      );

      socket.emit("admin-updated-order", orderId);
      fetchOrders();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Live Orders</h2>

      <div className="order-list">
        {orders.length === 0 && <p>No orders found.</p>}

        {orders.map((order) => (
          <div className="order-card" key={order._id}>
            <h3>Order #{order._id}</h3>

            <ul>
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.food?.name || "Unknown item"} × {item.quantity}
                </li>
              ))}
            </ul>

            <p>Total: ₹{order.totalAmount}</p>

            <select
              value={order.status}
              onChange={(e) => updateStatus(order._id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

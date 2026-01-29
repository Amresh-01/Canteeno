import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import { StoreContext } from "../../context/StoreContext";
import { API_BASE_URL } from "../../config";
import "./AdminAnalytics.css";

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const { token } = useContext(StoreContext);

  const fetchStats = async () => {
    const res = await axios.get(`${API_BASE_URL}/order/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success) setStats(res.data.data);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return <p>Loading analytics...</p>;

  return (
    <div className="analytics-container">
      <h2>Analytics Dashboard</h2>

      <div className="analytics-grid">
        <div className="card">
          <h3>Total Revenue</h3>
          <p>₹{stats.totalRevenue}</p>
        </div>

        <div className="card">
          <h3>Total Orders</h3>
          <p>{stats.totalOrders}</p>
        </div>

        <div className="card">
          <h3>Top Item</h3>
          <p>{stats.topItem?.name || "N/A"}</p>
        </div>
      </div>

      <div className="chart-section">
        <h3>Orders Per Day</h3>
        <Bar
          data={{
            labels: stats.ordersPerDay.map((i) => i.day),
            datasets: [
              {
                label: "Orders",
                data: stats.ordersPerDay.map((i) => i.count),
                backgroundColor: "#D96F32",
              },
            ],
          }}
        />
      </div>

      <div className="chart-section">
        <h3>Payment Method Split</h3>
        <Pie
          data={{
            labels: ["Cash", "Card", "UPI"],
            datasets: [
              {
                data: [
                  stats.payments.cash,
                  stats.payments.card,
                  stats.payments.upi,
                ],
                backgroundColor: ["#4caf50", "#1976d2", "#ff9800"],
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default AdminAnalytics;

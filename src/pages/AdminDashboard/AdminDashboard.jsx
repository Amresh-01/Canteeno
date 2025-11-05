import React, { useContext, useEffect, useState } from "react";
import "./AdminDashboard.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { url, token, userType } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); 
  const navigate = useNavigate();

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        url + "/api/order/all",
        { headers: { token } }
      );
      if (response.data.success) {
        // Sort by date (newest first)
        const sortedOrders = response.data.data.sort((a, b) => 
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
        setOrders(sortedOrders);
      } else {
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please login as admin.");
        navigate("/");
      } else {
        toast.error("Failed to fetch orders");
      }
    } finally {
      setLoading(false);
    }
  };

    const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.post(
        url + "/api/order/update-status",
        { orderId, status: newStatus },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(`Order marked as ${newStatus}`);
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        toast.error(response.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleStatusChange = (orderId, currentStatus) => {
    let newStatus;
    if (currentStatus === "Order Placed" || currentStatus === "pending") {
      newStatus = "accepted";
    } else if (currentStatus === "accepted") {
      newStatus = "preparing";
    } else if (currentStatus === "preparing") {
      newStatus = "ready";
    } else {
     return;
    }
    updateOrderStatus(orderId, newStatus);
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus === "all") return true;
    const status = order.status?.toLowerCase() || "pending";
    if (filterStatus === "pending") {
      return status === "pending" || status === "order placed";
    }
    return status === filterStatus;
  });

  useEffect(() => {
    if (!token || userType !== "admin") {
      navigate("/");
      return;
    }

    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); 

    return () => clearInterval(interval);
  }, [token, userType, navigate]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-loading">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>📊 Order Management Dashboard</h1>
        <p className="dashboard-subtitle">Real-time order tracking and management</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="stat-card pending">
          <h3>{orders.filter(o => (o.status?.toLowerCase() || "pending") === "pending" || (o.status?.toLowerCase() || "order placed") === "order placed").length}</h3>
          <p>Pending Orders</p>
        </div>
        <div className="stat-card accepted">
          <h3>{orders.filter(o => o.status?.toLowerCase() === "accepted").length}</h3>
          <p>Accepted</p>
        </div>
        <div className="stat-card preparing">
          <h3>{orders.filter(o => o.status?.toLowerCase() === "preparing").length}</h3>
          <p>Preparing</p>
        </div>
        <div className="stat-card ready">
          <h3>{orders.filter(o => o.status?.toLowerCase() === "ready").length}</h3>
          <p>Ready</p>
        </div>
        <div className="stat-card total">
          <h3>{orders.length}</h3>
          <p>Total Orders</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs">
        <button
          className={filterStatus === "all" ? "active" : ""}
          onClick={() => setFilterStatus("all")}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={filterStatus === "pending" ? "active" : ""}
          onClick={() => setFilterStatus("pending")}
        >
          Pending ({orders.filter(o => (o.status?.toLowerCase() || "pending") === "pending" || (o.status?.toLowerCase() || "order placed") === "order placed").length})
        </button>
        <button
          className={filterStatus === "accepted" ? "active" : ""}
          onClick={() => setFilterStatus("accepted")}
        >
          Accepted ({orders.filter(o => o.status?.toLowerCase() === "accepted").length})
        </button>
        <button
          className={filterStatus === "preparing" ? "active" : ""}
          onClick={() => setFilterStatus("preparing")}
        >
          Preparing ({orders.filter(o => o.status?.toLowerCase() === "preparing").length})
        </button>
        <button
          className={filterStatus === "ready" ? "active" : ""}
          onClick={() => setFilterStatus("ready")}
        >
          Ready ({orders.filter(o => o.status?.toLowerCase() === "ready").length})
        </button>
      </div>

      {/* Orders List */}
      <div className="admin-orders-container">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onStatusChange }) => {
  const status = order.status?.toLowerCase() || "pending";
  const isPending = status === "pending" || status === "order placed";
  const isAccepted = status === "accepted";
  const isPreparing = status === "preparing";
  const isReady = status === "ready";

  const getStatusColor = () => {
    if (isPending) return "#ef4444";
    if (isAccepted) return "#f59e0b";
    if (isPreparing) return "#3b82f6";
    if (isReady) return "#10b981";
    return "#6b7280";
  };

  const getNextAction = () => {
    if (isPending) return "Accept Order";
    if (isAccepted) return "Mark as Preparing";
    if (isPreparing) return "Mark as Ready";
    return null;
  };

  const handleNextAction = () => {
    if (isPending) {
      onStatusChange(order._id, "pending");
    } else if (isAccepted) {
      onStatusChange(order._id, "accepted");
    } else if (isPreparing) {
      onStatusChange(order._id, "preparing");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="order-card" style={{ borderLeft: `4px solid ${getStatusColor()}` }}>
      <div className="order-card-header">
        <div className="order-id">
          <strong>Order #{order._id?.slice(-6) || "N/A"}</strong>
        </div>
        <div className="order-status" style={{ backgroundColor: `${getStatusColor()}20`, color: getStatusColor() }}>
          <span className="status-dot" style={{ backgroundColor: getStatusColor() }}></span>
          {order.status || "Pending"}
        </div>
      </div>

      <div className="order-card-body">
        <div className="order-info">
          <div className="info-row">
            <span className="info-label">Customer:</span>
            <span className="info-value">
              {order.address?.firstName || ""} {order.address?.lastName || ""}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone:</span>
            <span className="info-value">{order.address?.phone || "N/A"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Address:</span>
            <span className="info-value">
              {order.address?.street || ""}, {order.address?.city || ""}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Order Time:</span>
            <span className="info-value">{formatDate(order.createdAt || order.date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Amount:</span>
            <span className="info-value amount">₹{order.amount || 0}</span>
          </div>
        </div>

        <div className="order-items">
          <strong>Items ({order.items?.length || 0}):</strong>
          <div className="items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="item-row">
                <span>{item.name || item.itemName}</span>
                <span className="item-qty">x{item.quantity || 1}</span>
                {item.notes && (
                  <div className="item-notes">
                    <small>Note: {item.notes}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="order-card-footer">
        {getNextAction() && (
          <button
            className="status-action-btn"
            onClick={handleNextAction}
            style={{ backgroundColor: getStatusColor() }}
          >
            {getNextAction()}
          </button>
        )}
        {isReady && (
          <div className="ready-badge">
            ✓ Order Ready for Pickup
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
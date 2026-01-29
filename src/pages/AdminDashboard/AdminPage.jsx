// src/pages/Admin/AdminPage.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";
import "./AdminPage.css";

const AdminPage = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminPage;

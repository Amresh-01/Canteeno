import React, { useContext, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config";
import axios from "axios";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [showDropdown, setShowDropdown] = useState(false);

  const { getTotalCartAmount, token, setToken, userType } =
    useContext(StoreContext);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/user/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
    } catch (err) {
      // If token is expired, still log the user out
      if (
        err?.response?.data?.message === "Token expired. Please login again."
      ) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(err?.response?.data?.message || "Logout failed");
      }
    } finally {
      // ALWAYS clear token – even on failure
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      setToken("");

      navigate("/");
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-content">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setMenu("home");
            navigate("/?reset=" + Date.now(), {
              replace: true,
              state: { resetCategory: true },
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <img src={assets.logo} alt="" className="logo" />
        </a>
        <ul className="navbar-menu">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setMenu("home");
              navigate("/?reset=" + Date.now(), {
                replace: true,
                state: { resetCategory: true },
              });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={menu === "home" ? "active" : ""}
          >
            Home
          </a>
          <a
            href="#explore-menu"
            onClick={() => setMenu("menu")}
            className={menu === "menu" ? "active" : ""}
          >
            Menu
          </a>
          {/* <a
            href="#app-download"
            onClick={() => setMenu("mobile-app")}
            className={menu === "mobile-app" ? "active" : ""}
          >
            Mobile App
          </a> */}
          <a
            href="#footer"
            onClick={() => setMenu("contact-us")}
            className={menu === "contact-us" ? "active" : ""}
          >
            Contact Us
          </a>
        </ul>
        <div className="navbar-right">
          <div className="navbar-search-icon">
            <Link to="/cart">
              <img src={assets.basket_icon} alt="" />
            </Link>
            <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
          </div>
          {!token ? (
            <button onClick={() => setShowLogin(true)}>Sign In</button>
          ) : (
            <div
              className="navbar-profile"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <img src={assets.profile_icon} alt="" />
              <ul
                className="nav-profile-dropdown"
                style={{ display: showDropdown ? "flex" : "none" }}
              >
                {userType === "admin" ? (
                  <>
                    <li onClick={() => navigate("/admin/dashboard")}>
                      <img src={assets.bag_icon} alt="" />
                      <p>Admin Dashboard</p>
                    </li>
                    <hr />
                    <li onClick={logout}>
                      <img src={assets.logout_icon} alt="" />
                      <p>Logout</p>
                    </li>
                  </>
                ) : (
                  <>
                    <li onClick={() => navigate("/myorders")}>
                      <img src={assets.bag_icon} alt="" />
                      <p>Orders</p>
                    </li>
                    <hr />
                    <li onClick={logout}>
                      <img src={assets.logout_icon} alt="" />
                      <p>Logout</p>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;

import React, { useEffect, useRef, useState } from "react";
import "../styles/button.scss";
import "../styles/navbar.scss";

import logo from "../assets/mockedge logo 1.png";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../redux/User.slice";
import { useLocation } from "react-router-dom";

export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { user } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();

  const location = useLocation();

  // Check if current URL contains "dashboard"
  const isOnDashboard = location.pathname.includes("/dashboard");


  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem("accessToken")
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <a className="logoImages" href="/">
          <img src={logo} alt="Logo" style={{ maxHeight: "3rem" }} />
        </a>
      </div>

      {/* Hamburger Button */}
      <button
        className={`navbar-burger ${menuOpen ? "is-active" : ""}`}
        onClick={(e) => {
          e.stopPropagation(); // ✅ stop event first
          setMenuOpen(!menuOpen);
        }}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Menu */}
      <div
        ref={menuRef}
        className={`navbar-menu ${menuOpen ? "is-active" : ""}`}
      >
        <div className="navbar-start">
          <a className="navbar-item" href="/">
            Home
          </a>
          <a className="navbar-item" href="/about">
            About
          </a>
          <a className="navbar-item" href="/contact">
            Contact
          </a>
        </div>
        <div className="navbar-end">
          {user === null || user.accessToken === null ? (
            <>
              <a className="button primary" href="/login">
                Log in
              </a>
              <a className="button primary" href="/signup">
                Sign up
              </a>
            </>
          ) : (
            <>
               {!isOnDashboard && (
                <a className="button primary" href={`/dashboard/${user.id}`}>
                  Dashboard
                </a>
              )}
              <button className="button primary" onClick={handleLogout}>
                logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

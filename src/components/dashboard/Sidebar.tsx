import React from "react";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  User,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  PlusIcon,
} from "lucide-react";
import "./sidebar.scss";
import { clearUser } from "../../redux/User.slice";

// Define the props interface
interface SidebarProps {
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarCollapsed,
  onToggleCollapse,
  isMobile,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { user } = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  
  const userId = user?.id ?? "me";

  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem("accessToken");
  };

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  const handleNavClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const navigationItems = [
    {
      to: `/dashboard/${userId}`,
      icon: LayoutDashboard,
      label: "Dashboard",
      end: true,
    },
    {
      to: `/dashboard/${userId}/create-mock`,
      icon: PlusIcon,
      label: "Create Mock",
      end: false,
      badge: "New",
    },
    {
      to: `/dashboard/${userId}/profile`,
      icon: User,
      label: "Profile",
      end: false,
    },
    {
      to: `/dashboard/${userId}/analytics`,
      icon: BarChart3,
      label: "Analytics",
      end: false,
      badge: "New",
    },
  ];

  const sidebarClasses = `sidebar ${
    isSidebarCollapsed && !isMobile ? "is-collapsed" : ""
  } ${
    isMobile && isMobileOpen ? "is-open" : ""
  } ${
    isMobile ? "sidebar--mobile" : "sidebar--desktop"
  }`;

  const showCollapseButton = !isMobile;
  const currentCollapsed = isMobile ? false : isSidebarCollapsed;

  return (
    <aside className={sidebarClasses}>
      {/* Header */}
      <div className="sidebar__header">
        {!currentCollapsed && (
          <div className="sidebar__logo">
            <div
              className="sidebar__logo-icon"
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleLogoClick()}
            >
              <LayoutDashboard size={24} />
            </div>
            <h2 className="sidebar__logo-text">MockEdge</h2>
          </div>
        )}
        
        {showCollapseButton && (
          <button
            className="sidebar__collapse-btn"
            onClick={onToggleCollapse}
            aria-label={currentCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {currentCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        )}
      </div>

      {/* User Profile Section */}
      <div className="sidebar__user">
        <div className="sidebar__user-avatar">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${
                user?.name || "User"
              }&background=6366f1&color=fff`
            }
            alt="User avatar"
            className="sidebar__user-image"
          />
        </div>
        {!currentCollapsed && (
          <div className="sidebar__user-info">
            <h3 className="sidebar__user-name">{user?.name || "User"}</h3>
            <p className="sidebar__user-role">{user?.role || "Member"}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.to} className="sidebar__nav-item">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar__nav-link ${
                      isActive ? "sidebar__nav-link--active" : ""
                    }`
                  }
                  title={currentCollapsed ? item.label : undefined}
                  onClick={handleNavClick}
                >
                  <div className="sidebar__nav-icon">
                    <IconComponent size={20} />
                  </div>
                  {!currentCollapsed && (
                    <>
                      <span className="sidebar__nav-text">{item.label}</span>
                      {item.badge && (
                        <span className="sidebar__nav-badge">{item.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="sidebar__footer">
        <NavLink
          to="/settings"
          className="sidebar__nav-link sidebar__nav-link--secondary"
          title={currentCollapsed ? "Settings" : undefined}
          onClick={handleNavClick}
        >
          <div className="sidebar__nav-icon">
            <Settings size={20} />
          </div>
          {!currentCollapsed && <span className="sidebar__nav-text">Settings</span>}
        </NavLink>

        <button
          className="sidebar__logout-btn"
          onClick={handleLogout}
          title={currentCollapsed ? "Sign Out" : undefined}
        >
          <div className="sidebar__nav-icon">
            <LogOut size={20} />
          </div>
          {!currentCollapsed && <span className="sidebar__nav-text">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
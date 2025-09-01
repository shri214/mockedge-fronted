import { Outlet } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Sidebar } from "./Sidebar";
import { BreadcrumbNavigation } from "./BreadcrumbNavigation";
import { Menu, Bell, Search } from "lucide-react";
import "./dashboardLayout.scss";
import { setCollapse } from "../../redux/collapse.slice";

// Consistent breakpoint
const MOBILE_BREAKPOINT = 1024;

export const DashboardLayout = () => {
  const dispatch = useDispatch();
  const { isCollapsed } = useSelector((state: any) => state.collapse);
  const { user } = useSelector((state: any) => state.user);

  // Single source of truth for mobile detection
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;
  });
  
  // Separate states for mobile and desktop
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    // Initialize from Redux state, but only for desktop
    return typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT 
      ? (isCollapsed || false) 
      : false;
  });

  // Handle responsive behavior with debounce
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(mobile);
    
    if (mobile) {
      // On mobile, always close the sidebar when resizing to mobile
      setIsMobileSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  // Sync desktop collapse state with Redux
  useEffect(() => {
    if (!isMobile) {
      dispatch(setCollapse(isDesktopSidebarCollapsed));
    }
  }, [isDesktopSidebarCollapsed, isMobile, dispatch]);

  // Handle mobile sidebar toggle
  const handleMobileToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      setIsMobileSidebarOpen(prev => !prev);
    }
  }, [isMobile]);

  // Handle desktop sidebar toggle
  const handleDesktopToggle = useCallback(() => {
    if (!isMobile) {
      setIsDesktopSidebarCollapsed(prev => !prev);
    }
  }, [isMobile]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobile && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    if (isMobileSidebarOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, isMobileSidebarOpen]);

  // Determine current sidebar state based on screen size
  const currentSidebarCollapsed = isMobile ? false : isDesktopSidebarCollapsed;

  return (
    <div
      className={`dashboard-layout ${
        !isMobile && isDesktopSidebarCollapsed ? "dashboard-layout--sidebar-collapsed" : ""
      }`}
      data-mobile={isMobile}
    >
      {/* Mobile Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="dashboard-layout__overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`dashboard-layout__sidebar ${
          isMobile && isMobileSidebarOpen ? "dashboard-layout__sidebar--mobile-open" : ""
        } ${
          isMobile ? "dashboard-layout__sidebar--mobile" : "dashboard-layout__sidebar--desktop"
        }`}
      >
        <Sidebar
          isSidebarCollapsed={currentSidebarCollapsed}
          onToggleCollapse={handleDesktopToggle}
          isMobile={isMobile}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="dashboard-layout__main">
        {/* Top Navigation Bar */}
        <header className="dashboard-layout__header">
          <div className="dashboard-layout__header-left">
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <button
                className="dashboard-layout__mobile-toggle"
                onClick={handleMobileToggle}
                aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                <Menu size={20} />
              </button>
            )}

            {/* Desktop Sidebar Toggle */}
            {!isMobile && (
              <button
                className="dashboard-layout__sidebar-toggle"
                onClick={handleDesktopToggle}
                aria-label={
                  isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <Menu size={18} />
              </button>
            )}

            {/* Breadcrumb Navigation */}
            <BreadcrumbNavigation />
          </div>

          <div className="dashboard-layout__header-center">
            {/* Global Search */}
            <div className="dashboard-layout__search">
              <Search size={18} className="dashboard-layout__search-icon" />
              <input
                type="text"
                placeholder="Search anything..."
                className="dashboard-layout__search-input"
              />
              <kbd className="dashboard-layout__search-kbd">⌘K</kbd>
            </div>
          </div>

          <div className="dashboard-layout__header-right">
            {/* Notifications */}
            <button className="dashboard-layout__notification-btn">
              <Bell size={18} />
              <span className="dashboard-layout__notification-badge">3</span>
            </button>

            {/* User Profile Dropdown */}
            <div className="dashboard-layout__user-menu">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${
                    user?.name || "User"
                  }&background=6366f1&color=fff`
                }
                alt="User avatar"
                className="dashboard-layout__user-avatar"
              />
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="dashboard-layout__content-wrapper">
          <main className="dashboard-layout__content">
            <div className="dashboard-layout__content-inner">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="dashboard-layout__footer">
            <div className="dashboard-layout__footer-content">
              <p className="dashboard-layout__footer-text">
                © 2024 MockEdge. All rights reserved.
              </p>
              <div className="dashboard-layout__footer-links">
                <a href="/privacy" className="dashboard-layout__footer-link">
                  Privacy
                </a>
                <a href="/terms" className="dashboard-layout__footer-link">
                  Terms
                </a>
                <a href="/support" className="dashboard-layout__footer-link">
                  Support
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="dashboard-layout__loading" data-loading="false">
        <div className="dashboard-layout__loading-spinner">
          <div className="dashboard-layout__loading-dot"></div>
          <div className="dashboard-layout__loading-dot"></div>
          <div className="dashboard-layout__loading-dot"></div>
        </div>
      </div>
    </div>
  );
};
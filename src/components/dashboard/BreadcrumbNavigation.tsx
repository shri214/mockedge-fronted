import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import "./breadcrumb.scss";
import { useSelector } from 'react-redux';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: any) => state.user);
  const userId = user?.id ?? "me";
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Home
    breadcrumbs.push({ label: 'Home', href: '/' });
    
    // If we're at home, return early
    if (pathSegments.length === 0) {
      return breadcrumbs;
    }
    
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip user ID segments in dashboard routes
      if (
        segment === userId ||
        segment.match(/^[a-f\d-]{36}$/i) ||
        segment.match(/^\d+$/)
      ) {
        return;
      }
      
      // Custom labels for specific routes
      const labelMap: { [key: string]: string } = {
        'dashboard': 'Dashboard',
        'profile': 'Profile',
        'analytics': 'Analytics',
        'settings': 'Settings',
        'users': 'Users',
        'projects': 'Projects',
        'reports': 'Reports',
        'notifications': 'Notifications',
        'billing': 'Billing',
        'support': 'Support',
        'admin': 'Admin',
      };
      
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      const isLast = index === pathSegments.length - 1;

      // ✅ Ensure dashboard routes always include userId
      let href: string | undefined;
      if (!isLast) {
        if (segment === "dashboard") {
          href = `/dashboard/${userId}`;
        } else if (pathSegments.includes("dashboard")) {
          // For nested routes like profile, analytics, etc.
          href = `/dashboard/${userId}/${segment}`;
        } else {
          href = currentPath;
        }
      }
      
      breadcrumbs.push({
        label,
        href,
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't render if only home breadcrumb exists and we're at home
  if (breadcrumbs.length === 1 && location.pathname === '/') {
    return null;
  }
  
  return (
    <nav className="breadcrumb-navigation" aria-label="Breadcrumb">
      <ol className="breadcrumb-navigation__list">
        {breadcrumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="breadcrumb-navigation__item">
            {index > 0 && (
              <ChevronRight 
                size={14} 
                className="breadcrumb-navigation__separator" 
                aria-hidden="true"
              />
            )}
            {crumb.href ? (
              <Link 
                to={crumb.href} 
                className="breadcrumb-navigation__link"
                title={`Go to ${crumb.label}`}
              >
                {index === 0 && <Home size={14} className="breadcrumb-navigation__home-icon" />}
                <span>{crumb.label}</span>
              </Link>
            ) : (
              <span className="breadcrumb-navigation__current" aria-current="page">
                {index === 0 && <Home size={14} className="breadcrumb-navigation__home-icon" />}
                <span>{crumb.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

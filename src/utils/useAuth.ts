import { useDispatch, useSelector } from "react-redux";
import { AuthStatus, UserRole } from "../utils/auth.types"
import { AuthenticationConstants } from "../utils/AuthenticationConstants";
import { useMemo } from "react";
import { clearUser } from "../redux/User.slice";

export const useAuth = () => {
  const { user,loading , isAuthenticated} = useSelector((state:any) => state.user)
  const accessToken= user?.accessToken;
  const dispatch=useDispatch();

  const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
    const currentTime = Date.now() / 1000;
    if(payload.exp<currentTime){
      dispatch(clearUser());
      localStorage.removeItem("accessToken");
    }
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't decode, assume expired
  }
};

  const isTokenValid = useMemo(() => {
    if (!accessToken) return false;
    return !isTokenExpired(accessToken);
  }, [accessToken]);

  const getAuthStatus = (): AuthStatus => {
    if (!accessToken || !user || !isTokenValid) {
      return AuthenticationConstants.deny as AuthStatus;
    }

    switch (user.role) {
      case UserRole.ADMIN:
        return AuthenticationConstants.admin as AuthStatus;
      case UserRole.USER:
        return AuthenticationConstants.user as AuthStatus;
      case UserRole.SUPER_ADMIN:
        return AuthenticationConstants.superAdmin as AuthStatus;
      default:
        return AuthenticationConstants.deny as AuthStatus;
    }
  }
  const hasRole = (requiredRoles: UserRole[]): boolean => {
    if (!user || !accessToken || !isTokenValid) return false;
    return requiredRoles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    // Add your permission logic here
    // This could check against a permissions array in the user object
    return true;
  };

  return {
    // user,
    // accessToken,
    // isAuthenticated,
    // loading,
    // authStatus: getAuthStatus(),
    // hasRole,
    // hasPermission,
    // isTokenExpired

     user: isTokenValid ? user : null,
    accessToken: isTokenValid ? accessToken : null,
    isAuthenticated: isAuthenticated && isTokenValid,
    loading,
    authStatus: getAuthStatus(),
    hasRole,
    hasPermission,
    isTokenExpired: !isTokenValid
  };
};
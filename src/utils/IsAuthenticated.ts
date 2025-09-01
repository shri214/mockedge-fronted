import { useSelector } from "react-redux";
import { RootState } from "../store";
import { AuthenticationConstants } from "./AuthenticationConstants";

export const IsAuthenticated = (): string => {
  const accessToken = useSelector((state: RootState) => state?.user?.user?.accessToken);
  const role = useSelector((state: RootState) => state.user.user?.role);
  if (accessToken) {
    if (role === "ADMIN") {
      return AuthenticationConstants.Admin;
    } else if (role === "USER") {
      return AuthenticationConstants.user;
    } else if (role === "ROLE_SYS_ADMIN") {
      return AuthenticationConstants.SuperAdmin;
    }
  } else {
    return AuthenticationConstants.deny;
  }
};

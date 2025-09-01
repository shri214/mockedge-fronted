// types/auth.types.ts
export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "ROLE_SYS_ADMIN"
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const AuthStatus = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
  DENIED: "deny"
} as const;
export type AuthStatus = typeof AuthStatus[keyof typeof AuthStatus]; 

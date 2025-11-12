import { DefaultSession } from "next-auth";

type UserRole = "ADMIN" | "USER" | string;

declare module "next-auth" {
  interface User {
    id: string;
    role?: UserRole;
  }
  interface Session {
    user: {
      id: string;
      role?: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: UserRole;
  }
}

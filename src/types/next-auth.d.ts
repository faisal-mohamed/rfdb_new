import { UserRole, UserType } from "../generated/prisma";

declare module "next-auth" {
  interface User {
    role: UserRole;
    userType: UserType;
    firstName: string;
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      userType: UserType;
      firstName: string;
      lastName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    userType: UserType;
    firstName: string;
    lastName: string;
  }
}

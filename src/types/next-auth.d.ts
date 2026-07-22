import "next-auth"

declare module "next-auth" {
  interface Session {
    user?: User;
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id: string;
    name?: string;
    phone?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

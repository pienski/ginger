import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/recipes/:path*",
    "/history/:path*",
    "/grocery/:path*",
    "/api/recipes/:path*",
    "/api/history/:path*",
    "/api/grocery/:path*",
    "/api/parse/:path*",
  ],
};

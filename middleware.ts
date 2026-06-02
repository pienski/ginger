export { default } from "next-auth/middleware";

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

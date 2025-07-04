/*import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse, NextRequest } from "next/server";

export default authMiddleware({
  publicRoutes: ["/", "/login", "/challenges", "api"],
  afterAuth(auth, req, evt) {
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({
        returnBackUrl: "http://localhost:3000/",
      });
    }
    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
*/

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { CART_COOKIE } from "@/lib/cart-config";
import { mergeGuestCart } from "@/lib/cart-merge";
import { deliverResetPasswordEmail } from "@/lib/dev-mailbox";

export const auth = betterAuth({
  appName: "Halden",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      deliverResetPasswordEmail(user.email, url);
    },
  },
  hooks: {
    // Sign-in and sign-up create a session: fold the guest bag into the
    // user's bag and drop the guest cookie. Never blocks signing in.
    after: createAuthMiddleware(async (ctx) => {
      const userId = ctx.context.newSession?.user.id;
      const guestCartId = ctx.getCookie(CART_COOKIE);
      if (!userId || !guestCartId) return;

      try {
        await mergeGuestCart(guestCartId, userId);
      } catch (error) {
        console.error("[cart] Failed to merge guest cart", error);
      }
      ctx.setCookie(CART_COOKIE, "", { maxAge: 0, path: "/" });
    }),
  },
  // nextCookies must stay last so it sees cookies set by earlier plugins.
  plugins: [admin(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

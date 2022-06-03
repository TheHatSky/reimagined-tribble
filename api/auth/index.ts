import { ApiVersion, Shopify } from "@shopify/shopify-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.April22,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

export default async function handle(req: VercelRequest, res: VercelResponse) {
  if (!req.cookies["shopify_top_level_oauth"]) {
    return res.redirect(
      `/api/auth/toplevel?${new URLSearchParams(
        req.query as Record<string, string>
      ).toString()}`
    );
  }

  const redirectUrl = await Shopify.Auth.beginAuth(
    req,
    res,
    req.query.shop as string,
    "/api/auth/callback",
    true
  );

  res.redirect(redirectUrl);
}

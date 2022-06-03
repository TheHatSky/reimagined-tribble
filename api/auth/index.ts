import { Shopify } from "@shopify/shopify-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

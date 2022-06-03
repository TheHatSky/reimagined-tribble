import { ApiVersion, Shopify } from "@shopify/shopify-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import topLevelAuthRedirect from "../helpers/top-level-auth-redirect";

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
  res.setHeader(
    "Set-Cookie",
    "shopify_top_level_oauth=1; SameSite=Strict; HttpOnly"
  );
  // res.cookies("shopify_top_level_oauth"), "1", {
  //   signed: true,
  //   httpOnly: true,
  //   sameSite: "strict",
  // });

  res.setHeader("Content-Type", "text/html");

  res.send(
    topLevelAuthRedirect({
      apiKey: Shopify.Context.API_KEY,
      hostName: Shopify.Context.HOST_NAME,
      host: req.query.host,
      query: req.query,
    })
  );
}

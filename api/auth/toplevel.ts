import { Shopify } from "@shopify/shopify-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import topLevelAuthRedirect from "../helpers/top-level-auth-redirect";

export default async function handle(req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    "Cookie",
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

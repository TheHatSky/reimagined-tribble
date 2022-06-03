import { Shopify } from "@shopify/shopify-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handle(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query as any
    );

    const host = req.query.host;
    // app.set(
    //   "active-shopify-shops",
    //   Object.assign(app.get("active-shopify-shops"), {
    //     [session.shop]: session.scope,
    //   })
    // );

    const response = await Shopify.Webhooks.Registry.register({
      shop: session.shop,
      accessToken: session.accessToken,
      topic: "APP_UNINSTALLED",
      path: "/webhooks",
    });

    if (!response["APP_UNINSTALLED"].success) {
      console.log(
        `Failed to register APP_UNINSTALLED webhook: ${response.result}`
      );
    }

    // Redirect to app with shop parameter upon auth
    res.redirect(`/?shop=${session.shop}&host=${host}`);
  } catch (e) {
    switch (true) {
      case e instanceof Shopify.Errors.InvalidOAuthError:
        res.status(400);
        res.send(e.message);
        break;
      case e instanceof Shopify.Errors.CookieNotFound:
      case e instanceof Shopify.Errors.SessionNotFound:
        // This is likely because the OAuth session cookie expired before the merchant approved the request
        res.redirect(`/auth?shop=${req.query.shop}`);
        break;
      default:
        res.status(500);
        res.send(e.message);
        break;
    }
  }
}

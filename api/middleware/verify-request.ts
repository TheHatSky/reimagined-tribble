import { Shopify } from "@shopify/shopify-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const TEST_GRAPHQL_QUERY = `
{
  shop {
    name
  }
}`;

export async function verifyRequest(req: VercelRequest, res: VercelResponse) {
  const session = await Shopify.Utils.loadCurrentSession(req, res, true);

  let shop = req.query.shop;

  if (session && shop && session.shop !== shop) {
    // The current request is for a different shop. Redirect gracefully.
    return res.redirect(`/auth?shop=${shop}`);
  }

  if (session?.isActive()) {
    try {
      // make a request to make sure oauth has succeeded, retry otherwise
      const client = new Shopify.Clients.Graphql(
        session.shop,
        session.accessToken
      );
      await client.query({ data: TEST_GRAPHQL_QUERY });
      return;
    } catch (e) {
      if (
        e instanceof Shopify.Errors.HttpResponseError &&
        e.response.code === 401
      ) {
        // We only want to catch 401s here, anything else should bubble up
      } else {
        throw e;
      }
    }
  }

  res.redirect(`/auth?shop=${shop}`);
}

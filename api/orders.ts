import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import axios from "axios";
import { verifyRequest } from "./middleware/verify-request";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import { Order } from "@shopify/shopify-api/dist/rest-resources/2022-04";

const ApiKey = "x9gJM-nA.xhPMI8KSX_-CY8fWUdUIP0_-4WGqW0N1" as const;

axios.defaults.baseURL = "https://sandbox.finmid.com";
axios.defaults.headers.common["X-API-KEY"] = ApiKey;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  verifyRequest(req, res);

  const session = await Shopify.Utils.loadCurrentSession(req, res, true);

  const allOrders = await Order.all({ session });
  // console.log("ORDERS", allOrders);
  res.status(200).send(allOrders);
}

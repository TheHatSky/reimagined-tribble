import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { Buyer } from "./types";
import axios from "axios";
import { verifyRequest } from "./middleware/verify-request";
import Shopify, { ApiVersion } from "@shopify/shopify-api";

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

  const buyer = req.body as Buyer;
  console.log("POST BUYER", buyer);

  try {
    await axios.post("/api/v1/buyers", buyer);

    console.log("BUYER CREATED", buyer);
    res.status(200).send(null);
  } catch (e) {
    console.log("error", e.response.data);
    res.status(500).send(null);
  }
}

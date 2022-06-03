import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import { Buyer } from "./types";
import axios from "axios";
import { verifyRequest } from "./middleware/verify-request";

const ApiKey = "x9gJM-nA.xhPMI8KSX_-CY8fWUdUIP0_-4WGqW0N1" as const;

axios.defaults.baseURL = "https://sandbox.finmid.com";
axios.defaults.headers.common["X-API-KEY"] = ApiKey;

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

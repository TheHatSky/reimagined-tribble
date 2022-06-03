import { resolve } from "path";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { Shopify, ApiVersion } from "@shopify/shopify-api";
import {
  Product,
  Order,
} from "@shopify/shopify-api/dist/rest-resources/2022-04";
import "dotenv/config";
import {
  Buyer,
  PaymentIntent,
  PaymentIntentCheck,
  PaymentIntentResponse,
} from "./types";
import axios from "axios";

const ApiKey = "x9gJM-nA.xhPMI8KSX_-CY8fWUdUIP0_-4WGqW0N1" as const;

axios.defaults.baseURL = "https://sandbox.finmid.com";
axios.defaults.headers.common["X-API-KEY"] = ApiKey;

import applyAuthMiddleware from "./middleware/auth";
import verifyRequest from "./middleware/verify-request";

const USE_ONLINE_TOKENS = true;
const TOP_LEVEL_OAUTH_COOKIE = "shopify_top_level_oauth";

const PORT = parseInt(process.env.PORT || "8081", 10);
const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;

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

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};
Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED", {
  path: "/webhooks",
  webhookHandler: async (topic, shop, body) => {
    delete ACTIVE_SHOPIFY_SHOPS[shop];
  },
});

// export for test use only
export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production"
) {
  const app = express();
  app.set("top-level-oauth-cookie", TOP_LEVEL_OAUTH_COOKIE);
  app.set("active-shopify-shops", ACTIVE_SHOPIFY_SHOPS);
  app.set("use-online-tokens", USE_ONLINE_TOKENS);

  app.use(cookieParser(Shopify.Context.API_SECRET_KEY));
  app.use(bodyParser.json());

  applyAuthMiddleware(app);

  app.post("/webhooks", async (req, res) => {
    try {
      await Shopify.Webhooks.Registry.process(req, res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
      if (!res.headersSent) {
        res.status(500).send(error.message);
      }
    }
  });

  app.post("/buyer", verifyRequest(app), async (req, res) => {
    const buyer = req.body as Buyer;
    console.log("POST BUYER", buyer);

    try {
      await axios.post("/api/v1/buyers", buyer);

      console.log("BUYER CREATED", buyer);
      res.status(200).send();
    } catch (e) {
      console.log("error", e.response.data);
      res.status(500).send();
    }
  });

  app.get("/buyer", verifyRequest(app), async (req, res) => {
    const id = req.query.id;

    console.log("GET BUYER", id);

    try {
      const { data: buyer } = await axios.get<Buyer>(`/api/v1/buyers/${id}`);

      console.log("BUYER", id, buyer);
      res.status(200).send(buyer);
    } catch (e) {
      // console.log("error", e);
      res.status(200).send(null);
    }
  });

  app.post("/payment-intents/check", verifyRequest(app), async (req, res) => {
    const intents = req.body as {
      seller_ids: string[];
      total_amount: number;
      currency: "EUR";
      payment_config_id: string;
      buyer_id: string;
    };
    console.log("payment-intents check", intents);

    try {
      const { data } = await axios.post<PaymentIntentCheck>(
        "/api/v1/payment-intents/check",
        intents
      );

      console.log("PaymentIntentCheck", data);
      res.status(200).send(data);
    } catch (e) {
      console.log("error", e.response.data);
      res.status(500).send(null);
    }
  });

  app.post("/payment-intents", verifyRequest(app), async (req, res) => {
    const intents = req.body as PaymentIntent;
    console.log("payment-intent", intents);

    try {
      const { data } = await axios.post<PaymentIntentCheck>(
        "/api/v1/payment-intents",
        intents
      );

      console.log("PaymentIntent", data);
      res.status(200).send(data);
    } catch (e) {
      console.log("error", e.response.data);
      res.status(500).send(null);
    }
  });

  app.get("/payment-intents/list", verifyRequest(app), async (req, res) => {
    try {
      const {
        data: { data },
      } = await axios.get<{ data: PaymentIntentResponse[] }>(
        "/api/v1/payment-intents/list?from=2000-01-01&to=2222-01-02&limit=100"
      );

      console.log("PaymentIntents", data);
      res.status(200).send(data);
    } catch (e) {
      console.log("error", e.response.data);
      res.status(500).send(null);
    }
  });

  app.get("/orders", verifyRequest(app), async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, true);

    const allOrders = await Order.all({ session });
    // console.log("ORDERS", allOrders);
    res.status(200).send(allOrders);
  });

  app.get("/products-count", verifyRequest(app), async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res, true);

    // console.log("PRODUCTS", await Product.all({ session }));
    const countData = await Product.count({ session });
    res.status(200).send(countData);
  });

  app.post("/graphql", verifyRequest(app), async (req, res) => {
    try {
      const response = await Shopify.Utils.graphqlProxy(req, res);
      res.status(200).send(response.body);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.use(express.json());

  app.use((req, res, next) => {
    const shop = req.query.shop;
    if (Shopify.Context.IS_EMBEDDED_APP && shop) {
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors https://${shop} https://admin.shopify.com;`
      );
    } else {
      res.setHeader("Content-Security-Policy", `frame-ancestors 'none';`);
    }
    next();
  });

  app.use("/*", (req, res, next) => {
    const { shop } = req.query;

    // Detect whether we need to reinstall the app, any request from Shopify will
    // include a shop in the query parameters.
    if (
      typeof shop === "string" &&
      app.get("active-shopify-shops")[shop] === undefined &&
      shop
    ) {
      res.redirect(
        `/auth?${new URLSearchParams(
          req.query as Record<string, any>
        ).toString()}`
      );
    } else {
      next();
    }
  });

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    vite = await import("vite").then(({ createServer }) =>
      createServer({
        root,
        logLevel: isTest ? "error" : "info",
        server: {
          port: PORT,
          hmr: {
            protocol: "ws",
            host: "localhost",
            port: 64999,
            clientPort: 64999,
          },
          middlewareMode: "html",
        },
      })
    );
    app.use(vite.middlewares);
  } else {
    const compression = await import("compression").then(
      ({ default: fn }) => fn
    );
    const serveStatic = await import("serve-static").then(
      ({ default: fn }) => fn
    );
    const fs = await import("fs");
    app.use(compression());
    app.use(serveStatic(resolve("dist/client")));
    app.use("/*", (req, res, next) => {
      // Client-side routing will pick up on the correct route to render, so we always render the index here
      res
        .status(200)
        .set("Content-Type", "text/html")
        .send(fs.readFileSync(`${process.cwd()}/dist/client/index.html`));
    });
  }

  return { app, vite };
}

if (!isTest) {
  createServer().then(({ app }) => app.listen(PORT));
}

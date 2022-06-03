import React from "react";
import { useEffect, useState, useCallback } from "react";
import { Button, DataTable, Link, List } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import type { Order } from "@shopify/shopify-api/dist/rest-resources/2022-04";
import { CreateBuyer } from "./CreateBuyer";

import { userLoggedInFetch } from "../App";
import { PaymentIntentCheck, PaymentIntentResponse } from "../../server/types";
import { IntentCheck } from "./IntentCheck";
import { IntentAction } from "./IntentAction";

const formatCurrency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
}).format;

export function OrdersList() {
  const [sortedRows, setSortedRows] = useState(null);

  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [intentCheck, setIntentCheck] = useState<PaymentIntentCheck>(null);

  const [intents, setIntents] = useState<PaymentIntentResponse[]>(null);

  const app = useAppBridge();
  const fetch = userLoggedInFetch(app);

  const updateOrders = useCallback(async () => {
    await fetch("/orders")
      .then((res) => res.json())
      .then(setOrders);
  }, []);

  useEffect(() => {
    updateOrders();
  }, [updateOrders]);

  useEffect(() => {
    fetch("/payment-intents/list")
      .then((r) => r.json())
      .then(setIntents);
  }, []);

  const initiallySortedRows = orders.map((order) => [
    order.id,
    <Link
      url={`https://reimagined-tribble-store.myshopify.com/admin/customers/${order.customer.id}`}
    >
      {order.customer.first_name} {order.customer.last_name}
    </Link>,
    <List>
      {order.line_items.map((i) => (
        <List.Item key={i.id.toString()}>
          {i.name} x{i.quantity}
        </List.Item>
      ))}
    </List>,
    formatCurrency(Number(order.total_price)),
    order.gateway,
    intents == null ? (
      "..."
    ) : intents.map((i) => i.id).includes(order.id.toString()) ? (
      <IntentAction
        intent={intents.find((i) => i.id === order.id.toString())}
      />
    ) : (
      <Button
        primary
        onClick={() => {
          console.log(
            "create payment intent",
            order.id,
            order.total_price,
            order.currency
          );
          setSelectedOrder(order);
        }}
      >
        Create payment intent
      </Button>
    ),
  ]);

  const rows = sortedRows ? sortedRows : initiallySortedRows;

  return (
    <>
      <DataTable
        columnContentTypes={["text", "text", "text", "numeric", "text", "text"]}
        headings={[
          "Id",
          "Customer",
          "Products",
          "Price",
          "Payment method",
          "Actions",
        ]}
        rows={rows}
      />
      {selectedOrder != null && intentCheck == null && (
        <CreateBuyer
          customer={selectedOrder.customer}
          onClose={() => {
            console.log("close buyer popup");
          }}
          onConfirm={async (buyer) => {
            await fetch("/payment-intents/check", {
              method: "POST",
              body: JSON.stringify({
                seller_ids: ["seller-123"],
                buyer_id: buyer.id,
                currency: selectedOrder.currency,
                total_amount: selectedOrder.total_price,
                payment_config_id: "2bbf04b5-6fff-499c-8803-a2ada7425865",
              }),
              headers: {
                "Content-Type": "application/json",
              },
            })
              .then((r) => r.json())
              .then(setIntentCheck);
          }}
        />
      )}
      {intentCheck != null && selectedOrder != null && (
        <IntentCheck
          intentCheck={intentCheck}
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setIntentCheck(null);
            updateOrders();
          }}
        />
      )}
    </>
  );
}

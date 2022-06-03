import { useAppBridge } from "@shopify/app-bridge-react";
import {
  DataTable,
  Heading,
  Modal,
  Stack,
  TextContainer,
} from "@shopify/polaris";
import { Order } from "@shopify/shopify-api/dist/rest-resources/2022-04";
import React, { useState } from "react";
import { PaymentIntent, PaymentIntentCheck } from "../../server/types";
import { userLoggedInFetch } from "../App";
import currency from "currency.js";
import { format } from "date-fns";

const formatCurrency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
}).format;

interface Props {
  onClose: () => void;
  intentCheck: PaymentIntentCheck;
  order: Order;
}

const paymentMethod = {
  "finmid TBL - BNPL 30 Days": "30D_SCT",
  "finmid TBL - BNPL 60 Days": "60D_SCT",
  "finmid TBL - BNPL 90 Days": "90D_SCT",
};

export const IntentCheck = ({ onClose, intentCheck, order }: Props) => {
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);

  const app = useAppBridge();
  const fetch = userLoggedInFetch(app);

  const { eligible, decline_reason, repayment_methods, due_date } = intentCheck;

  const repayment =
    repayment_methods != null
      ? repayment_methods.find((p) => p.id === paymentMethod[order.gateway])
      : null;

  const payment: PaymentIntent = {
    buyer_id: order.customer.id.toString(),
    currency: order.currency,
    id: order.id.toString(),
    repayment_method_id: repayment?.id,
    payment_config_id: "2bbf04b5-6fff-499c-8803-a2ada7425865",
    total_amount: order.total_price,

    order_details: order.line_items.map((i) => ({
      seller_id: "seller-123",
      line_item: {
        id: i.id.toString(),
        total_price: currency(i.price.toString())
          .multiply(Number(i.quantity))
          .toString(),
        name: i.name.toString(),
      },
    })),
  };

  return (
    <div style={{ height: "500px" }}>
      <Modal
        open={active}
        onClose={() => {
          setActive(false);
          onClose();
        }}
        title="Intent check"
        primaryAction={{
          content: "Confirm",
          loading: loading,
          onAction: async () => {
            console.log("INTENT CONFIRMED", payment);

            setLoading(true);

            await fetch("api/payment-intents", {
              method: "POST",
              body: JSON.stringify(payment),
              headers: {
                "Content-Type": "application/json",
              },
            });

            setLoading(false);

            console.log("Hooray!", payment);

            onClose();
          },
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: onClose,
          },
        ]}
      >
        <Modal.Section>
          <Stack vertical>
            {eligible && repayment != null ? (
              <Stack.Item>
                <TextContainer>
                  <Heading>Looking good!</Heading>

                  <p>Here is amount detalisation</p>

                  <p>
                    Payment option: {repayment.id} ({repayment.type})
                  </p>

                  <p>
                    Due date:{" "}
                    {due_date != null && format(new Date(due_date), "PPP")}
                  </p>
                </TextContainer>

                <DataTable
                  columnContentTypes={["text", "numeric"]}
                  headings={["", "Amount"]}
                  rows={[
                    [
                      "Original cost",
                      formatCurrency(
                        Number(repayment.amount_details.original_amount)
                      ),
                    ],
                    [
                      "Platform fees",
                      formatCurrency(
                        Number(repayment.amount_details.platform_fee_amount)
                      ),
                    ],
                    [
                      "Buyer fees",
                      formatCurrency(
                        Number(repayment.amount_details.buyer_fee_amount)
                      ),
                    ],
                  ]}
                  totals={[
                    "",
                    formatCurrency(
                      Number(repayment.amount_details.original_amount) +
                        Number(repayment.amount_details.platform_fee_amount) +
                        Number(repayment.amount_details.buyer_fee_amount)
                    ),
                  ]}
                  showTotalsInFooter
                />
              </Stack.Item>
            ) : (
              <Stack.Item>
                <TextContainer>
                  <Heading>Oof!</Heading>

                  <p>I'm sorry Dave, I'm afraid I can't do that</p>

                  <p>Decline reason: {decline_reason}</p>
                </TextContainer>
              </Stack.Item>
            )}
          </Stack>
        </Modal.Section>
      </Modal>
    </div>
  );
};

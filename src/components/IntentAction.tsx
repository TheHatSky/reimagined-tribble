import { Button } from "@shopify/polaris";
import React, { FC } from "react";
import { PaymentIntentResponse } from "../../server/types";

interface Props {
  intent: PaymentIntentResponse;
}

export const IntentAction: FC<Props> = ({ intent: { status } }) => {
  switch (status) {
    case "CANCELLED":
      return <>Cancelled</>;
    case "PENDING_REPAYMENT":
      return <>Pending repayment</>;
    case "CLOSED":
      return <>Closed</>;
    case "PROCESSING":
      return <>Processing</>;
    case "PENDING":
      return <Button onClick={() => {}}>Capture</Button>;
  }

  return null;
};

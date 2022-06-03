export interface Address {
  address_line_1: string;
  address_line_2: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface Buyer {
  status?: string;
  id: string;
  legal_name: string;
  business_form: string;
  business_registration_number: string;
  email: string;
  legal_address: Address;
  // order_history: {total_amount: '1000.00'}
}

export interface PaymentIntentCheck {
  eligible: boolean;
  decline_reason?: string;
  repayment_methods: {
    id: string;
    type: string;
    amount: string;
    amount_details: {
      original_amount: string;
      platform_fee_amount: string;
      buyer_fee_amount: string;
    };
  }[];
  currency: "EUR";
  due_date?: string;
}

export interface PaymentIntent {
  id: string;
  payment_config_id: string;
  repayment_method_id: string;
  buyer_id: string;
  currency: string; //"EUR";
  total_amount: string;

  order_details: {
    seller_id: string;
    line_item: {
      id: string;
      total_price: string | number;

      name?: string;
      description?: string;
      category?: string;
      item_url?: string;
    };
  }[];

  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  id: string;
  status:
    | "PENDING"
    | "PROCESSING"
    | "CAPTURED"
    | "PENDING_REPAYMENT"
    | "CANCELLED"
    | "CLOSED";
  order_id: string;
}

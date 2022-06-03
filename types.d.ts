interface Address {
  address_line_1: string;
  address_line_2: string;
  city: string;
  postal_code: string;
  country: string;
}

interface Buyer {
  id: string;
  legal_name: string;
  business_form: string;
  business_registration_number: string;
  email: string;
  legal_address: Address;
  // order_history: {total_amount: '1000.00'}
}

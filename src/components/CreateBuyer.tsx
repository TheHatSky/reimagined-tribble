import {
  Modal,
  Stack,
  TextContainer,
  TextField,
  Heading,
  Select,
} from "@shopify/polaris";
import type { Customer } from "@shopify/shopify-api/dist/rest-resources/2022-04";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import en from "i18n-iso-countries/langs/en.json";
import { registerLocale, alpha2ToAlpha3, getNames } from "i18n-iso-countries";
import { userLoggedInFetch } from "../App";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Buyer } from "../../server/types";

registerLocale(en);

interface Props {
  onClose: () => void;
  customer: Customer | { [key: string]: any };
  onConfirm: (buyer: Buyer) => void;
}

const legalForms = [
  {
    value: "GMBH",
    label: "GmbH",
  },
  {
    value: "UG",
    label: "UG",
  },
  {
    value: "EG",
    label: "EG",
  },
];

export const CreateBuyer = ({ customer, onClose, onConfirm }: Props) => {
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const { id, email, default_address } = customer;

  const [buyer, setBuyer] = useState<Buyer>({
    id: customer.id.toString(),
    business_form: legalForms[0].value,
    legal_name: default_address.company ?? "",
    business_registration_number: "",
    email: customer.email,
    legal_address: {
      address_line_1: default_address.address1 as string,
      address_line_2: default_address.address2 as string,
      city: default_address.city as string,
      postal_code: default_address.zip as string,
      country:
        default_address.country_code != null &&
        default_address.country_code !== ""
          ? alpha2ToAlpha3(default_address.country_code)
          : "DEU",
    },
  });

  const app = useAppBridge();
  const fetch = userLoggedInFetch(app);

  useEffect(() => {
    fetch("api/buyer?id=" + id)
      .then((res) => res.json())
      .then((b) => (b != null ? setBuyer(b) : undefined));
  }, []);

  const toggleModal = useCallback(() => setActive((active) => !active), []);

  const countries = useMemo(
    () =>
      Object.entries(getNames("en", { select: "official" })).map(
        ([a2, name]) => ({
          label: name,
          value: alpha2ToAlpha3(a2),
        })
      ),
    []
  );

  return (
    <div style={{ height: "500px" }}>
      <Modal
        open={active}
        onClose={() => {
          toggleModal();
          onClose();
        }}
        title="Confirm buyer's data"
        primaryAction={{
          content: "Confirm",
          loading: loading,
          onAction: async () => {
            console.log("BUYER CONFIRMED", buyer);

            setLoading(true);
            const { status, ...restBuyer } = buyer;
            await fetch("api/buyer", {
              method: "POST",
              body: JSON.stringify(restBuyer),
              headers: {
                "Content-Type": "application/json",
              },
            });

            setLoading(false);

            console.log("Pushed a buyer with id", buyer.id);

            onConfirm(buyer);
            onClose();
          },
        }}
        secondaryActions={[
          {
            content: "Close",
            onAction: toggleModal,
          },
        ]}
      >
        <Modal.Section>
          <Stack vertical>
            <Stack.Item>
              <TextContainer>
                <p>Please fill this info, yeah</p>
              </TextContainer>
            </Stack.Item>
            <Stack.Item fill>
              <TextField
                label="Legal name"
                value={buyer.legal_name}
                onChange={(value) =>
                  setBuyer((b) => ({ ...b, legal_name: value }))
                }
                autoComplete="off"
              />
            </Stack.Item>
            <Stack.Item fill>
              <Select
                label="Legal form"
                options={legalForms}
                value={buyer.business_form}
                onChange={(value) =>
                  setBuyer((b) => ({ ...b, business_form: value }))
                }
              />
            </Stack.Item>
            <Stack.Item fill>
              <TextField
                label="Registration number"
                value={buyer.business_registration_number}
                onChange={(value) =>
                  setBuyer((b) => ({
                    ...b,
                    business_registration_number: value,
                  }))
                }
                autoComplete="off"
              />
            </Stack.Item>
            <Stack.Item>
              <TextContainer>
                <Heading>Legal address</Heading>
              </TextContainer>
            </Stack.Item>
            <Stack.Item fill>
              <Select
                label="Country"
                options={countries}
                value={buyer.legal_address.country}
                onChange={(value) =>
                  setBuyer((b) => ({
                    ...b,
                    legal_address: { ...b.legal_address, country: value },
                  }))
                }
              />
            </Stack.Item>
            <Stack>
              <Stack.Item>
                <TextField
                  label="City"
                  value={buyer.legal_address.city}
                  onChange={(value) =>
                    setBuyer((b) => ({
                      ...b,
                      legal_address: { ...b.legal_address, city: value },
                    }))
                  }
                  autoComplete="off"
                />
              </Stack.Item>

              <Stack.Item>
                <TextField
                  label="Postal code"
                  value={buyer.legal_address.postal_code}
                  onChange={(value) =>
                    setBuyer((b) => ({
                      ...b,
                      legal_address: { ...b.legal_address, postal_code: value },
                    }))
                  }
                  autoComplete="off"
                />
              </Stack.Item>
            </Stack>
            <Stack.Item fill>
              <TextField
                label="Address line 1"
                value={buyer.legal_address.address_line_1}
                onChange={(value) =>
                  setBuyer((b) => ({
                    ...b,
                    legal_address: {
                      ...b.legal_address,
                      address_line_1: value,
                    },
                  }))
                }
                autoComplete="off"
              />
            </Stack.Item>
            <Stack.Item fill>
              <TextField
                label="Address line 2"
                value={buyer.legal_address.address_line_2}
                onChange={(value) =>
                  setBuyer((b) => ({
                    ...b,
                    legal_address: {
                      ...b.legal_address,
                      address_line_2: value,
                    },
                  }))
                }
                autoComplete="off"
              />
            </Stack.Item>
          </Stack>
        </Modal.Section>
      </Modal>
    </div>
  );
};

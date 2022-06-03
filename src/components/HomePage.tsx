import React from "react";
import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Heading,
} from "@shopify/polaris";

import trophyImgUrl from "../assets/home-trophy.png";

import { ProductsCard } from "./ProductsCard";
import { OrdersList } from "./OrdersList";

export function HomePage() {
  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Stack.Item fill>
                <TextContainer spacing="loose">
                  <Heading>Here's a list of recent orders</Heading>
                </TextContainer>

                <OrdersList />
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

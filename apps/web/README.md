This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sign in and run the frontend

Run the API on port `3000`, then run the frontend on port `3001` to match the
API's local CORS configuration:

```powershell
npm --prefix apps/web-next run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001) to sign in using an
existing account. Internal staff accounts are managed by the project seed and
local environment configuration. The default API URL is `http://localhost:3000`;
set `NEXT_PUBLIC_API_URL` if the API runs at a different address.

## Staff screens

Staff can sign in from the staff role on the home page or directly at
`/staff/login`. After login, the app opens `/staff/orders`, which uses the
verified staff session to call `GET /staff/orders` and `GET /staff/orders/:id`.
Select an order to review its items, options, payment attempts, and available
status actions. The frontend refreshes order data from the API after an update.
Staff API routes require a valid JWT with role `STAFF`.

To check the API with Thunder Client, sign in through `POST /auth/staff/login`,
then send its returned bearer token to `GET /staff/orders`,
`GET /staff/orders/:id`, or `PATCH /staff/orders/:id/status`. For the PATCH
request, use a workflow-valid body such as `{"status":"PREPARING"}`. Missing,
expired, or non-STAFF tokens are rejected by the backend.

## Manager order details

The manager detail screen at `/manager/orders/:id` continues to use the manager
access token and `GET /manager/orders/:id`. Manager order, product, and report
screens remain available through their existing routes.

## Manager screens

After signing in with an existing MANAGER account, use the navigation links to
open:

- `/manager/orders` for the live order list, status filtering, order-ID search,
  order details, and permitted status changes.
- `/manager/products` to create and edit drinks and options, or hide/show them.
- `/manager/reports` to request sales and payment counts for an inclusive date
  range.

The screens call the API with the access token from the existing login session;
they do not contain a token or substitute mock data. Start the API and frontend
as shown above, then sign in through the existing staff login. The API default
is `http://localhost:3000`; set `NEXT_PUBLIC_API_URL` in the frontend
environment when it runs elsewhere. Manager API routes require a valid JWT
with role `MANAGER`.

## Customer ordering

Open `/customer/menu` to view drinks and options from the public product API.
Select a drink to choose its available options, then use `/customer/cart` to
adjust quantities and create an order. The server calculates the final price
and checks stock. Sign in at `/customer/login`; order history and tracking are
available at `/customer/orders` and `/customer/orders/:id`.

Customer order creation, order history, order details, cancellation, and mock
payment require a customer JWT. The browser sends the current session token;
no token is stored in source code. Registration OTP is a local testing feature
printed by the API in non-production mode, not a real SMS. The checkout offers
simulated card/wallet results only; no real payment gateway is connected.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

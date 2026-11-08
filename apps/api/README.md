<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Customer APIs

The public menu is available without a token. Customer order and payment APIs
require a JWT returned by `POST /auth/customers/login` and the `CUSTOMER` role.
The customer ID is read from the verified JWT; do not send a `customerId` in
order requests.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/customers/register/request-otp` | Public | Request registration OTP with `displayName`, `phone`, and `password`. |
| `POST` | `/auth/customers/register/verify-otp` | Public | Verify registration using `phone` and `otp`. |
| `POST` | `/auth/customers/login` | Public | Sign in using `phone` and `password`; returns a customer access token. |
| `GET` | `/products` | Public | List drinks currently for sale and available options. |
| `GET` | `/products/:id` | Public | Read one drink and its available options. |
| `POST` | `/orders` | `CUSTOMER` | Create an order. Body: `{"items":[{"productId":"<uuid>","quantity":1,"optionIds":[]}],"paymentMethod":"CARD"}`. |
| `GET` | `/orders` | `CUSTOMER` | List the signed-in customer's orders. |
| `GET` | `/orders/:id` | `CUSTOMER` | Read a customer-owned order and payment attempts. |
| `PATCH` | `/orders/:id/cancel` | `CUSTOMER` | Cancel an order while its current status allows cancellation. |
| `POST` | `/payments/:id/mock-result?success=true` | `CUSTOMER` | Simulate successful payment for an owned payment. Use `success=false` to simulate failure. |

The server validates product and option IDs, availability, quantities, prices,
and stock; it calculates the final total from the database. Registration OTPs
are printed to the API terminal only in non-production environments for local
testing; this does not send an SMS. Payment is also simulated and does not
charge money.

The customer checkout reserves inventory. Before using this version with an
existing database, apply the new migration
`src/database/migrations/1794081600000-AddStockReservationToOrders.ts` through
the project's migration process. It has not been run automatically; TypeORM
`synchronize` remains disabled.

## Manager APIs

The manager endpoints use the existing access token returned by
`POST /auth/staff/login`. Send it as `Authorization: Bearer <accessToken>`.
Manager endpoints require the `MANAGER` role; the API enforces this with the
JWT and roles guards.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/manager/orders?status=CONFIRMED` | List orders, optionally filtered by order status; returns the latest payment status and safe customer fields. |
| `GET` | `/manager/orders/:id` | Read order details. |
| `PATCH` | `/manager/orders/:id/status` | Change status using the existing order workflow. Body: `{"status":"PREPARING"}`. |
| `GET` | `/manager/products` | List drinks including hidden items and their available/unavailable options. |
| `POST` | `/products` | Create a drink (existing manager-only endpoint). |
| `PATCH` | `/manager/products/:id` | Edit a drink or toggle `isAvailable`; hiding preserves order references. |
| `POST` | `/manager/products/:id/options` | Add a drink option. |
| `PATCH` | `/manager/products/:id/options/:optionId` | Edit an option or toggle `isAvailable`. |
| `GET` | `/manager/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD` | Get sales and order/payment counts for an inclusive UTC date range. |
| `GET` | `/staff/orders?status=CONFIRMED` | List staff orders with items/options and safe customer display name; defaults to orders needing processing. |
| `GET` | `/staff/orders/:id` | Read a staff order, items/options, safe customer display name, and payment attempts. |
| `PATCH` | `/staff/orders/:id/status` | Update a staff order through the valid workflow; body: `{"status":"PREPARING"}`. |

Product and option DTOs validate names, prices, quantities, enum values, and
availability. Drinks are not hard-deleted. Revenue includes only orders with
at least one `SUCCEEDED` payment; pending, failed, and unpaid order counts are
reported separately. These APIs use the existing schema and do not require a
database migration.

## Manager order management

Internal accounts log in through `POST /auth/staff/login` with `username` and
`password`. Order-management endpoints require the returned bearer access token
and the `MANAGER` role:

- `GET /manager/orders` lists orders; optionally filter with `?status=CONFIRMED`
  (valid values: `PENDING_PAYMENT`, `CONFIRMED`, `PREPARING`, `COMPLETED`,
  `CANCELLED`).
- `GET /manager/orders/:id` returns an order and its items and payment attempts.
- `PATCH /manager/orders/:id/status` accepts `{ "status": "PREPARING" }`.
  The processing flow is `CONFIRMED` → `PREPARING` → `COMPLETED`; orders can
  be cancelled before preparation.

The development seed creates internal accounts with usernames `staff` and
`manager`. Use the credentials configured for the local environment; the API
returns an access token and role, but never a password or password hash.

## Staff order handling

Internal staff sign in through `POST /auth/staff/login`. Send the returned
access token as `Authorization: Bearer <access-token>` to `/staff/orders`.
These endpoints require both `JwtAuthGuard` and `RolesGuard` and accept only
the `STAFF` role from the verified token. With no status filter, the list
contains `PENDING_PAYMENT`, `CONFIRMED`, and `PREPARING` orders, newest first.
An explicit status filter can also retrieve completed or cancelled orders.

Staff can move confirmed orders to preparation and preparing orders to
completed. Unprepared pending-payment or confirmed orders may be cancelled.
Only a successful payment moves an order to `CONFIRMED`; staff cannot mark a
payment successful or confirm an order manually. The API also verifies a
successful payment before allowing staff to start preparing an order. No schema
migration is needed.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It installs `@nestjs/observe`, wires it into `AppModule` and `main.ts`, and writes the app key and secret into `.env`, which every `nest start` script (`start`, `start:dev`, `start:debug`) then loads. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/sdk) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

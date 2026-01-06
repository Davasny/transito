# machin

Modern TypeScript state machines with first class persistency support.

## Getting started

- pnpm

```bash
pnpm add machin
```

- yarn

```bash
yarn add machin
```

- npm

```bash
npm install machin
```

## Usage

### drizzle with postgres

```typescript
// define schema
export const subscriptionsTable = pgTable("subscriptions", {
  /* fields required by machin */
  id: text()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  state: text().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),

  /* machine context */
  stripeCustomerId: text(),
});


// define machine config
import { machine } from "@/machine.js";

type SubContext = { stripeCustomerId: string | null };

export const subscribeMachineConfig = machine<SubContext>().define({
  initial: "inactive",
  states: {
    inactive: {
      on: {
        activate: {
          target: "activating",
        },
      },
    },
    activating: {
      entry: async (ctx, event: { stripeCustomerId: string }) => {
        console.log(`Activating subscription for customer: ${event.stripeCustomerId}`);

        // entry() method should return new context object
        return {
          ...ctx,
          stripeCustomerId: event.stripeCustomerId,
        };
      },
      onSuccess: {
        target: "active",
      },
      onError: {
        target: "activation_failed",
      },
    },
    activation_failed: {
      on: {
        retry: {
          target: "activating",
        },
      },
    },
    active: {
      on: {
        deactivate: {
          target: "inactive",
        },
      },
    },
  },
});


// bind machine to storage driver
const subscriptionMachine = withDrizzlePg(subscribeMachineConfig, {
  db,
  table: subscriptionsTable,
});

// get actor
const actor = await subscriptionMachine.createActor("subscriber-id", {
  stripeCustomerId: null,
});

// send event to actor
const activateResult = await actor.send("activate", {
  stripeCustomerId: "cus_123",
});
```

## Supported storage

### postgres via [drizzle](https://orm.drizzle.team/docs/get-started-postgresql)

```typescript
import { withDrizzlePg } from "machin/drizzle/pg";

const machine = withDrizzlePg(machineConfig, {
  db,
  table: machineTable,
});
```

### sqlite via [drizzle](https://orm.drizzle.team/docs/get-started-sqlite)

```typescript
import { withDrizzleSQLite } from "machin/drizzle/sqlite";

const machine = withDrizzleSQLite(machineConfig, {
  db,
  table: machineTable,
});
```

### redis via [node-redis](https://github.com/redis/node-redis)

```typescript
import { createClient } from "redis";
import { withRedis } from "machin/redis"

const client = await createClient({
  url: "redis://localhost:6379",
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

const subscriptionMachine = withRedis(subscribeMachineConfig, {
  client,
});
```

## License

MIT

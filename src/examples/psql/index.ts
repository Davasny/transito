import { v7 as uuidv7 } from "uuid";
import { withDrizzle } from "../../adapters/drizzle.js";
import { machine } from "../../machine.js";
import { db } from "./db.js";
import { subscriptionsTable } from "./schema.js";

type SubContext = { stripeCustomerId: string | null };

const submachineConfig = machine<SubContext>().define({
  initial: "inactive",
  context: { stripeCustomerId: null },
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
        console.log(
          `   ⚙️  [Actor Entry] Activating subscription for customer: ${event.stripeCustomerId}`,
        );
        return {
          ...ctx,
          stripeCustomerId: event.stripeCustomerId,
        };
      },
      onSuccess: {
        target: "active",
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

const subscriptionMachine = withDrizzle(submachineConfig, {
  db,
  table: subscriptionsTable,
});

const subscriberId = uuidv7();

console.log("\n🚀 Starting PostgreSQL Subscription State Machine Example\n");
console.log("━".repeat(60));

console.log("\n📦 Initializing actor...");
const actor = await subscriptionMachine.getOrCreateActor(subscriberId);

console.log(`✅ Actor spawned successfully`);
console.log(`   └─ Current state: "${actor.state}"`);
console.log(`   └─ Actor ID: "${subscriberId}"\n`);

console.log("━".repeat(60));
console.log("\n📨 Sending 'activate' event to actor...");
console.log(`   └─ Payload: { stripeCustomerId: "cus_456" }`);

const activateResult = await actor.send("activate", {
  stripeCustomerId: "cus_456",
});

console.log(`\n✅ Event processed successfully`);
console.log(`   └─ Previous state: "${actor.state}"`);
console.log(`   └─ New state: "${activateResult.state}"`);
console.log(`   └─ Context updated with customer ID\n`);

console.log("━".repeat(60));
console.log("\n🔌 Closing database connection...");

await db.$client.end();
console.log("✅ Database connection closed\n");

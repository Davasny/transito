CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"stripeCustomerId" text
);

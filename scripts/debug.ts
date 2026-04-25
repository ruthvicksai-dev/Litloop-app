import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT!);

async function run() {
    console.log("Fetching Admins from Convex...");
    const url = process.env.CONVEX_DEPLOYMENT;
    if (!url) throw new Error("Missing CONVEX_DEPLOYMENT");
    // We can't query "internal" from client.
}
run().catch(console.error);

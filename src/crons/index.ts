import cron from "node-cron";
import collections from "./collections";

export default function () {
  // Run when server starts
  collections().catch((e) => console.error("[CRON] collections", e));

  // Run Every Day at 12:00 AM
  cron.schedule("0 0 * * *", () => {
    collections().catch((e) => console.error("[CRON] collections", e));
  });
}

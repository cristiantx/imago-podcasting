import { Inngest } from "inngest";

import { getEnv } from "@/lib/config";

const env = getEnv();

export const inngest = new Inngest({
  id: "imago-podcasting",
  eventKey: env.INNGEST_EVENT_KEY
});

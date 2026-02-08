import { env } from "@protoburn/env/server";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

const db = drizzle(env.DB, { schema });

export default db;
export { schema };

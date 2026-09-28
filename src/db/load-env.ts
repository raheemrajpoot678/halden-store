// Loads env files for scripts that run outside Next.js (drizzle-kit, seed),
// with the same precedence as Next: .env.local wins over .env.
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

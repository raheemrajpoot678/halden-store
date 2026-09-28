// Test accounts created by `npm run db:seed` and shown on /sign-in outside
// production (or when NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true). Never real users.

export type DemoAccount = {
  label: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
};

export const demoAccounts: DemoAccount[] = [
  {
    label: "Customer",
    name: "Demo Customer",
    email: "demo@halden.test",
    password: "Halden-demo-1",
    role: "user",
  },
  {
    label: "Admin",
    name: "Halden Admin",
    email: "admin@halden.test",
    password: "Halden-admin-1",
    role: "admin",
  },
];

export const showDemoAccounts =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true";

import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard-home";

export const metadata: Metadata = {
  title: "Översikt",
  description:
    "Din personliga översikt: planstatus, poängprognos och nästa uppgift i veckoplanen.",
};

export default function Home() {
  return <DashboardHome />;
}

import type { Metadata } from "next";
import { StudiehjalpAdmin } from "@/components/studiehjalp/admin";

export const metadata: Metadata = {
  title: "Studiehjälp – admin",
  robots: { index: false, follow: false },
};

export default function StudiehjalpAdminPage() {
  return <StudiehjalpAdmin />;
}

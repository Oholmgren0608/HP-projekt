import type { Metadata } from "next";
import { ForumHub } from "@/components/forum/forum-hub";

export const metadata: Metadata = {
  title: "Forum",
  description:
    "Ställ frågor om uppgifter du tycker är svåra och få förklaringar av andra användare.",
};

export default function ForumPage() {
  return <ForumHub />;
}

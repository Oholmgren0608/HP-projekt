import type { Metadata } from "next";
import { AvatarReview } from "@/components/avatar-review";

export const metadata: Metadata = {
  title: "Granska profilbilder",
  robots: { index: false, follow: false },
};

export default function AvatarReviewPage() {
  return <AvatarReview />;
}

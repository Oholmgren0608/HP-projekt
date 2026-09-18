import type { Metadata } from "next";
import { ReviewScreen } from "./review-screen";

export const metadata: Metadata = {
  title: "Granska utkast — HP Lift",
};

export default function ReviewPage() {
  return <ReviewScreen />;
}

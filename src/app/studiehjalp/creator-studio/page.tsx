import type { Metadata } from "next";
import { CreatorStudio } from "@/components/studiehjalp/creator-studio";

export const metadata: Metadata = {
  title: "Creator Studio",
};

export default function CreatorStudioPage() {
  return <CreatorStudio />;
}

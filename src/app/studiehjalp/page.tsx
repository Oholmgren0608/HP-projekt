import type { Metadata } from "next";
import { StudiehjalpHub } from "@/components/studiehjalp/hub";

export const metadata: Metadata = {
  title: "Studiehjälp",
  description: "Hitta en granskad expert inom ett delprov på högskoleprovet, eller bli expert själv.",
};

export default function StudiehjalpPage() {
  return <StudiehjalpHub />;
}

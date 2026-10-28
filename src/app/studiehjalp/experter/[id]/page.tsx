import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExpertProfileView } from "@/components/studiehjalp/expert-profile";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
  title: "Expert",
};

export default async function ExpertPage(props: PageProps<"/studiehjalp/experter/[id]">) {
  const { id } = await props.params;
  if (!UUID_RE.test(id)) {
    notFound();
  }
  return <ExpertProfileView publicId={id.toLowerCase()} />;
}

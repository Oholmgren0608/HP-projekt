import { DuelHub } from "@/components/duel/duel-hub";

export default async function DuelPage(props: PageProps<"/duell">) {
  const searchParams = await props.searchParams;
  const kod =
    typeof searchParams.kod === "string" ? searchParams.kod : "";

  return <DuelHub initialCode={kod} />;
}

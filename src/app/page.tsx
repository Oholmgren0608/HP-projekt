import { HomeContent } from "@/components/home-content";
import { PlanProvider } from "@/components/plan-context";

export default function Home() {
  return (
    <PlanProvider>
      <HomeContent />
    </PlanProvider>
  );
}

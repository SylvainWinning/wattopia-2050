import BlackoutApp from "@/components/BlackoutApp";
import { withFallbackLabel } from "@/lib/live-mix";

export default function Home() {
  return <BlackoutApp initialSnapshot={withFallbackLabel("chargement initial")} />;
}

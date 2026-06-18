import WattopiaApp from "@/components/WattopiaApp";
import { withFallbackLabel } from "@/lib/live-mix";

export default function Home() {
  return <WattopiaApp initialSnapshot={withFallbackLabel("chargement initial")} />;
}

import WattopiaApp from "@/components/WattopiaApp";
import { fetchLiveMixSnapshot } from "@/lib/fetch-live-mix";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const demoParam = params?.demo;
  const initialSnapshot = await fetchLiveMixSnapshot(demoParam === "1");

  return <WattopiaApp initialSnapshot={initialSnapshot} />;
}

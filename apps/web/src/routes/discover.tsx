import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "@/features/prospect/discover";
export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover opportunities — ProspectAI" }, { name: "description", content: "Continue your goal and explore relevant sample opportunities in ProspectAI." }, { property: "og:title", content: "Discover opportunities — ProspectAI" }, { property: "og:description", content: "Discover, review, and prepare for sample opportunities." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: DiscoverPage,
});

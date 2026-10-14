import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/prospect/entry";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ProspectAI — Find what’s next" }, { name: "description", content: "Discover relevant opportunities, prepare your next move, and keep important moments in view with ProspectAI." }, { property: "og:title", content: "ProspectAI — Find what’s next" }, { property: "og:description", content: "An opportunity agent for discovery, preparation and follow-through." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: LandingPage,
});

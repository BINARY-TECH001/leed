import { createFileRoute } from "@tanstack/react-router";
import { OpportunitiesPage } from "@/features/prospect/pages";
export const Route = createFileRoute("/opportunities/")({
  head: () => ({ meta: [{ title: "Opportunities — ProspectAI" }, { name: "description", content: "Browse and refine sample jobs, projects, leads, scholarships and grants in ProspectAI." }, { property: "og:title", content: "Opportunities — ProspectAI" }, { property: "og:description", content: "Explore opportunities and find your next step." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: OpportunitiesPage,
});

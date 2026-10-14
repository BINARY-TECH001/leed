import { createFileRoute, notFound } from "@tanstack/react-router";
import { OpportunityDetail } from "@/features/prospect/pages";
import { opportunities } from "@/features/prospect/data";
export const Route = createFileRoute("/opportunities/$id")({
  loader: ({ params }) => { const opportunity = opportunities.find(o => o.id === params.id); if (!opportunity) throw notFound(); return opportunity; },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title || "Opportunity"} — ProspectAI` }, { name: "description", content: loaderData?.overview || "Explore an opportunity on ProspectAI." }, { property: "og:title", content: `${loaderData?.title || "Opportunity"} — ProspectAI` }, { property: "og:description", content: loaderData?.overview || "Explore an opportunity on ProspectAI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <OpportunityDetail opportunity={Route.useLoaderData()} />,
});

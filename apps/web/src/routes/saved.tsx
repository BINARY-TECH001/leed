import { createFileRoute } from "@tanstack/react-router";
import { SavedPage } from "@/features/prospect/pages";
export const Route = createFileRoute("/saved")({ head: () => ({ meta: [{ title: "Saved opportunities — ProspectAI" }, { name: "description", content: "Review opportunities saved for a closer look." }, { property: "og:title", content: "Saved opportunities — ProspectAI" }, { property: "og:description", content: "Keep promising opportunities together." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: SavedPage });

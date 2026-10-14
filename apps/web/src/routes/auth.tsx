import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/prospect/entry";
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ProspectAI" }, { name: "description", content: "Enter the ProspectAI interactive preview with mock sign-in options." }, { property: "og:title", content: "Sign in — ProspectAI" }, { property: "og:description", content: "Explore ProspectAI with a quick mock sign-in." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

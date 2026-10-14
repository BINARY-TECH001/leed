import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/features/prospect/entry";
export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Your goals — ProspectAI" }, { name: "description", content: "Set a goal and personalize your ProspectAI interactive preview." }, { property: "og:title", content: "Your goals — ProspectAI" }, { property: "og:description", content: "Tell ProspectAI what you are looking for." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: OnboardingPage,
});

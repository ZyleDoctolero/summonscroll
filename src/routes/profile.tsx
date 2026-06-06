import { createFileRoute } from "@tanstack/react-router";
import html from "../screens/profile.html?raw";
import { Screen } from "../screens/Screen";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "SummonScroll - Player Profile" }] }),
  component: () => <Screen html={html} title="SummonScroll - Player Profile" />,
});

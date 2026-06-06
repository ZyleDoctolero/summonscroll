import { createFileRoute } from "@tanstack/react-router";
import html from "../screens/battle.html?raw";
import { Screen } from "../screens/Screen";

export const Route = createFileRoute("/_authenticated/battle")({
  head: () => ({ meta: [{ title: "SummonScroll - Battle Selection" }] }),
  component: () => <Screen html={html} title="SummonScroll - Battle Selection" />,
});

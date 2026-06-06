import { createFileRoute } from "@tanstack/react-router";
import html from "../screens/island.html?raw";
import { Screen } from "../screens/Screen";

export const Route = createFileRoute("/_authenticated/island")({
  head: () => ({ meta: [{ title: "SummonScroll - Island" }] }),
  component: () => <Screen html={html} title="SummonScroll - Island" />,
});

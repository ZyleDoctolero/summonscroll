import { createFileRoute } from "@tanstack/react-router";
import html from "../../screens/guild.html?raw";
import { Screen } from "../../screens/Screen";

export const Route = createFileRoute("/_authenticated/guild")({
  head: () => ({ meta: [{ title: "The Vanguard - Guild Dashboard" }] }),
  component: () => <Screen html={html} title="The Vanguard - Guild Dashboard" />,
});

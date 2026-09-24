import { Newspaper } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function NewsPage() {
  return <PlaceholderPage eyebrow="News" title="Keep a clear view of what is changing." description="The news layer will bring local updates into one calm, readable stream with source context and room for nuance." icon={Newspaper} nextStep="A reliable pulse for local information." />;
}

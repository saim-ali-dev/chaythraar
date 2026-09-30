import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui/loading-state";

export default function PlaceLoading() {
  return <AppShell><main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><LoadingState label="place details" /></main></AppShell>;
}
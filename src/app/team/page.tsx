import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { getSiteMedia } from "@/lib/supabase/site-media";

const teamMembers = [
  { name: "Saim Ali", mediaKey: "team_saim_ali", role: "Developer", description: "Primary development and technical implementation for CHAYTHRAAR, including platform architecture and full-stack delivery.", lead: true },
  { name: "Faizan Ali Haidar", mediaKey: "team_faizan_ali_haidar", role: "R/D", description: "Research and development support for archival content, local knowledge gathering, and cultural review.", lead: false },
  { name: "Hidayat Ali", mediaKey: "team_hidayat_ali", role: "R/D", description: "Research and development work focused on contextual documentation and content quality.", lead: false },
  { name: "Suhaib Nazir", mediaKey: "team_suhaib_nazir", role: "R/D", description: "Research and development support for local sourcing, validation, and cultural writing.", lead: false },
];

export default async function TeamPage() {
  const teamMedia = await getSiteMedia();

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          title="The GOTEI"
          description="The team behind CHAYTHRAAR."
          variant="operational"
        />
        <p className="-mt-4 mb-10 max-w-3xl text-sm leading-6 text-[var(--color-slate)] sm:text-base">
          CHAYTHRAAR is an AI-powered platform focused on preserving and making Chitral&apos;s local history, culture, heritage, language, and knowledge more accessible.
        </p>

        <section aria-label="Team members" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => {
            const media = teamMedia.find((item) => item.media_key === member.mediaKey);
            return (
            <Card key={member.name} className={`group flex min-w-0 flex-col overflow-hidden border-[var(--color-line)] bg-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-line-strong)] hover:shadow-[0_10px_28px_rgba(28,43,53,0.08)] motion-reduce:transition-none ${member.lead ? "border-t-2 border-t-[var(--color-copper)]" : ""}`}>
              <MediaFrame src={media?.image_url ?? null} alt={`Portrait of ${member.name}`} fallbackTitle={member.name} fallbackDetail={member.role} className="aspect-[3/4] border-b border-[var(--color-line)]" sizes="(max-width: 640px) 100vw, 25vw" />

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h2 className="min-w-0 break-words text-lg font-semibold text-[var(--color-ink)]">{member.name}</h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-copper-deep)]">{member.role}</p>
                {media?.image_credit && <p className="mt-2 text-xs text-[var(--color-muted)]">Image credit: {media.image_credit}</p>}
                <p className="mt-3 text-sm leading-6 text-[var(--color-slate)]">{member.description}</p>
              </div>
            </Card>
            );
          })}
        </section>

        <p className="mt-10 border-l-2 border-[var(--color-copper)] py-1 pl-4 text-sm leading-6 text-[var(--color-slate)]">
          Built with technology, research, and a commitment to preserving Chitral&apos;s knowledge.
        </p>
      </main>
    </AppShell>
  );
}
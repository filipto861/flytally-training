import { redirect } from "next/navigation";

import { TrainingDataControls } from "@/components/training-data-controls";
import { getTrainingPrivacySummary } from "@/lib/training-privacy";
import { getTrainingSession } from "@/lib/training-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account & data · FlyTally Training" };

export default async function AccountPage() {
  const session = await getTrainingSession();
  if (!session) redirect("/api/auth/flytally/start?next=/account");
  const summary = await getTrainingPrivacySummary(session.subject);
  return <main className="shell" style={{maxWidth:"900px",display:"grid",gap:"18px"}}>
    <section className="pilot-library-header">
      <p className="eyebrow">ACCOUNT & DATA</p>
      <h1>Training privacy controls</h1>
      <p>Export or delete learner progress stored by FlyTally Training. You can erase Training progress independently here. Deleting your main FlyTally account from Logbook also requests Training-progress erasure before Logbook disables the sign-in identity; Logbook record-retention rules remain described by the canonical Privacy notice.</p>
    </section>
    <section style={{background:"#fff",border:"1px solid #d9e0ea",borderRadius:"18px",padding:"20px",display:"grid",gap:"12px"}}>
      <h2 style={{margin:0}}>Server data</h2>
      <p style={{margin:0,color:"#667085"}}>{summary.progressEvents} progress events · {summary.aircraftStates} aircraft progress states{summary.lastResetAt?` · last reset ${new Date(summary.lastResetAt).toLocaleString("en-GB")}`:""}</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:"10px"}}>
        <a className="header-action" href="/api/account/export">Download Training data</a>
        <a className="header-action header-action-secondary" href="https://fly-tally.com/profile#privacy">Open main FlyTally account settings</a>
      </div>
    </section>
    <section style={{background:"#fff",border:"1px solid #d9e0ea",borderRadius:"18px",padding:"20px"}}>
      <TrainingDataControls/>
    </section>
  </main>;
}

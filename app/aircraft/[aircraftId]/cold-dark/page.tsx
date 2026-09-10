import { redirect } from "next/navigation";

export default async function ColdDarkPage({ params }: Readonly<{ params: Promise<{ aircraftId: string }> }>) {
  const { aircraftId } = await params;
  redirect(`/aircraft/${encodeURIComponent(aircraftId)}/checklists`);
}

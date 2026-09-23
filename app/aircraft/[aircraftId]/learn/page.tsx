import { redirect } from "next/navigation";

import { withVariantQuery } from "@/lib/aircraft-applicability";

export default async function LearnEntryPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ aircraftId: string }>;
  searchParams: Promise<{ variant?: string }>;
}>) {
  const [{ aircraftId }, { variant }] = await Promise.all([params, searchParams]);
  redirect(withVariantQuery(`/aircraft/${aircraftId}/training`, variant));
}

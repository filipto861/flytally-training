export {};

const isProductionDeployment = process.env.VERCEL_ENV === "production";
const isMainBranch = !process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF === "main";
const publicationCutoff = Date.parse("2026-09-14T00:00:00Z");

if (!isProductionDeployment || !isMainBranch || Date.now() >= publicationCutoff) {
  console.log("M27 production content publication skipped outside the one-time production release window.");
  process.exit(0);
}

if (!process.env.TRAINING_DATABASE_URL?.trim()) {
  throw new Error("TRAINING_DATABASE_URL is required for the M27 production content publication.");
}

const { publishStaticNativeModuleUpgrade } = await import("../lib/governed-static-bootstrap.ts");
const { sql } = await import("../lib/db.ts");

const aircraftId = "learjet-35-36";
const subject = "1";
const domains = ["performance", "limitations", "abnormal"] as const;

for (const domain of domains) {
  try {
    const versionId = await publishStaticNativeModuleUpgrade(aircraftId, domain, subject);
    console.log(`Published M27 ${domain} as governed version ${versionId}.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already matches the reviewed native seed")) {
      console.log(`M27 ${domain} already matches the reviewed native seed; no publication change required.`);
      continue;
    }
    throw error;
  }
}

const published = await sql`SELECT i.domain,v.version_no,v.state,v.payload->>'title' AS title
  FROM training_content_items i
  JOIN training_content_publications p ON p.item_id=i.item_id
  JOIN training_content_versions v ON v.version_id=p.version_id
  WHERE i.aircraft_id=${aircraftId}
    AND i.domain IN ('performance','limitations','abnormal')
  ORDER BY i.domain` as Array<{domain:string;version_no:number;state:string;title:string}>;

console.log("M27 production publication verified:", published);

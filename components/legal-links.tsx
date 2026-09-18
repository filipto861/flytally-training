const DEFAULT_LEGAL_BASE = "https://fly-tally.com/legal";

const links = [
  ["Privacy", "privacy"],
  ["Terms", "terms"],
  ["Cookies", "cookies"],
  ["Aviation safety", "aviation-safety"],
  ["Claims", "brand-claims"],
  ["Providers", "subprocessors"],
  ["Report", "report"],
] as const;

export function LegalLinks() {
  const base=(process.env.NEXT_PUBLIC_FLYTALLY_LEGAL_URL?.trim() || DEFAULT_LEGAL_BASE).replace(/\/$/,"");
  return <nav aria-label="FlyTally legal" style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",justifyContent:"flex-end"}}>
    {links.map(([label,path])=><a key={path} href={`${base}/${path}`} rel="noreferrer">{label}</a>)}
  </nav>;
}

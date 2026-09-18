export function isTrustedMutationRequest(request: Request): boolean {
  const fetchSite=request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if(fetchSite==="cross-site")return false;

  const origin=request.headers.get("origin")?.trim();
  if(origin){
    try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
  }

  // Browser mutation routes fail closed when Origin is unavailable. Fetch
  // Metadata is accepted only when the browser explicitly identifies the
  // request as same-origin; missing/ambiguous metadata is not trusted.
  return fetchSite==="same-origin";
}

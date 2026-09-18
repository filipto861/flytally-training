export function isTrustedMutationRequest(request: Request): boolean {
  const fetchSite=request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if(fetchSite==="cross-site")return false;

  const origin=request.headers.get("origin")?.trim();
  if(!origin)return true;
  try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}

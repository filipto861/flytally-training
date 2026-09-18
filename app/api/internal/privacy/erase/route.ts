import { NextResponse } from "next/server";

import { verifyTrainingPrivacyErasureAssertion } from "@/lib/privacy-erasure-contract";
import { deleteTrainingProgress } from "@/lib/training-privacy";

const noStore={ "cache-control":"private, no-store" };

export async function POST(request:Request){
  const authorization=request.headers.get("authorization")?.trim()??"";
  const prefix="FlyTally-Privacy ";
  if(!authorization.startsWith(prefix))return NextResponse.json({error:"unauthorized"},{status:401,headers:noStore});

  let claims;
  try{claims=verifyTrainingPrivacyErasureAssertion(authorization.slice(prefix.length));}
  catch{return NextResponse.json({error:"privacy_contract_not_configured"},{status:503,headers:noStore});}
  if(!claims)return NextResponse.json({error:"invalid_privacy_assertion"},{status:401,headers:noStore});

  const result=await deleteTrainingProgress(claims.sub);
  return NextResponse.json({deleted:true,resetAt:result.resetAt},{headers:noStore});
}

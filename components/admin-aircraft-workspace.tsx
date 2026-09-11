import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./admin-aircraft-workspace.module.css";

type WorkspaceSection="overview"|"content"|"sources"|"review"|"settings";

type Props=Readonly<{
  aircraftId:string;
  displayName:string;
  status:"draft"|"published";
  active:WorkspaceSection;
  children:ReactNode;
}>;

const nav:readonly {key:WorkspaceSection;label:string;href:(aircraftId:string)=>string}[]=[
  {key:"overview",label:"Overview",href:id=>`/admin/aircraft/${encodeURIComponent(id)}`},
  {key:"content",label:"Content",href:id=>`/admin/aircraft/${encodeURIComponent(id)}/content`},
  {key:"sources",label:"Sources",href:id=>`/admin/aircraft/${encodeURIComponent(id)}/sources`},
  {key:"review",label:"Review",href:id=>`/admin/aircraft/${encodeURIComponent(id)}/review`},
  {key:"settings",label:"Settings",href:id=>`/admin/aircraft/${encodeURIComponent(id)}/settings`},
];

export function AdminAircraftWorkspace({aircraftId,displayName,status,active,children}:Props){
  return <main className={styles.shell}>
    <div className={styles.topbar}>
      <div>
        <Link className={styles.back} href="/admin">← Aircraft</Link>
        <div className={styles.identity}><h1>{displayName}</h1><span className={status==="published"?styles.live:styles.draft}>{status==="published"?"Published":"Draft"}</span></div>
      </div>
      <Link className={styles.onboarding} href={`/admin/aircraft/${encodeURIComponent(aircraftId)}/onboarding`}>Onboarding</Link>
    </div>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <nav aria-label="Aircraft administration">
          {nav.map(item=><Link key={item.key} href={item.href(aircraftId)} className={item.key===active?styles.active:undefined}>{item.label}</Link>)}
        </nav>
        <p>Technical governance runs in the background. Work here by task, not by database object.</p>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  </main>;
}

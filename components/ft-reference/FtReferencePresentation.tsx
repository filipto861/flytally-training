import type {
  ReferencePresentation,
  ReferencePresentationGroup,
} from "@/lib/reference-presentation";

import styles from "./ft-reference.module.css";

function sourceLabel(source: {
  readonly manualId: string;
  readonly chapter?: string;
  readonly section?: string;
  readonly pageLabel: string;
}) {
  return [
    source.manualId,
    source.chapter ? `Ch ${source.chapter}` : undefined,
    source.section,
    `p. ${source.pageLabel}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Group({
  group,
}: Readonly<{
  group: ReferencePresentationGroup;
}>) {
  return (
    <section className={styles.group} aria-labelledby={`reference-group-${group.id}`}>
      <header>
        <h3 id={`reference-group-${group.id}`}>{group.title}</h3>
        <span>{group.items.length}</span>
      </header>

      <div className={styles.items}>
        {group.items.map((item) => (
          <article className={styles.item} id={item.id} key={item.id}>
            <div className={styles.valueLine}>
              <strong>{item.label}</strong>
              <b>
                {String(item.value)}
                {item.unit ? <small> {item.unit}</small> : null}
              </b>
            </div>

            {item.condition ? (
              <p className={styles.condition}>
                <span>Applies when</span>
                {item.condition}
              </p>
            ) : null}

            {item.notices.map((notice, index) => (
              <p
                className={styles[`notice_${notice.kind}`]}
                key={`${item.id}-${notice.kind}-${index}`}
              >
                <span>{notice.kind.toUpperCase()}</span>
                {notice.text}
              </p>
            ))}

            {item.sources.length ? (
              <details className={styles.sources}>
                <summary>Source</summary>
                {item.sources.map((source) => (
                  <small key={sourceLabel(source)}>{sourceLabel(source)}</small>
                ))}
              </details>
            ) : null}
          </article>
        ))}
      </div>

      {group.sources.length ? (
        <details className={styles.groupSources}>
          <summary>Group source</summary>
          {group.sources.map((source) => (
            <small key={sourceLabel(source)}>{sourceLabel(source)}</small>
          ))}
        </details>
      ) : null}
    </section>
  );
}

export function FtReferencePresentation({
  reference,
  view,
}: Readonly<{
  reference: ReferencePresentation;
  view: "fast-path" | "full";
}>) {
  return (
    <section
      className={styles.reference}
      aria-label="Reference quick access"
      data-ft-reference-view={view}
    >
      <header className={styles.header}>
        <div>
          <p>REFERENCE</p>
          <h2>{view === "fast-path" ? "Quick reference" : reference.title}</h2>
        </div>
        <span>{reference.itemCount} published items</span>
      </header>

      <div className={styles.groups}>
        {reference.groups.map((group) => (
          <Group group={group} key={group.id} />
        ))}
      </div>

      {reference.disclaimer || reference.sourceNote ? (
        <details className={styles.boundary}>
          <summary>Training & source notes</summary>
          {reference.disclaimer ? <p>{reference.disclaimer}</p> : null}
          {reference.sourceNote ? <p>{reference.sourceNote}</p> : null}
        </details>
      ) : null}
    </section>
  );
}

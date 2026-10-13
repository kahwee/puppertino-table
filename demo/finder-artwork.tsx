interface FinderFile {
  name: string;
  kind: string;
  size: string;
  modified: string;
  folder: string;
}
export type FinderView = 'icons' | 'list' | 'columns' | 'gallery';
export function ViewGlyph({
  view,
}: {
  view: FinderView | 'search' | 'back' | 'forward' | 'info' | 'trash' | 'restore';
}) {
  const paths = {
    icons: 'M3 3h6v6H3ZM15 3h6v6h-6ZM3 15h6v6H3ZM15 15h6v6h-6Z',
    list: 'M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1',
    columns: 'M3 4h18v16H3ZM9 4v16M15 4v16',
    gallery: 'M3 3h18v13H3ZM3 21h3M10 21h4M18 21h3',
    search: 'M10 3a7 7 0 1 0 0 14a7 7 0 0 0 0-14M15 15l6 6',
    back: 'M15 4l-8 8 8 8',
    forward: 'M9 4l8 8-8 8',
    trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
    restore: 'M4 4v6h6M4 10a8 8 0 1 1 0 5',
    info: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18M12 11v6M12 7h.01',
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[view]} />
    </svg>
  );
}
export function Glyph({
  folder = false,
  kind = 'PDF document',
}: {
  folder?: boolean;
  kind?: string;
}) {
  const color =
    kind === 'Spreadsheet'
      ? '#268354'
      : kind === 'PNG image'
        ? '#795ab4'
        : kind === 'Text document'
          ? '#667c97'
          : '#c7574e';
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="finder-demo-file-icon">
      {folder ? (
        <>
          <path d="M2 5h8l2 3h10v12H2Z" fill="#77c6ec" stroke="#389dce" strokeWidth=".7" />
          <path d="M2 10h20v10H2Z" fill="#5bb7e3" />
          <path d="M3 11h18" stroke="#b7e5fa" />
        </>
      ) : (
        <>
          <path d="M5 2h9l5 5v15H5Z" fill="#fff" stroke="#b8c0c9" strokeWidth=".8" />
          <path d="M14 2v5h5" fill="#e7ebef" stroke="#b8c0c9" strokeWidth=".8" />
          <rect x="3" y="12" width="16" height="7" rx="1.5" fill={color} />
          <path d="M7 15h8M7 17h5" stroke="#fff" strokeWidth=".9" />
        </>
      )}
    </svg>
  );
}
export function FilePreview({ file }: { file?: FinderFile }) {
  if (!file)
    return (
      <div className="finder-demo-empty">
        <Glyph folder />
        <strong>No file selected</strong>
        <span>Select a file to see its preview.</span>
      </div>
    );
  return (
    <div className="finder-demo-preview">
      <div
        className={`finder-demo-paper finder-demo-paper-${file.kind === 'PNG image' ? 'image' : file.kind === 'Spreadsheet' ? 'sheet' : 'document'}`}
        role="img"
        aria-label={`Fictional preview of ${file.name}`}
      >
        <span className="finder-demo-paper-kicker">ALPINE / DESIGN STUDIO</span>
        <strong>
          {file.kind === 'PNG image'
            ? 'Higher ground.'
            : file.kind === 'Spreadsheet'
              ? 'Project budget'
              : file.kind === 'Text document'
                ? 'Notes & ideas'
                : 'A fresh perspective.'}
        </strong>
        <div className="finder-demo-paper-landscape" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="finder-demo-paper-caption">
          {file.kind === 'Spreadsheet'
            ? 'Planning · Production · Delivery'
            : 'Thoughtful work. Clear direction.'}
        </span>
        <div className="finder-demo-paper-lines" aria-hidden="true">
          <hr />
          <hr />
          <hr />
        </div>
        <span className="finder-demo-paper-foot">
          PROJECT ALPINE <span>01 / 06</span>
        </span>
      </div>
      <h2>{file.name}</h2>
      <p>
        {file.kind} · {file.size}
      </p>
      <dl>
        <dt>Modified</dt>
        <dd>{file.modified}</dd>
        <dt>Location</dt>
        <dd>{file.folder}</dd>
      </dl>
    </div>
  );
}

/** Original fictional artwork: the example owns thumbnails and previews. */
export function FileArtwork({ file }: { file: FinderFile }) {
  const sheet = file.kind === 'Spreadsheet';
  const text = file.kind === 'Text document';
  const image = file.kind === 'PNG image';
  return (
    <svg viewBox="0 0 72 90" aria-hidden="true">
      <rect
        x="3"
        y="2"
        width="66"
        height="86"
        rx="2"
        fill={sheet ? '#eff7f1' : text ? '#f6f8fb' : '#f9f7f2'}
        stroke="#cad1cc"
      />

      <path d="M10 13h15M10 25h42M10 30h25" stroke="#476058" strokeWidth="2" />
      {!sheet && !text && (
        <>
          <rect x="10" y={image ? 34 : 43} width="52" height={image ? 40 : 24} fill="#d5e5df" />
          <path
            d={image ? 'M10 74l20-29 12 16 12-24 8 10v27Z' : 'M10 67l15-20 14 15 12-16 11 10v11Z'}
            fill="#567e71"
          />
          <path d={image ? 'M10 74l17-22 23 22Z' : 'M10 67l12-16 18 16Z'} fill="#294f43" />
        </>
      )}
      {sheet && (
        <>
          <rect x="10" y="34" width="52" height="9" fill="#428b65" />
          <path
            d="M10 43h52M10 52h52M10 61h52M10 70h52M27 43v36M45 43v36"
            stroke="#9dbfab"
            strokeWidth=".7"
          />
        </>
      )}
      {text ? (
        <path
          d="M10 37h46M10 44h52M10 51h40M10 61h52M10 68h48M10 75h34"
          stroke="#afbcc9"
          strokeWidth="1.4"
        />
      ) : (
        <path d="M10 77h52M10 81h33" stroke="#9db4a9" />
      )}
    </svg>
  );
}

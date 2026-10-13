import {
  ArchiveIcon,
  ArrowUUpLeftIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CircleIcon,
  ColumnsIcon,
  DesktopIcon,
  DotsThreeIcon,
  EyeIcon,
  FolderIcon,
  InfoIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  SlideshowIcon,
  SquaresFourIcon,
  TrashIcon,
} from '@phosphor-icons/react';

interface FinderFile {
  name: string;
  kind: string;
  size: string;
  modified: string;
  folder: string;
}
export type FinderView = 'icons' | 'list' | 'columns' | 'gallery';
const viewIcons = {
  icons: SquaresFourIcon,
  list: ListBulletsIcon,
  columns: ColumnsIcon,
  gallery: SlideshowIcon,
  search: MagnifyingGlassIcon,
  back: CaretLeftIcon,
  forward: CaretRightIcon,
  info: InfoIcon,
  trash: TrashIcon,
  restore: ArrowUUpLeftIcon,
  actions: DotsThreeIcon,
  preview: EyeIcon,
  folder: FolderIcon,
  archive: ArchiveIcon,
  desktop: DesktopIcon,
  tag: CircleIcon,
};
export function ViewGlyph({ view }: { view: keyof typeof viewIcons }) {
  const Icon = viewIcons[view];
  return <Icon size={20} weight="regular" aria-hidden="true" />;
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

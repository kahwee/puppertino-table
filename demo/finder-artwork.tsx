import {
  ArchiveIcon,
  ArrowUUpLeftIcon,
  CaretDoubleRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CircleIcon,
  ColumnsIcon,
  DesktopIcon,
  DotsThreeIcon,
  EyeIcon,
  FileImageIcon,
  FilePdfIcon,
  FileTextIcon,
  FileXlsIcon,
  FolderIcon,
  ImagesIcon,
  InfoIcon,
  ListIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
  TrashIcon,
  TreeStructureIcon,
} from '@phosphor-icons/react';
import type { CSSProperties } from 'react';
import { FinderEmptyState, FinderPreview } from '../src/index.js';
import { formatDateTime } from './date-format.js';

interface FinderFile {
  name: string;
  kind: string;
  size: string;
  modified: Date;
  folder: string;
}

const viewIcons = {
  icons: SquaresFourIcon,
  list: ListIcon,
  columns: ColumnsIcon,
  gallery: ImagesIcon,
  outline: TreeStructureIcon,
  search: MagnifyingGlassIcon,
  back: CaretLeftIcon,
  forward: CaretRightIcon,
  info: InfoIcon,
  trash: TrashIcon,
  restore: ArrowUUpLeftIcon,
  actions: DotsThreeIcon,
  overflow: CaretDoubleRightIcon,
  preview: EyeIcon,
  folder: FolderIcon,
  archive: ArchiveIcon,
  desktop: DesktopIcon,
  tag: CircleIcon,
};
export function ViewGlyph({
  view,
  selected = false,
}: {
  view: keyof typeof viewIcons;
  selected?: boolean;
}) {
  const Icon = viewIcons[view];
  return <Icon size={20} weight={selected ? 'fill' : 'regular'} aria-hidden="true" />;
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
  const Icon = folder
    ? FolderIcon
    : kind === 'Spreadsheet'
      ? FileXlsIcon
      : kind === 'PNG image'
        ? FileImageIcon
        : kind === 'Text document'
          ? FileTextIcon
          : FilePdfIcon;
  return (
    <Icon
      size={24}
      weight="duotone"
      style={{ '--finder-file-color': folder ? '#389dce' : color } as CSSProperties}
      aria-hidden="true"
      className="finder-demo-file-icon"
    />
  );
}
export function FilePreview({ file }: { file?: FinderFile }) {
  if (!file)
    return (
      <FinderEmptyState>
        <Glyph folder />
        <strong>No file selected</strong>
        <span>Select a file to see its preview.</span>
      </FinderEmptyState>
    );
  return (
    <FinderPreview
      heading={file.name}
      description={`${file.kind} · ${file.size}`}
      artwork={
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
      }
    >
      <dl>
        <dt>Modified</dt>
        <dd>{formatDateTime(file.modified)}</dd>
        <dt>Location</dt>
        <dd>{file.folder}</dd>
      </dl>
    </FinderPreview>
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

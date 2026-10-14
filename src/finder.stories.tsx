import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCreateAtom } from '@tanstack/react-store';
import type { ColumnSizingState, RowSelectionState, SortingState } from '@tanstack/react-table';
import type { DragEvent, KeyboardEvent, MouseEvent } from 'react';
import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent, within } from 'storybook/test';
import { finderViewRecipes } from '../.storybook/finder-recipes.js';
import { formatDateTime } from '../demo/date-format.js';
import { FileArtwork, FilePreview, Glyph, ViewGlyph } from '../demo/finder-artwork.js';
import { DemoToolbar } from '../demo/finder-chrome.js';
import { type FileItem, finderFilesReducer, initialFinderFiles } from '../demo/finder-files.js';
import {
  type FinderOutlineItem,
  finderAncestors,
  finderGroupIds,
  finderOutlineItems,
  finderVisibleFiles,
  isFinderGroup,
} from '../demo/finder-outline.js';
import { FinderTags } from '../demo/finder-tags.js';
import {
  applySelectionGesture,
  ColumnView,
  ColumnViewItem,
  ContextMenu,
  createPuppertinoColumnHelper,
  FinderBody,
  FinderContent,
  FinderDetails,
  FinderFilmstrip,
  FinderGallery,
  FinderGalleryItem,
  FinderIconGrid,
  FinderIconItem,
  FinderPathBar,
  FinderSidebar,
  FinderSidebarGroup,
  FinderSidebarItem,
  FinderStatusBar,
  type FinderView,
  FinderWindow,
  finderViews,
  nextItemId,
  type OutlineExpandedState,
  OutlineView,
  TableView,
  useContextMenu,
  useItemNavigation,
} from './index.js';
import './finder-demo.css';

const helper = createPuppertinoColumnHelper<FinderOutlineItem>();
const columns = helper.columns([
  helper.accessor('name', {
    header: 'Name',
    size: 300,
    minSize: 200,
    maxSize: 440,
    cell: (cell) => (
      <span className="finder-demo-filename">
        <span className="pt-icon">
          <Glyph kind={cell.row.original.kind} folder={isFinderGroup(cell.row.original)} />
        </span>
        {cell.getValue()}
      </span>
    ),
  }),
  helper.accessor('modified', {
    header: 'Date modified',
    size: 260,
    minSize: 240,
    sortFn: 'datetime',
    sortUndefined: 'last',
    cell: (cell) => {
      const value = cell.getValue();
      return value ? <time dateTime={value.toISOString()}>{formatDateTime(value)}</time> : '—';
    },
  }),
  helper.accessor('size', { header: 'Size', size: 90, minSize: 70 }),
  helper.accessor('kind', { header: 'Kind', size: 160, minSize: 120 }),
]);

function FinderDemo({
  initialView = 'list',
  initialDensity = 'compact',
  initialPreview = true,
  selectable = true,
  selectionCheckboxes = false,
  resizable = true,
  disabled = false,
  manualSorting = false,
  onViewChange,
  onDensityChange,
}: {
  initialView?: FinderView;
  initialDensity?: 'compact' | 'comfortable';
  initialPreview?: boolean;
  selectable?: boolean;
  selectionCheckboxes?: boolean;
  resizable?: boolean;
  disabled?: boolean;
  manualSorting?: boolean;
  onViewChange?(view: FinderView): void;
  onDensityChange?(density: 'compact' | 'comfortable'): void;
}) {
  const [fileState, dispatchFiles] = useReducer(finderFilesReducer, initialFinderFiles);
  const { files, trash, lastDeletedIds } = fileState;
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnSizing = useCreateAtom<ColumnSizingState>({});
  const [outlineExpanded, setOutlineExpanded] = useState<OutlineExpandedState>(() =>
    Object.fromEntries(
      finderGroupIds(finderOutlineItems(initialFinderFiles.files, 'Projects')).map((id) => [
        id,
        true,
      ]),
    ),
  );
  const selectionAnchor = useRef<string | null>(null);
  const selectionSummary = useRef<HTMLOutputElement>(null);
  const [tagNames, setTagNames] = useState(['Project Alpine', 'Work', 'Review']);
  const [folder, setFolder] = useState('Projects');
  const [localView, setLocalView] = useState(initialView);
  const [localDensity, setLocalDensity] = useState<'compact' | 'comfortable'>(initialDensity);
  // A slice has one owner: live Storybook args or local state, never delayed prop mirrors.
  const view = onViewChange ? initialView : localView;
  const density = onDensityChange ? initialDensity : localDensity;
  const setView = (next: FinderView) => {
    if (onViewChange) onViewChange(next);
    else setLocalView(next);
  };
  const setDensity = (next: 'compact' | 'comfortable') => {
    if (onDensityChange) onDensityChange(next);
    else setLocalDensity(next);
  };
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<string | null>(
    initialPreview && (initialView === 'columns' || initialView === 'gallery') ? 'brief' : null,
  );
  const [query, setQuery] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [quickLookOpen, setQuickLookOpen] = useState(false);
  const quickLook = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState('');
  const renameDialog = useRef<HTMLDialogElement>(null);
  const renameInput = useRef<HTMLInputElement>(null);
  const renameLabelId = useId();
  const renameErrorId = useId();
  const pendingViewFocus = useRef<{ id: string; view: FinderView } | null>(null);
  const [history, setHistory] = useState({ folders: ['Projects'], index: 0 });
  const [dragging, setDragging] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);
  const [message, setMessage] = useState('All changes stay in this demo');
  const menu = useContextMenu<string>();
  const availableTags = tagNames;
  const activeTag = folder.startsWith('tag:') ? folder.slice(4) : null;
  const folderTitle = activeTag ?? folder;
  const inTrash = folder === 'Trash';
  const folderFiles = useMemo(
    () =>
      activeTag
        ? files.filter((file) => file.tags?.includes(activeTag))
        : inTrash
          ? trash
          : files.filter((file) => file.folder === folder),
    [activeTag, files, folder, inTrash, trash],
  );
  const visible = useMemo(
    () => folderFiles.filter((file) => file.name.toLowerCase().includes(query.toLowerCase())),
    [folderFiles, query],
  );
  const outlineItems = useMemo(() => finderOutlineItems(visible, folder), [visible, folder]);
  useEffect(() => {
    if (view !== 'outline') return;
    const ids = finderGroupIds(outlineItems);
    setOutlineExpanded((previous) => {
      const missing = ids.filter((id) => previous[id] === undefined);
      return missing.length
        ? { ...previous, ...Object.fromEntries(missing.map((id) => [id, true])) }
        : previous;
    });
  }, [outlineItems, view]);
  const actionFiles =
    view === 'outline' ? finderVisibleFiles(outlineItems, outlineExpanded) : visible;
  const selectedFiles = actionFiles.filter((file) => selection[file.id]);
  const CollectionView =
    view === 'outline' ? OutlineView<FinderOutlineItem> : TableView<FinderOutlineItem>;
  const applyPreviewSetup = useEffectEvent((show: boolean, next: FinderView) => {
    if (next === 'columns')
      setDetail(selectedFiles[0]?.id ?? (show ? (visible[0]?.id ?? null) : null));
  });
  useEffect(() => applyPreviewSetup(initialPreview, initialView), [initialPreview, initialView]);
  const canAct = selectable && !disabled;
  const active = visible.find((file) => file.id === detail);
  useEffect(() => {
    const dialog = quickLook.current;
    if (!dialog) return;
    if (quickLookOpen && active) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [quickLookOpen, active]);
  useEffect(() => {
    const dialog = renameDialog.current;
    if (!dialog) return;
    if (renamingId) {
      if (!dialog.open) dialog.showModal();
      const input = renameInput.current;
      if (input) {
        input.focus();
        const extension = input.value.lastIndexOf('.');
        input.setSelectionRange(0, extension > 0 ? extension : input.value.length);
      }
    } else if (dialog.open) dialog.close();
  }, [renamingId]);
  const startRename = (id: string) => {
    const file = visible.find((item) => item.id === id);
    if (!file || !canAct || inTrash) return;
    setRenameName(file.name);
    setRenameError('');
    setRenamingId(id);
  };
  const commitRename = () => {
    const file = visible.find((item) => item.id === renamingId);
    const name = renameName.trim();
    if (!file || !canAct || inTrash) return;
    if (!name || name.includes('/') || name === '.' || name === '..') {
      setRenameError('Choose a filename without a slash.');
      return;
    }
    if (
      files.some(
        (item) =>
          item.id !== file.id &&
          item.folder === file.folder &&
          item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      setRenameError('A file with this name already exists in this folder.');
      return;
    }
    dispatchFiles({ type: 'rename', id: file.id, name });
    setMessage(`Renamed ${file.name} to ${name}.`);
    setRenamingId(null);
  };
  const displayIds = () => {
    const ids = Array.from(
      content.current?.querySelectorAll<HTMLElement>('[data-file-id]') ?? [],
    ).map((element) => element.dataset.fileId ?? '');
    return ids.length ? ids : visible.map((file) => file.id);
  };
  const navigation = useItemNavigation({
    orderedIds: visible.map((file) => file.id),
    getItemElement: (id) =>
      Array.from(content.current?.querySelectorAll<HTMLElement>('[data-file-id]') ?? []).find(
        (element) => element.dataset.fileId === id,
      ),
    orientation: view === 'icons' ? 'grid' : view === 'gallery' ? 'horizontal' : 'vertical',
    columns: () => {
      const grid = content.current?.querySelector('.pt-finder-icon-grid');
      return grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 1;
    },
    disabled,
    getItemLabel: (id) => visible.find((file) => file.id === id)?.name ?? '',
    onNavigate: (id, modifiers) =>
      selectFile(id, { shiftKey: !!modifiers.shift, metaKey: false, ctrlKey: false }, displayIds()),
  });
  useLayoutEffect(() => {
    const pending = pendingViewFocus.current;
    if (pending?.view === view && navigation.focus(pending.id)) {
      pendingViewFocus.current = null;
    }
  }, [navigation.focus, view]);
  const changeView = (next: FinderView) => {
    if (document.activeElement instanceof HTMLElement && document.activeElement.dataset.fileId)
      pendingViewFocus.current = { id: document.activeElement.dataset.fileId, view: next };
    else if (pendingViewFocus.current) pendingViewFocus.current.view = next;
    if (next === 'outline' && pendingViewFocus.current) {
      const parents = finderAncestors(outlineItems, pendingViewFocus.current.id);
      setOutlineExpanded((previous) => ({
        ...previous,
        ...Object.fromEntries(parents.map((id) => [id, true])),
      }));
    }
    setView(next);
    if ((next === 'columns' || next === 'gallery') && !detail) setDetail(visible[0]?.id ?? null);
  };
  const previewFile = (id: string) => {
    if (disabled) return;
    setDetail(id);
    setQuickLookOpen(true);
  };
  const itemKeyDown = (id: string, event: KeyboardEvent<HTMLElement>, ids = displayIds()) => {
    menu.getTriggerProps(id).onKeyDown(event);
    if (event.defaultPrevented || event.target !== event.currentTarget) return;
    if (
      view === 'columns' &&
      event.key === 'ArrowLeft' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      event.stopPropagation();
      setDetail(null);
      columnNavigation.focus(
        ['Projects', 'Archive', 'Trash'].includes(folder) ? folder : 'Projects',
      );
      return;
    }
    // The list's visual order can differ from the application's source order.
    if (
      view === 'list' &&
      ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      const next = nextItemId({ orderedIds: ids, currentId: id, key: event.key });
      if (next) {
        event.preventDefault();
        event.stopPropagation();
        if (navigation.focus(next)) selectFile(next, event, ids);
      }
      return;
    }
    if (view !== 'outline') navigation.getItemProps(id).onKeyDown(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      startRename(id);
    } else if (event.key === ' ' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      selectFile(id, event, ids);
      previewFile(id);
    } else if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      selectFile(id, event, ids);
    }
  };
  const clearSelection = () => {
    setSelection({});
    selectionAnchor.current = null;
  };
  const selectFile = (
    id: string,
    event: Pick<MouseEvent, 'shiftKey' | 'metaKey' | 'ctrlKey'>,
    ids = visible.map((file) => file.id),
  ) => {
    if (disabled) return;
    setDetail(id);
    if (!selectable) return;
    const anchor = selectionAnchor.current;
    const modifiers = { shift: event.shiftKey, toggle: event.metaKey || event.ctrlKey };
    selectionAnchor.current = applySelectionGesture(ids, {}, anchor, id, modifiers).anchor;
    setSelection(
      (previous) => applySelectionGesture(ids, previous, anchor, id, modifiers).selection,
    );
  };
  const finishAction = (text: string) => {
    clearSelection();
    setDetail(null);
    setInfoOpen(false);
    setQuickLookOpen(false);
    setMessage(text);
  };
  const focusAfterMutation = () => {
    const previousFocus = document.activeElement;
    requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (
        focused === previousFocus ||
        focused === document.body ||
        focused?.getAttribute('aria-haspopup') === 'menu'
      )
        selectionSummary.current?.focus();
    });
  };
  const deleteFiles = (targets: FileItem[]) => {
    if (!canAct || inTrash || !targets.length) return;
    dispatchFiles({ type: 'delete', ids: targets.map((file) => file.id) });
    finishAction(`Moved ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to Trash.`);
    focusAfterMutation();
  };
  const restoreFiles = (targets: FileItem[]) => {
    if (!canAct || !targets.length) return;
    dispatchFiles({ type: 'restore', ids: targets.map((file) => file.id) });
    finishAction(
      `Restored ${targets.length} ${targets.length === 1 ? 'file' : 'files'} to their original folders.`,
    );
    focusAfterMutation();
  };
  const moveFiles = (targets: FileItem[], target: 'Projects' | 'Archive') => {
    if (!canAct || inTrash || !targets.length) return;
    dispatchFiles({ type: 'move', ids: targets.map((file) => file.id), folder: target });
    finishAction(
      `Moved ${targets.length === 1 ? targets[0].name : `${targets.length} files`} to ${target}`,
    );
  };
  const emptyMessage = query
    ? `No files match “${query}”.`
    : activeTag
      ? `No files tagged “${activeTag}”.`
      : inTrash
        ? 'Trash is empty. Deleted files will appear here.'
        : folder === 'Archive'
          ? 'Archive is empty. Move files here from Projects.'
          : 'No files in Projects. Restore files from Trash or reset the demo.';
  const navigate = (name: string) => {
    if (name !== folder)
      setHistory((previous) => ({
        folders: [...previous.folders.slice(0, previous.index + 1), name],
        index: previous.index + 1,
      }));
    clearSelection();
    setFolder(name);
    setDetail(null);
    setInfoOpen(false);
    setQuery('');
  };
  const travel = (delta: number) => {
    const index = history.index + delta;
    if (index < 0 || index >= history.folders.length) return;
    setHistory({ ...history, index });
    clearSelection();
    setFolder(history.folders[index]);
    setDetail(null);
    setInfoOpen(false);
    setQuery('');
  };
  const context = actionFiles.find((file) => file.id === menu.state?.context);
  const contextTargets = context ? (selection[context.id] ? selectedFiles : [context]) : [];
  const dragProps = (file: FileItem) => ({
    draggable: canAct && !inTrash,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (!canAct || inTrash) {
        event.preventDefault();
        return;
      }
      const targets = selection[file.id] ? selectedFiles : [file];
      event.dataTransfer.setData('text/plain', file.id);
      event.dataTransfer.effectAllowed = 'move';
      setDragging(targets.map((item) => item.id));
      setMessage(
        `Dragging ${targets.length} ${targets.length === 1 ? 'file' : 'files'} — drop on a folder or Trash`,
      );
    },
    onDragEnd: () => {
      setDragging([]);
      setOver(null);
    },
  });
  const dropProps = (target: string) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!canAct || !dragging.length) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setOver(target);
    },
    onDragLeave: () => setOver(null),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const id = event.dataTransfer.getData('text/plain');
      if (!canAct || !dragging.includes(id)) return;
      const targets = actionFiles.filter((file) => dragging.includes(file.id));
      if (target === 'Trash') deleteFiles(targets);
      else if (target === 'Archive' || target === 'Projects') moveFiles(targets, target);
      setDragging([]);
      setOver(null);
    },
  });
  const selectAll = () => {
    if (!canAct) return;
    setSelection((previous) => ({
      ...previous,
      ...Object.fromEntries(actionFiles.map((file) => [file.id, true])),
    }));
    selectionAnchor.current = null;
  };
  const undoDelete = () => {
    if (disabled || !lastDeletedIds.length) return;
    dispatchFiles({ type: 'undo' });
    finishAction('Deletion undone. Files restored to their original folders.');
    focusAfterMutation();
  };
  const toolbarActions = [
    {
      id: 'select-all',
      label: 'Select All',
      shortcut: '⌘A',
      disabled: !canAct || !visible.length,
      onSelect: selectAll,
    },
    {
      id: 'clear',
      label: 'Deselect All',
      disabled: !selectedFiles.length,
      onSelect: clearSelection,
    },
    { id: 'selection-separator', type: 'separator' as const },
    ...(inTrash
      ? [
          {
            id: 'restore',
            label: 'Put Back',
            disabled: !canAct || !selectedFiles.length,
            onSelect: () => restoreFiles(selectedFiles),
          },
        ]
      : [
          {
            id: 'move',
            label: `Move to ${folder === 'Archive' ? 'Projects' : 'Archive'}`,
            disabled: !canAct || !selectedFiles.length,
            onSelect: () => moveFiles(selectedFiles, folder === 'Archive' ? 'Projects' : 'Archive'),
          },
          {
            id: 'trash',
            label: 'Move to Trash',
            icon: <ViewGlyph view="trash" />,
            shortcut: '⌘⌫',
            disabled: !canAct || !selectedFiles.length,
            onSelect: () => deleteFiles(selectedFiles),
          },
        ]),
    { id: 'undo-separator', type: 'separator' as const },
    {
      id: 'undo',
      label: 'Undo Move to Trash',
      shortcut: '⌘Z',
      disabled: disabled || !lastDeletedIds.length,
      onSelect: undoDelete,
    },
  ];
  const columnNavigation = useItemNavigation({
    orderedIds: ['Projects', 'Archive', 'Trash'],
    getItemElement: (id) =>
      Array.from(content.current?.querySelectorAll<HTMLElement>('[data-folder]') ?? []).find(
        (element) => element.dataset.folder === id,
      ),
    onNavigate: (id) => navigate(id),
  });
  const folderButton = (name: string, column = false) => (
    <FinderSidebarItem
      key={name}
      data-folder={name}
      className={over === name ? 'finder-demo-drop' : ''}
      selected={folder === name}
      iconTone={name === 'Trash' ? 'secondary' : 'accent'}
      icon={
        <ViewGlyph view={name === 'Trash' ? 'trash' : name === 'Archive' ? 'archive' : 'folder'} />
      }
      {...(column ? columnNavigation.getItemProps(name) : {})}
      onKeyDown={(event) => {
        if (!column) return;
        columnNavigation.getItemProps(name).onKeyDown(event);
        if (
          !event.defaultPrevented &&
          event.key === 'ArrowRight' &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey
        ) {
          event.preventDefault();
          const id = selectedFiles[0]?.id ?? visible[0]?.id;
          if (id && navigation.focus(id)) selectFile(id, event);
        }
      }}
      onClick={() => navigate(name)}
      {...dropProps(name)}
    >
      {name}
    </FinderSidebarItem>
  );
  return (
    <main className="finder-demo-stage">
      <FinderWindow
        aria-label="Finder-style demo"
        onKeyDown={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest('input,textarea,select,[contenteditable=true],[role="menu"]')
          )
            return;
          if (event.defaultPrevented || disabled || !(event.metaKey || event.ctrlKey)) return;
          if (['1', '2', '3', '4', '5'].includes(event.key)) {
            event.preventDefault();
            changeView(finderViews[Number(event.key) - 1]);
          }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            travel(event.key === 'ArrowLeft' ? -1 : 1);
          }
          if (event.key.toLowerCase() === 'i' && selectedFiles.length === 1) {
            event.preventDefault();
            setDetail(selectedFiles[0].id);
            setInfoOpen(true);
          }
          if (
            (event.key.toLowerCase() === 'o' || event.key === 'ArrowDown') &&
            selectedFiles.length === 1
          ) {
            event.preventDefault();
            previewFile(selectedFiles[0].id);
          }
          if (event.key.toLowerCase() === 'a') {
            event.preventDefault();
            selectAll();
          }
          if (event.key === 'Backspace') {
            event.preventDefault();
            deleteFiles(selectedFiles);
          }
          if (event.key.toLowerCase() === 'z') {
            event.preventDefault();
            undoDelete();
          }
        }}
      >
        <DemoToolbar
          folder={folderTitle}
          tags={
            <FinderTags
              files={selectedFiles}
              available={availableTags}
              disabled={!canAct}
              onTag={(tag, remove) => {
                if (!canAct) return;
                if (!remove)
                  setTagNames((previous) =>
                    previous.includes(tag) ? previous : [...previous, tag],
                  );
                dispatchFiles({
                  type: 'tag',
                  ids: selectedFiles.map((file) => file.id),
                  tag,
                  remove,
                });
                setMessage(`${remove ? 'Removed' : 'Assigned'} tag ${tag}.`);
              }}
            />
          }
          view={view}
          canBack={history.index > 0}
          canForward={history.index < history.folders.length - 1}
          onTravel={travel}
          onView={changeView}
          query={query}
          onQuery={(value) => {
            clearSelection();
            setDetail(null);
            setInfoOpen(false);
            setQuery(value);
          }}
          actions={toolbarActions}
          canPreview={!disabled && selectedFiles.length === 1}
          onPreview={() => previewFile(selectedFiles[0].id)}
        />
        <FinderBody density={density}>
          <FinderSidebar aria-label="Favorites">
            <FinderSidebarGroup label="Favorites">
              {['Projects', 'Archive'].map((name) => folderButton(name))}
            </FinderSidebarGroup>
            <FinderSidebarGroup label="Locations">
              <div className="p-sidebar-row">
                <span className="p-sidebar-icon finder-demo-location">
                  <ViewGlyph view="desktop" />
                </span>
                Design studio
              </div>
              {folderButton('Trash')}
            </FinderSidebarGroup>
            <FinderSidebarGroup label="Tags">
              {availableTags.map((tag) => (
                <FinderSidebarItem
                  key={tag}
                  selected={activeTag === tag}
                  icon={<ViewGlyph view="tag" />}
                  iconTone="secondary"
                  onClick={() => navigate(`tag:${tag}`)}
                >
                  {tag}
                </FinderSidebarItem>
              ))}
            </FinderSidebarGroup>
          </FinderSidebar>
          <FinderContent
            ref={content}
            onPointerDown={(event) => {
              if (
                event.target instanceof HTMLElement &&
                !event.target.closest(
                  '[data-file-id],[data-outline-id],button,input,[role="separator"],thead',
                )
              ) {
                clearSelection();
                setDetail(null);
              }
            }}
          >
            {view === 'list' || view === 'outline' ? (
              <CollectionView
                key={revision}
                data={view === 'outline' ? outlineItems : visible}
                {...(view === 'outline'
                  ? {
                      getChildren: (item: FinderOutlineItem) =>
                        isFinderGroup(item) ? item.children : undefined,
                      expanded: outlineExpanded,
                      onExpandedChange: setOutlineExpanded,
                    }
                  : {})}
                isRowSelectable={(item) => !isFinderGroup(item)}
                atoms={{ columnSizing }}
                columns={columns}
                getRowId={(file) => file.id}
                getRowLabel={(file) => file.name}
                ariaLabel={view === 'outline' ? 'Project file hierarchy' : 'Project files'}
                selectionAnchor={selectionAnchor}
                rowSelection={selection}
                onRowSelectionChange={setSelection}
                selectable={selectable}
                selectionCheckboxes={selectionCheckboxes}
                resizable={resizable}
                disabled={disabled}
                manualSorting={manualSorting}
                sorting={sorting}
                onSortingChange={setSorting}
                getRowProps={(row) => {
                  if (isFinderGroup(row.original)) return { 'data-outline-id': row.id };
                  return {
                    ...(view === 'list' ? navigation.getItemProps(row.id) : {}),
                    'data-file-id': row.id,
                    ...menu.getTriggerProps(row.id),
                    ...dragProps(row.original),
                    onFocus: () => {
                      if (view === 'list') navigation.getItemProps(row.id).onFocus();
                      if (!disabled) setDetail(row.id);
                    },
                    onClick: (event) => {
                      if ((event.target as HTMLElement).closest('button,input,a')) return;
                      event.preventDefault();
                      event.currentTarget.focus();
                      selectFile(row.id, event, displayIds());
                    },
                    onDoubleClick: () => previewFile(row.id),
                    onKeyDown: (event) => itemKeyDown(row.id, event, displayIds()),
                  };
                }}
                emptyContent={emptyMessage}
              />
            ) : view === 'columns' ? (
              <ColumnView
                key={revision}
                ariaLabel="Workspace columns"
                resizable={resizable}
                resizeDisabled={disabled}
                columns={[
                  {
                    id: 'workspace',
                    label: 'Workspace',
                    width: 170,
                    content: (
                      <>
                        {folderButton('Projects', true)}
                        {folderButton('Archive', true)}
                        {folderButton('Trash', true)}
                      </>
                    ),
                  },
                  {
                    id: 'files',
                    label: folderTitle,
                    width: 280,
                    content: visible.length ? (
                      visible.map((file) => (
                        <ColumnViewItem
                          disabled={disabled}
                          key={file.id}
                          selected={!!selection[file.id]}
                          icon={<Glyph kind={file.kind} />}
                          {...menu.getTriggerProps(file.id)}
                          {...dragProps(file)}
                          {...navigation.getItemProps(file.id)}
                          data-file-id={file.id}
                          onKeyDown={(event) => itemKeyDown(file.id, event)}
                          onDoubleClick={() => previewFile(file.id)}
                          onClick={(event) => {
                            event.currentTarget.focus();
                            selectFile(file.id, event);
                          }}
                        >
                          {file.name}
                        </ColumnViewItem>
                      ))
                    ) : (
                      <p className="finder-demo-no-results">{emptyMessage}</p>
                    ),
                  },
                  ...(active
                    ? [
                        {
                          id: 'preview',
                          label: 'Preview',
                          content: <FilePreview file={active} />,
                        },
                      ]
                    : []),
                ]}
              />
            ) : view === 'icons' ? (
              <FinderIconGrid aria-label="Project file icons">
                {visible.map((file) => (
                  <FinderIconItem
                    key={file.id}
                    selected={!!selection[file.id]}
                    disabled={disabled}
                    artwork={<FileArtwork file={file} />}
                    description={file.kind}
                    {...menu.getTriggerProps(file.id)}
                    {...dragProps(file)}
                    {...navigation.getItemProps(file.id)}
                    data-file-id={file.id}
                    onKeyDown={(event) => itemKeyDown(file.id, event)}
                    onDoubleClick={() => previewFile(file.id)}
                    onClick={(event) => {
                      event.currentTarget.focus();
                      selectFile(file.id, event);
                    }}
                  >
                    {file.name}
                  </FinderIconItem>
                ))}
                {!visible.length && <p className="finder-demo-no-results">{emptyMessage}</p>}
              </FinderIconGrid>
            ) : (
              <FinderGallery aria-label="Project file gallery">
                <FilePreview file={active ?? visible[0]} />
                <FinderFilmstrip aria-label="Gallery files">
                  {!visible.length && <p className="finder-demo-no-results">{emptyMessage}</p>}
                  {visible.map((file) => (
                    <FinderGalleryItem
                      key={file.id}
                      aria-label={file.name}
                      disabled={disabled}
                      selected={!!selection[file.id]}
                      {...menu.getTriggerProps(file.id)}
                      {...dragProps(file)}
                      {...navigation.getItemProps(file.id)}
                      data-file-id={file.id}
                      onKeyDown={(event) => itemKeyDown(file.id, event)}
                      onDoubleClick={() => previewFile(file.id)}
                      onClick={(event) => {
                        event.currentTarget.focus();
                        selectFile(file.id, event);
                      }}
                    >
                      <FileArtwork file={file} />
                    </FinderGalleryItem>
                  ))}
                </FinderFilmstrip>
              </FinderGallery>
            )}
          </FinderContent>
          {active && infoOpen && (
            <FinderDetails aria-label="File details">
              <span className="finder-demo-detail-icon">
                <Glyph kind={active.kind} />
              </span>
              <h2>{active.name}</h2>
              <p>{active.kind}</p>
              <dl>
                <dt>Size</dt>
                <dd>{active.size}</dd>
                <dt>Modified</dt>
                <dd>{formatDateTime(active.modified)}</dd>
                <dt>{inTrash ? 'Original folder' : 'Folder'}</dt>
                <dd>{active.folder}</dd>
              </dl>
              <button type="button" onClick={() => setInfoOpen(false)}>
                Close details
              </button>
            </FinderDetails>
          )}
        </FinderBody>
        <FinderPathBar>
          <Glyph folder />
          <span>Design studio</span>
          <span aria-hidden="true">›</span>
          <span>Workspace</span>
          <span aria-hidden="true">›</span>
          <strong>{folderTitle}</strong>
          {active && (
            <>
              <span aria-hidden="true">›</span>
              <span>{active.name}</span>
            </>
          )}
        </FinderPathBar>
        <FinderStatusBar>
          <output ref={selectionSummary} tabIndex={-1} aria-label="Selection summary">
            {selectedFiles.length
              ? `${selectedFiles.length} of ${visible.length} selected`
              : `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`}
          </output>
        </FinderStatusBar>
        <span className="pt-sr-only" role="status">
          {message}
        </span>
        <ContextMenu
          ariaLabel="File actions"
          position={menu.state?.position ?? null}
          returnFocus={menu.state?.returnFocus}
          onClose={menu.close}
          actions={
            context
              ? [
                  {
                    id: 'info',
                    label: 'Get Info',
                    icon: <ViewGlyph view="info" />,
                    shortcut: '⌘I',
                    onSelect: () => {
                      setDetail(context.id);
                      setInfoOpen(true);
                    },
                  },
                  {
                    id: 'rename',
                    label: 'Rename',
                    disabled: !canAct || inTrash,
                    onSelect: () => startRename(context.id),
                  },
                  { id: 'separator', type: 'separator' },
                  ...(inTrash
                    ? [
                        {
                          id: 'restore',
                          label:
                            contextTargets.length > 1
                              ? `Put Back ${contextTargets.length} Items`
                              : 'Put Back',
                          disabled: !canAct,
                          onSelect: () => restoreFiles(contextTargets),
                        },
                      ]
                    : [
                        {
                          id: 'move',
                          label: `Move to ${context.folder === 'Archive' ? 'Projects' : 'Archive'}`,
                          disabled: !canAct,
                          onSelect: () =>
                            moveFiles(
                              contextTargets,
                              context.folder === 'Archive' ? 'Projects' : 'Archive',
                            ),
                        },
                        {
                          id: 'delete',
                          label: 'Move to Trash',
                          icon: <ViewGlyph view="trash" />,
                          disabled: !canAct,
                          onSelect: () => deleteFiles(contextTargets),
                        },
                      ]),
                  {
                    id: 'download',
                    label: 'Download sample',
                    href: 'data:text/plain,Fictional%20project%20brief',
                    download: 'sample.txt',
                  },
                ]
              : []
          }
        />
      </FinderWindow>
      <dialog
        ref={quickLook}
        className="finder-demo-quick-look"
        aria-label="Quick Look"
        onCancel={(event) => {
          event.preventDefault();
          setQuickLookOpen(false);
        }}
        onClose={(event) => {
          if (!event.currentTarget.open) setQuickLookOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setQuickLookOpen(false);
          }
          if (event.key === ' ' && event.target === event.currentTarget) {
            event.preventDefault();
            setQuickLookOpen(false);
          }
          if (active && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            event.preventDefault();
            const next = nextItemId({
              orderedIds: displayIds(),
              currentId: active.id,
              key: event.key,
              orientation: 'horizontal',
            });
            if (next) {
              setDetail(next);
              if (canAct) setSelection({ [next]: true });
            }
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            setQuickLookOpen(false);
        }}
      >
        <header>
          <button
            type="button"
            className="p-button"
            aria-label="Close Quick Look"
            onClick={() => setQuickLookOpen(false)}
          >
            ×
          </button>
          <strong>{quickLookOpen ? active?.name : null}</strong>
        </header>
        {quickLookOpen && active && <FilePreview file={active} />}
      </dialog>
      <dialog
        ref={renameDialog}
        className="finder-demo-rename"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setRenamingId(null);
          }
        }}
        aria-labelledby={renameLabelId}
        onCancel={(event) => {
          event.preventDefault();
          setRenamingId(null);
        }}
        onClose={(event) => {
          if (!event.currentTarget.open) setRenamingId(null);
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            commitRename();
          }}
        >
          <h2 id={renameLabelId}>Rename file</h2>
          <label>
            New name
            <input
              ref={renameInput}
              className="p-form-text"
              aria-label="New filename"
              aria-invalid={!!renameError || undefined}
              aria-describedby={renameError ? renameErrorId : undefined}
              value={renameName}
              onChange={(event) => {
                setRenameName(event.target.value);
                setRenameError('');
              }}
            />
          </label>
          {renameError && (
            <p id={renameErrorId} role="alert">
              {renameError}
            </p>
          )}
          <footer>
            <button type="button" className="p-button" onClick={() => setRenamingId(null)}>
              Cancel
            </button>
            <button type="submit" className="p-button">
              Rename
            </button>
          </footer>
        </form>
      </dialog>
      <fieldset className="finder-demo-controls" aria-label="Demo settings">
        <span>Try the shared components</span>
        <label>
          Density{' '}
          <select
            aria-label="Row density"
            value={density}
            onChange={(event) => setDensity(event.target.value as 'compact' | 'comfortable')}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            menu.close();
            dispatchFiles({ type: 'reset' });
            setTagNames(['Project Alpine', 'Work', 'Review']);
            clearSelection();
            setInfoOpen(false);
            setSorting([]);
            columnSizing.set({});
            setOutlineExpanded(
              Object.fromEntries(
                finderGroupIds(finderOutlineItems(initialFinderFiles.files, 'Projects')).map(
                  (id) => [id, true],
                ),
              ),
            );
            setFolder('Projects');
            setDetail(view === 'columns' || view === 'gallery' ? 'brief' : null);
            setDragging([]);
            setOver(null);
            setQuery('');
            setHistory({ folders: ['Projects'], index: 0 });
            setQuickLookOpen(false);
            setRenamingId(null);
            setMessage('All changes stay in this demo');
            setRevision((value) => value + 1);
          }}
        >
          Reset demo
        </button>
      </fieldset>
    </main>
  );
}

const meta = {
  title: 'Examples/Finder',
  component: FinderDemo,
  tags: ['!autodocs'],
  args: {
    initialView: 'list',
    initialDensity: 'compact',
    initialPreview: true,
    selectable: true,
    selectionCheckboxes: false,
    resizable: true,
    disabled: false,
    manualSorting: false,
    onViewChange: fn(),
    onDensityChange: fn(),
  },
  render: function Playground(args) {
    const [, updateArgs] = useArgs<typeof args>();
    return (
      <FinderDemo
        {...args}
        onViewChange={(initialView) => {
          args.onViewChange?.(initialView);
          updateArgs({ initialView });
        }}
        onDensityChange={(initialDensity) => {
          args.onDensityChange?.(initialDensity);
          updateArgs({ initialDensity });
        }}
      />
    );
  },
  argTypes: {
    onViewChange: { control: false, table: { category: 'Events' } },
    onDensityChange: { control: false, table: { category: 'Events' } },
    selectionCheckboxes: {
      control: 'boolean',
      description:
        'Show optional table checkboxes when selection is enabled. Finder uses row selection by default.',
      table: { category: 'Collection behavior' },
    },
    initialView: {
      name: 'View',
      table: { category: 'Workspace' },
      control: 'inline-radio',
      options: [...finderViews],
      description:
        'Live view, synchronized with the toolbar. Preserves files, folder history and selection.',
    },
    initialPreview: {
      name: 'Select first preview',
      table: { category: 'Workspace' },
      control: 'boolean',
      description:
        'Choose the first column preview without resetting files. Gallery always shows a preview.',
    },
    initialDensity: {
      name: 'Density',
      table: { category: 'Workspace' },
      control: 'inline-radio',
      options: ['compact', 'comfortable'],
      description:
        'Live spacing, synchronized with the in-app selector. Preserves files and selection.',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable file selection and commands. Updates without resetting the workspace.',
      table: { category: 'Workspace' },
    },
    resizable: {
      control: 'boolean',
      description: 'Enable pointer and keyboard column resizing.',
      table: { category: 'Collection behavior' },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable workspace selection, commands, sorting and resizing.',
      table: { category: 'Workspace' },
    },
    manualSorting: {
      control: 'boolean',
      description: 'Keep app-owned row order when sorting changes; disable for local sorting.',
      table: { category: 'Collection behavior' },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      source: {
        transform: (_code: string, context: { args: { initialView?: FinderView } }) =>
          finderViewRecipes[context.args.initialView ?? 'list'],
        language: 'tsx',
        type: 'dynamic',
      },
      description: {
        component:
          'Fictional Finder-style workspace with shared selection across five views, bulk moves, Trash, restore and undo. File operations and native HTML drag/drop are owned by this example. The Move menu command is the keyboard alternative. No filesystem access.',
      },
    },
  },
} satisfies Meta<typeof FinderDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FileTable: Story = {
  name: 'Playground',
  parameters: {
    docs: {
      description: {
        story:
          'Sort Name, check rows (Shift-click for ranges), drag a header divider, or right-click a file. Drag a row to Archive; Reset demo restores files, selection and widths.',
      },
    },
  },
};
export const NarrowColumns: Story = {
  args: { initialView: 'columns', initialPreview: false },
  decorators: [
    (Story) => (
      <div className="finder-demo-frame">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      source: { language: 'tsx', code: finderViewRecipes.columns },
      description: {
        story:
          'Start with the file column; click a file to reveal its preview. Narrow windows keep ancestor columns accessible by horizontal scrolling. Use the canvas resize control to compare smaller widths.',
      },
    },
  },
};

export const Tags: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    docs: {
      description: {
        story:
          'Select a file and assign tags from the toolbar. Assigned tags become gray tokens; sidebar tags filter the workspace.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('row', { name: /Project brief.pdf/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Tags' }));
    const popover = within(canvas.getByRole('dialog', { name: 'Assign tags' }));
    await userEvent.click(popover.getByRole('option', { name: 'Review' }));
    await expect(popover.getByRole('button', { name: 'Remove tag Review' })).toBeVisible();
    await expect(popover.queryByRole('option', { name: 'Review' })).toBeNull();
  },
};

export const KeyboardWorkflow: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Finder-style keys across all five views: arrows, Shift ranges, type-to-select, Command/Ctrl+1–4, Space Quick Look, Return rename and Command/Ctrl+Backspace to Trash. Operations stay in the demo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByRole('row');
    await step('Navigate, extend a range and type to select', async () => {
      await userEvent.click(rows[1]);
      await userEvent.keyboard('{ArrowDown}');
      await expect(rows[2]).toHaveFocus();
      await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
      await expect(canvas.getByLabelText('Selection summary')).toHaveTextContent('2 of 6 selected');
      await userEvent.keyboard('b');
      await expect(rows[3]).toHaveFocus();
    });
    await step('Open Quick Look and restore file focus', async () => {
      await userEvent.keyboard(' ');
      await expect(canvas.getByRole('dialog', { name: 'Quick Look' })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await expect(rows[3]).toHaveFocus();
    });
    await step('Rename the selected document', async () => {
      await userEvent.keyboard('{Enter}');
      const rename = within(canvas.getByRole('dialog', { name: 'Rename file' }));
      const input = rename.getByRole('textbox', { name: 'New filename' });
      await userEvent.clear(input);
      await userEvent.type(input, 'Budget 2027.xlsx');
      await userEvent.click(rename.getByRole('button', { name: 'Rename' }));
      await expect(
        canvas.getByText('Budget 2027.xlsx', { selector: '.finder-demo-filename' }),
      ).toBeInTheDocument();
    });
    await step('Keep selection and focus across Icons, Columns and Gallery', async () => {
      await userEvent.keyboard('{Control>}1{/Control}');
      const icons = within(await canvas.findByRole('region', { name: 'Project file icons' }));
      const budget = icons.getByRole('button', { name: 'Budget 2027.xlsx Spreadsheet' });
      await expect(budget).toHaveFocus();
      await expect(budget).toHaveAttribute('aria-pressed', 'true');
      await userEvent.dblClick(budget);
      await expect(canvas.getByRole('dialog', { name: 'Quick Look' })).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await userEvent.keyboard('{Control>}3{/Control}');
      await expect(
        await canvas.findByRole('region', { name: 'Workspace columns' }),
      ).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Budget 2027.xlsx' })).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      const workspace = within(canvas.getByRole('region', { name: 'Workspace' }));
      await expect(workspace.getByRole('button', { name: 'Projects' })).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(canvas.getByRole('button', { name: 'Budget 2027.xlsx' })).toHaveFocus();
      await userEvent.keyboard('{Control>}4{/Control}');
      await expect(
        await canvas.findByRole('region', { name: 'Project file gallery' }),
      ).toBeInTheDocument();
      await userEvent.keyboard('{ArrowRight}');
      await expect(canvas.getByRole('button', { name: 'Cover artwork.png' })).toHaveFocus();
      await userEvent.keyboard('{Control>}a{/Control}');
      await expect(canvas.getByLabelText('Selection summary')).toHaveTextContent('6 of 6 selected');
    });
    await step('Reset the fictional workspace', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reset demo' }));
    });
  },
};

export const QuickLook: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Open Quick Look on a selected document. The native modal contains focus, restores the invoking item on close and supports Left/Right previews. Escape or the close control returns to the workspace.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('row', { name: /Project brief.pdf/ }));
    await userEvent.keyboard(' ');
    const preview = within(canvas.getByRole('dialog', { name: 'Quick Look' }));
    await expect(preview.getByRole('button', { name: 'Close Quick Look' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(preview.getByRole('heading', { name: 'Research notes.txt' })).toBeInTheDocument();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(preview.getByRole('heading', { name: 'Project brief.pdf' })).toBeInTheDocument();
  },
};

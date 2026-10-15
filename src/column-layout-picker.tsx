'use client';
import { Popover } from '@base-ui/react/popover';
import { useSelector } from '@tanstack/react-store';
import { useEffect, useId, useRef, useState } from 'react';
import type { useColumnLayout } from './use-column-layout.js';

/** Small native preset picker with an anchored, explicit save/rename workflow. */
export function ColumnLayoutPicker({
  controller,
  disabled = false,
  label = 'Column layout',
}: {
  controller: ReturnType<typeof useColumnLayout>;
  disabled?: boolean;
  label?: string;
}) {
  // Preview widths leave the committed preset unchanged. Render only when its ID changes.
  const selected = useSelector(controller.columnSizing, () => controller.getActivePresetId());
  const persistence = useSelector(controller.persistence);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'save' | 'rename'>('save');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const preset = controller.presets.find((item) => item.id === selected);
  const unavailable = disabled || !controller.ready;
  useEffect(() => {
    if (unavailable) setOpen(false);
  }, [unavailable]);
  return (
    <div className="pt-layout-picker">
      <label htmlFor={id}>{label}</label>
      <span className="p-select">
        <select
          id={id}
          value={selected}
          disabled={unavailable}
          onChange={(event) => {
            controller.applyPreset(event.target.value);
            setNotice('Column layout applied.');
          }}
        >
          <option value="" disabled>
            Custom layout
          </option>
          {controller.presets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </span>
      <Popover.Root
        open={!unavailable && open}
        onOpenChange={(value) => {
          setOpen(value);
          setError('');
          setMode('save');
          setName('');
        }}
      >
        <Popover.Trigger
          className="p-button p-button-borderless"
          disabled={unavailable}
          aria-label="Layout options"
          title="Save or manage layouts"
        >
          ⋯
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={6} collisionPadding={8}>
            <Popover.Popup className="pt-layout-popup" initialFocus={input}>
              <Popover.Title>
                {mode === 'rename' ? 'Rename layout' : 'Save current layout'}
              </Popover.Title>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const success =
                    mode === 'rename' && preset
                      ? controller.renamePreset(preset.id, name)
                      : controller.savePreset(name);
                  if (!success) {
                    setError(
                      'Use a unique name of 1–64 characters. Up to 30 layouts can be saved.',
                    );
                    input.current?.focus();
                    return;
                  }
                  setNotice(mode === 'rename' ? 'Layout renamed.' : 'Layout saved.');
                  setOpen(false);
                }}
              >
                <label htmlFor={`${id}-name`}>Name</label>
                <input
                  ref={input}
                  id={`${id}-name`}
                  className="p-field"
                  autoComplete="off"
                  value={name}
                  maxLength={64}
                  required
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError('');
                  }}
                />
                {error && (
                  <p id={`${id}-error`} role="alert">
                    {error}
                  </p>
                )}
                <div className="pt-layout-form-actions">
                  <Popover.Close className="p-button" type="button">
                    Cancel
                  </Popover.Close>
                  <button className="p-button p-button-primary" type="submit">
                    {mode === 'rename' ? 'Rename' : 'Save'}
                  </button>
                </div>
              </form>
              {preset && !preset.readOnly && (
                <div className="pt-layout-manage">
                  <button
                    className="p-button p-button-borderless"
                    type="button"
                    onClick={() => {
                      setMode('rename');
                      setName(preset.name);
                      setError('');
                      input.current?.focus();
                      input.current?.select();
                    }}
                  >
                    Rename saved layout…
                  </button>
                  <button
                    className="p-button p-button-borderless"
                    type="button"
                    onClick={() => {
                      controller.deletePreset(preset.id);
                      setNotice('Saved layout deleted. Current columns kept.');
                      setOpen(false);
                    }}
                  >
                    Delete saved layout
                  </button>
                </div>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <span className="pt-layout-notice" role="status">
        {persistence === 'session' ? 'Storage unavailable. Changes kept for this visit.' : notice}
      </span>
    </div>
  );
}

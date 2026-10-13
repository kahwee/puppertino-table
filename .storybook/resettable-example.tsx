import { Fragment, type ReactNode, useState } from 'react';

/** Reset Storybook args and remount local example state without changing the shared theme. */
export function ResettableExample({ onReset, children }: { onReset(): void; children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          className="p-button"
          onClick={() => {
            onReset();
            setRevision((value) => value + 1);
          }}
        >
          Reset example
        </button>
      </div>
      <Fragment key={revision}>{children}</Fragment>
    </>
  );
}

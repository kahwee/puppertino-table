import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createResizeController,
  type ResizeEnvironment,
  type ResizeMember,
  type ResizeTarget,
} from '../src/resize-controller.js';
import { persistResize } from '../src/resize-persistence.js';

function fixture() {
  let widths = { name: 200, score: 100 };
  let listens = 0,
    unlistens = 0,
    gestures = 0,
    cleaned = 0;
  let cancel: () => boolean = () => false;
  let cancelMedia: () => void = () => {};
  let compact = false;
  const saved: string[] = [];
  const environment: ResizeEnvironment = {
    listenCancel(callback) {
      listens++;
      cancel = callback;
      return () => {
        unlistens++;
        cancel = () => false;
      };
    },
    isCompact: (query) => !!query && compact,
    startGesture(target, pointer, _class, _query, callback) {
      gestures++;
      cancelMedia = callback;
      target.setPointerCapture(pointer);
      return () => {
        cleaned++;
        if (target.hasPointerCapture(pointer)) target.releasePointerCapture(pointer);
      };
    },
  };
  const adapter = {
    snapshot: () => ({ ...widths }),
    bounds: (id: string) => ({ id, size: id === 'name' ? 200 : 100, minSize: 50, maxSize: 400 }),
    apply: (next: Record<string, number>) => {
      widths = { name: next.name, score: next.score };
    },
    reset: (id: string) => {
      widths = { ...widths, [id]: id === 'name' ? 200 : 100 };
    },
  };
  const member = (): ResizeMember => ({
    adapter,
    options: {
      storageKey: 'widths',
      storage: {
        setItem: (_key, value) => {
          saved.push(value);
        },
      },
    },
  });
  let captured: number | undefined;
  const target: ResizeTarget = {
    focus() {},
    setPointerCapture: (id) => {
      captured = id;
    },
    hasPointerCapture: (id) => captured === id,
    releasePointerCapture: () => {
      captured = undefined;
    },
  };
  const controller = createResizeController(environment, persistResize);
  return {
    controller,
    member,
    target,
    saved,
    widths: () => widths,
    counts: () => ({ listens, unlistens, gestures, cleaned }),
    cancel: () => cancel(),
    mediaCancel: () => cancelMedia(),
    compact: () => {
      compact = true;
    },
  };
}
test('one listener registration, exclusive gesture ownership, and idempotent release', () => {
  const f = fixture(),
    first = f.member(),
    other = f.member();
  const release = f.controller.retain(first),
    releaseOther = f.controller.retain(other);
  assert.equal(f.counts().listens, 1);
  assert.equal(f.controller.begin(first, 'name', 10, 1, f.target, 0), true);
  assert.equal(f.controller.begin(other, 'score', 10, 2, f.target, 0), false);
  f.controller.move(other, 1, 70);
  f.controller.move(first, 99, 70);
  assert.equal(f.widths().name, 200);
  f.controller.move(first, 1, 70);
  assert.equal(f.widths().name, 260);
  assert.equal(f.controller.key(other, 'score', 'ArrowRight'), false);
  releaseOther();
  assert.equal(f.widths().name, 260);
  assert.equal(f.counts().unlistens, 0);
  release();
  release();
  assert.equal(f.widths().name, 200);
  assert.equal(f.saved.length, 0);
  assert.deepEqual(f.counts(), { listens: 1, unlistens: 1, gestures: 1, cleaned: 1 });
});
test('completion persists once, cancellation restores the snapshot without persistence', () => {
  const f = fixture(),
    owner = f.member();
  f.controller.retain(owner);
  f.controller.begin(owner, 'name', 0, 1, f.target, 0);
  f.controller.move(owner, 1, 30);
  f.controller.end(owner, 2);
  assert.equal(f.saved.length, 0);
  f.controller.end(owner, 1);
  f.controller.end(owner, 1);
  assert.equal(f.saved.length, 1);
  assert.equal(JSON.parse(f.saved[0]).name, 230);
  f.controller.begin(owner, 'name', 0, 2, f.target, 0);
  f.controller.move(owner, 2, 50);
  assert.equal(f.cancel(), true);
  assert.equal(f.cancel(), false);
  assert.equal(f.widths().name, 230);
  assert.equal(f.saved.length, 1);
});
test('disabled, responsive and pointer cancellation cannot save a preview', () => {
  const f = fixture(),
    owner = f.member();
  f.controller.retain(owner);
  for (const reason of ['disabled', 'media', 'pointer']) {
    owner.options.enabled = true;
    owner.options.cancelMediaQuery = '(max-width: 600px)';
    f.controller.begin(owner, 'name', 0, 1, f.target, 0);
    f.controller.move(owner, 1, 40);
    if (reason === 'disabled') {
      owner.options.enabled = false;
      f.controller.end(owner, 1);
    }
    if (reason === 'media') f.mediaCancel();
    if (reason === 'pointer') f.controller.cancel(owner, 1);
    assert.equal(f.widths().name, 200);
  }
  assert.equal(f.saved.length, 0);
  f.compact();
  assert.equal(f.controller.begin(owner, 'name', 0, 1, f.target, 0), false);
});
test('keyboard bounds, reset, ignored keys and storage failures', () => {
  const f = fixture(),
    owner = f.member();
  f.controller.retain(owner);
  assert.equal(f.controller.key(owner, 'name', 'Tab'), false);
  f.controller.key(owner, 'name', 'ArrowRight', true);
  assert.equal(f.widths().name, 240);
  f.controller.key(owner, 'name', 'End');
  f.controller.key(owner, 'name', 'ArrowRight');
  assert.equal(f.widths().name, 400);
  f.controller.key(owner, 'name', 'Home');
  f.controller.key(owner, 'name', 'ArrowLeft');
  assert.equal(f.widths().name, 50);
  f.controller.key(owner, 'name', 'Enter');
  assert.equal(f.widths().name, 200);
  owner.options.storage = {
    setItem() {
      throw new Error('Blocked storage');
    },
  };
  assert.equal(f.controller.key(owner, 'name', 'ArrowRight'), true);
  assert.equal(f.widths().name, 216);
  assert.equal(f.controller.reset(owner, 'name'), true);
  assert.equal(f.widths().name, 200);
});
test('independent controllers and capture failure leave no active gesture', () => {
  const a = fixture(),
    b = fixture(),
    ownerA = a.member(),
    ownerB = b.member();
  a.controller.retain(ownerA);
  b.controller.retain(ownerB);
  a.controller.begin(ownerA, 'name', 0, 1, a.target, 0);
  a.controller.move(ownerA, 1, 40);
  assert.equal(b.controller.key(ownerB, 'name', 'ArrowRight'), true);
  a.cancel();
  assert.equal(a.widths().name, 200);
  assert.equal(b.widths().name, 216);
  const broken = {
    ...a.target,
    setPointerCapture() {
      throw new Error('Invalid pointer');
    },
  };
  assert.equal(a.controller.begin(ownerA, 'name', 0, 2, broken, 0), false);
  assert.equal(a.controller.key(ownerA, 'name', 'ArrowRight'), true);
});

test('cancel restores only the owned column and completion does not repeat the preview update', () => {
  const f = fixture();
  const owner = f.member();
  f.controller.retain(owner);
  f.controller.begin(owner, 'name', 0, 1, f.target, 0);
  f.controller.move(owner, 1, 40);
  owner.adapter.apply({ ...owner.adapter.snapshot(), score: 175 });
  f.controller.cancel(owner, 1);
  assert.deepEqual(f.widths(), { name: 200, score: 175 });
  assert.equal(f.saved.length, 0);
  let writes = 0;
  const apply = owner.adapter.apply;
  owner.adapter.apply = (widths) => {
    writes++;
    apply(widths);
  };
  f.controller.begin(owner, 'name', 0, 2, f.target, 0);
  f.controller.move(owner, 2, 40);
  assert.equal(writes, 1);
  f.controller.end(owner, 2);
  assert.equal(writes, 1);
  assert.deepEqual(f.widths(), { name: 240, score: 175 });
  assert.equal(f.saved.length, 1);
});

test('commit callbacks fire once for completed operations and never for cancellation', () => {
  const f = fixture();
  const owner = f.member();
  const committed: Record<string, number>[] = [];
  owner.options.onCommit = (widths) => committed.push(widths);
  const release = f.controller.retain(owner);
  f.controller.begin(owner, 'name', 0, 1, f.target, 0);
  f.controller.move(owner, 1, 48);
  assert.equal(committed.length, 0);
  f.controller.end(owner, 1);
  f.controller.end(owner, 1);
  assert.deepEqual(committed, [{ name: 248, score: 100 }]);
  f.controller.begin(owner, 'name', 0, 2, f.target, 0);
  f.controller.move(owner, 2, 40);
  f.cancel();
  assert.equal(committed.length, 1);
  f.controller.key(owner, 'name', 'ArrowRight');
  assert.equal(committed[1].name, 264);
  f.controller.key(owner, 'name', 'Enter');
  assert.equal(committed[2].name, 200);
  f.controller.begin(owner, 'name', 0, 3, f.target, 0);
  f.controller.move(owner, 3, 20);
  release();
  assert.equal(committed.length, 3);
});

test('commits report intended controlled widths even before the owner rerenders or with blocked storage', () => {
  const f = fixture();
  const owner = f.member();
  // Model an asynchronous controlled owner: applying widths does not immediately update snapshot.
  owner.adapter.apply = () => {};
  const commits: Record<string, number>[] = [];
  owner.options.storage = {
    setItem() {
      throw new Error('Blocked');
    },
  };
  owner.options.onCommit = (widths) => commits.push(widths);
  f.controller.retain(owner);
  f.controller.key(owner, 'name', 'ArrowRight');
  assert.equal(commits[0].name, 216);
  f.controller.begin(owner, 'name', 0, 1, f.target, 0);
  f.controller.move(owner, 1, 80);
  f.controller.end(owner, 1);
  assert.equal(commits[1].name, 280);
  commits[1].name = 999;
  assert.equal(
    owner.adapter.snapshot().name,
    200,
    'Commit snapshots do not mutate the resize owner',
  );
});

test('schema cancellation retains sibling widths missing from the new snapshot', () => {
  const f = fixture();
  const member = f.member();
  f.controller.retain(member);
  f.controller.begin(member, 'name', 0, 1, f.target, 0);
  f.controller.move(member, 1, 60);
  member.adapter = { ...member.adapter, snapshot: () => ({}) };
  f.controller.cancelMember(member);
  assert.deepEqual(f.widths(), { name: 200, score: 100 });
  assert.deepEqual(f.saved, []);
});

test('coupled panes restore the full layout and commit normalized displayed sizes', () => {
  const f = fixture();
  const owner = f.member();
  const originalApply = owner.adapter.apply;
  owner.adapter = {
    ...owner.adapter,
    coupled: true,
    apply: (next) => {
      const name = Math.min(next.name, 220);
      originalApply({ name, score: 300 - name });
    },
  };
  const stop = f.controller.retain(owner);
  assert.equal(f.controller.begin(owner, 'name', 0, 1, f.target, 0), true);
  f.controller.move(owner, 1, 50);
  assert.deepEqual(f.widths(), { name: 220, score: 80 });
  f.controller.cancel(owner, 1);
  assert.deepEqual(f.widths(), { name: 200, score: 100 });
  assert.equal(f.saved.length, 0);
  f.controller.begin(owner, 'name', 0, 2, f.target, 0);
  f.controller.move(owner, 2, 50);
  f.controller.end(owner, 2);
  assert.deepEqual(JSON.parse(f.saved[0]), { name: 220, score: 80 });
  f.controller.key(owner, 'name', 'End', false);
  assert.deepEqual(JSON.parse(f.saved[1]), { name: 220, score: 80 });
  stop();
});

test('coupled commit snapshots retain normalized intent when a controlled owner ignores previews', () => {
  const f = fixture();
  const owner = f.member();
  owner.adapter = {
    ...owner.adapter,
    coupled: true,
    apply: (next) => {
      const name = Math.min(next.name, 220);
      return { name, score: 300 - name };
    },
  };
  const stop = f.controller.retain(owner);
  f.controller.begin(owner, 'name', 0, 1, f.target, 0);
  f.controller.move(owner, 1, 50);
  f.controller.end(owner, 1);
  assert.deepEqual(f.widths(), { name: 200, score: 100 });
  assert.deepEqual(JSON.parse(f.saved[0]), { name: 220, score: 80 });
  f.controller.key(owner, 'name', 'End', false);
  assert.deepEqual(JSON.parse(f.saved[1]), { name: 220, score: 80 });
  stop();
});

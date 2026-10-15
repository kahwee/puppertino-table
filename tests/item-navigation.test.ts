import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextItemId } from '../src/index.js';

const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
test('list and horizontal navigation respect direction, bounds and home/end', () => {
  const next = (key: string, currentId = 'b') => nextItemId({ orderedIds: ids, currentId, key });
  assert.equal(next('ArrowDown'), 'c');
  assert.equal(next('ArrowUp'), 'a');
  assert.equal(next('ArrowUp', 'a'), 'a');
  assert.equal(next('ArrowDown', 'f'), 'f');
  assert.equal(next('Home'), 'a');
  assert.equal(next('End'), 'f');
  assert.equal(next('ArrowLeft'), undefined);
  assert.equal(next('Enter'), undefined);
  assert.equal(
    nextItemId({ orderedIds: ids, currentId: 'b', key: 'ArrowRight', orientation: 'horizontal' }),
    'c',
  );
  assert.equal(nextItemId({ orderedIds: [], currentId: 'a', key: 'Home' }), undefined);
});
test('grid navigation follows visual columns without wrapping into another row', () => {
  const next = (currentId: string, key: string, columns = 3) =>
    nextItemId({ orderedIds: ids, currentId, key, orientation: 'grid', columns });
  assert.equal(next('b', 'ArrowDown'), 'e');
  assert.equal(next('e', 'ArrowUp'), 'b');
  assert.equal(next('c', 'ArrowRight'), 'c');
  assert.equal(next('d', 'ArrowLeft'), 'd');
  assert.equal(next('e', 'ArrowRight'), 'f');
  assert.equal(next('b', 'ArrowDown', 2), 'd');
  assert.equal(next('e', 'ArrowDown', 3), 'e');
});

test('frozen duplicate orders preserve first occurrences, empty IDs and missing focus', () => {
  const orderedIds = Object.freeze(['', '__proto__', 'a', '__proto__', 'b', 'a']);
  for (let repeat = 0; repeat < 2; repeat++) {
    const next = (currentId: string, key: string) => nextItemId({ orderedIds, currentId, key });
    assert.equal(next('', 'ArrowDown'), '__proto__');
    assert.equal(next('__proto__', 'ArrowDown'), 'a');
    assert.equal(next('a', 'End'), 'b');
    assert.equal(next('missing', 'ArrowUp'), 'b');
    assert.equal(next('missing', 'ArrowDown'), '');
  }
});

test('mutable orders reflect edits between keypresses', () => {
  const orderedIds = ['a', 'b', 'c'];
  const next = () => nextItemId({ orderedIds, currentId: 'a', key: 'ArrowDown' });
  assert.equal(next(), 'b');
  orderedIds.splice(1, 1, 'd');
  assert.equal(next(), 'd');
  orderedIds.reverse();
  assert.equal(next(), 'a');
});

test('ignored keys and Home never traverse the collection', () => {
  const orderedIds = new Proxy(['a', 'b'], {
    get(target, key, receiver) {
      if (key === Symbol.iterator) throw new Error('Unexpected collection traversal');
      return Reflect.get(target, key, receiver);
    },
  });
  assert.equal(nextItemId({ orderedIds, currentId: 'b', key: 'Enter' }), undefined);
  assert.equal(nextItemId({ orderedIds, currentId: 'b', key: 'ArrowLeft' }), undefined);
  assert.equal(nextItemId({ orderedIds, currentId: 'b', key: 'Home' }), 'a');
});

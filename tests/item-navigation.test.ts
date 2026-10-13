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

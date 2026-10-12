import { createPuppertinoColumnHelper } from '../src/index.js';
export interface Person {
  id: string;
  name: string;
  team: string;
  score: number;
  active: boolean;
}
export const people: Person[] = Array.from({ length: 267 }, (_, index) => ({
  id: `person-${index}`,
  name: `Person ${String(index + 1).padStart(3, '0')}`,
  team: ['Design', 'Engineering', 'Operations'][index % 3],
  score: (index * 17) % 101,
  active: index % 4 !== 0,
}));
const helper = createPuppertinoColumnHelper<Person>();
export const personColumns = helper.columns([
  helper.accessor('name', { header: 'Name', size: 240, minSize: 160, maxSize: 700 }),
  helper.accessor('team', { header: 'Team', size: 180, minSize: 110, maxSize: 400 }),
  helper.accessor('score', {
    header: 'Score',
    size: 120,
    minSize: 80,
    maxSize: 240,
    cell: (context) => <span className="demo-number">{context.getValue()}</span>,
  }),
  helper.accessor('active', {
    header: 'Status',
    size: 140,
    minSize: 110,
    maxSize: 300,
    cell: (context) => (
      <span className="demo-badge">{context.getValue() ? 'Active' : 'Paused'}</span>
    ),
  }),
]);
export interface Product {
  id: string;
  product: string;
  price: number;
  stock: number;
}
const productHelper = createPuppertinoColumnHelper<Product>();
export const productColumns = productHelper.columns([
  productHelper.accessor('product', { header: 'Product', size: 260 }),
  productHelper.accessor('price', {
    header: 'Price',
    size: 120,
    cell: (context) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
        context.getValue(),
      ),
  }),
  productHelper.accessor('stock', { header: 'Stock', size: 100 }),
]);
export const products: Product[] = [
  { id: 'desk', product: 'Standing desk', price: 399, stock: 12 },
  { id: 'lamp', product: 'Desk lamp', price: 59, stock: 35 },
  { id: 'chair', product: 'Office chair', price: 229, stock: 8 },
];

import type { Preview } from '@storybook/react-vite';
import '../demo/style.css';

const preview: Preview = {
  parameters: { layout: 'padded', controls: { expanded: true }, a11y: { test: 'error' } },
  tags: ['autodocs'],
};
export default preview;

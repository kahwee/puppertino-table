import type { Preview } from '@storybook/react-vite';
import '../demo/style.css';
import './docs.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true, sort: 'requiredFirst' },
    docs: { toc: { headingSelector: 'h2, h3' } },
    options: {
      storySort: {
        order: [
          'Start here',
          ['Overview'],
          'Examples',
          ['Finder'],
          'Puppertino',
          ['Table', 'Resource browser'],
        ],
      },
    },
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};
export default preview;

import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import '../demo/style.css';
import './docs.css';
import './theme.css';
import { ComponentDocs } from './component-docs.js';

const preview: Preview = {
  decorators: [
    withThemeByClassName({ themes: { light: '', dark: 'p-dark-mode' }, defaultTheme: 'light' }),
  ],
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: false, sort: 'requiredFirst' },
    docs: { page: ComponentDocs, toc: { headingSelector: 'h2, h3' } },
    options: {
      storySort: {
        order: [
          'Start here',
          ['Overview', 'TypeScript'],
          'Examples',
          ['Finder'],
          'Puppertino',
          [
            'Table',
            'Outline view',
            'Split view',
            'Column view',
            'Sidebar',
            'Tag picker',
            'Finder composition',
          ],
        ],
      },
    },
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};
export default preview;

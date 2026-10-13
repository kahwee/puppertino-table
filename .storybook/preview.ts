import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';
import '../demo/style.css';
import './docs.css';
import './theme.css';
import { ComponentDocs } from './component-docs.js';

const preview: Preview = {
  decorators: [
    withThemeByClassName({ themes: { light: '', dark: 'p-dark-mode' }, defaultTheme: 'light' }),
  ],
  initialGlobals: { theme: 'light', viewport: { value: undefined, isRotated: false } },
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: false, sort: 'requiredFirst', exclude: /^on[A-Z]/ },
    viewport: { options: MINIMAL_VIEWPORTS },
    docs: { codePanel: true, page: ComponentDocs, toc: { headingSelector: 'h2, h3' } },
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

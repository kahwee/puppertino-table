import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';
import '../demo/style.css';
import './docs.css';
import './theme.css';

const preview: Preview = {
  decorators: [
    withThemeByClassName({ themes: { light: '', dark: 'p-dark-mode' }, defaultTheme: 'light' }),
  ],
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true, sort: 'requiredFirst' },
    docs: { toc: { headingSelector: 'h2, h3' } },
    options: {
      storySort: {
        order: [
          'Start here',
          ['Overview', 'TypeScript'],
          'Examples',
          ['Finder'],
          'Puppertino',
          ['Typed table', 'Table', 'Resource browser'],
        ],
      },
    },
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};
export default preview;

import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Puppertino Table',
    brandUrl: './?path=/docs/start-here-overview--docs',
    brandTarget: '_self',
    colorPrimary: '#0064dc',
    colorSecondary: '#0064dc',
    appBg: '#f0f0f2',
    appContentBg: '#ffffff',
    appBorderColor: '#dcdce0',
    appBorderRadius: 8,
    barBg: '#fafafa',
    textColor: '#29292d',
    textMutedColor: '#65656b',
    fontBase: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
  sidebar: { showRoots: true },
});

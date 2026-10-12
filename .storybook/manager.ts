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
  }),
  sidebar: { showRoots: true },
});

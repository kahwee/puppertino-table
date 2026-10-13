import {
  Controls,
  Description,
  Primary,
  Stories,
  Subtitle,
  Title,
  useOf,
} from '@storybook/addon-docs/blocks';
import { componentGuides } from './component-guides.js';

/** One primary canvas; additional docs stories show distinct recipes only. */
export function ComponentDocs() {
  const resolved = useOf('meta');
  const guide = resolved.type === 'meta' ? componentGuides[resolved.preparedMeta.title] : undefined;
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <h2 id="playground">Playground</h2>
      <p>
        {guide?.intro ??
          'Use Controls to explore this component. Use the shared Theme and Viewport toolbars for appearance and responsive layouts.'}
      </p>
      <Primary />
      {guide && (
        <>
          <h2 id="try-these-controls">Try these controls</h2>
          <div className="storybook-guide-table-scroll">
            <table className="storybook-guide-table" aria-label="Playground scenarios">
              <thead>
                <tr>
                  <th scope="col">Setting</th>
                  <th scope="col">Try</th>
                  <th scope="col">Observe</th>
                </tr>
              </thead>
              <tbody>
                {guide.scenarios.map((scenario) => (
                  <tr key={scenario.setting}>
                    <th scope="row">
                      <code>{scenario.setting}</code>
                    </th>
                    <td>{scenario.try}</td>
                    <td>{scenario.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <h3 id="live-arguments">Live arguments</h3>
      <Controls />
      {guide && (
        <>
          <h2 id="integration">Integration</h2>
          <p>{guide.integration}</p>
          <p>
            Open the Code panel in the full canvas or Show code above for a complete public recipe.
            Inspect emitted callbacks in Actions. Reset Controls to restore metadata defaults.
          </p>
          <p>
            <a
              href={`https://github.com/kahwee/puppertino-table/blob/main/docs/guide.md#${guide.api}`}
            >
              API guide
            </a>
            {' · '}
            <a href="./?path=/docs/start-here-typescript--docs" target="_top">
              Typed Storybook patterns
            </a>
          </p>
          {guide.keyboard && (
            <>
              <h3 id="keyboard">Keyboard</h3>
              <ul>
                {guide.keyboard.map((binding) => (
                  <li key={binding.keys}>
                    <kbd>{binding.keys}</kbd>
                    {' — '}
                    {binding.action}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <Stories includePrimary={false} />
    </>
  );
}

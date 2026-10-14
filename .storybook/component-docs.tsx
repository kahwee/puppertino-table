import {
  Controls,
  Primary,
  Source,
  Stories,
  Subtitle,
  Title,
  useOf,
} from '@storybook/addon-docs/blocks';
import { componentGuides } from './component-guides.js';
import { scenarioGroups, scenarioHref } from './scenarios.js';
import { supportingSources } from './supporting-sources.js';
import { workflows } from './workflows.js';

/** One primary canvas; additional docs stories show distinct recipes only. */
export function ComponentDocs() {
  const resolved = useOf('meta');
  const guide = resolved.type === 'meta' ? componentGuides[resolved.preparedMeta.title] : undefined;
  const scenarios =
    resolved.type === 'meta'
      ? scenarioGroups[resolved.preparedMeta.title as keyof typeof scenarioGroups]
      : undefined;
  const checks = resolved.type === 'meta' ? workflows[resolved.preparedMeta.title] : undefined;
  const supporting =
    resolved.type === 'meta' ? supportingSources[resolved.preparedMeta.title] : undefined;
  return (
    <>
      <Title />
      <Subtitle />
      <h2 id="playground">Playground</h2>
      <p>
        {guide?.intro ??
          'Use Controls to explore this component. Use the shared Theme and Viewport toolbars for appearance and responsive layouts.'}
      </p>
      <Primary />
      {supporting &&
        [supporting, ...(supporting.additional ?? [])].map((file) => (
          <details className="storybook-supporting" key={file.filename}>
            <summary>Supporting code: {file.filename}</summary>
            <p>
              {file.filename.endsWith('.tsx') ||
              file.filename.endsWith('.ts') ||
              file.filename.endsWith('.css')
                ? 'Use this file with its matching short integration in Code.'
                : 'Full default recipe with the original fixtures and cells.'}
            </p>
            <Source language={file.filename.endsWith('.css') ? 'css' : 'tsx'} code={file.code} />
          </details>
        ))}
      {scenarios && (
        <>
          <h2 id="open-a-scenario">Open a scenario</h2>
          <p>
            Start with a named configuration, then adjust its native Controls. Variants share
            playgrounds; ownership links open the matching integration recipe.
          </p>
          <ul className="storybook-scenario-grid">
            {scenarios.scenarios.map((scenario) => (
              <li key={scenario.name}>
                <a
                  href={scenarioHref(
                    'story' in scenario ? scenario.story : scenarios.story,
                    scenario.args,
                  )}
                  target="_top"
                >
                  {scenario.name}
                </a>
                <span>{scenario.observe}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {guide && !scenarios && (
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
            Copy <strong>Code</strong> for a typed app. Inspect callbacks in{' '}
            <strong>Actions</strong>. <strong>Reset example</strong>, where available, restores args
            and local data.
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
      {checks && (
        <>
          <h2 id="workflows">Workflows</h2>
          <p>Replay named steps in Interactions.</p>
          <ul className="storybook-workflow-links">
            {checks.map((check) => (
              <li key={check.story}>
                <a
                  href={`./?path=/story/${check.story}&addonPanel=storybook/interactions/panel`}
                  target="_top"
                >
                  {check.name}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <Stories includePrimary={false} />
    </>
  );
}

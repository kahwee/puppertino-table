import { Controls, Primary, Source, Subtitle, Title, useOf } from '@storybook/addon-docs/blocks';
import { componentGuides } from './component-guides.js';
import { scenarioGroups, scenarioHref } from './scenarios.js';
import { focusedRecipes, type StoryRecipe, tableIntegrations } from './story-catalog.js';
import { supportingSources } from './supporting-sources.js';
import { workflows } from './workflows.js';

function RecipeLinks({ recipes, label }: { recipes: readonly StoryRecipe[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ul className="storybook-recipe-grid">
        {recipes.map((recipe) => (
          <li key={recipe.story}>
            <a href={`./?path=/story/${recipe.story}`} target="_top">
              {recipe.name}
            </a>
            <p>{recipe.when}</p>
            <dl>
              <dt>Try</dt>
              <dd>{recipe.try}</dd>
              <dt>Expect</dt>
              <dd>{recipe.expect}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** One interactive canvas per Docs page; open other integrations deliberately. */
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
  const recipes =
    resolved.type === 'meta' ? focusedRecipes[resolved.preparedMeta.title] : undefined;
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
      {resolved.type === 'meta' && resolved.preparedMeta.title === 'Puppertino/Table' && (
        <>
          <h2 id="choose-an-integration">Choose an integration</h2>
          <p>Keep the playground for component behavior. Open a workspace for an app-level task.</p>
          <RecipeLinks recipes={tableIntegrations} label="Table integration paths" />
        </>
      )}
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
          <p>Follow the journey below, or open its executable check in Interactions.</p>
          <ul className="storybook-workflow-grid">
            {checks.map((check) => (
              <li key={check.story}>
                <a
                  href={`./?path=/story/${check.story}&addonPanel=storybook/interactions/panel`}
                  target="_top"
                >
                  {check.name}
                </a>
                <ol>
                  {check.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p>
                  <strong>Expect:</strong> {check.result}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      {recipes && (
        <details className="storybook-focused-recipes">
          <summary>Focused recipes ({recipes.length})</summary>
          <p>Open one when you need its integration detail. Each has its own Code panel.</p>
          <RecipeLinks recipes={recipes} label="Focused integration recipes" />
        </details>
      )}
      {supporting && (
        <>
          <h2 id="supporting-files">Supporting files</h2>
          <p>Copy the short integration from Code first; expand only the files it imports.</p>
          {[supporting, ...(supporting.additional ?? [])].map((file) => (
            <details className="storybook-supporting" key={file.filename}>
              <summary>Supporting code: {file.filename}</summary>
              <Source language={file.filename.endsWith('.css') ? 'css' : 'tsx'} code={file.code} />
            </details>
          ))}
        </>
      )}
    </>
  );
}

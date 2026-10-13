const owners = [
  {
    name: 'Internal',
    description: 'Local UI state. Start here.',
    href: './?path=/story/puppertino-table--default',
  },
  {
    name: 'React',
    description: 'Your app owns values and change callbacks.',
    href: './?path=/story/puppertino-table--selection&args=stateOwner:react',
  },
  {
    name: 'Atoms',
    description: 'Share state between components and subscriptions.',
    href: './?path=/story/puppertino-table--selection&args=stateOwner:atoms',
  },
];

export function IntegrationGuide() {
  return (
    <>
      <nav className="storybook-choice-grid" aria-label="State ownership choices">
        {owners.map((owner) => (
          <a className="storybook-choice" key={owner.name} href={owner.href} target="_top">
            <strong>{owner.name}</strong>
            <span>{owner.description}</span>
          </a>
        ))}
      </nav>
      <p className="storybook-note">
        <strong>Server data?</strong> Set <code>manualSorting</code> to keep supplied order. State
        ownership and row ordering are separate choices. Use one owner per state slice.
      </p>
    </>
  );
}

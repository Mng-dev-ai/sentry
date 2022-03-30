import {useEffect, useState} from 'react';
import styled from '@emotion/styled';

import HighlightTopRightPattern from 'sentry-images/pattern/highlight-top-right.svg';

import CheckboxFancy from 'sentry/components/checkboxFancy/checkboxFancy';
import DropdownMenuControlV2 from 'sentry/components/dropdownMenuControlV2';
import {MenuItemProps} from 'sentry/components/dropdownMenuItemV2';
import IdBadge from 'sentry/components/idBadge';
import SidebarPanel from 'sentry/components/sidebar/sidebarPanel';
import {CommonSidebarProps, SidebarPanelKey} from 'sentry/components/sidebar/types';
import {t} from 'sentry/locale';
import PageFiltersStore from 'sentry/stores/pageFiltersStore';
import {useLegacyStore} from 'sentry/stores/useLegacyStore';
import pulsingIndicatorStyles from 'sentry/styles/pulsingIndicator';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import EventWaiter from 'sentry/utils/eventWaiter';
import marked from 'sentry/utils/marked';
import useApi from 'sentry/utils/useApi';
import useOrganization from 'sentry/utils/useOrganization';
import useProjects from 'sentry/utils/useProjects';

function PerformanceOnboardingSidebar(props: CommonSidebarProps) {
  const {currentPanel, collapsed, hidePanel, orientation} = props;
  const isActive = currentPanel === SidebarPanelKey.PerformanceOnboarding;

  const api = useApi();
  const organization = useOrganization();
  const access = new Set(organization.access);
  const hasProjectAccess = access.has('project:read');

  const {projects, initiallyLoaded: projectsLoaded} = useProjects();

  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);

  const {selection, isReady} = useLegacyStore(PageFiltersStore);

  useEffect(() => {
    if (projects.length === 0 || !isReady || !isActive) {
      return;
    }

    const selectedProjects = new Set(selection.projects.map(id => String(id)));

    if (selection.projects.length) {
      if (currentProject && selectedProjects.has(currentProject.id)) {
        return;
      }
      const needle = projects.find(
        project => project.id === String(selection.projects[0])
      );
      if (needle) {
        setCurrentProject(needle);
        return;
      }
    }

    setCurrentProject(projects[0]);
  }, [selection.projects, projects, isActive]);

  if (
    !isActive ||
    !hasProjectAccess ||
    currentProject === undefined ||
    !projectsLoaded ||
    !projects ||
    projects.length <= 0
  ) {
    return null;
  }

  const items: MenuItemProps[] = projects.reduce((acc: MenuItemProps[], project) => {
    const itemProps: MenuItemProps = {
      key: project.id,
      label: <StyledIdBadge project={project} avatarSize={16} hideOverflow disableLink />,
      onAction: function switchProject() {
        setCurrentProject(project);
      },
    };

    if (currentProject.id === project.id) {
      acc.unshift(itemProps);
    } else {
      acc.push(itemProps);
    }

    return acc;
  }, []);

  const tasks = [INSTALL_CONTENT, CONFIGURE_SAMPLE_RATE, VERIFY];

  return (
    <TaskSidebarPanel
      orientation={orientation}
      collapsed={collapsed}
      hidePanel={hidePanel}
    >
      <TopRightBackgroundImage src={HighlightTopRightPattern} />
      <TaskList>
        <Heading>{t('Boost Performance')}</Heading>
        <div>
          <DropdownMenuControlV2
            items={items}
            triggerLabel={
              <StyledIdBadge
                project={currentProject}
                avatarSize={32}
                hideOverflow
                disableLink
              />
            }
            triggerProps={{
              'aria-label': currentProject.slug,
              borderless: true,
            }}
            placement="bottom left"
          />
        </div>
        <div>
          {t(
            'Adding performance to your Javascript project is simple. Make sure you’ve got these basics down.'
          )}
        </div>
        {tasks.map((content, index) => {
          let footer: React.ReactNode = null;

          if (index === 2) {
            footer = (
              <EventWaiter
                api={api}
                organization={organization}
                project={currentProject}
                eventType="transaction"
                onIssueReceived={() => {
                  // TODO
                }}
              >
                {() => <EventWaitingIndicator />}
              </EventWaiter>
            );
          }

          return (
            <div key={index}>
              <TaskCheckBox>
                <CheckboxFancy
                  size="22px"
                  isChecked
                  onClick={() => {
                    return;
                  }}
                />
              </TaskCheckBox>
              <DocumentationWrapper dangerouslySetInnerHTML={{__html: marked(content)}} />
              {footer}
            </div>
          );
        })}
      </TaskList>
    </TaskSidebarPanel>
  );
}

const TaskSidebarPanel = styled(SidebarPanel)`
  width: 450px;
`;

const TopRightBackgroundImage = styled('img')`
  position: absolute;
  top: 0;
  right: 0;
  width: 60%;
  user-select: none;
`;

const TaskList = styled('div')`
  display: grid;
  grid-auto-flow: row;
  gap: ${space(1)};
  margin: 50px ${space(4)} ${space(4)} ${space(4)};
`;

const Heading = styled('div')`
  display: flex;
  color: ${p => p.theme.purple300};
  font-size: ${p => p.theme.fontSizeExtraSmall};
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1;
  margin-top: ${space(3)};
`;

const StyledIdBadge = styled(IdBadge)`
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 1;
`;

const TaskCheckBox = styled('div')`
  float: left;
  margin-right: ${space(1.5)};
  height: 27px;
  display: flex;
  align-items: center;
`;

const PulsingIndicator = styled('div')`
  ${pulsingIndicatorStyles};
  margin-right: ${space(1)};
`;

const EventWaitingIndicator = styled((p: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p}>
    <PulsingIndicator />
    {t(`Waiting for this project's first transaction event`)}
  </div>
))`
  display: flex;
  align-items: center;
  flex-grow: 1;
  font-size: ${p => p.theme.fontSizeMedium};
  color: ${p => p.theme.pink300};
`;

const DocumentationWrapper = styled('div')`
  p {
    line-height: 1.5;
  }
  pre {
    word-break: break-all;
    white-space: pre-wrap;
  }
`;

const INSTALL_CONTENT = `
#### Install

Install the tracing package. Without this, you're missing out on tracing.

\`\`\`sh
# Using yarn
yarn add @sentry/browser @sentry/tracing

# Using npm
npm install --save @sentry/browser @sentry/tracing
\`\`\`
`;

const CONFIGURE_SAMPLE_RATE = `
#### Configure

Sampling for transactions must also be configured before tracing is be enabled in your app.

\`\`\`js
import * as Sentry from "@sentry/browser";

// If taking advantage of automatic instrumentation (highly recommended)
import { BrowserTracing } from "@sentry/tracing";
// Or, if only manually tracing
// import * as _ from "@sentry/tracing"
// Note: You MUST import the package in some way for tracing to work

Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",

  // This enables automatic instrumentation (highly recommended), but is not
  // necessary for purely manual usage
  integrations: [new BrowserTracing()],

  // To set a uniform sample rate
  tracesSampleRate: 0.2

  // Alternatively, to control sampling dynamically
  tracesSampler: samplingContext => { ... }
});
\`\`\`
`;

const VERIFY = `
#### Verify

Verify that performance monitoring is working correctly by using our automatic instrumentation or by starting and finishing a transaction using custom instrumentation.

\`\`\`js
const transaction = Sentry.startTransaction({ name: "test-transaction" });
const span = transaction.startChild({ op: "functionX" }); // This function returns a Span
// functionCallX
span.finish(); // Remember that only finished spans will be sent with the transaction
transaction.finish(); // Finishing the transaction will send it to Sentry
\`\`\`
`;

export default PerformanceOnboardingSidebar;

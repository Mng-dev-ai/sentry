import {Fragment, useEffect, useState} from 'react';
import styled from '@emotion/styled';
import * as Sentry from '@sentry/react';

import HighlightTopRightPattern from 'sentry-images/pattern/highlight-top-right.svg';

import {loadDocs} from 'sentry/actionCreators/projects';
import Button from 'sentry/components/button';
import CheckboxFancy from 'sentry/components/checkboxFancy/checkboxFancy';
import DropdownMenuControlV2 from 'sentry/components/dropdownMenuControlV2';
import {MenuItemProps} from 'sentry/components/dropdownMenuItemV2';
import IdBadge from 'sentry/components/idBadge';
import SidebarPanel from 'sentry/components/sidebar/sidebarPanel';
import {CommonSidebarProps, SidebarPanelKey} from 'sentry/components/sidebar/types';
import platforms from 'sentry/data/platforms';
import {t, tct} from 'sentry/locale';
import PageFiltersStore from 'sentry/stores/pageFiltersStore';
import ProjectsStore from 'sentry/stores/projectsStore';
import {useLegacyStore} from 'sentry/stores/useLegacyStore';
import pulsingIndicatorStyles from 'sentry/styles/pulsingIndicator';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import EventWaiter from 'sentry/utils/eventWaiter';
import localStorage from 'sentry/utils/localStorage';
import marked from 'sentry/utils/marked';
import useApi from 'sentry/utils/useApi';
import useOrganization from 'sentry/utils/useOrganization';
import useProjects from 'sentry/utils/useProjects';

import wizardContent from './docs';

function PerformanceOnboardingSidebar(props: CommonSidebarProps) {
  const {currentPanel, collapsed, hidePanel, orientation} = props;
  const isActive = currentPanel === SidebarPanelKey.PerformanceOnboarding;
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
        <OnboardingContent currentProject={currentProject} />
      </TaskList>
    </TaskSidebarPanel>
  );
}

function generateOnboardingDocKeys(platform: PlatformKey): string[] {
  return ['1-install', '2-configure', '3-verify'].map(
    key => `${key}-performance-onboarding-${key}`
  );
}

function OnboardingContent({currentProject}: {currentProject: Project}) {
  const api = useApi();
  const organization = useOrganization();
  const [received, setReceived] = useState<boolean>(false);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  // const [html, setHtml] = useState<string | undefined>(undefined);
  // const [link, setLink] = useState<string | undefined>(undefined);
  const [increment, setIncrement] = useState<number>(0);

  const currentPlatform = platforms.find(p => p.id === currentProject.platform);

  useEffect(() => {
    if (!currentPlatform) {
      setLoadingDocs(false);
      return;
    }

    api.clear();
    setLoadingDocs(true);

    loadDocs(
      api,
      organization.slug,
      currentProject.slug,
      'javascript-performance-onboarding-1-install' as any
    )
      .then(({html, link}) => {
        // TODO:
        console.log('html', html);
        console.log('link', link);

        setLoadingDocs(false);
      })
      .catch(error => {
        Sentry.captureException(error);
        setLoadingDocs(false);
      });
  }, [currentPlatform]);

  const docs = wizardContent[currentProject.platform || 'javascript'];

  if (loadingDocs) {
    return <div>Loading</div>;
  }

  if (!currentPlatform || !docs) {
    // TODO: generate sentry error
    return (
      <Fragment>
        <div>
          {t(
            'We are unable to find performance setup instructions for your project. This should not have happened. Rest assured we are notified and are on the case.'
          )}
        </div>
        <div>
          <Button size="small" href="https://docs.sentry.io/platforms/" external>
            {t('Go to Sentry Documentation')}
          </Button>
        </div>
      </Fragment>
    );
  }

  const tasks = [docs.INSTALL, docs.CONFIGURE, docs.VERIFY];
  return (
    <Fragment>
      <div>
        {tct(
          `Adding performance to your [platform] project is simple. Make sure you've got these basics down.`,
          {platform: currentPlatform?.name || currentProject.slug}
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
                setReceived(true);
              }}
            >
              {() => (received ? <EventReceivedIndicator /> : <EventWaitingIndicator />)}
            </EventWaiter>
          );
        }

        const localStorageKey = `perf-onboarding-${currentProject.id}-${index}`;
        const isChecked = localStorage.getItem(localStorageKey) === 'check';

        return (
          <div key={index}>
            <TaskCheckBox>
              <CheckboxFancy
                size="22px"
                isChecked={isChecked}
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIncrement(increment + 1);
                  if (isChecked) {
                    localStorage.removeItem(localStorageKey);
                  } else {
                    localStorage.setItem(localStorageKey, 'check');
                  }

                  return;
                }}
              />
            </TaskCheckBox>
            <DocumentationWrapper dangerouslySetInnerHTML={{__html: marked(content)}} />
            {footer}
          </div>
        );
      })}
      <div>
        <Button
          size="small"
          onClick={() => {
            setReceived(true);
            const mockProjectUpdate: Project = {
              ...currentProject,
              firstTransactionEvent: true,
            };
            ProjectsStore.onUpdateSuccess(mockProjectUpdate);
          }}
        >
          {t('God mode: Send a Transaction')}
        </Button>
      </div>
    </Fragment>
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
  user-select: none;
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

const EventReceivedIndicator = styled((p: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p}>
    {'🎉 '}
    {t(`We've received this project's first transaction event!`)}
  </div>
))`
  display: flex;
  align-items: center;
  flex-grow: 1;
  font-size: ${p => p.theme.fontSizeMedium};
  color: ${p => p.theme.green300};
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

export default PerformanceOnboardingSidebar;

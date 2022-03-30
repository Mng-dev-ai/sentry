import {useEffect, useState} from 'react';
import styled from '@emotion/styled';

import HighlightTopRightPattern from 'sentry-images/pattern/highlight-top-right.svg';

import DropdownMenuControlV2 from 'sentry/components/dropdownMenuControlV2';
import {MenuItemProps} from 'sentry/components/dropdownMenuItemV2';
import IdBadge from 'sentry/components/idBadge';
import SidebarPanel from 'sentry/components/sidebar/sidebarPanel';
import {CommonSidebarProps, SidebarPanelKey} from 'sentry/components/sidebar/types';
import {t} from 'sentry/locale';
import PageFiltersStore from 'sentry/stores/pageFiltersStore';
import {useLegacyStore} from 'sentry/stores/useLegacyStore';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import useOrganization from 'sentry/utils/useOrganization';
import useProjects from 'sentry/utils/useProjects';

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
                project={{
                  ...currentProject,
                  slug: `${currentProject.slug} Checklist`,
                }}
                avatarSize={32}
                hideOverflow
                disableLink
              />
            }
            triggerProps={{
              'aria-label': `${currentProject.slug} checklist`,
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

export default PerformanceOnboardingSidebar;

import styled from '@emotion/styled';

import SidebarPanel from 'sentry/components/sidebar/sidebarPanel';
import {CommonSidebarProps, SidebarPanelKey} from 'sentry/components/sidebar/types';

function PerformanceOnboardingSidebar(props: CommonSidebarProps) {
  const {currentPanel, collapsed, hidePanel, orientation} = props;
  const isActive = currentPanel === SidebarPanelKey.PerformanceOnboarding;

  if (!isActive) {
    return null;
  }

  return (
    <TaskSidebarPanel
      orientation={orientation}
      collapsed={collapsed}
      hidePanel={hidePanel}
    >
      <div>hello</div>
    </TaskSidebarPanel>
  );
}

const TaskSidebarPanel = styled(SidebarPanel)`
  width: 450px;
`;

export default PerformanceOnboardingSidebar;

import {useState} from 'react';
import styled from '@emotion/styled';

import CheckboxFancy from 'sentry/components/checkboxFancy/checkboxFancy';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import localStorage from 'sentry/utils/localStorage';

type Props = {
  docContent: string | undefined;
  docKey: string;
  project: Project;
};

function OnBoardingStep(props: Props) {
  const {docKey, project, docContent} = props;

  const [increment, setIncrement] = useState<number>(0);

  const localStorageKey = `perf-onboarding-${project.id}-${docKey}`;
  const isChecked = localStorage.getItem(localStorageKey) === 'check';

  if (!docContent) {
    return null;
  }

  return (
    <div>
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
      <DocumentationWrapper dangerouslySetInnerHTML={{__html: docContent}} />
    </div>
  );
}

const TaskCheckBox = styled('div')`
  float: left;
  margin-right: ${space(1.5)};
  height: 27px;
  display: flex;
  align-items: center;
  user-select: none;
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

export default OnBoardingStep;

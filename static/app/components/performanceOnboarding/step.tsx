import {Dispatch, useEffect, useState} from 'react';
import styled from '@emotion/styled';
import * as Sentry from '@sentry/react';

import {loadDocs} from 'sentry/actionCreators/projects';
import CheckboxFancy from 'sentry/components/checkboxFancy/checkboxFancy';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import localStorage from 'sentry/utils/localStorage';
import useApi from 'sentry/utils/useApi';
import useOrganization from 'sentry/utils/useOrganization';

type Props = {
  docContent: string | undefined;
  docKey: string;
  project: Project;
  setDocContent: Dispatch<string>;
  setLoadingDoc: Dispatch<boolean>;
};

function OnBoardingStep(props: Props) {
  const {project, docKey, setLoadingDoc, setDocContent, docContent} = props;

  const api = useApi();
  const organization = useOrganization();
  const [increment, setIncrement] = useState<number>(0);

  const localStorageKey = `perf-onboarding-${project.id}-${docKey}`;
  const isChecked = localStorage.getItem(localStorageKey) === 'check';

  const currentPlatform = project.platform;

  useEffect(() => {
    if (!currentPlatform) {
      setLoadingDoc(false);
      return;
    }

    api.clear();
    setLoadingDoc(true);

    loadDocs(api, organization.slug, project.slug, docKey as any)
      .then(({html, link}) => {
        // console.log(docKey, html);
        setDocContent(html as string);
        setLoadingDoc(false);
      })
      .catch(error => {
        Sentry.captureException(error);
        setLoadingDoc(false);
      });
  }, [currentPlatform]);

  // console.log(docKey, docContent);

  if (!docContent) {
    return <div>Loading</div>;
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

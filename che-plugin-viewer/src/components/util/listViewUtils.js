import * as React from 'react';
import { ListView, Button } from 'patternfly-react';
import classNames from 'classnames';

export const renderActions = (actions, rowNum) => (
  <div>
    {actions.map(({ label, fn }, index) => (
      <Button key={index} onClick={() => fn(rowNum + 1)}>
        {label}
      </Button>
    ))}
  </div>
);

export const renderAdditionalInfoItems = itemProperties =>
  itemProperties &&
  Object.keys(itemProperties).map(prop => {
    const cssClassNames = classNames('pficon', {
      'pficon-flavor': prop === 'hosts',
      'pficon-cluster': prop === 'clusters',
      'pficon-container-node': prop === 'nodes',
      'pficon-image': prop === 'images'
    });
    return (
      <ListView.InfoItem key={prop}>
        <span className={cssClassNames} />
        <strong>{itemProperties[prop]}</strong> {prop}
      </ListView.InfoItem>
    );
  });

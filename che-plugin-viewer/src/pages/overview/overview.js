import * as React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import connect from 'react-redux/es/connect/connect';

import { Button } from 'patternfly-react/dist/esm/components/Button';
import { EmptyState } from 'patternfly-react/dist/esm/components/EmptyState';
import { ListView } from 'patternfly-react/dist/esm/components/ListView';

import { getImageForIconClass } from '../../utils/catalogItemIcon';
import CreateInstance from '../createInstance/createInstance';

const action1 = rowNum => alert(`Action 1 executed on Row ${rowNum}`);
const action2 = rowNum => alert(`Action 2 executed on Row ${rowNum}`);

const rowActions = [
  { label: 'Action 1', fn: action1 },
  { label: 'Action 2', fn: action2 }
];

const renderActions = (actions, rowNum) => (
  <div>
    {actions.map(({ label, fn }, index) => (
      <Button key={index} onClick={() => fn(rowNum + 1)}>
        {label}
      </Button>
    ))}
  </div>
);

const Overview = ({ catalogInstances, createShown, createItem, history }) => {
  const renderOverview = () => (
    <div>
      <div className="page-header">
        <h1>Overview</h1>
      </div>
      {_.size(catalogInstances) > 0 && (
        <ListView>
          {catalogInstances.map(
            (
              {
                icon,
                name,
                instanceName,
                provider,
                createdAt,
                actions,
                description,
                version,
                healthIndex,
                certifiedLevel
              },
              index
            ) => (
                <ListView.Item
                  key={index}
                  checkboxInput={<input type="checkbox" />}
                  leftContent={
                    <img
                      className="overview-list-icon"
                      src={icon}
                      alt={name}
                    />
                  }
                  heading={name}
                  description={instanceName}
                  additionalInfo={[
                    <ListView.InfoItem key="certifiedLevel">
                      {certifiedLevel}
                    </ListView.InfoItem>,
                    <ListView.InfoItem key="healthIndex">
                      {healthIndex}
                    </ListView.InfoItem>,
                    <ListView.InfoItem key={version}>{version}</ListView.InfoItem>
                  ]}
                  actions={renderActions(rowActions, index)}
                >
                  <div className="row">
                    <div className="col-md-12">{description}</div>
                  </div>
                </ListView.Item>
              )
          )}
        </ListView>
      )}
      {_.size(catalogInstances) === 0 && (
        <EmptyState className="full-page-blank-slate">
          <EmptyState.Icon />
          <EmptyState.Title>No instances have been added</EmptyState.Title>
          <EmptyState.Info>
            Add Catalog or Marketplace items to show them in this view.
          </EmptyState.Info>
        </EmptyState>
      )}
    </div>
  );

  const renderCreateInstance = () => (
    <CreateInstance creatingItem={createItem} history={history} />
  );

  return createShown ? renderCreateInstance() : renderOverview();
};

Overview.propTypes = {
  catalogInstances: PropTypes.array,
  createShown: PropTypes.bool,
  createItem: PropTypes.object,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired
};

Overview.defaultProps = {
  catalogInstances: [],
  createShown: false,
  createItem: null
};

const mapStateToProps = state => ({
  ...state.catalog.catalogInstances,
  createShown: state.catalog.creatingInstance.shown,
  createItem: state.catalog.creatingInstance.creatingItem
});

export default connect(mapStateToProps)(Overview);

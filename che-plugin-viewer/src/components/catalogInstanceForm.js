/* eslint-disable react/no-unused-prop-types */
import * as React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import { Dropdown } from 'patternfly-react/dist/esm/components/Dropdown';
import { Form, Radio } from 'patternfly-react/dist/esm/components/Form';
import { Grid } from 'patternfly-react/dist/esm/components/Grid';
import { MenuItem } from 'patternfly-react/dist/esm/components/MenuItem';

import { helpers } from '../common/helpers';

class CatalogInstanceForm extends React.Component {
  state = {
    createItem: null,
    namespaces: helpers.fakeNamespaces
  };

  static getDerivedStateFromProps(props, state) {
    const { catalogItem } = props;
    if (!catalogItem || !_.isEqual(catalogItem, state.createItem)) {
      const createItem = helpers.createDefaultInstance(catalogItem);
      return {
        createItem,
        initItem: _.cloneDeep(createItem)
      };
    }

    return null;
  }

  renderFormLabel = label => (
    <Grid.Col componentClass={Form.ControlLabel} sm={5}>
      {label}
    </Grid.Col>
  );

  validateForm = createItem => !!createItem.instanceName;

  updateName = event => {
    const { createItem } = this.state;
    const { onChange } = this.props;
    createItem.instanceName = event.target.value;
    onChange(createItem, this.validateForm(createItem));
  };

  setNamespace = newNamespace => {
    const { createItem } = this.state;
    const { onChange } = this.props;
    createItem.namespace = newNamespace;
    onChange(createItem, this.validateForm(createItem));
  };

  onChangePlan = event => {
    const { createItem } = this.state;
    const { onChange } = this.props;
    createItem.plan = event.target.value;
    onChange(createItem, this.validateForm(createItem));
  };

  onValueChange = (event, field) => {
    const { createItem } = this.state;
    const { onChange } = this.props;
    createItem[field] = event.target.value;
    console.dir(createItem);
    onChange(createItem, this.validateForm(createItem));
  };

  renderFormLabel = label => {
    const { horizontal, labelSize } = this.props;
    if (horizontal) {
      return (
        <Grid.Col componentClass={Form.ControlLabel} sm={labelSize}>
          {label}
        </Grid.Col>
      );
    }
    return <Form.ControlLabel>{label}</Form.ControlLabel>;
  };

  renderFormControl = control => {
    const { horizontal, labelSize } = this.props;
    if (horizontal) {
      return <Grid.Col sm={12 - labelSize}>{control}</Grid.Col>;
    }
    return control;
  };

  render() {
    const { createItem, namespaces } = this.state;
    const { horizontal } = this.props;

    return (
      <Form horizontal={horizontal} onSubmit={e => e.preventDefault()}>
        <Form.FormGroup>
          {this.renderFormLabel('Project')}
          {this.renderFormControl(
            <div className="catalog-dropdownselect">
              <Dropdown id="projectDropdown">
                <Dropdown.Toggle>
                  <span>{createItem.namespace}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {_.map(namespaces, nextNamespace => (
                    <MenuItem
                      key={nextNamespace}
                      className={{
                        'catalog-dropdownselect-menuitem-selected':
                          createItem.namespace === nextNamespace
                      }}
                      eventKey="1"
                      onClick={() => this.setNamespace(nextNamespace)}
                    >
                      {nextNamespace}
                    </MenuItem>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Name')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              autoFocus
              placeholder="Enter a name"
              value={createItem.instanceName}
              onChange={e => this.updateName(e)}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Plans')}
          {this.renderFormControl(
            <React.Fragment>
              <Radio
                name="plans"
                value="Plan 1"
                checked={createItem.plan === 'Plan 1'}
                onChange={this.onChangePlan}
              >
                Plan 1
              </Radio>
              <Radio
                name="plans"
                value="Plan 2"
                checked={createItem.plan === 'Plan 2'}
                onChange={this.onChangePlan}
              >
                Plan 2
              </Radio>
            </React.Fragment>
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Memory Limit')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.memoryLimit}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Volume Capacity')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.volumeCapacity}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Git Repository URL')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.gitRepo}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Git Reference')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.gitRef}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Context Directory')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.contextDir}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Startup Project')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.startupProject}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('SDK Version')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.sdkVersion}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Startup Assembly')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.startupAssembly}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Npm Tools')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.npmTools}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Test Projects')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.testProjects}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
        <Form.FormGroup>
          {this.renderFormLabel('Configuration')}
          {this.renderFormControl(
            <Form.FormControl
              className="catalog-form-control"
              type="text"
              value={createItem.configuration}
              onChange={e => this.onValueChange(e, 'memoryLimit')}
            />
          )}
        </Form.FormGroup>
      </Form>
    );
  }
}

CatalogInstanceForm.propTypes = {
  catalogItem: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  horizontal: PropTypes.bool,
  labelSize: PropTypes.number
};

CatalogInstanceForm.defaultProps = {
  catalogItem: null,
  horizontal: true,
  labelSize: 5
};

export default CatalogInstanceForm;

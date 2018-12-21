import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import CatalogItemHeader from 'patternfly-react-extensions/dist/esm/components/CatalogItemHeader/CatalogItemHeader';
import { Grid } from 'patternfly-react/dist/esm/components/Grid';
import { Button } from 'patternfly-react/dist/esm/components/Button';
import { Modal } from 'patternfly-react/dist/esm/components/Modal';
import { ExpandCollapse } from 'patternfly-react/dist/esm/components/ExpandCollapse';

import { getImageForIconClass } from '../../utils/catalogItemIcon';
import {
  createCatalogInstance,
  hideCreateCatalogInstance
} from '../../redux/actions/catalogActions';

import CatalogInstanceForm from '../../components/catalogInstanceForm';
import { helpers } from '../../common/helpers';

class CreateInstance extends React.Component {
  constructor(props) {
    super(props);

    const createItem = helpers.createDefaultInstance(props.creatingItem);

    this.state = {
      createItem,
      createItemValid: false
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { instanceCreated, navRequest } = this.props;

    if (instanceCreated && !prevProps.instanceCreated) {
      this.props.history.push('/');
      this.props.hideCreateCatalogInstance();
    }
    if (navRequest !== prevProps.navRequest) {
      console.log(navRequest);
      this.onCancel(navRequest);
    }

    return null;
  }

  createInstance = () => {
    this.props.createCatalogInstance(this.state.createItem);
  };

  updateCreateItem = (item, valid) => {
    this.setState({ createItem: item, createItemValid: valid });
  };

  onCancel = (navigateTo = null) => {
    const { createItem } = this.state;

    if (!helpers.isDefaultInstance(createItem)) {
      helpers.showCancelCreateInstanceConfirmation(() =>
        this.props.hideCreateCatalogInstance(navigateTo)
      );
      return;
    }

    this.props.hideCreateCatalogInstance(navigateTo);
  };

  render() {
    const { createItem, createItemValid } = this.state;

    return (
      <Grid.Row className="catalog-create-instance">
        <Modal.Header>
          <h2>Create Catalog Instance</h2>
        </Modal.Header>
        <Modal.Body className="catalog-modal__body">
          <Grid fluid className="catalog-create-instance-form">
            <CatalogInstanceForm
              catalogItem={createItem}
              onChange={this.updateCreateItem}
              horizontal={false}
            />
          </Grid>
          <div className="catalog-modal__item catalog-modal__description">
            <div className="catalog-modal__description__header">
              <CatalogItemHeader
                className="catalog-modal__item-header"
                iconImg={getImageForIconClass(createItem.imgUrl)}
                title={createItem.name}
                vendor={<span> {createItem.provider}</span>}
              />
            </div>
            {createItem.shortDescription}
            <ExpandCollapse
              className="catalog-modal__long-description"
              align="center"
              bordered
              textCollapsed="More Information"
              textExpanded="Less Information"
            >
              {createItem.description}
            </ExpandCollapse>
          </div>
        </Modal.Body>
        <Modal.Footer className="catalog-modal__footer">
          <Button
            bsStyle="default"
            className="btn-cancel"
            onClick={this.onCancel}
          >
            Cancel
          </Button>
          <Button
            bsStyle="primary"
            onClick={this.createInstance}
            disabled={!createItemValid}
          >
            Create Instance
          </Button>
        </Modal.Footer>
        {this.props.creatingInstance && (
          <Modal show bsSize="sm">
            <Modal.Body>Creating...</Modal.Body>
          </Modal>
        )}
      </Grid.Row>
    );
  }
}

CreateInstance.propTypes = {
  creatingItem: PropTypes.object.isRequired,
  creatingInstance: PropTypes.bool,
  instanceCreated: PropTypes.bool,
  createCatalogInstance: PropTypes.func,
  hideCreateCatalogInstance: PropTypes.func,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  navRequest: PropTypes.string
};

CreateInstance.defaultProps = {
  creatingInstance: false,
  instanceCreated: false,
  createCatalogInstance: null,
  hideCreateCatalogInstance: null,
  navRequest: ''
};

const mapDispatchToProps = dispatch => ({
  createCatalogInstance: item => dispatch(createCatalogInstance(item)),
  hideCreateCatalogInstance: () => dispatch(hideCreateCatalogInstance())
});

const mapStateToProps = state => ({
  createItem: state.catalog.creatingItem,
  creatingInstance: state.catalog.catalogInstances.pending,
  instanceCreated: state.catalog.catalogInstances.fulfilled,
  navRequest: state.catalog.navigateRequest.navigateTo
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateInstance);

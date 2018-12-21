/* eslint-disable react/no-unused-prop-types */
import * as React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';

import { CatalogItemHeader } from 'patternfly-react-extensions/dist/esm/components/CatalogItemHeader';
import { Button } from 'patternfly-react/dist/esm/components/Button';
import { Grid } from 'patternfly-react/dist/esm/components/Grid';
import { Modal } from 'patternfly-react/dist/esm/components/Modal';

import { helpers } from '../common/helpers';
import { createCatalogInstance } from '../redux/actions/catalogActions';
import { getImageForIconClass } from '../utils/catalogItemIcon';
import CatalogInstanceForm from './catalogInstanceForm';

class CatalogItemCreateInstanceDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      createItem: null,
      createItemValid: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (!_.isEqual(props.detailsItem, state.detailsItem)) {
      return {
        detailsItem: props.detailsItem,
        createItem: _.cloneDeep(props.detailsItem)
      };
    }

    return null;
  }

  createInstance = () => {
    this.props.createCatalogInstance(this.state.createItem);
  };

  updateCreateItem = (item, valid) => {
    this.setState({ createItem: item, createItemValid: valid });
  };

  closeDialog = () => {
    const { createItem } = this.state;
    const { onClose } = this.props;

    if (!helpers.isDefaultInstance(createItem)) {
      helpers.showCancelCreateInstanceConfirmation(onClose);
      return;
    }

    onClose();
  };

  render() {
    const { createItem, createItemValid } = this.state;

    return (
      <Modal
        show
        backdrop
        onHide={this.closeDialog}
        className="right-side-modal-pf catalog-create-instance-dialog"
        bsSize="lg"
      >
        <Modal.Header>
          <Modal.CloseButton onClick={this.closeDialog} />
          <CatalogItemHeader
            className="catalog-modal__item-header"
            iconImg={getImageForIconClass(createItem.imgUrl)}
            title={createItem.name}
            vendor={`${createItem.version} provided by ${createItem.provider}`}
          />
        </Modal.Header>
        <Modal.Body>
          <h3>Description</h3>
          {createItem.shortDescription}
          <h3>Create Catalog Instance</h3>
          <Grid fluid className="catalog-create-instance-form">
            <CatalogInstanceForm
              catalogItem={createItem}
              onChange={this.updateCreateItem}
              horizontal
              labelSize={3}
            />
          </Grid>
        </Modal.Body>
        <Modal.Footer className="catalog-modal__footer">
          <Button
            bsStyle="default"
            className="btn-cancel"
            onClick={this.closeDialog}
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
      </Modal>
    );
  }
}

CatalogItemCreateInstanceDialog.propTypes = {
  detailsItem: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  createCatalogInstance: PropTypes.func
};

CatalogItemCreateInstanceDialog.defaultProps = {
  createCatalogInstance: helpers.noop
};

const mapDispatchToProps = dispatch => ({
  createCatalogInstance: item => dispatch(createCatalogInstance(item))
});

const mapStateToProps = state => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CatalogItemCreateInstanceDialog);

import * as React from 'react';
import PropTypes from 'prop-types';
import connect from 'react-redux/es/connect/connect';

import Modal from 'patternfly-react/dist/esm/components/Modal/Modal';
import EmptyState from 'patternfly-react/dist/esm/components/EmptyState/EmptyState';
import { Alert } from 'patternfly-react/dist/esm/components/Alert';

import CatalogView from '../../components/catalogView';
import CreateInstance from '../createInstance/createInstance';
import {
  fetchCatalogItems,
  navigateRequestClear
} from '../../redux/actions/catalogActions';
import { helpers } from '../../common/helpers';

class CatalogA extends React.Component {
  componentDidMount() {
    this.refresh();
  }

  componentDidUpdate(prevProps) {
    const { createShown, navigateOnHide, history } = this.props;
    if (createShown !== prevProps.createShown) {
      if (!createShown && navigateOnHide) {
        this.props.navigateRequestClear();
        history.push(navigateOnHide);
      }
    }
  }
  refresh() {
    this.props.fetchCatalogItems();
  }

  renderPendingMessage = () => {
    const { pending } = this.props;
    if (pending) {
      return (
        <Modal bsSize="lg" backdrop={false} show animation={false}>
          <Modal.Body>
            <div className="spinner spinner-xl" />
            <div className="text-center">Loading catalog items...</div>
          </Modal.Body>
        </Modal>
      );
    }

    return null;
  };

  renderError = () => {
    const { errorMessage } = this.props;

    return (
      <EmptyState>
        <Alert type="error">
          <span>Error retrieving catalog items: {errorMessage}</span>
        </Alert>
        {this.renderPendingMessage()}
      </EmptyState>
    );
  };

  renderView = () => {
    const { error, pending, history, catalogItems } = this.props;

    if (error) {
      return this.renderError();
    }

    if (pending) {
      return this.renderPendingMessage();
    }

    return (
      <CatalogView history={history} noDetails catalogItems={catalogItems} />
    );
  };

  render() {
    const { createShown, createItem, history } = this.props;

    const catalogView = (
      <div>
        <div className="page-header">
          <h1>Catalog A</h1>
        </div>
        {this.renderView()}
      </div>
    );

    return createShown ? (
      <CreateInstance creatingItem={createItem} history={history} />
    ) : (
        catalogView
      );
  }
}

CatalogA.propTypes = {
  catalogItems: PropTypes.array,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  pending: PropTypes.bool,
  createShown: PropTypes.bool,
  navigateOnHide: PropTypes.string,
  createItem: PropTypes.object,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  fetchCatalogItems: PropTypes.func,
  navigateRequestClear: PropTypes.func
};

CatalogA.defaultProps = {
  catalogItems: [],
  error: false,
  errorMessage: '',
  pending: false,
  createShown: false,
  navigateOnHide: '',
  createItem: null,
  fetchCatalogItems: helpers.noop,
  navigateRequestClear: helpers.noop
};

const mapDispatchToProps = dispatch => ({
  fetchCatalogItems: () => dispatch(fetchCatalogItems()),
  navigateRequestClear: () => dispatch(navigateRequestClear())
});

const mapStateToProps = state => ({
  ...state.catalog.catalogItems,
  createShown: state.catalog.creatingInstance.shown,
  createItem: state.catalog.creatingInstance.creatingItem,
  navigateOnHide: state.catalog.navigateRequest.navigateTo
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CatalogA);

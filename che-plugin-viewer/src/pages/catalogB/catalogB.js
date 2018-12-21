import * as React from 'react';
import PropTypes from 'prop-types';
import connect from 'react-redux/es/connect/connect';

import Modal from 'patternfly-react/dist/esm/components/Modal/Modal';
import EmptyState from 'patternfly-react/dist/esm/components/EmptyState/EmptyState';
import { Alert } from 'patternfly-react/dist/esm/components/Alert';

import CatalogView from '../../components/catalogView';
import CreateInstance from '../createInstance/createInstance';
import { fetchCatalogItems } from '../../redux/actions/catalogActions';
import { helpers } from '../../common/helpers';

class CatalogB extends React.Component {
  componentDidMount() {
    this.refresh();
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

    return <CatalogView history={history} catalogItems={catalogItems} />;
  };

  render() {
    const { createShown, createItem, history } = this.props;

    const catalogView = (
      <div>
        <div className="page-header">
          <h1>Catalog B</h1>
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

CatalogB.propTypes = {
  catalogItems: PropTypes.array,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  pending: PropTypes.bool,
  createShown: PropTypes.bool,
  createItem: PropTypes.object,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  fetchCatalogItems: PropTypes.func
};

CatalogB.defaultProps = {
  catalogItems: [],
  error: false,
  errorMessage: '',
  pending: false,
  createShown: false,
  createItem: null,
  fetchCatalogItems: helpers.noop
};

const mapDispatchToProps = dispatch => ({
  fetchCatalogItems: () => dispatch(fetchCatalogItems())
});

const mapStateToProps = state => ({
  ...state.catalog.catalogItems,
  createShown: state.catalog.creatingInstance.shown,
  createItem: state.catalog.creatingInstance.creatingItem
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CatalogB);

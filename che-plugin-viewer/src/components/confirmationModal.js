import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Icon } from 'patternfly-react/dist/esm/components/Icon';

import Store from '../redux/store';
import { confirmationModalConstants } from '../redux/constants';
import { helpers } from '../common/helpers';
import MessageDialog from './messageDialog';

class ConfirmationModal extends React.Component {
  cancel = () => {
    if (this.props.onCancel) {
      this.props.onCancel();
    } else {
      Store.dispatch({
        type: confirmationModalConstants.CONFIRMATION_MODAL_HIDE
      });
    }
  };

  render() {
    const {
      show,
      title,
      heading,
      body,
      icon,
      confirmButtonText,
      cancelButtonText,
      onConfirm
    } = this.props;

    return (
      <MessageDialog
        show={show}
        onHide={this.cancel}
        primaryAction={onConfirm}
        secondaryAction={this.cancel}
        primaryActionButtonContent={confirmButtonText}
        secondaryActionButtonContent={cancelButtonText}
        primaryActionButtonBsStyle="primary"
        title={title}
        icon={icon}
        primaryText={heading}
        secondaryText={body}
        enforceFocus
      />
    );
  }
}

ConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.string,
  heading: PropTypes.node,
  icon: PropTypes.node,
  body: PropTypes.node,
  confirmButtonText: PropTypes.string,
  cancelButtonText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func
};

ConfirmationModal.defaultProps = {
  title: 'Confirm',
  heading: null,
  body: null,
  icon: <Icon type="pf" name="warning-triangle-o" />,
  confirmButtonText: 'Confirm',
  cancelButtonText: '',
  onConfirm: helpers.noop,
  onCancel: null
};

const mapStateToProps = state => ({
  ...state.confirmationModal
});

export default connect(mapStateToProps)(ConfirmationModal);

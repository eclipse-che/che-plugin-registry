/* eslint-disable react/no-did-update-set-state */
import * as React from 'react';
import PropTypes from 'prop-types';

import { CatalogItemHeader } from 'patternfly-react-extensions/dist/esm/components/CatalogItemHeader';
import {
  PropertiesSidePanel,
  PropertyItem
} from 'patternfly-react-extensions/dist/esm/components/PropertiesSidePanel';
import { Button } from 'patternfly-react/dist/esm/components/Button';
import { Modal } from 'patternfly-react/dist/esm/components/Modal';
import { Alert } from 'patternfly-react/dist/esm/components/Alert'

const notAvailable = (
  <span className="properties-side-panel-pf-property-label">N/A</span>
);

const CatalogItemDetailsDialog = ({
  detailsItem,
  onShowCreateInstance,
  onClose,
  onDismiss
}) => (
    <Modal
      show
      backdrop
      onHide={onClose}
      className="right-side-modal-pf"
      bsSize="lg"
    >
      <Modal.Header>
        <Modal.CloseButton onClick={onClose} />
        <CatalogItemHeader
          className="catalog-modal__item-header"
          iconImg={detailsItem.icon}
          title={detailsItem.name}
          vendor={`${detailsItem.version} provided by ${detailsItem.provider}`}
        />
      </Modal.Header>
      <Modal.Body>
        <div className="catalog-modal__body">
          <PropertiesSidePanel>
            <Button
              bsStyle="primary"
              className="catalog-modal__subscribe"
              onClick={onShowCreateInstance}
            >
              Preview
           </Button>
            <PropertyItem
              label="Operator Version"
              value={detailsItem.version || notAvailable}
            />
            <PropertyItem
              label="Certified Level"
              value={detailsItem.certifiedLevel || notAvailable}
            />
            <PropertyItem
              label="Provider"
              value={detailsItem.provider || notAvailable}
            />
            <PropertyItem
              label="Health Index"
              value={detailsItem.healthIndex || notAvailable}
            />
            <PropertyItem
              label="Repository"
              value={detailsItem.url || notAvailable}
            />
            <PropertyItem
              label="Container Image"
              value={detailsItem.containerImage || notAvailable}
            />
            <PropertyItem
              label="Created At"
              value={detailsItem.createdAt || notAvailable}
            />
            <PropertyItem
              label="Support"
              value={detailsItem.support || notAvailable}
            />
          </PropertiesSidePanel>
          <div className="catalog-modal__item catalog-modal__description">
            <div key="desc">
              {/* <div class="alert alert-info alert-dismissable">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                  <span class="pficon pficon-close"></span>
                </button>
                <span class="pficon pficon-info"></span>
                <p><strong>Steps to enable this plugin</strong></p>
                <p>Go to che dashboard then select worskpaces</p>
                <p>Select the worskpace for which you want to activate this plugin</p>
                <p>Click on plugins to see the list of plugins and activate the required plugin</p>
              </div> */}
              <Alert type="info" onClick={onClose}>
                I am an Alert with type="
                info
                "
              </Alert>

              <h2>Overview</h2>
              A sample che plugin.
    <h2 key="desc-1">Features</h2>
              Praesent sagittis est et arcu fringilla placerat. Cras erat ante, dapibus
              non mauris ac, volutpat sollicitudin ligula. Morbi gravida nisl vel risus
              tempor, sit amet luctus erat tempus. Curabitur blandit sem non pretium
              bibendum. Donec eleifend non turpis vitae vestibulum. Vestibulum ut sem ac
              nunc posuere blandit sed porta lorem. Cras rutrum velit vel leo iaculis
              imperdiet.
              <h2 key="desc-2">Screenshots/Videos</h2>
              <img src={require('./scr1.png')} height='110px' />
              <h2 key="desc-3">Configuration</h2>
              Curabitur nisl quam, interdum a venenatis a, consequat a ligula. Nunc nec
              lorem in erat rhoncus lacinia at ac orci. Sed nec augue congue, vehicula
              justo quis, venenatis turpis. Nunc quis consectetur purus. Nam vitae viverra
              lacus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum
              eu augue felis. Maecenas in dignissim purus, quis pulvinar lectus. Vivamus
              euismod ultrices diam, in mattis nibh.
      <h2 key="desc-4">Documentation</h2>
              <a key="link-1" href="https://www.patternfly.org/">
                https://www.patternfly.org
      </a>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );

CatalogItemDetailsDialog.propTypes = {
  detailsItem: PropTypes.object.isRequired,
  onShowCreateInstance: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onShowDialog: PropTypes.func.isRequired,
};

export default CatalogItemDetailsDialog;

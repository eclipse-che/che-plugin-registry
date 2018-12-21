import * as React from 'react';
import * as _ from 'lodash-es';
import { store } from '../redux/store';
import { confirmationModalConstants } from '../redux/constants';

const noop = Function.prototype;

const fakeNamespaces = [
  'default',
  'development',
  'my-project',
  'production',
  'qa',
  'test-project'
];

const defaultInstanceData = {
  instanceName: '',
  namespace: fakeNamespaces[0],
  plan: 'Plan 1',
  memoryLimit: '128Mi',
  volumeCapacity: '256Mi',
  gitRepo: 'https://github.com/redhat-developer/s2i-aspnet-musicstore-ex.git',
  gitRef: 'https://github.com/redhat-developer/s2i-aspnet-musicstore-ex.git',
  contextDir: '',
  startupProject: 'samples/MusicStore',
  sdkVersion: '',
  startupAssembly: '',
  npmTools: '',
  testProjects: '',
  configuration: 'Release'
};

const createDefaultInstance = catalogItem => ({
  ...defaultInstanceData,
  ..._.cloneDeep(catalogItem)
});

const isDefaultInstance = catalogItem => {
  const compItem = _.pick(catalogItem, _.keys(defaultInstanceData));
  return _.isEqual(compItem, defaultInstanceData);
};

const showCancelCreateInstanceConfirmation = confirmed => {
  const onConfirm = () => {
    store.dispatch({
      type: confirmationModalConstants.CONFIRMATION_MODAL_HIDE
    });
    confirmed();
  };

  const message = <span>Discard unsaved changes?</span>;

  store.dispatch({
    type: confirmationModalConstants.CONFIRMATION_MODAL_SHOW,
    title: 'Cancel Create Instance',
    heading: message,
    confirmButtonText: 'Discard',
    cancelButtonText: 'Cancel',
    onConfirm
  });
};

const setStateProp = (prop, data, options) => {
  const { state = {}, initialState = {}, reset = true } = options;
  const obj = { ...state };

  if (!state[prop]) {
    console.error(
      `Error: Property ${prop} does not exist within the passed state.`,
      state
    );
  }

  if (reset && !initialState[prop]) {
    console.warn(
      `Warning: Property ${prop} does not exist within the passed initialState.`,
      initialState
    );
  }

  if (reset) {
    obj[prop] = {
      ...state[prop],
      ...initialState[prop],
      ...data
    };
  } else {
    obj[prop] = {
      ...state[prop],
      ...data
    };
  }

  return obj;
};

const viewPropsChanged = (nextViewOptions, currentViewOptions) =>
  nextViewOptions.currentPage !== currentViewOptions.currentPage ||
  nextViewOptions.pageSize !== currentViewOptions.pageSize;

const createViewQueryObject = (viewOptions, queryObj) => {
  const queryObject = {
    ...queryObj
  };

  if (viewOptions) {
    queryObject.page = viewOptions.currentPage;
    queryObject.page_size = viewOptions.pageSize;
  }

  return queryObject;
};

const getErrorMessageFromResults = results => {
  const responseData = _.get(results, 'response.data', results.message);

  if (typeof responseData === 'string') {
    return responseData;
  }

  const getMessages = messageObject =>
    _.map(messageObject, next => {
      if (_.isString(next)) {
        return next;
      }
      if (_.isArray(next)) {
        return getMessages(next);
      }
      return 'Unknown error';
    });

  return _.join(getMessages(responseData), '\n');
};

const FULFILLED_ACTION = base => `${base}_FULFILLED`;

const PENDING_ACTION = base => `${base}_PENDING`;

const REJECTED_ACTION = base => `${base}_REJECTED`;

export const helpers = {
  noop,
  fakeNamespaces,
  createDefaultInstance,
  isDefaultInstance,
  showCancelCreateInstanceConfirmation,
  setStateProp,
  viewPropsChanged,
  createViewQueryObject,
  getErrorMessageFromResults,
  FULFILLED_ACTION,
  PENDING_ACTION,
  REJECTED_ACTION
};

export default helpers;

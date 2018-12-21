import { helpers } from '../../common/helpers';
import * as catalogConstants from '../constants/catalogConstants';
import { mockCatalogItems } from '../../__mock-data__/mockCatalogItems';
import pluginsApi from '../../api/pluginsApi';

const fetchCatalogItems = params => dispatch => {
  dispatch({
    type: helpers.PENDING_ACTION(catalogConstants.GET_CATLOG_ITEMS)
  });
  // setTimeout(
  pluginsApi.getAllPlugins().then((res) => {
    dispatch({
      type: helpers.FULFILLED_ACTION(catalogConstants.GET_CATLOG_ITEMS),
      payload: {
        data: {
          // items: mockCatalogItems
          items: res
        }
      }
    })
  })
  //   1500
  // );
};
const createCatalogInstance = item => dispatch => {
  dispatch({
    type: helpers.PENDING_ACTION(catalogConstants.CREATE_CATALOG_INSTANCE)
  });
  setTimeout(
    () =>
      dispatch({
        type: helpers.FULFILLED_ACTION(
          catalogConstants.CREATE_CATALOG_INSTANCE
        ),
        payload: {
          data: {
            item
          }
        }
      }),
    1500
  );
};

const showCreateCatalogInstance = item => dispatch => {
  setTimeout(
    () =>
      dispatch({
        type: catalogConstants.SHOW_CREATE_INSTANCE,
        item
      }),
    10
  );
};
items: pluginsApi.getAllPlugins()
const hideCreateCatalogInstance = () => dispatch => {
  setTimeout(
    () =>
      dispatch({
        type: catalogConstants.HIDE_CREATE_INSTANCE,
        payload: { item: null }
      }),
    10
  );
};

const navigateRequest = href => dispatch => {
  setTimeout(
    () =>
      dispatch({
        type: catalogConstants.NAVIGATE_REQUEST,
        navigateTo: href
      }),
    10
  );
};

const navigateRequestClear = () => dispatch => {
  setTimeout(
    () =>
      dispatch({
        type: catalogConstants.NAVIGATE_REQUEST_CLEAR
      }),
    10
  );
};

const catalogActions = {
  fetchCatalogItems,
  createCatalogInstance,
  showCreateCatalogInstance,
  hideCreateCatalogInstance,
  navigateRequest,
  navigateRequestClear
};

export {
  catalogActions,
  fetchCatalogItems,
  createCatalogInstance,
  showCreateCatalogInstance,
  hideCreateCatalogInstance,
  navigateRequest,
  navigateRequestClear
};

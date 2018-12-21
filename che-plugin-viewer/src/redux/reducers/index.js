import { combineReducers } from 'redux';
import { catalogReducer } from './catalogReducer';
import { confirmationModalReducer } from './confirmationModalReducer';

const reducers = {
  catalog: catalogReducer,
  confirmationModal: confirmationModalReducer
};

const reduxReducers = combineReducers(reducers);

export { reduxReducers, reducers };

export default reduxReducers;

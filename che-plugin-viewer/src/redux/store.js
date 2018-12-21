import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { reduxReducers } from './reducers';

const history = createBrowserHistory();
const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  connectRouter(history)(reduxReducers),
  composeEnhancer(
    applyMiddleware(
      routerMiddleware(history),
      thunkMiddleware,
      promiseMiddleware()
    )
  )
);

const reloadReducers = () => {
  store.replaceReducer(connectRouter(history)(reduxReducers));
};

export { store as default, store, reloadReducers };

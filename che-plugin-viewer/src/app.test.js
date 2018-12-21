import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { baseName } from './routes';
import App from './app';

const store = createStore((state = []) => state);

it('renders without crashing', () => {
  // Would you like to debug Jest tests in Chrome? See the following note:
  // https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#debugging-tests-in-chrome
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <Router basename={baseName}>
        <App />
      </Router>
    </Provider>,
    div
  );
});

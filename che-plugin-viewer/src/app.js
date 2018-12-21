import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { routes } from './routes';

import './app.css';
import Nav from './components/nav';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.menu = routes();
  }

  render() {
    const { location, history } = this.props;
    return <Nav routes={this.menu} location={location} history={history} />;
  }
}

App.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

export default withRouter(App);

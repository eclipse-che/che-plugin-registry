import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect, Switch } from 'react-router-dom';
import connect from 'react-redux/es/connect/connect';
import {
  VerticalNav,
  VerticalNavItem,
  VerticalNavSecondaryItem,
  VerticalNavMasthead,
  VerticalNavBrand,
  VerticalNavIconBar,
  Dropdown,
  Icon,
  MenuItem,
  Grid
} from 'patternfly-react';
import pfLogo from 'patternfly/dist/img/logo-alt.svg';
import * as cheLogo from '../img/che-logo.svg';
import * as cheText from '../img/che-text.svg'
import pfBrand from 'patternfly/dist/img/brand-alt.svg';
import ConfirmationModal from '../components/confirmationModal';

import { helpers } from '../common/helpers';
import { navigateRequest } from '../redux/actions/catalogActions';

class Nav extends React.Component {
  renderContent = () => {
    const { routes } = this.props;
    const allRoutes = [];
    routes.map((item, index) => {
      allRoutes.push(
        <Route key={index} exact path={item.to} component={item.component} />
      );
      if (item.subItems) {
        item.subItems.map((secondaryItem, subIndex) =>
          allRoutes.push(
            <Route
              key={subIndex}
              exact
              path={secondaryItem.to}
              component={secondaryItem.component}
            />
          )
        );
      }
      return allRoutes;
    });

    return (
      <Switch>
        {allRoutes}
        <Redirect from="*" to="/" key="default-route" />
      </Switch>
    );
  };

  navigateTo = path => {
    const { history, createShown } = this.props;
    console.dir(this.props);
    console.log(`CreateShown: ${createShown}`);
    if (createShown) {
      this.props.navigateRequest(path);
      return;
    }

    console.log(`Pushing: ${path}`);
    history.push(path);
  };

  render() {
    const { location, routes } = this.props;

    const vertNavItems = routes.map(item => {
      const active = location.pathname === item.to;
      const subItemActive =
        item.subItems &&
        item.subItems.some(subItem => location.pathname === subItem.to);
      return (
        <VerticalNavItem
          key={item.to}
          title={item.title}
          iconClass={item.iconClass}
          active={active || subItemActive}
          onClick={() => this.navigateTo(item.to)}
        >
          {item.subItems &&
            item.subItems.map(secondaryItem => (
              <VerticalNavSecondaryItem
                key={secondaryItem.to}
                title={secondaryItem.title}
                iconClass={secondaryItem.iconClass}
                active={secondaryItem.to === location.pathname}
                onClick={() => this.navigateTo(secondaryItem.to)}
              />
            ))}
        </VerticalNavItem>
      );
    });

    const dropdownComponentClass = props => (
      <li className={props.className}>{props.children}</li>
    );

    return (
      <React.Fragment>
        <VerticalNav persistentSecondary={false}>
          <VerticalNavMasthead>
            <VerticalNavBrand titleImg={cheText} iconImg={cheLogo} />
            <VerticalNavIconBar>
              {/* <Dropdown componentClass={dropdownComponentClass} id="help">
                <Dropdown.Toggle
                  className="nav-item-iconic"
                  bsStyle="link"
                  noCaret
                >
                  <Icon type="pf" name="help" />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <MenuItem eventKey="1">Help</MenuItem>
                  <MenuItem eventKey="2">About</MenuItem>
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown componentClass={dropdownComponentClass} id="user">
                <Dropdown.Toggle className="nav-item-iconic" bsStyle="link">
                  <Icon type="pf" name="user" />{' '}
                  <span className="dropdown-title">Brian Johnson</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <MenuItem eventKey="1">Preferences</MenuItem>
                  <MenuItem eventKey="2">Logout</MenuItem>
                </Dropdown.Menu>
              </Dropdown> */}
            </VerticalNavIconBar>
          </VerticalNavMasthead>
          {vertNavItems}
        </VerticalNav>
        <Grid fluid className="container-pf-nav-pf-vertical">
          <ConfirmationModal key="confirmationModal" />
          {this.renderContent()}
        </Grid>
      </React.Fragment>
    );
  }
}

Nav.propTypes = {
  routes: PropTypes.array.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  createShown: PropTypes.bool,
  navigateRequest: PropTypes.func
};

Nav.defaultProps = {
  createShown: false,
  navigateRequest: helpers.noop
};

const mapDispatchToProps = dispatch => ({
  navigateRequest: path => dispatch(navigateRequest(path))
});

const mapStateToProps = state => ({
  createShown: state.catalog.creatingInstance.shown
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Nav);

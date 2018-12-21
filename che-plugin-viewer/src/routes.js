import Overview from './pages/overview/overview';
import CatalogA from './pages/catalogA/catalogA';
import CatalogB from './pages/catalogB/catalogB';
import CatalogC from './pages/catalogC/catalogC';
import Administration from './pages/administration/administration';

const baseName = '/';

const routes = () => [
  // {
  //   iconClass: 'fa fa-dashboard',
  //   title: 'Overview',
  //   to: '/',
  //   component: Overview
  // },
  // {
  //   iconClass: 'fa fa-star',
  //   title: 'Catalog A',
  //   to: '/catalog',
  //   component: CatalogA
  // },
  // {
  //   iconClass: 'fa fa-bell',
  //   title: 'Catalog B',
  //   to: '/catalog-b',
  //   component: CatalogB
  // },
  {
    iconClass: 'fa fa-bell',
    title: 'Plugins List',
    to: '/plugins',
    component: CatalogC
  }
  // {
  //   iconClass: 'fa fa-cog',
  //   title: 'Administration',
  //   to: '/admin',
  //   component: Administration
  // }
];

export { baseName, routes };

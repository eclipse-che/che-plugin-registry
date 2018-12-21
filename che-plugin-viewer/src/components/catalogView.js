/* eslint-disable react/no-did-update-set-state */
import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';

import { CatalogTileView } from 'patternfly-react-extensions/dist/esm/components/CatalogTileView';
import { CatalogTile } from 'patternfly-react-extensions/dist/esm/components/CatalogTile';
import { VerticalTabs } from 'patternfly-react-extensions/dist/esm/components/VerticalTabs';
import { FilterSidePanel } from 'patternfly-react-extensions/dist/esm/components/FilterSidePanel';
import { EmptyState } from 'patternfly-react/dist/esm/components/EmptyState';
import { Modal } from 'patternfly-react/dist/esm/components/Modal';
import FormControl from 'patternfly-react/dist/esm/components/Form/FormControl';

import { helpers } from '../common/helpers';
import { Button } from 'patternfly-react/dist/esm/components/Button';
import { showCreateCatalogInstance } from '../redux/actions/catalogActions';
import {
  normalizeIconClass,
  getImageForIconClass
} from '../utils/catalogItemIcon';
import {
  categorizeItems,
  recategorizeItems
} from '../utils/categorizeCatalogItems';
import CatalogItemDetailsDialog from '../components/catalogItemDetailsDialog';
import CatalogItemCreateInstanceDialog from '../components/catalogItemCreateInstanceDialog';

class CatalogView extends React.Component {
  constructor(props) {
    super(props);

    const activeTabs = ['all']; // array of tabs [main category, sub-category]
    const filters = {
      byName: {
        value: '',
        active: false
      },
      byType: {
        chePlugin: {
          label: 'Plugin',
          value: 'Che Plugin',
          active: false
        },
        cheEditor: {
          label: 'Editor',
          value: 'Che Editor',
          active: false
        }
      }
    };

    let filterCounts = {
      byType: {
        chePlugins: 0,
        cheEditors: 0
      }
    };

    this.state = {
      activeTabs,
      filters,
      filterCounts,
      showAllItemsForCategory: null,
      detailsItem: null,
      showDetails: false,
      showCreateInstance: false,
      showDialog: false
    };

    if (_.size(props.catalogItems)) {
      const categories = categorizeItems(props.catalogItems);

      this.state = this.getCategoryState(activeTabs, categories);
      filterCounts = this.getFilterCounts(
        activeTabs,
        filters,
        filterCounts,
        categories
      );

      _.assign(this.state, {
        showAllItemsForCategory: null,
        activeTabs,
        filters,
        filterCounts,
        detailsItem: null,
        showDetails: false,
        showCreateInstance: false
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { catalogItems, instanceCreated } = this.props;
    const { filters, filterCounts, activeTabs } = this.state;
    if (instanceCreated && !prevProps.instanceCreated) {
      this.props.history.push('/');
    }

    if (catalogItems !== prevProps.catalogItems) {
      const newCategories = categorizeItems(catalogItems);
      const filteredItems = this.filterItems(catalogItems, filters);
      const filteredCategories = recategorizeItems(
        filteredItems,
        newCategories
      );
      this.setState({
        ...this.getCategoryState(activeTabs, filteredCategories),
        ...this.getFilterCounts(
          activeTabs,
          filters,
          filterCounts,
          newCategories
        )
      });
    }
  }

  hasActiveFilters = filters => {
    const { byName, byType } = filters;
    return (
      byType.chePlugin.active ||
      byType.cheEditor.active ||
      byName.active
    );
  };

  getActiveCategories = (activeTabs, categories) => {
    const mainCategory = _.find(categories, { id: _.first(activeTabs) });
    const subCategory =
      activeTabs.length < 2
        ? null
        : _.find(mainCategory.subcategories, { id: _.last(activeTabs) });
    return [mainCategory, subCategory];
  };

  getFilterCounts(activeTabs, filters, filterCounts, categories) {
    const filteredItems = this.filterItemsForCounts(filters);
    const categoriesForCounts = recategorizeItems(filteredItems, categories);

    const [mainCategory, subCategory] = this.getActiveCategories(
      activeTabs,
      categoriesForCounts
    );
    const items = subCategory ? subCategory.items : mainCategory.items;

    const count = _.countBy(items, 'type');
    const newFilterCounts = { ...filterCounts };
    newFilterCounts.byType.chePlugins =
      count['Che Plugin'] || 0;
    newFilterCounts.byType.cheEditors = count['Che Editor'] || 0;

    return newFilterCounts;
  }

  getCategoryState(activeTabs, categories) {
    const [mainCategory, subCategory] = this.getActiveCategories(
      activeTabs,
      categories
    );
    const currentCategories = mainCategory.subcategories || categories;
    const numItems = subCategory ? subCategory.numItems : mainCategory.numItems;

    return {
      categories,
      currentCategories,
      numItems: numItems || 0
    };
  }

  isAllTabActive() {
    const { activeTabs } = this.state;
    return _.first(activeTabs) === 'all';
  }

  activeTabIsSubCategory(subcategories) {
    const { activeTabs } = this.state;
    if (activeTabs.length < 2) {
      return false;
    }

    const activeID = _.last(activeTabs);
    return _.some(subcategories, { id: activeID });
  }

  isActiveTab(categoryID) {
    const { activeTabs } = this.state;
    const activeID = _.last(activeTabs);
    return activeID === categoryID;
  }

  hasActiveDescendant(categoryID) {
    const { activeTabs } = this.state;
    return _.first(activeTabs) === categoryID;
  }

  renderTabs(category, parentID = null) {
    const { id, label, subcategories } = category;
    const active = this.isActiveTab(id);
    const onActivate = () => {
      const tabs = parentID ? [parentID, id] : [id];
      this.onActivateTab(tabs);
    };
    const hasActiveDescendant = this.hasActiveDescendant(id);
    const shown = id === 'all';
    return (
      <VerticalTabs.Tab
        key={id}
        title={label}
        active={active}
        className={!category.numItems ? 'catalog-tab__empty' : null}
        onActivate={onActivate}
        hasActiveDescendant={hasActiveDescendant}
        shown={shown}
      >
        {!_.isEmpty(subcategories) && (
          <VerticalTabs
            restrictTabs
            activeTab={this.activeTabIsSubCategory(subcategories)}
          >
            {_.map(subcategories, subcategory =>
              this.renderTabs(subcategory, id)
            )}
          </VerticalTabs>
        )}
      </VerticalTabs.Tab>
    );
  }

  renderCategoryTabs() {
    const { categories } = this.state;
    return (
      <VerticalTabs restrictTabs activeTab shown="true">
        {_.map(categories, category => this.renderTabs(category))}
      </VerticalTabs>
    );
  }

  syncTabsAndTiles(category, parentCategory) {
    const { categories, currentCategories, filters, filterCounts } = this.state;
    if (!parentCategory && category === 'all') {
      const activeTabs = [category];
      this.setState({
        activeTabs,
        ...this.getCategoryState(activeTabs, categories),
        ...this.getFilterCounts(activeTabs, filters, filterCounts, categories),
        numItems: _.first(categories).numItems,
        showAllItemsForCategory: null
      });
    }

    const tmpCategories = parentCategory ? currentCategories : categories;
    const activeCategory = _.find(tmpCategories, { id: category });
    if (!activeCategory) {
      return;
    }

    const { numItems, subcategories } = activeCategory;
    const activeTabs = parentCategory ? [parentCategory, category] : [category];

    this.setState({
      activeTabs,
      ...this.getCategoryState(activeTabs, categories),
      ...this.getFilterCounts(activeTabs, filters, filterCounts, categories),
      numItems: numItems || 0,
      showAllItemsForCategory: _.isEmpty(subcategories) ? category : null
    });
  }

  onActivateTab(tabs) {
    const category = _.last(tabs);
    const parent = tabs.length > 1 ? _.first(tabs) : null;
    this.syncTabsAndTiles(category, parent);
  }

  showItemDetails = item => {
    const { noDetails } = this.props;

    if (noDetails) {
      this.props.showCreateCatalogInstance(item);
      return;
    }
    this.setState({ detailsItem: item, showDetails: true });
  };

  hideItemDetails = () => {
    this.setState({ showDetails: false });
  };

  // showCreateItemInstance = () => {
  //   const { detailsItem } = this.state;
  //   const { dialogForm } = this.props;

  //   if (dialogForm) {
  //     const createItem = helpers.createDefaultInstance(detailsItem);

  //     this.setState({
  //       showDetails: false,
  //       showCreateInstance: true,
  //       createItem
  //     });
  //     return;
  //   }
  //   this.props.showCreateCatalogInstance(detailsItem);
  // };
  showCreateItemInstance = () => {
    var win = window.open('https://che.openshift.io/f?name=hello&user=osio-ci-getstart1', '_blank');
    win.focus();
  };
  hideCreateItemInstance = () => {
    this.setState({ showCreateInstance: false });
  };

  hideCreateItemInstance = () => {
    this.setState({ showCreateInstance: false });
  };

  showDialog() {
    return (
      <div className="static-modal">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Title>Modal title</Modal.Title>
          </Modal.Header>

          <Modal.Body>One fine body...</Modal.Body>

          <Modal.Footer>
            <Button>Close</Button>
            <Button bsStyle="primary">Save changes</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </div>
    );
  }
  renderCategory(category, viewAll) {
    const { id, label, parentCategory, items } = category;

    return (
      <CatalogTileView.Category
        key={id}
        title={label}
        totalItems={items && category.items.length}
        viewAll={viewAll}
        onViewAll={() => this.syncTabsAndTiles(id, parentCategory)}
      >
        {_.map(items, item => {
          const { id, title, icon, provider, description } = item;
          const iconClass = item.IconClass
            ? `icon ${normalizeIconClass(item.conClass)}`
            : null;
          const vendor = provider ? `provided by ${provider}` : null;
          return (
            <CatalogTile
              id={id}
              key={id}
              onClick={() => this.showItemDetails(item)}
              title={title}
              iconImg={icon}
              iconClass={iconClass}
              vendor={vendor}
              description={description}
            />
          );
        })}
      </CatalogTileView.Category>
    );
  }

  renderCategoryTiles(category) {
    const { currentCategories } = this.state;
    const { subcategories } = category;
    if (category.id === 'all') {
      return (
        <React.Fragment key={category.id}>
          {_.map(currentCategories, topCategory => {
            if (topCategory.id === 'all') {
              return null;
            }
            return this.renderCategory(topCategory, false);
          })}
        </React.Fragment>
      );
    }

    if (!_.size(subcategories)) {
      return this.renderCategory(category, true);
    }

    return (
      <React.Fragment key={category.id}>
        {_.map(subcategories, subcategory =>
          this.renderCategory(subcategory, false)
        )}
      </React.Fragment>
    );
  }

  getCategoryLabel(categoryID) {
    const { categories } = this.state;
    return _.get(_.find(categories, { id: categoryID }), 'label');
  }

  filterItems(catalogItems, filters) {
    const { byName, byType } = filters;

    if (!this.hasActiveFilters(filters)) {
      return catalogItems;
    }

    let filteredItems = [];

    if (byType.chePlugin.active) {
      filteredItems = _.filter(catalogItems, {
        type: byType.chePlugin.value
      });
    }

    if (byType.cheEditor.active) {
      filteredItems = filteredItems.concat(
        _.filter(catalogItems, { type: byType.cheEditor.value })
      );
    }

    if (byName.active) {
      const filterString = byName.value.toLowerCase();
      return _.filter(
        byType.chePlugin.active || byType.cheEditor.active
          ? filteredItems
          : catalogItems,
        item => item.name.toLowerCase().includes(filterString)
      );
    }

    return filteredItems;
  }

  filterItemsForCounts = filters => {
    const { catalogItems } = this.props;
    const { byName } = filters;

    if (byName.active) {
      const filterString = byName.value.toLowerCase();
      return _.filter(catalogItems, item =>
        item.name.toLowerCase().includes(filterString)
      );
    }

    return catalogItems;
  };

  clearFilters() {
    const filters = _.cloneDeep(this.state.filters);
    filters.byName.active = false;
    filters.byType.chePlugin.active = false;
    filters.byType.cheEditor.active = false;
    filters.byName.value = '';
    this.filterByNameInput.focus();
    this.setState({ filters });
  }

  onFilterChange(filterType, id, value) {
    const { catalogItems } = this.props;
    const { filters, activeTabs, categories } = this.state;

    const newFilters = _.cloneDeep(filters);
    if (filterType === 'byName') {
      const active = !!value;
      newFilters[filterType] = { active, value };
    } else {
      newFilters[filterType][id].active = value;
    }

    const filteredItems = this.filterItems(catalogItems, newFilters);
    const newCategories = recategorizeItems(filteredItems, categories);
    this.setState({
      filters: newFilters,
      ...this.getCategoryState(activeTabs, newCategories)
    });
  }

  render() {
    const {
      activeTabs,
      showAllItemsForCategory,
      currentCategories,
      numItems,
      filters,
      filterCounts,
      detailsItem,
      showDetails,
      showCreateInstance,
      createItem
    } = this.state;
    const { chePlugin, cheEditor } = filters.byType;
    const { chePlugins, cheEditors } = filterCounts.byType;
    const activeCategory = showAllItemsForCategory
      ? _.find(currentCategories, { id: showAllItemsForCategory })
      : null;
    const heading = activeCategory
      ? activeCategory.label
      : this.getCategoryLabel(_.first(activeTabs));

    return (
      <div className="catalog-page col-xs-12">
        <div className="catalog-page__tabs">
          {this.renderCategoryTabs()}
          <FilterSidePanel>
            <FilterSidePanel.Category onSubmit={e => e.preventDefault()}>
              <FormControl
                type="text"
                inputRef={ref => {
                  this.filterByNameInput = ref;
                }}
                placeholder="Filter by keyword..."
                bsClass="form-control"
                value={filters.byName.value}
                autoFocus
                onChange={e =>
                  this.onFilterChange('byName', null, e.target.value)
                }
              />
            </FilterSidePanel.Category>
            <FilterSidePanel.Category title="Type">
              <FilterSidePanel.CategoryItem
                count={chePlugins}
                checked={chePlugin.active}
                onChange={e =>
                  this.onFilterChange(
                    'byType',
                    'chePlugin',
                    e.target.checked
                  )
                }
              >
                {chePlugin.label}
              </FilterSidePanel.CategoryItem>
              <FilterSidePanel.CategoryItem
                count={cheEditors}
                checked={cheEditor.active}
                onChange={e =>
                  this.onFilterChange('byType', 'cheEditor', e.target.checked)
                }
              >
                {cheEditor.label}
              </FilterSidePanel.CategoryItem>
            </FilterSidePanel.Category>
          </FilterSidePanel>
        </div>
        <div className="catalog-page__content">
          <div>
            <div className="catalog-page__heading">{heading}</div>
            <div className="catalog-page__num-items">{numItems} items</div>
          </div>
          {numItems > 0 && (
            <CatalogTileView>
              {activeCategory
                ? this.renderCategoryTiles(activeCategory)
                : _.map(
                  currentCategories,
                  category =>
                    category.numItems && category.id !== 'all'
                      ? this.renderCategoryTiles(category)
                      : null
                )}
            </CatalogTileView>
          )}
          {numItems === 0 && (
            <EmptyState className="catalog-page__no-filter-results">
              <EmptyState.Title
                className="catalog-page__no-filter-results-title"
                aria-level="2"
              >
                No Results Match the Filter Criteria
              </EmptyState.Title>
              <EmptyState.Info className="text-secondary">
                No catalog items are being shown due to the filters being
                applied.
              </EmptyState.Info>
              <EmptyState.Help>
                <button
                  type="text"
                  className="btn btn-link"
                  onClick={() => this.clearFilters()}
                >
                  Clear All Filters
                </button>
              </EmptyState.Help>
            </EmptyState>
          )}
          {detailsItem &&
            showDetails && (
              <CatalogItemDetailsDialog
                detailsItem={detailsItem}
                onClose={this.hideItemDetails}
                onShowCreateInstance={this.showCreateItemInstance}
                onShowDialog={this.showDialog}
              />
            )}
          {detailsItem &&
            showCreateInstance && (
              <CatalogItemCreateInstanceDialog
                detailsItem={createItem}
                onClose={this.hideCreateItemInstance}
              />
            )}
          {this.props.creatingInstance && (
            <Modal show bsSize="sm">
              <Modal.Body>Creating...</Modal.Body>
            </Modal>
          )}
        </div>
      </div>
    );
  }
}

CatalogView.propTypes = {
  catalogItems: PropTypes.array,
  creatingInstance: PropTypes.bool,
  instanceCreated: PropTypes.bool,
  noDetails: PropTypes.bool,
  dialogForm: PropTypes.bool,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  showCreateCatalogInstance: PropTypes.func
};

CatalogView.defaultProps = {
  catalogItems: [],
  creatingInstance: false,
  instanceCreated: false,
  noDetails: false,
  dialogForm: false,
  showCreateCatalogInstance: helpers.noop
};

const mapDispatchToProps = dispatch => ({
  showCreateCatalogInstance: item => dispatch(showCreateCatalogInstance(item))
});

const mapStateToProps = state => ({
  creatingInstance: state.catalog.catalogInstances.pending,
  instanceCreated: state.catalog.catalogInstances.fulfilled
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CatalogView);

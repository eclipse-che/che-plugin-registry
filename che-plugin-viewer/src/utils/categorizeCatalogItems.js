import * as _ from 'lodash-es';

export const catalogCategories = [
  { id: 'all', label: 'All Categories' },
  {
    id: 'languages',
    label: 'Languages',
    field: 'tags',
    subcategories: [
      { id: 'java', label: 'Java', values: ['java'] },
      {
        id: 'javascript',
        values: ['javascript', 'nodejs', 'js'],
        label: 'JavaScript'
      },
      { id: 'dotnet', label: '.NET', values: ['dotnet'] },
      { id: 'perl', label: 'Perl', values: ['perl'] },
      { id: 'ruby', label: 'Ruby', values: ['ruby'] },
      { id: 'php', label: 'PHP', values: ['php'] },
      { id: 'python', label: 'Python', values: ['python'] },
      { id: 'golang', label: 'Go', values: ['golang', 'go'] }
    ]
  },
  {
    id: 'databases',
    label: 'Databases',
    field: 'tags',
    subcategories: [
      { id: 'mongodb', label: 'Mongo', values: ['mongodb'] },
      { id: 'mysql', label: 'MySQL', values: ['mysql'] },
      { id: 'postgresql', label: 'Postgres', values: ['postgresql'] },
      { id: 'mariadb', label: 'MariaDB', values: ['mariadb'] }
    ]
  },
  {
    id: 'middleware',
    label: 'Middleware',
    field: 'tags',
    subcategories: [
      {
        id: 'integration',
        label: 'Integration',
        values: ['amq', 'fuse', 'jboss-fuse', 'sso', '3scale']
      },
      {
        id: 'process-automation',
        label: 'Process Automation',
        values: ['decisionserver', 'processserver']
      },
      {
        id: 'analytics-data',
        label: 'Analytics & Data',
        values: ['datagrid', 'datavirt']
      },
      {
        id: 'runtimes',
        label: 'Runtimes & Frameworks',
        values: ['eap', 'httpd', 'tomcat']
      }
    ]
  },
  {
    id: 'cicd',
    label: 'CI/CD',
    field: 'tags',
    subcategories: [
      { id: 'jenkins', label: 'Jenkins', values: ['jenkins'] },
      { id: 'pipelines', label: 'Pipelines', values: ['pipelines'] }
    ]
  },
  {
    id: 'virtualization',
    label: 'Virtualization',
    field: 'tags',
    subcategories: [
      { id: 'vms', label: 'Virtual Machines', values: ['virtualmachine'] }
    ]
  },
  { id: 'other', label: 'Other' }
];

export const marketplaceCategories = [
  { id: 'all', label: 'All Categories' },
  {
    id: 'catalog-source',
    label: 'Catalog Source',
    field: 'status.catalogSource',
    subcategories: [
      {
        id: 'rh-operators',
        label: 'Red Hat Operators',
        value: 'rh-operators',
        field: 'status.packageName',
        subcategories: [
          { id: 'amq-streams', label: 'AMQ Streams', value: 'amq-streams' },
          { id: 'etcd', label: 'Etcd', value: 'etcd' },
          { id: 'prometheus', label: 'Prometheus', value: 'prometheus' }
        ]
      },
      {
        id: 'certified-operator',
        label: 'Certified Operators',
        value: 'certified-operators'
      }
    ]
  },
  { id: 'other', label: 'Other' }
];

const filterSubcategories = (category, item) => {
  if (!_.size(category.subcategories)) {
    return [];
  }
  const matchedSubcategories = [];

  _.forEach(category.subcategories, subCat => {
    if (
      !_.isEmpty(_.intersection(subCat.values, _.get(item, category.field)))
    ) {
      matchedSubcategories.push(subCat);
      matchedSubcategories.push(...filterSubcategories(subCat, item));
    }
  });

  return matchedSubcategories;
};

// categorize item under sub and main categories
const addItem = (item, category, subcategory = null) => {
  // Add the item to the category
  if (!category.items) {
    category.items = [item];
  } else if (!category.items.includes(item)) {
    category.items = category.items.concat(item);
  }
  // Add the item to the subcategory
  if (subcategory) {
    if (!subcategory.items) {
      subcategory.items = [item];
    } else if (!subcategory.items.includes(item)) {
      subcategory.items = subcategory.items.concat(item);
    }
  }
};

const sortItems = items => _.sortBy(items, 'tileName');
const isCategoryEmpty = ({ items }) => _.isEmpty(items);

const pruneCategoriesWithNoItems = categories => {
  _.remove(categories, isCategoryEmpty);
  _.each(categories, category =>
    _.remove(category.subcategories, isCategoryEmpty)
  );
};

const processSubCategories = category => {
  _.each(category.subcategories, subcategory => {
    if (subcategory.items) {
      subcategory.numItems = _.size(subcategory.items);
      subcategory.items = sortItems(subcategory.items);
      processSubCategories(subcategory);
    }
  });
};

// calculate numItems per Category and subcategories, sort items
const processCategories = categories => {
  _.each(categories, category => {
    if (category.items) {
      category.numItems = _.size(category.items);
      category.items = sortItems(category.items);
      processSubCategories(category);
    }
  });
};

const categorize = (items, categories) => {
  const otherCategory = _.find(categories, { id: 'other' });

  // Categorize each item
  _.each(items, item => {
    let itemCategorized = false;

    _.each(categories, category => {
      const matchedSubcategories = filterSubcategories(category, item);
      _.each(matchedSubcategories, subcategory => {
        addItem(item, category, subcategory); // add to subcategory & main category
        itemCategorized = true;
      });
    });
    if (!itemCategorized) {
      addItem(item, otherCategory); // add to Other category
    }
  });

  const allCategory = _.find(categories, { id: 'all' });
  allCategory.numItems = _.size(items);
  allCategory.items = items;
};

/**
 * Creates an items array under each category and subcategory.  If no match, categorizes item
 * under 'Other' main category.
 */
export const categorizeItems = items => {
  const categories = _.cloneDeep(catalogCategories);

  categorize(items, categories);
  pruneCategoriesWithNoItems(categories);
  processCategories(categories);

  return categories;
};

const clearItemsFromCategories = categories => {
  _.each(categories, category => {
    category.numItems = 0;
    category.items = [];
    _.each(category.subcategories, subcategory => {
      subcategory.numItems = 0;
      subcategory.items = [];
    });
  });
};

export const recategorizeItems = (items, categories) => {
  const newCategories = _.cloneDeep(categories);
  clearItemsFromCategories(newCategories);

  categorize(items, newCategories);
  processCategories(newCategories);
  return newCategories;
};

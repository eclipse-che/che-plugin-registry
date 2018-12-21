import * as React from 'react';

const description = (
  <div key="description">
    <h2 key="desc-1">Lorem ipsum</h2>
    Praesent sagittis est et arcu fringilla placerat. Cras erat ante, dapibus
    non mauris ac, volutpat sollicitudin ligula. Morbi gravida nisl vel risus
    tempor, sit amet luctus erat tempus. Curabitur blandit sem non pretium
    bibendum. Donec eleifend non turpis vitae vestibulum. Vestibulum ut sem ac
    nunc posuere blandit sed porta lorem. Cras rutrum velit vel leo iaculis
    imperdiet.
    <h2 key="desc-2">Dolor sit amet</h2>
    Donec consequat dignissim neque, sed suscipit quam egestas in. Fusce
    bibendum laoreet lectus commodo interdum. Vestibulum odio ipsum, tristique
    et ante vel, iaculis placerat nulla. Suspendisse iaculis urna feugiat lorem
    semper, ut iaculis risus tempus.
    <h2 key="desc-3">Consectetur</h2>
    Curabitur nisl quam, interdum a venenatis a, consequat a ligula. Nunc nec
    lorem in erat rhoncus lacinia at ac orci. Sed nec augue congue, vehicula
    justo quis, venenatis turpis. Nunc quis consectetur purus. Nam vitae viverra
    lacus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum
    eu augue felis. Maecenas in dignissim purus, quis pulvinar lectus. Vivamus
    euismod ultrices diam, in mattis nibh.
    <h2 key="desc-4">Documentations</h2>
    <a key="link-1" href="https://www.patternfly.org/">
      https://www.patternfly.org
    </a>
  </div>
);

// axios.get('http://che-backend-che-backend.devtools-dev.ext.devshift.net/v1/plugins').then(function (response) {
//   plugin_meta_data = response;
//   console.log(plugin_meta_data.data)
// }).catch(function (error) {
//   console.log(error);
// });
// console.log(plugin_meta_data.data)

// export const mockCatalogItems = plugin_meta_data.data;
// export const mockCatalogItems = [
//   {
//     uid: 1,
//     kind: 'ImageStream',
//     tags: ['builder', '.net', 'dotnet', 'dotnetcore', 'rh-dotnet20'],
//     shortDescription:
//       'Build and run .NET Core 2.0 applications on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/redhat-developer/s2i-dotnetcore/tree/master/2.0/build/README.md.',
//     iconClass: null,
//     imgUrl: 'icon-dotnet',
//     name: '.NET Core',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 2,
//     kind: 'ImageStream',
//     tags: ['builder', 'httpd'],
//     shortDescription:
//       'Build and serve static content via Apache HTTP Server (httpd) 2.4 on CentOS 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/httpd-container/blob/master/2.4/README.md.',
//     iconClass: null,
//     imgUrl: 'icon-apache',
//     name: 'Apache HTTP Server (httpd)',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 3,
//     kind: 'ClusterServiceClass',
//     tags: ['quickstart', 'php', 'cakephp'],
//     shortDescription:
//       'An example CakePHP application with a MySQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/cakephp-ex/blob/master/README.md.',
//     iconClass: null,
//     imgUrl: 'icon-php',
//     name: 'CakePHP + MySQL',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 4,
//     kind: 'ClusterServiceClass',
//     tags: ['quickstart', 'perl', 'dancer'],
//     shortDescription:
//       'An example Dancer application with a MySQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/dancer-ex/blob/master/README.md.',
//     iconClass: null,
//     imgUrl: 'icon-perl',
//     name: 'Dancer + MySQL',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 5,
//     kind: 'ClusterServiceClass',
//     tags: ['quickstart', 'python', 'django'],
//     shortDescription:
//       'An example Django application with a PostgreSQL database. For more information about using this template, including OpenShift considerations, see https://github.com/openshift/django-ex/blob/master/README.md.',
//     iconClass: null,
//     imgUrl: 'icon-python',
//     name: 'Django + PostgreSQL',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 6,
//     kind: 'ClusterServiceClass',
//     tags: ['instant-app', 'jenkins'],
//     shortDescription:
//       'Jenkins service, without persistent storage.↵↵WARNING: Any data stored will be lost upon pod destruction. Only use this template for testing.',
//     iconClass: null,
//     imgUrl: 'icon-jenkins',
//     name: 'Jenkins (Ephemeral)',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 7,
//     kind: 'ClusterServiceClass',
//     tags: ['database', 'mariadb'],
//     shortDescription:
//       'MariaDB database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mariadb-container/blob/master/10.2/root/usr/share/container-scripts/mysql/README.md.↵↵NOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
//     iconClass: null,
//     imgUrl: 'icon-mariadb',
//     name: 'MariaDB',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 8,
//     kind: 'ClusterServiceClass',
//     tags: ['database', 'mongodb'],
//     shortDescription:
//       'MongoDB database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mongodb-container/blob/master/3.2/README.md.↵↵NOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
//     iconClass: null,
//     imgUrl: 'icon-mongodb',
//     name: 'MongoDB',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   },
//   {
//     uid: 9,
//     kind: 'ClusterServiceClass',
//     tags: ['database', 'mysql'],
//     shortDescription:
//       'MySQL database service, with persistent storage. For more information about using this template, including OpenShift considerations, see https://github.com/sclorg/mysql-container/blob/master/5.7/root/usr/share/container-scripts/mysql/README.md.↵↵NOTE: Scaling to more than one replica is not supported. You must have persistent volumes available in your cluster to use this template.',
//     iconClass: null,
//     imgUrl: 'icon-mysql-database',
//     name: 'MySQL',
//     provider: 'Red Hat, Inc.',
//     version: '1.0.2',
//     certifiedLevel: 'Certified',
//     healthIndex: 'Healthy',
//     repository: 'https://github.com/patternfly/patternfly.git',
//     containerImage: '0.22.2',
//     createdAt: 'Aug 23, 1:58 pm',
//     description
//   }
// ];
export const mockCatalogItems = [
  {
    "description": "A hello world theia plug-in wrapped into a Che Plug-in",
    "icon": "https://www.eclipse.org/che/images/ico/16x16.png",
    "id": "che-dummy-plugin",
    "name": "Che Samples Hello World Plugin",
    "title": "Che Samples Hello World Plugin",
    "type": "Che Plugin",
    "url": "https://github.com/ws-skeleton/che-dummy-plugin/releases/download/untagged-8f3e198285a2f3b6b2db/che-dummy-plugin.tar.gz",
    "version": "0.0.1"
  },
  {
    "description": "Che Plug-in with che-machine-exec service to provide creation terminal or tasks for Eclipse CHE workspace machines.",
    "icon": "https://www.eclipse.org/che/images/ico/16x16.png",
    "id": "che-machine-exec-plugin",
    "name": "Che machine-exec Service",
    "title": "Che machine-exec Service Plugin",
    "type": "Che Plugin",
    "url": "https://github.com/ws-skeleton/che-machine-exec/releases/download/0.0.1alfa2/che-service-plugin.tar.gz",
    "version": "0.0.1"
  },
  {
    "description": "Che Plug-in with Theia plug-in and container definition providing a service",
    "icon": "https://www.eclipse.org/che/images/ico/16x16.png",
    "id": "che-service-plugin",
    "name": "Che Samples REST API Sidecar Plugin",
    "title": "Che Samples REST API Sidecar Plugin",
    "type": "Che Plugin",
    "url": "https://github.com/ws-skeleton/che-service-plugin/releases/download/untagged-5c4c888ff2de8ae7a5e2/che-service-plugin.tar.gz",
    "version": "0.0.1"
  },
  {
    "description": "Eclipse Dirigible as App Development Platform for Eclipse Che",
    "icon": "https://www.dirigible.io/img/logo/dirigible-logo.png",
    "id": "org.eclipse.che.editor.dirigible",
    "name": "dirigible-che-editor-plugin",
    "title": "Eclipse Dirigible for Eclipse Che",
    "type": "Che Editor",
    "url": "https://github.com/dirigiblelabs/dirigible-che-editor-plugin/releases/download/1.0.0/dirigible-che-editor-plugin.tar.gz",
    "version": "1.0.0"
  },
  {
    "description": "Eclipse IDE",
    "icon": "https://github.com/eclipse/eclipse.platform/raw/master/platform/org.eclipse.sdk/eclipse256.png",
    "id": "org.eclipse.che.editor.eclipseide",
    "name": "eclipse-ide",
    "title": "Eclipse IDE (in browser using Broadway) as editor for Eclipse Che",
    "type": "Che Editor",
    "url": "https://github.com/ws-skeleton/che-editor-eclipseide/releases/download/0.0.1/che-editor-plugin.tar.gz",
    "version": "0.0.1"
  },
  {
    "description": "Eclipse GWT IDE",
    "icon": null,
    "id": "org.eclipse.che.editor.gwt",
    "name": "gwt-ide",
    "title": "Eclipse GWT IDE for Eclipse Che",
    "type": "Che Editor",
    "url": "https://github.com/skabashnyuk/che-editor-gwt-ide/releases/download/untagged-c615b3964b2022b5896f/che-editor-plugin.tar.gz",
    "version": "1.0.0"
  },
  {
    "description": "Jupyter Notebook as Editor for Eclipse Che",
    "icon": "https://jupyter.org/assets/main-logo.svg",
    "id": "org.eclipse.che.editor.jupyter",
    "name": "jupyter-notebook",
    "title": "Jupyter Notebook as Editor for Eclipse Che",
    "type": "Che Editor",
    "url": "https://github.com/ws-skeleton/che-editor-jupyter/releases/download/untagged-cc4e4c9a7741551b6776/che-editor-plugin.tar.gz",
    "version": "1.0.0"
  },
  {
    "description": "Eclipse Theia",
    "icon": "https://pbs.twimg.com/profile_images/929088242456190976/xjkS2L-0_400x400.jpg",
    "id": "org.eclipse.che.editor.theia",
    "name": "theia-ide",
    "title": "Eclipse Theia for Eclipse Che",
    "type": "Che Editor",
    "url": "https://github.com/ws-skeleton/che-editor-theia/releases/download/untagged-74eef382fad2636fda4f/che-editor-plugin.tar.gz",
    "version": "1.0.0"
  },
  {
    "description": "Fortune plug-in running in its own container that provides the fortune tool",
    "icon": "https://www.eclipse.org/che/images/ico/16x16.png",
    "id": "org.eclipse.che.samples.container-fortune",
    "name": "Che-Samples-Fortune",
    "title": "Che Samples Container Fortune Plugin",
    "type": "Theia plugin",
    "url": "https://github.com/ws-skeleton/che-fortune-plugin/releases/download/untagged-bbffe2843692982f673b/che_fortune_plugin.theia",
    "version": "0.0.1"
  }
]
// let i;
// for (i = 1; i < 10; i++) {
//   console.log(plugin_meta_data.data[i].title)
//   mockCatalogItems[i].shortDescription = plugin_meta_data.data[i].title;
//   mockCatalogItems[i].imgUrl = plugin_meta_data.data[i].icon;
//   mockCatalogItems[i].name = plugin_meta_data.data[i].name;
//   mockCatalogItems[i].version = plugin_meta_data.data[i].version;
//   mockCatalogItems[i].repository = plugin_meta_data.data[i].url;

// }

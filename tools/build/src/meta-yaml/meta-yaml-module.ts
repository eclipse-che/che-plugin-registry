/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import { ContainerModule, interfaces } from 'inversify';

import { MetaYamlGenerator } from './meta-yaml-generator';
import { MetaYamlWriter } from './meta-yaml-writer';

const metaYamlModule = new ContainerModule((bind: interfaces.Bind) => {
  bind(MetaYamlGenerator).toSelf().inSingletonScope();
  bind(MetaYamlWriter).toSelf().inSingletonScope();
});

export { metaYamlModule };

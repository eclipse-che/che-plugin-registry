/**********************************************************************
 * Copyright (c) 2020-2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

describe('Test Featured', () => {

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('basics', async () => {
    // only vscode-java is interesting, other one are fake one
    const vscodeJavaItem = items[0];

    expect(vscodeJavaItem.id).toBe('vscode-java');
    expect(vscodeJavaItem.onLanguages).toStrictEqual(['java']);
    expect(vscodeJavaItem.workspaceContains).toStrictEqual(['pom.xml', 'build.gradle', '.classpath']);
    expect(vscodeJavaItem.contributes).toStrictEqual({ languages: [{ id: 'java' }] });
  });
});

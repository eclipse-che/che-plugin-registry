/**********************************************************************
 * Copyright (c) 2020-2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';

import { InversifyBinding } from '../src/inversify-binding';
import { Main } from '../src/main';

describe('Test Main with stubs', () => {
  const originalConsoleError = console.error;
  const mockedConsoleError = jest.fn();
  const buildMethod = jest.fn();
  const buildMock = {
    build: buildMethod as any,
  };
  const container = {
    getAsync: jest.fn().mockResolvedValue(buildMock),
  } as any;
  const spyInitBindings = jest.spyOn(InversifyBinding.prototype, 'initBindings');

  beforeEach(() => {
    spyInitBindings.mockImplementation(() => Promise.resolve(container));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => (console.error = mockedConsoleError));
  afterEach(() => (console.error = originalConsoleError));

  test('success', async () => {
    const main = new Main();
    const returnCode = await main.start();
    expect(returnCode).toBeTruthy();
    expect(buildMethod).toHaveBeenCalled();
    expect(mockedConsoleError).toHaveBeenCalledTimes(0);
  });

  test('error', async () => {
    jest.spyOn(InversifyBinding.prototype, 'initBindings').mockImplementation(() => {
      throw new Error('Dummy error');
    });
    const main = new Main();
    const returnCode = await main.start();
    expect(mockedConsoleError).toHaveBeenCalled();
    expect(returnCode).toBeFalsy();
    expect(buildMethod).toHaveBeenCalled();
  });

  test('error without stack', async () => {
    jest.spyOn(InversifyBinding.prototype, 'initBindings').mockImplementation(() => {
      // eslint-disable-next-line no-throw-literal
      throw { message: 'Dummy error' };
    });
    const main = new Main();
    const returnCode = await main.start();
    expect(mockedConsoleError).toHaveBeenCalled();
    expect(returnCode).toBeFalsy();
    expect(buildMethod).toHaveBeenCalled();
  });
});

/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import { IconCheck } from '../src/pr-icon-check';
/**********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import axios from 'axios';

describe('Icon', () => {
  const prIconCheck = new IconCheck();

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('absolute icon', async () => {
    const spyOnHead = jest.spyOn(axios, 'head');
    const iconToTest = 'https://fake-icon.png';
    await prIconCheck.check(iconToTest);
    expect(spyOnHead).toBeCalled();
    expect(spyOnHead.mock.calls[0][0]).toBe(iconToTest);
  });

  test('absolute invalid icon', async () => {
    const iconToTest = 'https://fake-icon.png';
    const spyOnHead = jest.spyOn(axios, 'head');
    spyOnHead.mockImplementation(() => {
      throw new Error('icon does not exists');
    });
    await expect(prIconCheck.check(iconToTest)).rejects.toThrow('icon does not exists');
  });

  test('relative icon', async () => {
    const iconToTest = '/v3/images/eclipse-che-logo.png';
    const spyOnHead = jest.spyOn(axios, 'head');
    spyOnHead.mockResolvedValue(true);
    await prIconCheck.check(iconToTest);

    // do not call axios with relative icons
    expect(spyOnHead).toBeCalledTimes(0);
  });

  test('relative invalid icon', async () => {
    const iconToTest = '/v3/images/eclipse-che-not-exists.png';
    const spyOnHead = jest.spyOn(axios, 'head');
    spyOnHead.mockResolvedValue(true);
    await expect(prIconCheck.check(iconToTest)).rejects.toThrow(
      'The icon with relative path /v3/images/eclipse-che-not-exists.png does not exists at'
    );
    // do not call axios with relative icons
    expect(spyOnHead).toBeCalledTimes(0);
  });
});

/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as fs from 'fs-extra';

import { ResourceLimitsChecker, cpuRegex, memoryRegex } from '../src/resource-limits-checker';

describe('Resource Limits Checker Test', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('CPU regex :: test [100]', async () => {
    const result = '100'.match(cpuRegex);
    expect(result).toBeDefined();
  });

  test('CPU regex :: test [1.5]', async () => {
    const result = '1.5'.match(cpuRegex);
    expect(result).toBeDefined();
  });

  test('CPU regex :: test [100.]', async () => {
    const result = '100.'.match(cpuRegex);
    expect(result).toBe(null);
  });

  test('CPU regex :: test [100m]', async () => {
    const result = '100m'.match(cpuRegex);
    expect(result).toBeDefined();
  });

  test('CPU regex :: test [10.0m]', async () => {
    const result = '10.0m'.match(cpuRegex);
    expect(result).toBe(null);
  });

  test('CPU regex :: test [m]', async () => {
    const result = 'm'.match(cpuRegex);
    expect(result).toBe(null);
  });

  test('Memory regex :: test [100]', async () => {
    const result = '100'.match(memoryRegex);
    expect(result).toBeDefined();
  });

  test('Memory regex :: test [1.5]', async () => {
    const result = '1.5'.match(memoryRegex);
    expect(result).toBeDefined();
  });

  test('Memory regex :: test [1.]', async () => {
    const result = '1.'.match(memoryRegex);
    expect(result).toBe(null);
  });

  test('Memory regex :: test [100M]', async () => {
    const result = '100M'.match(memoryRegex);
    expect(result).toBeDefined();
  });

  test('Memory regex :: test [100m]', async () => {
    const result = '100m'.match(memoryRegex);
    expect(result).toBe(null);
  });

  test('Memory regex :: test [M]', async () => {
    const result = 'M'.match(memoryRegex);
    expect(result).toBe(null);
  });

  test('Memory regex :: test [1.5M]', async () => {
    const result = '1.5M'.match(memoryRegex);
    expect(result).toBeDefined();
  });

  test('Memory regex :: test [15.M]', async () => {
    const result = '15.M'.match(memoryRegex);
    expect(result).toBe(null);
  });

  test('Resource Limits Checker :: valid plugin', async () => {
    const checker = new ResourceLimitsChecker();

    const result = checker.validate(plugin);
    expect(result).toStrictEqual({
      invalid: undefined,
      missing: undefined,
    });
  });

  test('Resource Limits Checker :: missing memoryRequest and cpuRequest, invalid memoryLimit', async () => {
    const checker = new ResourceLimitsChecker();

    const result = checker.validate(plugin);
    expect(result).toStrictEqual({
      invalid: ['memoryLimit'],
      missing: ['cpuRequest', 'memoryRequest'],
    });
  });

  test('Resource Limits Checker :: all memory and CPU limits/requests are missing', async () => {
    const checker = new ResourceLimitsChecker();

    const result = checker.validate(plugin);
    expect(result).toStrictEqual({
      invalid: undefined,
      missing: ['cpuLimit', 'cpuRequest', 'memoryLimit', 'memoryRequest'],
    });
  });

  test('Resource Limits Checker :: test one valid plugin', async () => {
    const yamlContent = `
version: 1.0.0
plugins:
  - repository:
      url: 'url1'
      revision: v1.44.8
    sidecar:
      memoryLimit: 512Mi
      memoryRequest: 20Mi
      cpuLimit: 500m
      cpuRequest: 30m
    extension: extension1
    `;

    const readFile = jest.spyOn(fs, 'readFile') as jest.Mock;
    readFile.mockReturnValue(yamlContent);

    const checker = new ResourceLimitsChecker();

    const originalFunction = checker['validate'];

    const mockValidate = jest.spyOn(checker, 'validate') as jest.Mock;
    mockValidate.mockImplementation(plugin => originalFunction(plugin));

    const result = await checker.check();

    expect(mockValidate).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  test('Resource Limits Checker :: test two plugins with missing cpuRequest and memoryRequest', async () => {
    const yamlContent = `
version: 1.0.0
plugins:
  - repository:
      url: 'url1'
      revision: v1.44.8
    sidecar:
      memoryLimit: 512Mi
      cpuLimit: 500m
    extension: extension1
  - repository:
      url: 'url2'
      revision: v1.44.8
    sidecar:
      memoryLimit: 512Mi
      cpuLimit: 500m
    extension: extension2
    `;

    const readFile = jest.spyOn(fs, 'readFile') as jest.Mock;
    readFile.mockReturnValue(yamlContent);

    const consoleLog = jest.spyOn(console, 'log') as jest.Mock;

    const checker = new ResourceLimitsChecker();

    const originalFunction = checker['validate'];

    const mockValidate = jest.spyOn(checker, 'validate') as jest.Mock;
    mockValidate.mockImplementation(plugin => originalFunction(plugin));

    const result = await checker.check();

    expect(mockValidate).toHaveBeenCalledTimes(2);
    expect(result).toBe(false);

    expect(consoleLog).toHaveBeenCalledTimes(4);
  });

  test('Resource Limits Checker :: test plugin without extension', async () => {
    const yamlContent = `
version: 1.0.0
plugins:
  - repository:
      url: 'url1'
      revision: v1.44.8
    `;

    const readFile = jest.spyOn(fs, 'readFile') as jest.Mock;
    readFile.mockReturnValue(yamlContent);

    const consoleLog = jest.spyOn(console, 'log') as jest.Mock;

    const checker = new ResourceLimitsChecker();

    const originalFunction = checker['validate'];

    const mockValidate = jest.spyOn(checker, 'validate') as jest.Mock;
    mockValidate.mockImplementation(plugin => originalFunction(plugin));

    const result = await checker.check();

    expect(mockValidate).toHaveBeenCalledTimes(0);
    expect(result).toBe(false);

    expect(consoleLog).toHaveBeenCalledTimes(1);
  });
});

# Copyright (c) 2020 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

FROM python:3.8.2-slim

RUN apt-get update && \
    apt-get install vim git -y && \
    pip install certifi chardet packaging PyYAML requests six urllib3 && \
    apt-get clean && apt-get -y autoremove && rm -rf /var/lib/apt/lists/*

ADD plugin_checker.py plugin_checker.py

# Copyright (c) 2020-2021 Red Hat, Inc.
# This program and the accompanying materials are made
# available under the terms of the Eclipse Public License 2.0
# which is available at https://www.eclipse.org/legal/epl-2.0/
#
# SPDX-License-Identifier: EPL-2.0
#
# Contributors:
#   Red Hat, Inc. - initial API and implementation

import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By

options = Options()
options.log.level = "trace"
options.headless = True
options.add_argument('--disable-web-security')
options.add_argument('--allow-running-insecure-content')
options.add_argument('--ignore-certificate-errors')

NEW_USER="admin"

browser = webdriver.Firefox(options=options, executable_path="/usr/local/bin/geckodriver")
wait = WebDriverWait(browser, 30)
print (sys.argv[1])
browser.get(sys.argv[1])

wait.until(EC.title_contains('Log in'))

username_elem = browser.find_element_by_id('username')
username_elem.send_keys(NEW_USER)

password_elem = browser.find_element_by_id('password')
password_elem.send_keys(NEW_USER)

login_btn_elem = browser.find_element_by_id('kc-login')
login_btn_elem.click()

browser.implicitly_wait(20)
browser.get(sys.argv[1])

try:
    #Waiting for theia itself to be loaded so that tests will be run
    wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, 'ide-iframe')))
    wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="theia-app-shell"]')))
    wait.until(EC.presence_of_element_located((By.XPATH, '//*[@id="/projects:/projects/test.log"]')))
    print("----- Workspace is ready -----")
except Exception as e:
    print("Loading took too much time!", e)

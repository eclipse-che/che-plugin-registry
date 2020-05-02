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

NEW_USER="testUser1"

browser = webdriver.Firefox(options=options, executable_path="/usr/local/bin/geckodriver")
wait = WebDriverWait(browser, 1000)
browser.get(sys.argv[1])

wait.until(EC.title_contains('Log in'))

username_elem = browser.find_element_by_id('username')
username_elem.send_keys(NEW_USER)

password_elem = browser.find_element_by_id('password')
password_elem.send_keys(NEW_USER)

login_btn_elem = browser.find_element_by_id('kc-login')
login_btn_elem.click()

# Waiting for theia itself to be loaded so that git will clone and tests will be run
wait.until(EC.presence_of_element_located((By.XPATH, "//*[@class='theia-ApplicationShell']")))

#!/usr/bin/env bash

# Copyright (c) 2020 Red Hat, Inc.
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which accompanies this distribution, and is available at
# http://www.eclipse.org/legal/epl-v10.html

function installOC() {
  OC_DIR_NAME=openshift-origin-client-tools-v3.11.0-0cbc58b-linux-64bit
  curl -vL "https://github.com/openshift/origin/releases/download/v3.11.0/${OC_DIR_NAME}.tar.gz" --output ${OC_DIR_NAME}.tar.gz
  tar -xvf ${OC_DIR_NAME}.tar.gz
  cp ${OC_DIR_NAME}/oc /usr/local/bin
  cp ${OC_DIR_NAME}/oc /tmp
}

function installJQ() {
  installEpelRelease
  yum install --assumeyes -d1 jq
}

function installEpelRelease() {
  if yum repolist | grep epel; then
    echo "Epel already installed, skipping instalation."
  else
    #excluding mirror1.ci.centos.org
    echo "exclude=mirror1.ci.centos.org" >>/etc/yum/pluginconf.d/fastestmirror.conf
    echo "Installing epel..."
    yum install -d1 --assumeyes epel-release
    yum update --assumeyes -d1
  fi
}

function installYQ() {
  installEpelRelease
  curl -Lo yq https://github.com/mikefarah/yq/releases/download/3.2.1/yq_linux_amd64
  chmod +x ./yq
  mv ./yq /usr/local/bin/yq
}

function installStartDocker() {
  yum install --assumeyes -d1 yum-utils device-mapper-persistent-data lvm2
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  yum install --assumeyes -d1 docker-ce
  mkdir -p /etc/docker
  echo "{ \"insecure-registries\": [\"172.30.0.0/16\"] }" >/etc/docker/daemon.json
  systemctl start docker
  docker version
}

function installMvn() {
  yum install --assumeyes -d1 centos-release-scl
  yum install --assumeyes -d1 rh-maven33
}

function installNodejs() {
  curl -sL https://rpm.nodesource.com/setup_10.x | bash -
  yum install -y nodejs
}

function installYarn() {
  yum-config-manager --add-repo https://dl.yarnpkg.com/rpm/yarn.repo
  yum install -y yarn
}

function installGit() {
  yum install --assumeyes -d1 git
}

function installWget() {
  yum -y install wget
}

function installGssCompiler() {
  yum install -y gcc-c++ make
}

function installDependencies() {
  echo "======== Installing dependencies: ========"
  start=$(date +%s)

  installEpelRelease
  installYQ
  installStartDocker
  installJQ
  installOC
  installGit
  installWget
  # Getting dependencies ready
  yum install --assumeyes -d1 \
    patch \
    pcp \
    bzip2 \
    golang \
    make \
    java-1.8.0-openjdk \
    java-1.8.0-openjdk-devel \
    python3
  python3 -m pip install selenium
  wget https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-linux64.tar.gz
  tar -xvzf geckodriver*
  chmod +x geckodriver
  mv geckodriver /usr/local/bin/
  installMvn
  installNodejs
  installYarn

  stop=$(date +%s)
  install_dep_duration=$((stop - start))
  echo "======== Installing all dependencies lasted $install_dep_duration seconds. ========"

}

function installKVM() {
  echo "======== Start to install KVM virtual machine ========"

  yum install -y qemu-kvm libvirt libvirt-python libguestfs-tools virt-install

  curl -L https://github.com/dhiltgen/docker-machine-kvm/releases/download/v0.10.0/docker-machine-driver-kvm-centos7 -o /usr/local/bin/docker-machine-driver-kvm
  chmod +x /usr/local/bin/docker-machine-driver-kvm

  systemctl enable libvirtd
  systemctl start libvirtd

  virsh net-list --all
  echo "======== KVM has been installed successfully ========"
}

function generateCerts() {
  CA_CN="Local Eclipse Che Signer"
  DOMAIN=\*.$( minishift ip ).nip.io
  OPENSSL_CNF=/etc/pki/tls/openssl.cnf
  
  openssl genrsa -out ca.key 4096
  
  openssl req -x509 \
  -new -nodes \
  -key ca.key \
  -sha256 \
  -days 1024 \
  -out ca.crt \
  -subj /CN="${CA_CN}" \
  -reqexts SAN \
  -extensions SAN \
  -config <(cat ${OPENSSL_CNF} \
      <(printf '[SAN]\nbasicConstraints=critical, CA:TRUE\nkeyUsage=keyCertSign, cRLSign, digitalSignature'))
  
  openssl genrsa -out domain.key 2048
  
  openssl req -new -sha256 \
    -key domain.key \
    -subj "/O=Local {prod}/CN=${DOMAIN}" \
    -reqexts SAN \
    -config <(cat ${OPENSSL_CNF} \
        <(printf "\n[SAN]\nsubjectAltName=DNS:${DOMAIN}\nbasicConstraints=critical, CA:FALSE\nkeyUsage=digitalSignature, keyEncipherment, keyAgreement, dataEncipherment\nextendedKeyUsage=serverAuth")) \
    -out domain.csr
  
  openssl x509 \
    -req \
    -sha256 \
    -extfile <(printf "subjectAltName=DNS:${DOMAIN}\nbasicConstraints=critical, CA:FALSE\nkeyUsage=digitalSignature, keyEncipherment, keyAgreement, dataEncipherment\nextendedKeyUsage=serverAuth") \
    -days 365 \
    -in domain.csr \
    -CA ca.crt \
    -CAkey ca.key \
    -CAcreateserial -out domain.crt
}

function installAndStartMinishift() {
  echo "======== Start to install minishift ========"
  curl -Lo minishift.tgz https://github.com/minishift/minishift/releases/download/v1.34.2/minishift-1.34.2-linux-amd64.tgz
  tar -xvf minishift.tgz --strip-components=1
  chmod +x ./minishift
  mv ./minishift /usr/local/bin/minishift

  #Setup GitHub token for minishift
  if [ -z "$CHE_BOT_GITHUB_TOKEN" ]
  then
    echo "\$CHE_BOT_GITHUB_TOKEN is empty. Minishift start might fail with GitGub API rate limit reached."
  else
    echo "\$CHE_BOT_GITHUB_TOKEN is set, checking limits."
    GITHUB_RATE_REMAINING=$(curl -slL "https://api.github.com/rate_limit?access_token=$CHE_BOT_GITHUB_TOKEN" | jq .rate.remaining)
    if [ "$GITHUB_RATE_REMAINING" -gt 1000 ]
    then
      echo "Github rate greater than 1000. Using che-bot token for minishift startup."
      export MINISHIFT_GITHUB_API_TOKEN=$CHE_BOT_GITHUB_TOKEN
    else
      echo "Github rate is lower than 1000. *Not* using che-bot for minishift startup."
      echo "If minishift startup fails, please try again later."
    fi
  fi

  minishift version
  minishift config set memory 14GB
  minishift config set cpus 4

  echo "======== Launch minishift ========"
  minishift start
}

function installCheCtl() {
  echo "======== Start to install chectl ========"
  bash <(curl -sL https://www.eclipse.org/che/chectl/) --channel=stable
  echo "======== chectl has been installed successfully ========"
}

function getOpenshiftLogs() {
    oc logs "$(oc get pods --selector=component=che -o jsonpath="{.items[].metadata.name}")"  || true
    oc logs "$(oc get pods --selector=component=keycloak -o jsonpath="{.items[].metadata.name}")" || true
}

function deployCheIntoCluster() {
  echo "======== Start to install CHE ========"
  if chectl server:start -a operator -p openshift --k8spodreadytimeout=360000 --self-signed-cert --chenamespace=che; then
    echo "Started succesfully"
    oc get checluster -o yaml
  else
    echo "======== oc get events ========"
    oc get events
    echo "======== oc get all ========"
    oc get all
    # echo "==== docker ps ===="
    # docker ps
    # echo "==== docker ps -q | xargs -L 1 docker logs ===="
    # docker ps -q | xargs -L 1 docker logs | true
    getOpenshiftLogs
    curl -vL http://keycloak-che.${LOCAL_IP_ADDRESS}.nip.io/auth/realms/che/.well-known/openid-configuration || true
    oc get checluster -o yaml || true
    exit 1337
  fi
}

function loginToOpenshiftAndSetDevRole() {
  generateCerts
  oc login -u system:admin --insecure-skip-tls-verify
  oc adm policy add-cluster-role-to-user cluster-admin developer
  oc project default
  oc delete secret router-certs
  cat domain.crt domain.key > minishift.crt
  oc create secret tls router-certs --key=domain.key --cert=minishift.crt
  oc rollout latest router
  oc create namespace che
  cp rootCA.crt ca.crt
  oc create secret generic self-signed-certificate --from-file=ca.crt -n=che
  oc login -u developer -p pass --insecure-skip-tls-verify
  oc project che
}

function archiveArtifacts() {
  JOB_NAME=$1
  DATE=$(date +"%m-%d-%Y-%H-%M")
  echo "Archiving artifacts from ${DATE} for ${JOB_NAME}/${BUILD_NUMBER}"
  cd /root/payload
  ls -la ./artifacts.key
  chmod 600 ./artifacts.key
  chown "$(whoami)" ./artifacts.key
  mkdir -p "./che/${JOB_NAME}/${BUILD_NUMBER}"
  cp -R ./report "./che/${JOB_NAME}/${BUILD_NUMBER}/" || true
  rsync --password-file=./artifacts.key -Hva --partial --relative "./che/${JOB_NAME}/${BUILD_NUMBER}" devtools@artifacts.ci.centos.org::devtools/
}

function defineCheRoute(){
  CHE_ROUTE=$(oc get route che --template='{{ .spec.host }}')
  echo "====== Check CHE ROUTE ======"
  curl -vLk "$CHE_ROUTE"
}

# Set the default to true
TESTS_PASSED=true

function createTestWorkspaceAndRunTest() {
  defineCheRoute
  oc project che
  oc get namespace

  ### Create workspace
  for devfile in "${AVAILABLE_DEVFILES[@]}"
  do
    echo "Starting workspace with devfile: $devfile"
    rm workspace_url.txt
    chectl workspace:create --access-token "$USER_ACCESS_TOKEN" -f https://raw.githubusercontent.com/eclipse/che-devfile-registry/master/devfiles/java-maven/devfile.yaml --start > workspace_url.txt
    workspace_url=$(tail -n 1 workspace_url.txt)

    cat "$devfile"

    pods=$(oc get pods --all-namespaces -l che.workspace_id --field-selector status.phase=Running 2>&1)
    while [ "$pods" == 'No resources found.' ];
    do
        echo "No pod found with che.workspace_id"
        echo "Current available pods are"
        oc get pods
        echo "Current deployments are"
        oc get deployments
        oc get pods --all-namespaces -l che.workspace_id
        sleep 10
        pods=$(oc get pods --all-namespaces -l che.workspace_id --field-selector status.phase=Running 2>&1)
    done

    oc get pods
    oc get pods -l che.workspace_id -o json
    oc get pods --all-namespaces -l che.workspace_id -o json

    oc get pods -l che.workspace_id

    ### Now we need to wait until we see some arguments in the output of the theia? pod
    ### Once we see this correct output then we can proceed by running cat on the created file
    ### that lives in the workspace
    workspace_name=$(oc get pods -l che.workspace_id -o json | jq '.items[0].metadata.name' | tr -d \")
    theia_ide_container_name=$(oc get pods -l che.workspace_id -o json | jq '.items[0].metadata.annotations[]' | grep -P "theia-ide" | tr -d \")

    echo "Workspace name is: "
    echo "$workspace_name"
    echo "Theia IDE Container Name is: "
    echo "$theia_ide_container_name"

    # Start the python3 selenium script that will connect to the workspace so that git clone will finish and tests will be run
    python3 test.py ${workspace_url} &

    oc cp che/${workspace_name}:/projects/test.log ./test.log -c ${theia_ide_container_name}
    while ! grep -q "TESTS FAILED" test.log && ! grep -q "TESTS PASSED" test.log;
    do
        echo "Waiting for log file to be created and have TESTS FAILED or TESTS PASSED"
        sleep 10
        oc cp che/${workspace_name}:/projects/test.log ./test.log -c ${theia_ide_container_name}
        ls
        cat test.log
    done

    # Test to see if the tests failed, the TEST_PASSED default is set to true
    if cat test.log | grep -q "TESTS FAILED"
    then
      TESTS_PASSED=false
    fi
  done
  export TESTS_PASSED
}

function createTestUserAndObtainUserToken() {

  ### Create user and obtain token
  KEYCLOAK_URL=$(oc get route/keycloak -o jsonpath='{.spec.host}')
  KEYCLOAK_BASE_URL="https://${KEYCLOAK_URL}/auth"

  TEST_USERNAME=testUser1

  echo "======== Getting admin token ========"
  ADMIN_ACCESS_TOKEN=$(curl -k -X POST "$KEYCLOAK_BASE_URL"/realms/master/protocol/openid-connect/token -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin" -d "password=admin" -d "grant_type=password" -d "client_id=admin-cli" | jq -r .access_token)
  echo "$ADMIN_ACCESS_TOKEN"

  echo "========Creating user========"
  USER_JSON="{\"username\": \"${TEST_USERNAME}\",\"enabled\": true,\"emailVerified\": true,\"email\":\"test1@user.aa\"}"
  echo "$USER_JSON"

  curl -k -X POST "$KEYCLOAK_BASE_URL"/admin/realms/che/users -H "Authorization: Bearer ${ADMIN_ACCESS_TOKEN}" -H "Content-Type: application/json" -d "${USER_JSON}" -v
  USER_ID=$(curl -k -X GET "$KEYCLOAK_BASE_URL"/admin/realms/che/users?username=${TEST_USERNAME} -H "Authorization: Bearer ${ADMIN_ACCESS_TOKEN}" | jq -r .[0].id)
  echo "========User id: $USER_ID========"

  echo "========Updating password========"
  # shellcheck disable=SC2125
  CREDENTIALS_JSON={\"type\":\"password\",\"value\":\"${TEST_USERNAME}\",\"temporary\":false}
  echo $CREDENTIALS_JSON

  curl -k -X PUT "$KEYCLOAK_BASE_URL/admin/realms/che/users/${USER_ID}/reset-password" -H "Authorization: Bearer ${ADMIN_ACCESS_TOKEN}" -H "Content-Type: application/json" -d "${CREDENTIALS_JSON}" -v
  USER_ACCESS_TOKEN=$(curl -k -X POST "$KEYCLOAK_BASE_URL"/realms/che/protocol/openid-connect/token -H "Content-Type: application/x-www-form-urlencoded" -d "username=${TEST_USERNAME}" -d "password=${TEST_USERNAME}" -d "grant_type=password" -d "client_id=che-public" | jq -r .access_token)
  export USER_ACCESS_TOKEN
  echo "========User Access Token: $USER_ACCESS_TOKEN "
}

function setupEnvs() {
  eval "$(./env-toolkit load -f jenkins-env.json -r \
    CHE_BOT_GITHUB_TOKEN \
    CHE_MAVEN_SETTINGS \
    CHE_GITHUB_SSH_KEY \
    ^BUILD_NUMBER$ \
    CHE_OSS_SONATYPE_GPG_KEY \
    CHE_OSS_SONATYPE_PASSPHRASE \
    QUAY_ECLIPSE_CHE_USERNAME \
    QUAY_ECLIPSE_CHE_PASSWORD)"

  export PATH=$PATH:/opt/rh/rh-maven33/root/bin
}

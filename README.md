# actions-sonarqube

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Actions for running sonarqube

## usage

### Pull request analysis

When running PR analysis it is important to checkout the PR commit. By default
`github.sha` will contain the SHA of the merge commit when the action event
type is `pull_request`. In order to checkout the PR commit, we need to specify
`ref: ${{ github.event.pull_request.head.sha }}` when using the
`actions/checkout@v2` action.

```yaml
on: [pull_request]

jobs:
  sonarqube:
    runs-on: [self-hosted,ts-large-x64-docker-large]
    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - uses: tradeshift/actions-sonarqube@v2
        with:
          token: ${{ secrets.SONAR_TOKEN }}
          host: https://mysonar.com
```

### Branch analysis

When running branch analysis eg. on master branch, it is important to
checkout with history. This can be done using `fetch-depth: 0` when using
the `actions/checkout@v2` action.

```yaml
on:
  push:
    branches: master

jobs:
  sonarqube:
    runs-on: [self-hosted,ts-large-x64-docker-large]
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: tradeshift/actions-sonarqube@v2
        with:
          token: ${{ secrets.SONAR_TOKEN }}
          host: https://mysonar.com
```

### Running with mTLS

To have extra security on the access to sonarqube we are guarding it with mTLS. To run the action with mTLS pass `ca-cert`, `client-cert` and `client-key`

```yaml
on:
  push:
    branches: master

jobs:
  sonarqube:
    runs-on: [self-hosted,ts-large-x64-docker-large]
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: tradeshift/actions-sonarqube@v2
        with:
          ca-cert: ${{ secrets.SONAR_CACERT }}
          client-cert: ${{ secrets.SONAR_CLIENTCERT }}
          client-key: ${{ secrets.SONAR_CLIENTKEY }}
          token: ${{ secrets.SONAR_TOKEN }}
          host: https://mysonar.com
```

## Using maven

The java setup below enables the MTLS in the JVM, so no need to use the proxy in this case.

The proxy is not enabled when `client-cert` is not set.

```yaml
name: Sonarqube scanner

on:
  pull_request:
jobs:
  build:
    runs-on: [self-hosted,ts-large-x64-docker-large]
    steps:
      - uses: actions/checkout@v2

      - uses: actions/cache@v3
        with:
          path: ~/.m2/repository
          key: ${{ runner.os }}-maven-${{ github.event.repository.name }}-${{ hashFiles('**/pom.xml') }}
          restore-keys: |
            ${{ runner.os }}-maven-${{ github.event.repository.name }}-
            ${{ runner.os }}-maven-

      - id: setupJava
        uses: actions/setup-java@v3
        with:
          java-version: 11
          distribution: 'zulu'
          
      - name: Set up Maven
        uses: tradeshift/actions-setup-maven@v4.4
        with:
          maven-version: 3.8.6

      - name: Configure maven
        uses: tradeshift/actions-setup-java-mtls@v1
        with:
          java-version: "${{ steps.setupJava.outputs.version }}"
          maven-settings: ${{ secrets.MAVEN_SETTINGS_GH_PG }}
          maven-security: ${{ secrets.MAVEN_SECURITY }}
          maven-p12: ${{ secrets.MAVEN_P12 }}
          maven-p12-password: ${{ secrets.MAVEN_P12_PASSWORD }}
          mtls-cacert: ${{ secrets.MTLS_CACERT }}

      - name: SonarQube Scan
        uses: tradeshift/actions-sonarqube@v2
        with:
          scanner: maven
          token: ${{ secrets.SONAR_TOKEN }}
          host: 'https://sonar.ts.sv'
```
Test change (dont merge)

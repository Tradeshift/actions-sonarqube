# actions-sonarqube

Actions for running sonarqube

## scanner

Usage:

```yaml
on: pull_request
jobs:
  sonarqube:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v2
      - uses: tradeshift/actions-sonarqube/scanner@v1
        with:
          ca-cert: ${{ secrets.SONAR_CACERT }}
          client-cert: ${{ secrets.SONAR_CLIENTCERT }}
          client-key: ${{ secrets.SONAR_CLIENTKEY }}
          token: ${{ secrets.SONAR_TOKEN }}
          host: https://mysonar.com
```

## script-proxy-opts

Usage:

```yaml
name: Sonarqube scanner

on:
  pull_request:
jobs:
  build:
    runs-on: self-hosted
    steps:
    - uses: actions/checkout@v2

        - uses: actions/cache@v1
          id: cache
          with:
            path: ~/.m2/repository
            key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
            restore-keys: |
              ${{ runner.os }}-maven-

        - name: Set up JDK 10
          uses: actions/setup-java@v1
          with:
            java-version: 10

        - name: Setup Maven certs
          uses: tradeshift/actions-maven@master
          with:
            maven-settings: ${{ secrets.MAVEN_SETTINGS }}
            maven-security-settings: ${{ secrets.MAVEN_SECURITY }}
            maven-p12-keystore: ${{ secrets.MAVEN_P12 }}
            maven-p12-keystore-password: ${{ secrets.MAVEN_P12_PASSWORD }}
            company-rootca: ${{ secrets.MTLS_CACERT }}

        - name: Auth Docker GCR
          uses: tradeshift/actions-docker-gcr/auth@master
          with:
            gcr-service-account-key: ${{ secrets.GCLOUD_SERVICE_ACCOUNT_KEY }}

        - name: SonarQube options
          id: sonar-opts
          uses: tradeshift/actions-sonarqube/script-proxy-opts@master
          with:
            ca-cert: ${{ secrets.MTLS_CACERT }}
            cert: ${{ secrets.MTLS_CERT }}
            key: ${{ secrets.MTLS_KEY }}
            sonar-token: ${{ secrets.SONAR_TOKEN }}
            sonar-host: "https://sonar.host"

        - name SonarQube maven scan
          run: |
            mvn -B sonar:sonar ${{ steps.sonar-opts.output.opts }}


```

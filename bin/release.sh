#!/usr/bin/env bash

set -euxo pipefail

error_missing_field () {
  echo "Missing required env var: $1"
  exit 1
}

# ensure all required variables are set before doing any work
if [[ -z ${GITHUB_USER:-} ]]; then error_missing_field "GITHUB_USER"; fi
if [[ -z ${GITHUB_ACCESS_TOKEN:-} ]]; then error_missing_field "GITHUB_ACCESS_TOKEN"; fi
if [[ -z ${NPM_TOKEN:-} ]]; then error_missing_field "NPM_TOKEN"; fi
if [[ -z ${RELEASE_BRANCH:-} ]]; then error_missing_field "RELEASE_BRANCH"; fi
if [[ -z ${VERSION:-} ]]; then error_missing_field "VERSION"; fi
if [[ -z ${DIST_TAG:-} ]]; then error_missing_field "DIST_TAG"; fi

git clone --single-branch \
  --branch "$RELEASE_BRANCH" \
  https://"$GITHUB_USER":"$GITHUB_ACCESS_TOKEN"@github.com/bugsnag/bugsnag-expo-performance.git

cd /app/bugsnag-expo-performance

# "ci" rather than "install" ensures the process doesn't make the work tree dirty by modifying lockfiles
npm ci

# set the preid to match the dist tag if it's a prerelease version
# for example, a "beta" dist tag will produce versions like "1.0.0-beta.0"
case $VERSION in
  "prerelease" | "prepatch" | "preminor" | "premajor")
    preid="$DIST_TAG"
    ;;
  *)
    preid=""
    ;;
esac

CURRENT_VERSION=$(npm pkg get version | tr -d '"')

# increment package version
if [ -z "${RETRY_PUBLISH:-}" ]; then
  npm version "$VERSION" --preid="$preid"
fi

# build the package
npm run build

# ask for confirmation before proceeding with publish
set +x  # disable trace output for cleaner prompt
NEW_VERSION=$(npm pkg get version | tr -d '"')
echo ""
echo "New version: @bugsnag/expo-performance@$CURRENT_VERSION => v$NEW_VERSION"
echo ""
echo "This will be published with tag: $DIST_TAG"
echo ""
read -p "Do you want to proceed? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Release cancelled."
  exit 1
fi
set -x  # re-enable trace output

# push version commit and tag
git push --follow-tags

# publish the package
npm publish --tag "$DIST_TAG"

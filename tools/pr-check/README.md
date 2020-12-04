# PR Checks

This folder holds a Node.js script can be used to run PR checks. The main file responsible is `src/pr-check.ts`.

## Icons/Extensions 404 Check

This PR check is executed on any PR modifying plugins, and verifies two things:
* Whether the icon field points to a location which is reachable/downloadable
* Whether all .vsix files in the extensions spec are reachable/downloadable

This check can be run by specifying the `icons-extensions-404` argument when running the `pr-check.js` script.

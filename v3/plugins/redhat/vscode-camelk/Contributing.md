The VS Code Tooling for Camel K extension requires VS Code Kubernetes to be installed.
It comes with a specific sidecar image. This sidecar image can be found in the folder `sidecars/camelk`

When updating the Camel K or the Kubernetes extension, the Camel K and Kubernetes Tooling sidecar images might need to be updated too. When Kubernetes Tooling sidecar needs to be updated, the Camel K sidecar also needs to be updated as it depends on it.

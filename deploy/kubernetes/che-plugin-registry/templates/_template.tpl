{{- define "pluginRegistryHost" -}}
{{- .Values.chePluginRegistryHost | default (printf .Values.chePluginRegistryUrlFormat .Release.Namespace .Values.global.ingressDomain) -}}
{{- end -}}

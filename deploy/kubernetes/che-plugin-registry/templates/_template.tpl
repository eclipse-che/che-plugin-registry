{{- define "plugin.hostname" -}}
{{- .Values.hostnameOverride | default (printf "che-plugin-registry-%s" .Release.Namespace) -}}
{{- end -}}

variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

# Hostnames the Firebase Auth SDK may run on. Cloud Run URLs are stable per
# project + service name, so these survive destroy/recreate of the app layer.
variable "auth_domains" {
  type    = list(string)
  default = []
}

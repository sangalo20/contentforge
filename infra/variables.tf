variable "project_id" {
  description = "GCP project that hosts the demo."
  type        = string
}

variable "owner_email" {
  description = "Login created by `deploy.sh bootstrap` as workspace owner. Read by deploy.sh; not used by Terraform resources."
  type        = string
}

variable "region" {
  description = "Region for Cloud Run. Must match the base layer (registry, Firestore, buckets)."
  type        = string
  default     = "us-central1"
}

variable "build_region" {
  description = "Cloud Build region. Defaults to var.region."
  type        = string
  default     = null
}

variable "service_name" {
  description = "Cloud Run service name for the agent service."
  type        = string
  default     = "odin-agent"
}

variable "image" {
  description = "Prebuilt agent-service image in the base registry (deploy.sh passes <repo>/odin-agent:demo)."
  type        = string
}

variable "app_image" {
  description = "Prebuilt ContentForge web-app image in the base registry (deploy.sh passes <repo>/contentforge:demo)."
  type        = string
}

# Models. Bare names route to Gemini Enterprise Agent Platform (vertex_ai/) via ADC.
variable "gemini_model" {
  type    = string
  default = "gemini-3.1-pro-preview"
}

variable "gemini_flash_model" {
  type    = string
  default = "gemini-3.8-flash"
}

variable "image_model" {
  type    = string
  default = "gemini-3-pro-image"
}

variable "vertex_location" {
  type    = string
  default = "global"
}

variable "allowed_origins" {
  description = "CORS allowlist for browser calls (comma-separated)."
  type        = string
  default     = "http://localhost:5193"
}

variable "cpu" {
  type    = string
  default = "2"
}

variable "memory" {
  type    = string
  default = "2Gi"
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "max_instances" {
  type    = number
  default = 3
}

variable "request_timeout_seconds" {
  description = "Streaming LLM calls run for minutes; Cloud Run default is 300s."
  type        = number
  default     = 900
}

variable "invoker_members" {
  description = "Principals allowed to call the service (IAM-protected; no public access)."
  type        = list(string)
  default     = []
}

variable "allow_unauthenticated" {
  description = "Open the service to the internet. Off by default; the ContentForge backend calls it with an ID token."
  type        = bool
  default     = false
}


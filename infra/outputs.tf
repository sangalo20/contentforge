output "service_url" {
  value = google_cloud_run_v2_service.odin_agent.uri
}

output "app_url" {
  value = google_cloud_run_v2_service.contentforge.uri
}

output "image_repo" {
  value = local.base.image_repo
}

output "build_region" {
  value = coalesce(var.build_region, var.region)
}

output "firebase_web_config" {
  sensitive = true
  value     = local.base.firebase_web_config
}

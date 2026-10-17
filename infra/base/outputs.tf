output "project_id" { value = var.project_id }
output "region" { value = var.region }
output "image_repo" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.contentforge.repository_id}"
}
output "renders_bucket" { value = google_storage_bucket.renders.name }
output "media_bucket" { value = google_storage_bucket.media.name }
output "supadata_secret_id" { value = google_secret_manager_secret.supadata.secret_id }
output "serper_secret_id" { value = google_secret_manager_secret.serper.secret_id }

output "firebase_web_config" {
  value = {
    VITE_FIREBASE_API_KEY             = data.google_firebase_web_app_config.contentforge.api_key
    VITE_FIREBASE_AUTH_DOMAIN         = data.google_firebase_web_app_config.contentforge.auth_domain
    VITE_FIREBASE_PROJECT_ID          = var.project_id
    VITE_FIREBASE_STORAGE_BUCKET      = google_storage_bucket.media.name
    VITE_FIREBASE_MESSAGING_SENDER_ID = lookup(data.google_firebase_web_app_config.contentforge, "messaging_sender_id", "")
    VITE_FIREBASE_APP_ID              = google_firebase_web_app.contentforge.app_id
  }
}

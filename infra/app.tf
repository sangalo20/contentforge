# APP LAYER — destroy/recreate freely. Reads the base layer's outputs.
# Images are prebuilt in the base registry; nothing here builds anything.

data "terraform_remote_state" "base" {
  backend = "local"
  config = {
    path = "${path.module}/base/terraform.tfstate"
  }
}

locals {
  base           = data.terraform_remote_state.base.outputs
  renders_bucket = local.base.renders_bucket
  media_bucket   = local.base.media_bucket
}

# ------------------------------------------------- Odin agent service
resource "google_service_account" "odin_agent" {
  project      = var.project_id
  account_id   = "odin-agent-sa"
  display_name = "Odin Agent service (ContentForge DevFest)"
}

resource "google_project_iam_member" "odin_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.odin_agent.email}"
}

resource "google_project_iam_member" "odin_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.odin_agent.email}"
}

resource "google_project_iam_member" "odin_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.odin_agent.email}"
}

resource "google_storage_bucket_iam_member" "odin_renders" {
  bucket = local.renders_bucket
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.odin_agent.email}"
}

resource "google_secret_manager_secret_iam_member" "odin_reads_serper" {
  project   = var.project_id
  secret_id = local.base.serper_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.odin_agent.email}"
}

# IAM grants take up to a minute to propagate; a container that boots before
# then gets PERMISSION_DENIED from Firestore and exits. Wait once, after all
# bindings, before creating either service.
resource "time_sleep" "iam_propagation" {
  create_duration = "75s"
  depends_on = [
    google_project_iam_member.odin_aiplatform_user,
    google_project_iam_member.odin_firestore_user,
    google_project_iam_member.odin_log_writer,
    google_storage_bucket_iam_member.odin_renders,
    google_secret_manager_secret_iam_member.odin_reads_serper,
    google_project_iam_member.app_firestore_user,
    google_project_iam_member.app_aiplatform_user,
    google_project_iam_member.app_log_writer,
    google_storage_bucket_iam_member.app_media,
    google_secret_manager_secret_iam_member.app_reads_supadata,
  ]
}

resource "google_cloud_run_v2_service" "odin_agent" {
  project             = var.project_id
  name                = var.service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  depends_on = [
    google_project_iam_member.odin_aiplatform_user,
    google_storage_bucket_iam_member.odin_renders,
    google_secret_manager_secret_iam_member.odin_reads_serper,
    time_sleep.iam_propagation,
  ]

  template {
    service_account = google_service_account.odin_agent.email
    timeout         = "${var.request_timeout_seconds}s"

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        startup_cpu_boost = true
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "VERTEX_LOCATION"
        value = var.vertex_location
      }
      env {
        name  = "GEMINI_MODEL"
        value = var.gemini_model
      }
      env {
        name  = "GEMINI_FLASH_MODEL"
        value = var.gemini_flash_model
      }
      env {
        name  = "IMAGE_MODEL"
        value = var.image_model
      }
      env {
        name  = "RENDERS_BUCKET"
        value = local.renders_bucket
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = var.allowed_origins
      }
      env {
        name  = "LOG_LEVEL"
        value = "INFO"
      }
      env {
        name = "SERPER_API_KEY"
        value_source {
          secret_key_ref {
            secret  = local.base.serper_secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get { path = "/healthz" }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 24
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "invokers" {
  for_each = toset(var.allow_unauthenticated ? ["allUsers"] : var.invoker_members)
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.odin_agent.name
  role     = "roles/run.invoker"
  member   = each.value
}

# ------------------------------------------------- ContentForge web app
resource "google_service_account" "contentforge" {
  project      = var.project_id
  account_id   = "contentforge-sa"
  display_name = "ContentForge web app (DevFest)"
}

resource "google_project_iam_member" "app_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.contentforge.email}"
}

resource "google_project_iam_member" "app_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.contentforge.email}"
}

resource "google_project_iam_member" "app_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.contentforge.email}"
}

resource "google_storage_bucket_iam_member" "app_media" {
  bucket = local.media_bucket
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.contentforge.email}"
}

resource "google_secret_manager_secret_iam_member" "app_reads_supadata" {
  project   = var.project_id
  secret_id = local.base.supadata_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.contentforge.email}"
}

resource "google_cloud_run_v2_service_iam_member" "app_invokes_odin" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.odin_agent.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.contentforge.email}"
}

resource "google_cloud_run_v2_service" "contentforge" {
  project             = var.project_id
  name                = "contentforge"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  depends_on = [
    google_project_iam_member.app_firestore_user,
    google_storage_bucket_iam_member.app_media,
    google_secret_manager_secret_iam_member.app_reads_supadata,
    time_sleep.iam_propagation,
  ]

  template {
    service_account = google_service_account.contentforge.email
    timeout         = "${var.request_timeout_seconds}s"

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = var.app_image

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
        startup_cpu_boost = true
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_CLOUD_LOCATION"
        value = var.region
      }
      env {
        name  = "STORAGE_BUCKET"
        value = local.media_bucket
      }
      env {
        name  = "ODIN_API_URL"
        value = google_cloud_run_v2_service.odin_agent.uri
      }
      env {
        name  = "CORS_ORIGINS"
        value = var.allowed_origins
      }
      env {
        name = "SUPADATA_API_KEY"
        value_source {
          secret_key_ref {
            secret  = local.base.supadata_secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get { path = "/api/health" }
        initial_delay_seconds = 3
        period_seconds        = 5
        failure_threshold     = 24
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "app_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.contentforge.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

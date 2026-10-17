# BASE LAYER — applied once, never destroyed for the demo. Holds everything
# stateful or slow: APIs, image registry, secrets, Firestore, Firebase Auth,
# buckets. The app layer (../) creates Cloud Run + IAM on top and can be torn
# down and rebuilt in minutes.

locals {
  apis = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "compute.googleapis.com",
    "aiplatform.googleapis.com",
    "storage.googleapis.com",
    "firestore.googleapis.com",
    "logging.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",
    "serviceusage.googleapis.com",
    "secretmanager.googleapis.com",
  ]
  compute_default_sa = "${data.google_project.this.number}-compute@developer.gserviceaccount.com"
}

data "google_project" "this" {
  project_id = var.project_id
}

resource "google_project_service" "apis" {
  for_each           = toset(local.apis)
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# ------------------------------------------------- Artifact Registry
resource "google_artifact_registry_repository" "contentforge" {
  project       = var.project_id
  location      = var.region
  repository_id = "contentforge"
  format        = "DOCKER"
  description   = "ContentForge images (agent service + web app)"
  depends_on    = [google_project_service.apis]
}

# Cloud Build default identity: push images, write logs, read source tarballs.
resource "google_project_iam_member" "build_ar_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${local.compute_default_sa}"
}

resource "google_project_iam_member" "build_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${local.compute_default_sa}"
}

resource "google_project_iam_member" "build_source_reader" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${local.compute_default_sa}"
}

# ------------------------------------------------- Buckets
resource "google_storage_bucket" "renders" {
  project                     = var.project_id
  name                        = "${var.project_id}-contentforge-renders"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
  lifecycle_rule {
    condition { age = 30 }
    action { type = "Delete" }
  }
  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket" "media" {
  project                     = var.project_id
  name                        = "${var.project_id}-contentforge-media"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
  depends_on                  = [google_project_service.apis]
}

# ------------------------------------------------- Firestore
resource "google_firestore_database" "default" {
  project         = var.project_id
  name            = "(default)"
  location_id     = var.region
  type            = "FIRESTORE_NATIVE"
  deletion_policy = "DELETE"
  depends_on      = [google_project_service.apis]
}

# Every library listing (app + /api/v1) filters by workspace and sorts by
# createdAt; Firestore needs a composite index for that or returns 500.
resource "google_firestore_index" "library_by_workspace" {
  project     = var.project_id
  database    = google_firestore_database.default.name
  collection  = "content_pipeline_library"
  query_scope = "COLLECTION"

  fields {
    field_path = "workspaceId"
    order      = "ASCENDING"
  }
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

# ------------------------------------------------- Firebase + Auth
resource "google_firebase_project" "this" {
  provider   = google-beta
  project    = var.project_id
  depends_on = [google_project_service.apis]
}

resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false
    email {
      enabled           = true
      password_required = true
    }
  }

  authorized_domains = concat(
    ["localhost", "${var.project_id}.firebaseapp.com", "${var.project_id}.web.app"],
    var.auth_domains,
  )

  depends_on = [google_firebase_project.this]
}

resource "google_firebase_web_app" "contentforge" {
  provider        = google-beta
  project         = var.project_id
  display_name    = "ContentForge DevFest"
  deletion_policy = "DELETE"
  depends_on      = [google_firebase_project.this]
}

data "google_firebase_web_app_config" "contentforge" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.contentforge.app_id
}

# ------------------------------------------------- Secrets (containers only)
# Versions are added by deploy.sh so values never touch state or source.
resource "google_secret_manager_secret" "supadata" {
  project   = var.project_id
  secret_id = "contentforge-supadata-api-key"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "serper" {
  project   = var.project_id
  secret_id = "odin-serper-api-key"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

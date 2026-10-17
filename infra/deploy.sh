#!/bin/zsh
# ContentForge DevFest deployment.
#
# Two Terraform layers:
#   infra/base  — stateful, applied once: APIs, registry, secrets, Firestore,
#                 Firebase Auth, buckets. Images live here. Never destroyed.
#   infra/      — app layer: service accounts, IAM, two Cloud Run services.
#                 Destroy/recreate in ~2-3 min using prebuilt images.
#
# Before the talk:   ./deploy.sh base && ./deploy.sh secrets && ./deploy.sh build && ./deploy.sh bootstrap
# On stage:          ./deploy.sh down     (optional, beforehand)
#                    ./deploy.sh up       <- the demo: apply app layer with prebuilt images
#                    ./deploy.sh smoke
# Cleanup:           ./deploy.sh down     (keeps base);  ./deploy.sh nuke  (everything)
set -euo pipefail
cd "$(dirname "$0")"

export CLOUDSDK_ACTIVE_CONFIG_NAME=gde
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud-gde/application_default_credentials.json"

PROJECT=$(grep -E '^project_id' terraform.tfvars | sed -E 's/.*"(.*)".*/\1/')
REGION=$(grep -E '^region' terraform.tfvars | sed -E 's/.*"(.*)".*/\1/')
REPO="$REGION-docker.pkg.dev/$PROJECT/contentforge"
DEMO_TAG=${DEMO_TAG:-demo}
OWNER_EMAIL=${OWNER_EMAIL:-mwenyinyo@gmail.com}
IMAGE="$REPO/odin-agent:$DEMO_TAG"
APP_IMAGE="$REPO/contentforge:$DEMO_TAG"

# Cloud Run only rolls a new revision when the image string changes, so a moved
# :demo tag would be ignored. Pin by digest at apply time instead.
digest_of() {
  local name=${1%%:*} tag=${1##*:} d
  d=$(gcloud artifacts docker tags list "$name" --project "$PROJECT" --filter="tag:$tag" --format='value(version)' 2>/dev/null | head -1)
  [[ -n $d ]] && echo "$name@$d"
}
tf_vars() {
  local img app
  img=$(digest_of "$IMAGE"); app=$(digest_of "$APP_IMAGE")
  [[ -n $img && -n $app ]] || { echo "!! :$DEMO_TAG tag missing in registry; run ./deploy.sh build" >&2; exit 1; }
  echo -var "image=$img" -var "app_image=$app"
}

base() {
  ( cd base && terraform init -input=false -upgrade >/dev/null && terraform apply -input=false -auto-approve )
}

# Copy third-party keys from the Belrose .env files into Secret Manager.
# Values flow through a pipe only; nothing is echoed or stored here.
secrets() {
  local belrose="$HOME/Development/belrose"
  grep -E '^SUPADATA_API_KEY=' "$belrose/contentforge/backend/.env" | cut -d= -f2- | tr -d '\n"' \
    | gcloud secrets versions add contentforge-supadata-api-key --project "$PROJECT" --data-file=- --quiet
  grep -E '^SERPER_API_KEY=' "$belrose/odin-agent/.env" | cut -d= -f2- | tr -d '\n"' \
    | gcloud secrets versions add odin-serper-api-key --project "$PROJECT" --data-file=- --quiet
  echo ">> secrets stored"
}

write_frontend_env() {
  ( cd base && terraform output -json firebase_web_config ) \
    | python3 -c 'import json,sys; [print(f"{k}={v}") for k,v in json.load(sys.stdin).items()]' \
    > ../contentforge/frontend/.env.production
}

# Build both images and tag them :demo (plus a timestamp tag for history).
# `tags add` does not move an existing tag reliably; drop it first.
retag() {
  gcloud artifacts docker tags delete "$2" --quiet >/dev/null 2>&1 || true
  gcloud artifacts docker tags add "$1" "$2" --quiet
}

build() {
  local ts; ts=$(date +%Y%m%d-%H%M%S)
  echo ">> building $IMAGE"
  gcloud builds submit ../odin-agent --project "$PROJECT" --region "$REGION" --tag "$REPO/odin-agent:$ts" --quiet >/dev/null
  retag "$REPO/odin-agent:$ts" "$IMAGE"
  write_frontend_env
  echo ">> building $APP_IMAGE"
  gcloud builds submit ../contentforge --project "$PROJECT" --region "$REGION" --tag "$REPO/contentforge:$ts" --quiet >/dev/null
  retag "$REPO/contentforge:$ts" "$APP_IMAGE"
  echo ">> built and tagged :$DEMO_TAG"
}

# THE DEMO: create SAs, IAM and both Cloud Run services from prebuilt images.
up() {
  terraform init -input=false -upgrade >/dev/null
  time terraform apply -input=false -auto-approve $(tf_vars)
  echo
  echo "app:  $(terraform output -raw app_url)"
  echo "odin: $(terraform output -raw service_url)"
}

down() {
  terraform init -input=false -upgrade >/dev/null
  terraform destroy -input=false -auto-approve $(tf_vars)
}

nuke() {
  down
  ( cd base && terraform destroy -input=false -auto-approve )
}

bootstrap() {
  export GCP_PROJECT_ID="$PROJECT" OWNER_EMAIL
  export OWNER_PASSWORD=${OWNER_PASSWORD:-$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)}
  ( cd ../contentforge/backend && [[ -d node_modules ]] || npm ci --omit=dev >/dev/null )
  ( cd ../contentforge/backend && node scripts/devfest-bootstrap-owner.mjs )
  umask 077
  printf 'url=%s\nemail=%s\npassword=%s\n' "$(terraform output -raw app_url 2>/dev/null || echo pending)" "$OWNER_EMAIL" "$OWNER_PASSWORD" > .demo_credentials
  echo ">> owner ready: $OWNER_EMAIL (credentials in infra/.demo_credentials)"
}

smoke() {
  sleep 15  # fresh run.invoker bindings take a few seconds to reach the edge
  local odin app
  odin=$(terraform output -raw service_url); app=$(terraform output -raw app_url)
  echo ">> odin  $(curl -sS "$odin/healthz/ready" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d["status"], d["agents"])')"
  echo ">> app   HTTP $(curl -sS -o /dev/null -w '%{http_code}' "$app/api/health") /api/health"
  echo ">> open  $app"
}

images() {
  gcloud artifacts docker tags list "$REPO/odin-agent" --project "$PROJECT" --format='table(tag,version)' 2>/dev/null | head -5
  gcloud artifacts docker tags list "$REPO/contentforge" --project "$PROJECT" --format='table(tag,version)' 2>/dev/null | head -5
}

case "${1:-}" in
  base)      base ;;
  secrets)   secrets ;;
  build)     build ;;
  up)        up ;;
  down)      down ;;
  nuke)      nuke ;;
  bootstrap) bootstrap ;;
  smoke)     smoke ;;
  images)    images ;;
  *) echo "usage: $0 base|secrets|build|up|down|nuke|bootstrap|smoke|images"; exit 2 ;;
esac

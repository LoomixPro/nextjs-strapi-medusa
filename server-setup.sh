#!/usr/bin/env bash
# ==============================================================================
#  Full-Stack E-Commerce Server Deployment & Setup Wizard
#  (Next.js Storefront + Medusa Backend + Strapi CMS + Caddy + OpenObserve)
#  Based on Project Deployment Architecture & README.md
# ==============================================================================

set -eo pipefail

# ------------------------------------------------------------------------------
# Colors & Formatting
# ------------------------------------------------------------------------------
BOLD='\033[1m'
NC='\033[0m' # No Color
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'

LOG_FILE="server-setup.log"
touch "${LOG_FILE}" 2>/dev/null && chmod 600 "${LOG_FILE}" 2>/dev/null || true
exec > >(tee -a "${LOG_FILE}") 2>&1

# ------------------------------------------------------------------------------
# Helper Output Functions
# ------------------------------------------------------------------------------
print_banner() {
    clear 2>/dev/null || true
    echo -e "${CYAN}${BOLD}"
    echo "=============================================================================="
    echo "       🚀 NEXT.JS + MEDUSA + STRAPI + CADDY SERVER SETUP WIZARD"
    echo "=============================================================================="
    echo -e "${NC}"
}

step_header() {
    local num="$1"
    local title="$2"
    echo ""
    echo -e "${MAGENTA}${BOLD}------------------------------------------------------------------------------${NC}"
    echo -e "${MAGENTA}${BOLD} [PHASE ${num}] ${title}${NC}"
    echo -e "${MAGENTA}${BOLD}------------------------------------------------------------------------------${NC}"
}

info() {
    echo -e "${BLUE}${BOLD}ℹ [INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}${BOLD}✔ [SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}${BOLD}⚠ [WARNING]${NC} $1"
}

error() {
    echo -e "${RED}${BOLD}✖ [ERROR]${NC} $1"
}

prompt_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local input
    echo -ne "${CYAN}${prompt} ${GRAY}[${default}]${NC}: "
    read -r input
    printf -v "$var_name" '%s' "${input:-$default}"
}

prompt_secret() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local input
    if [ -n "$default" ]; then
        echo -ne "${CYAN}${prompt} ${GRAY}[Default: keep generated]${NC}: "
    else
        echo -ne "${CYAN}${prompt}${NC}: "
    fi
    read -r -s input
    if [ -n "$input" ]; then
        echo -e " ${GREEN}✔ (${#input} characters entered)${NC}"
    else
        echo ""
    fi
    printf -v "$var_name" '%s' "${input:-$default}"
}

wait_for_health() {
    local service="$1"
    local timeout="${2:-90}"
    local count=0
    echo -ne "${BLUE}⏳ Waiting for ${service} to become healthy...${NC}"
    while [ "$count" -lt "$timeout" ]; do
        local status
        status=$(docker inspect --format='{{json .State.Health.Status}}' "$service" 2>/dev/null || echo "\"unknown\"")
        if [ "$status" == "\"healthy\"" ]; then
            echo -e " ${GREEN}${BOLD}[HEALTHY]${NC}"
            return 0
        fi
        # If container has no healthcheck configured, check if it's running
        if [ "$status" == "\"unknown\"" ] || [ "$status" == "null" ]; then
            local running
            running=$(docker inspect --format='{{json .State.Running}}' "$service" 2>/dev/null || echo "false")
            if [ "$running" == "true" ]; then
                echo -e " ${GREEN}${BOLD}[RUNNING]${NC}"
                return 0
            fi
        fi
        sleep 2
        count=$((count + 2))
        echo -ne "."
    done
    echo -e " ${RED}${BOLD}[TIMEOUT]${NC}"
    warn "${service} did not report healthy within ${timeout}s. Check logs: docker compose logs ${service}"
    return 1
}

wait_for_port() {
    local host="$1"
    local port="$2"
    local name="$3"
    local timeout="${4:-90}"
    local count=0
    echo -ne "${BLUE}⏳ Waiting for ${name} (${host}:${port}) to be ready... [0s]${NC}"
    while [ "$count" -lt "$timeout" ]; do
        if curl -sf "http://${host}:${port}/_health" >/dev/null 2>&1 || curl -sf "http://${host}:${port}/health" >/dev/null 2>&1 || curl -sf "http://${host}:${port}" >/dev/null 2>&1 || nc -z "$host" "$port" 2>/dev/null || (echo > "/dev/tcp/${host}/${port}") 2>/dev/null; then
            echo -e " ${GREEN}${BOLD}[READY in ${count}s]${NC}"
            return 0
        fi
        sleep 2
        count=$((count + 2))
        echo -ne "\r${BLUE}⏳ Waiting for ${name} (${host}:${port}) to be ready... [${count}s]${NC}"
    done
    echo -e "\r${YELLOW}⏳ Waiting for ${name} (${host}:${port}) to be ready... [TIMEOUT (${timeout}s)]${NC}"
    return 1
}

wait_for_http_ready() {
    local url="$1"
    local name="$2"
    local timeout="${3:-180}"
    local count=0
    echo -ne "${BLUE}⏳ Waiting for ${name} to finish startup & become fully ready... [0s]${NC}"
    while [ "$count" -lt "$timeout" ]; do
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
            echo -e "\r${GREEN}✔ ${name} is fully initialized and ready! (HTTP ${http_code} in ${count}s)${NC}               "
            return 0
        fi
        sleep 3
        count=$((count + 3))
        echo -ne "\r${BLUE}⏳ Waiting for ${name} to finish startup & become fully ready... [${count}s]${NC}"
    done
    echo -e "\r${YELLOW}⚠️  ${name} wait timed out after ${timeout}s. Container may still be initializing.${NC}               "
    return 1
}


pull_with_progress() {
    local service="$1"
    local title="$2"
    info "Pulling ${title} container image..."
    
    local pull_log
    pull_log=$(mktemp)
    docker compose pull "$service" > "$pull_log" 2>&1 &
    local pid=$!
    
    local spin_chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    local i=0
    local elapsed=0
    
    while kill -0 "$pid" 2>/dev/null; do
        local spin="${spin_chars[i % ${#spin_chars[@]}]}"
        local progress_info
        progress_info=$(grep -E "Downloading|Extracting" "$pull_log" 2>/dev/null | tail -n1 | sed -E 's/.*([0-9.]+MB\/[0-9.]+MB).*/\1/' || true)
        if [ -n "$progress_info" ]; then
            echo -ne "\r${CYAN}${spin} Downloading ${title} (${progress_info}) ... [${elapsed}s]${NC}        \b\b\b\b\b\b\b\b"
        else
            echo -ne "\r${CYAN}${spin} Downloading ${title} container image ... [${elapsed}s]${NC}        \b\b\b\b\b\b\b\b"
        fi
        sleep 1
        elapsed=$((elapsed + 1))
        i=$((i + 1))
    done
    
    wait "$pid"
    local exit_code=$?
    
    if [ "$exit_code" -eq 0 ]; then
        echo -e "\r${GREEN}✔ ${title} container image downloaded successfully in ${elapsed}s.${NC}                  "
        rm -f "$pull_log"
        return 0
    else
        echo -e "\r${RED}✖ Failed to pull ${title} image.${NC}                  "
        echo -e "${YELLOW}Error details:${NC}"
        cat "$pull_log"
        rm -f "$pull_log"
        return 1
    fi
}

generate_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        # Fallback using /dev/urandom
        head -c 32 /dev/urandom | od -A n -t x1 | tr -d ' \n'
    fi
}

update_env_var() {
    local key="$1"
    local val="$2"
    local env_file="${3:-.env}"
    if [ ! -f "$env_file" ]; then
        touch "$env_file"
    fi
    if grep -q "^${key}=" "$env_file"; then
        # Escape special characters for sed
        local escaped_val
        escaped_val=$(printf '%s\n' "$val" | sed -e 's/[\/&]/\\&/g')
        sed -i "s/^${key}=.*/${key}=${escaped_val}/" "$env_file"
    else
        echo "${key}=${val}" >> "$env_file"
    fi
}

get_env_var() {
    local key="$1"
    local env_file="${2:-.env}"
    if [ -f "$env_file" ]; then
        grep "^${key}=" "$env_file" | head -n1 | cut -d '=' -f2- | tr -d '\r' || true
    fi
}

detect_server_ip() {
    local ip
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$ip" ]; then
        ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
    fi
    if [ -z "$ip" ]; then
        ip="127.0.0.1"
    fi
    echo "$ip"
}

detect_github_repo() {
    local repo_url
    repo_url=$(git config --get remote.origin.url 2>/dev/null || true)
    if [ -n "$repo_url" ]; then
        repo_url="${repo_url%.git}"
        repo_url="${repo_url%.git/}"
        echo "$repo_url" | sed -E 's/.*github\.com[:\/]//' | tr '[:upper:]' '[:lower:]'
    else
        echo ""
    fi
}

authenticate_ghcr() {
    local deploy_repo="$1"
    local default_gh_user
    default_gh_user=$(echo "$deploy_repo" | cut -d '/' -f1)
    
    local saved_pat
    saved_pat=$(get_env_var "GITHUB_PAT")
    if [ -z "$saved_pat" ]; then
        saved_pat=$(get_env_var "GITHUB_DEPLOY_TOKEN")
    fi

    echo ""
    echo -e "${BOLD}GitHub Container Registry (ghcr.io) Authentication:${NC}"
    
    local has_docker_login=false
    if grep -q "ghcr.io" ~/.docker/config.json 2>/dev/null; then
        has_docker_login=true
    fi

    if [ "$has_docker_login" = true ]; then
        warn "Existing Docker ghcr.io credentials found, but they might belong to an older session or different account."
    fi

    if [ -n "$saved_pat" ]; then
        local try_saved="Y"
        prompt_default "Authenticate ghcr.io using saved token for '${default_gh_user}'? (Y/n)" "Y" try_saved
        if [[ "$try_saved" =~ ^[Yy]$ ]]; then
            info "Authenticating with ghcr.io using saved token..."
            if echo "$saved_pat" | docker login ghcr.io -u "$default_gh_user" --password-stdin >/dev/null 2>&1; then
                success "Docker successfully authenticated with ghcr.io as '${default_gh_user}'."
                return 0
            else
                warn "Saved token failed to authenticate with ghcr.io."
            fi
        fi
    fi

    local prompt_login="Y"
    prompt_default "Do you need to login/re-authenticate with ghcr.io for '${deploy_repo}'? (Y/n)" "Y" prompt_login
    if [[ "$prompt_login" =~ ^[Yy]$ ]]; then
        local gh_user="" gh_pat=""
        prompt_default "GitHub Username" "$default_gh_user" gh_user
        prompt_default "GitHub Personal Access Token (PAT with 'repo', 'workflow', 'read:packages' scopes)" "${saved_pat:-}" gh_pat
        if [ -n "$gh_pat" ]; then
            info "Logging in to ghcr.io..."
            if echo "$gh_pat" | docker login ghcr.io -u "$gh_user" --password-stdin; then
                update_env_var "GITHUB_PAT" "$gh_pat"
                update_env_var "GITHUB_DEPLOY_TOKEN" "$gh_pat"
                success "Docker authenticated with ghcr.io as '${gh_user}'."
                return 0
            else
                error "Failed to authenticate with ghcr.io. Please check your username and token permissions."
                return 1
            fi
        else
            warn "No token entered. Skipping ghcr.io authentication."
        fi
    fi
    return 0
}



# ------------------------------------------------------------------------------
# Pre-Flight Checks
# ------------------------------------------------------------------------------
preflight_checks() {
    print_banner
    info "Starting pre-flight system checks..."

    # Check Linux OS
    if [[ "$OSTYPE" != "linux"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
        warn "This script is designed for Linux/macOS environments."
    fi

    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker is not installed."
        echo -ne "${CYAN}Do you want to automatically install Docker now? (y/N)${NC}: "
        read -r install_docker
        if [[ "$install_docker" =~ ^[Yy]$ ]]; then
            info "Installing Docker via get.docker.com..."
            curl -fsSL https://get.docker.com | sudo sh
            sudo usermod -aG docker "$USER"
            success "Docker installed! Note: You might need to re-login if docker permissions fail."
        else
            error "Please install Docker and re-run this script."
            exit 1
        fi
    fi

    # Check Docker Compose v2
    if ! docker compose version >/dev/null 2>&1; then
        error "'docker compose' (v2) is not available. Please install docker-compose-plugin."
        exit 1
    fi
    success "Docker & Docker Compose v2 verified."

    # Check docker permissions
    if ! docker ps >/dev/null 2>&1; then
        warn "Cannot connect to Docker daemon as user '$USER'."
        info "Fixing permissions: adding $USER to docker group..."
        sudo groupadd docker 2>/dev/null || true
        sudo usermod -aG docker "$USER" 2>/dev/null || true
        warn "Docker permissions updated. Please execute 'newgrp docker' or re-login to your SSH session, then re-run this script."
        exit 1
    fi

    # Check / Install helper utilities: curl, openssl, jq, nc/netcat
    local missing_pkgs=()
    for pkg in curl openssl jq; do
        if ! command -v "$pkg" >/dev/null 2>&1; then
            missing_pkgs+=("$pkg")
        fi
    done

    if [ ${#missing_pkgs[@]} -gt 0 ]; then
        info "Installing required packages: ${missing_pkgs[*]}..."
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update -qq && sudo apt-get install -y -qq "${missing_pkgs[@]}"
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y "${missing_pkgs[@]}"
        fi
    fi
    success "Required tools (curl, openssl, jq) verified."
}

# ------------------------------------------------------------------------------
# Phase 0: Configuration & Profile Wizard
# ------------------------------------------------------------------------------
configure_profile_and_env() {
    step_header "0" "Deployment Profile Selection & .env Configuration"

    # Check if .env already exists before asking anything
    if [ -f ".env" ]; then
        warn "An existing .env file was found."
        local use_existing="Y"
        prompt_default "Do you want to use the existing .env file and continue? (Y/n)" "Y" use_existing
        if [[ "$use_existing" =~ ^[Yy]$ ]]; then
            info "Using existing .env configuration."
            
            # Verify and fix GITHUB_DEPLOY_REPO if unset or invalid template value
            local existing_repo
            existing_repo=$(get_env_var "GITHUB_DEPLOY_REPO")
            if [ -z "$existing_repo" ] || [[ "$existing_repo" == *"<"* ]] || [[ "$existing_repo" == *".git"* ]]; then
                local detected_repo
                detected_repo=$(detect_github_repo)
                prompt_default "GitHub Repository name (owner/repo for ghcr.io images)" "${detected_repo:-your-github-username/your-repo-name}" existing_repo
                existing_repo="${existing_repo%.git}"
                existing_repo="${existing_repo%.git/}"
                existing_repo=$(echo "$existing_repo" | tr '[:upper:]' '[:lower:]')
                update_env_var "GITHUB_DEPLOY_REPO" "$existing_repo"
            fi

            # Authenticate with ghcr.io for the repository
            authenticate_ghcr "$existing_repo"
            return 0
        fi
        cp .env ".env.bak.$(date +%s)"
        info "Existing .env backed up to .env.bak.*"
    fi

    local current_ip
    current_ip=$(detect_server_ip)

    echo -e "Please select your deployment profile according to ${BOLD}README.md §3${NC}:"
    echo -e " ${BOLD}1)${NC} ${CYAN}Profile A${NC} — Quick LAN / Local Test (Plain HTTP + Server IP, Skip Caddy SSL)"
    echo -e " ${BOLD}2)${NC} ${CYAN}Profile B${NC} — VM / LAN with HTTPS (${BOLD}.local${NC} hostnames + Caddy self-signed SSL) [Recommended for VM/Demo]"
    echo -e " ${BOLD}3)${NC} ${CYAN}Profile C${NC} — Real Public Domain (Production HTTPS with real domain names + Caddy auto ZeroSSL/Let's Encrypt)"
    echo ""

    local profile_choice="2"
    prompt_default "Enter profile choice (1/2/3)" "2" profile_choice

    local profile="B"
    case "$profile_choice" in
        1) profile="A" ;;
        2) profile="B" ;;
        3) profile="C" ;;
        *) profile="B" ;;
    esac

    info "Selected: Profile ${profile}"

    # Start with template if available
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        touch .env
    fi

    # Generate all secret keys automatically
    info "Generating secure cryptographic random secrets..."
    local pg_pass meili_master strapi_salt strapi_adm_jwt strapi_trans strapi_jwt strapi_enc strapi_k1 strapi_k2
    local medusa_jwt medusa_cookie revalidate_sec umami_sec internal_sec auth_mfa

    pg_pass=$(generate_secret)
    meili_master=$(generate_secret)
    strapi_salt=$(generate_secret)
    strapi_adm_jwt=$(generate_secret)
    strapi_trans=$(generate_secret)
    strapi_jwt=$(generate_secret)
    strapi_enc=$(generate_secret)
    strapi_k1=$(generate_secret)
    strapi_k2=$(generate_secret)
    medusa_jwt=$(generate_secret)
    medusa_cookie=$(generate_secret)
    revalidate_sec=$(generate_secret)
    umami_sec=$(generate_secret)
    internal_sec=$(generate_secret)
    auth_mfa=$(generate_secret)

    update_env_var "POSTGRES_PASSWORD" "$pg_pass"
    update_env_var "MEILI_MASTER_KEY" "$meili_master"
    update_env_var "STRAPI_API_TOKEN_SALT" "$strapi_salt"
    update_env_var "STRAPI_ADMIN_JWT_SECRET" "$strapi_adm_jwt"
    update_env_var "STRAPI_TRANSFER_TOKEN_SALT" "$strapi_trans"
    update_env_var "STRAPI_JWT_SECRET" "$strapi_jwt"
    update_env_var "STRAPI_ENCRYPTION_KEY" "$strapi_enc"
    update_env_var "STRAPI_APP_KEYS" "${strapi_k1},${strapi_k2}"
    update_env_var "MEDUSA_JWT_SECRET" "$medusa_jwt"
    update_env_var "MEDUSA_COOKIE_SECRET" "$medusa_cookie"
    update_env_var "REVALIDATE_SECRET" "$revalidate_sec"
    update_env_var "UMAMI_APP_SECRET" "$umami_sec"
    update_env_var "INTERNAL_API_SECRET" "$internal_sec"
    update_env_var "AUTH_MFA_ENCRYPTION_KEY" "$auth_mfa"

    # Base Constants
    update_env_var "POSTGRES_USER" "postgres"
    update_env_var "POSTGRES_MAX_CONNECTIONS" "500"
    update_env_var "STRAPI_NODE_ENV" "production"
    update_env_var "STRAPI_DATABASE_CLIENT" "postgres"
    update_env_var "STRAPI_DATABASE_SSL" "false"
    update_env_var "STRAPI_HOST" "0.0.0.0"
    update_env_var "STRAPI_PORT" "1337"
    update_env_var "MEDUSA_NODE_ENV" "production"
    update_env_var "MEDUSA_ADMIN_ONBOARDING_TYPE" "default"
    update_env_var "MEILISEARCH_INDEX_NAME" "products"
    update_env_var "MEILISEARCH_NO_ANALYTICS" "true"
    update_env_var "MEILISEARCH_ENV" "production"
    update_env_var "MINIO_REGION" "us-east-1"
    update_env_var "MINIO_BUCKET" "mystore"
    update_env_var "DEFAULT_REGION" "US"
    update_env_var "DEFAULT_LOCALE" "en-US"
    update_env_var "ENABLE_IRAN_FEATURES" "false"
    update_env_var "STOREFRONT_URL" "http://storefront:8000"
    update_env_var "MEDUSA_BACKEND_URL" "http://medusa:9000"
    update_env_var "UMAMI_URL" "http://localhost:3000"
    update_env_var "REGISTRY_URL" "https://raw.githubusercontent.com/Loomix-pro/Loomix-registry/main/src/modules"
    update_env_var "GITHUB_PAT" ""

    # Admin Credentials
    echo ""
    echo -e "${BOLD}Configuring Admin Credentials:${NC}"
    local medusa_email="admin@example.com"
    local medusa_pwd="password123"
    prompt_default "Primary Admin Email (Medusa & System Admin)" "admin@example.com" medusa_email
    prompt_default "Primary Admin Password" "password123" medusa_pwd
    update_env_var "MEDUSA_ADMIN_EMAIL" "$medusa_email"
    update_env_var "MEDUSA_ADMIN_PASSWORD" "$medusa_pwd"

    local minio_user="minioadmin"
    local minio_pwd="$medusa_pwd"
    prompt_default "MinIO Root User" "minioadmin" minio_user
    prompt_default "MinIO Root Password" "$minio_pwd" minio_pwd
    update_env_var "MINIO_ROOT_USER" "$minio_user"
    update_env_var "MINIO_ROOT_PASSWORD" "$minio_pwd"

    local oobs_email="$medusa_email"
    local oobs_pwd="$medusa_pwd"
    prompt_default "OpenObserve Root Email" "$oobs_email" oobs_email
    prompt_default "OpenObserve Root Password" "$oobs_pwd" oobs_pwd
    update_env_var "OPENOBSERVE_ROOT_USER_EMAIL" "$oobs_email"
    update_env_var "OPENOBSERVE_ROOT_USER_PASSWORD" "$oobs_pwd"

    # Profile Specific URL configurations
    case "$profile" in
        A)
            local server_ip
            prompt_default "Enter Server Public or Local IP" "$current_ip" server_ip
            update_env_var "STOREFRONT_PUBLIC_URL" "http://${server_ip}:8000"
            update_env_var "MEDUSA_BACKEND_PUBLIC_URL" "http://${server_ip}:9000"
            update_env_var "STRAPI_PUBLIC_URL" "http://${server_ip}:1337"
            update_env_var "MEILISEARCH_PUBLIC_URL" "http://127.0.0.1:7700"
            update_env_var "MINIO_PUBLIC_URL" "http://${server_ip}:9001/mystore"
            update_env_var "GOOGLE_CALLBACK_URL" "http://${server_ip}:8000/ir/account/auth/callback"
            update_env_var "UMAMI_PUBLIC_URL" "http://${server_ip}:3005"
            update_env_var "OPENOBSERVE_PUBLIC_URL" "http://${server_ip}:5080"
            update_env_var "MEDUSA_ALLOW_HTTP_COOKIES" "true"
            update_env_var "STORE_CORS" ""
            update_env_var "ADMIN_CORS" ""
            update_env_var "AUTH_CORS" ""
            ;;

        B)
            update_env_var "STOREFRONT_PUBLIC_URL" "https://store.local"
            update_env_var "MEDUSA_BACKEND_PUBLIC_URL" "https://api.local"
            update_env_var "STRAPI_PUBLIC_URL" "https://admin.local"
            update_env_var "MEILISEARCH_PUBLIC_URL" "https://search.local"
            update_env_var "MINIO_PUBLIC_URL" "https://api.local/minio/mystore"
            update_env_var "GOOGLE_CALLBACK_URL" "https://store.local/ir/account/auth/callback"
            update_env_var "UMAMI_PUBLIC_URL" "https://analytics.local"
            update_env_var "OPENOBSERVE_PUBLIC_URL" "https://monitor.local"
            update_env_var "MEDUSA_ALLOW_HTTP_COOKIES" "false"
            update_env_var "STORE_CORS" ""
            update_env_var "ADMIN_CORS" ""
            update_env_var "AUTH_CORS" ""
            ;;

        C)
            local domain=""
            local ssl_email=""
            prompt_default "Enter your primary base domain (e.g. yourdomain.com)" "yourdomain.com" domain
            prompt_default "Enter email for ACME SSL certificates" "$medusa_email" ssl_email

            update_env_var "DOMAIN" "${domain}"
            update_env_var "ACME_EMAIL" "${ssl_email}"
            update_env_var "STOREFRONT_PUBLIC_URL" "https://${domain}"
            update_env_var "MEDUSA_BACKEND_PUBLIC_URL" "https://api.${domain}"
            update_env_var "STRAPI_PUBLIC_URL" "https://admin.${domain}"
            update_env_var "MEILISEARCH_PUBLIC_URL" "https://search.${domain}"
            update_env_var "MINIO_PUBLIC_URL" "https://api.${domain}/minio/mystore"
            update_env_var "GOOGLE_CALLBACK_URL" "https://${domain}/ir/account/auth/callback"
            update_env_var "UMAMI_PUBLIC_URL" "https://analytics.${domain}"
            update_env_var "OPENOBSERVE_PUBLIC_URL" "https://monitor.${domain}"
            update_env_var "MEDUSA_ALLOW_HTTP_COOKIES" "false"
            update_env_var "STORE_CORS" ""
            update_env_var "ADMIN_CORS" ""
            update_env_var "AUTH_CORS" ""

            info "Caddy configured to dynamically use DOMAIN '${domain}' and ACME_EMAIL '${ssl_email}' from .env."
            ;;
    esac

    # GitHub Repository for Docker Images (ghcr.io)
    echo ""
    echo -e "${BOLD}Configuring GitHub Repository & Container Images:${NC}"
    local detected_repo
    detected_repo=$(detect_github_repo)
    local deploy_repo="${detected_repo:-your-github-username/your-repo-name}"
    prompt_default "GitHub Repository name (owner/repo for ghcr.io images)" "$deploy_repo" deploy_repo
    deploy_repo="${deploy_repo%.git}"
    deploy_repo="${deploy_repo%.git/}"
    deploy_repo=$(echo "$deploy_repo" | tr '[:upper:]' '[:lower:]')
    update_env_var "GITHUB_DEPLOY_REPO" "$deploy_repo"

    # Absolute deploy path on server
    local current_deploy_path
    current_deploy_path=$(pwd)
    update_env_var "DEPLOY_PATH" "$current_deploy_path"

    success ".env successfully configured for Profile ${profile}."

    # GitHub Container Registry Authentication
    authenticate_ghcr "$deploy_repo"

    # Optional Integrations (Email, SMS, Payment Gateways)
    echo ""
    echo -e "${BOLD}Optional Third-Party Integrations:${NC}"
    prompt_default "Do you want to configure optional Email (SMTP/Gmail), SMS, or Payment Gateways now? (y/N)" "N" config_integrations
    if [[ "$config_integrations" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${CYAN}1. Email Service Configuration (SMTP / Gmail):${NC}"
        local smtp_host smtp_port smtp_user smtp_pass smtp_from contact_recipient
        prompt_default "SMTP Host (e.g. smtp.gmail.com, press Enter to skip)" "" smtp_host
        if [ -n "$smtp_host" ]; then
            prompt_default "SMTP Port" "587" smtp_port
            prompt_default "SMTP Username / Email" "$medusa_email" smtp_user
            prompt_default "SMTP Password / App Password" "" smtp_pass
            prompt_default "Sender Email (From)" "$smtp_user" smtp_from
            prompt_default "Contact Form Recipient Email" "$medusa_email" contact_recipient

            update_env_var "SMTP_HOST" "$smtp_host"
            update_env_var "SMTP_PORT" "$smtp_port"
            update_env_var "SMTP_USER" "$smtp_user"
            update_env_var "SMTP_PASS" "$smtp_pass"
            update_env_var "SMTP_FROM_ADDRESS" "$smtp_from"
            update_env_var "SMTP_SECURE" "false"
            update_env_var "CONTACT_FORM_RECIPIENT" "$contact_recipient"
        fi

        echo ""
        echo -e "${CYAN}2. SMS Provider Configuration (sms-ir / Kavenegar):${NC}"
        local sms_prov sms_key sms_otp sms_order
        prompt_default "SMS Provider (sms-ir, kavenegar, twilio, or Enter to skip)" "" sms_prov
        if [ -n "$sms_prov" ]; then
            update_env_var "SMS_PROVIDER" "$sms_prov"
            prompt_default "SMS API Key / Token" "" sms_key
            if [ -n "$sms_key" ]; then
                update_env_var "SMS_API_KEY" "$sms_key"
                update_env_var "KAVENEGAR_API_KEY" "$sms_key"
            fi
            prompt_default "SMS OTP Template ID (press Enter to skip)" "" sms_otp
            if [ -n "$sms_otp" ]; then
                update_env_var "SMS_OTP_TEMPLATE_ID" "$sms_otp"
            fi
            prompt_default "SMS Order Placed Template ID (press Enter to skip)" "" sms_order
            if [ -n "$sms_order" ]; then
                update_env_var "SMS_ORDER_PLACED_TEMPLATE_ID" "$sms_order"
            fi
        fi

        echo ""
        echo -e "${CYAN}3. Payment Gateway Configuration (Stripe & International Payments):${NC}"
        local stripe_secret_key stripe_pub_key stripe_webhook_secret
        prompt_default "Stripe Secret Key (sk_..., press Enter to skip)" "" stripe_secret_key
        if [ -n "$stripe_secret_key" ]; then
            update_env_var "STRIPE_KEY" "$stripe_secret_key"
            update_env_var "STRIPE_API_KEY" "$stripe_secret_key"

            prompt_default "Stripe Publishable Key (pk_..., press Enter to skip)" "" stripe_pub_key
            if [ -n "$stripe_pub_key" ]; then
                update_env_var "NEXT_PUBLIC_STRIPE_KEY" "$stripe_pub_key"
            fi

            prompt_default "Stripe Webhook Secret (whsec_..., press Enter to skip)" "" stripe_webhook_secret
            if [ -n "$stripe_webhook_secret" ]; then
                update_env_var "STRIPE_WEBHOOK_SECRET" "$stripe_webhook_secret"
            fi
        fi

        success "Optional integration settings saved to .env."
    fi
}

# ------------------------------------------------------------------------------
# Phase 1: Running Infrastructure Services
# ------------------------------------------------------------------------------
phase_1_infrastructure() {
    step_header "1" "Running Infrastructure Services (Postgres, Redis, Meilisearch, MinIO)"
    
    pull_with_progress "postgres" "PostgreSQL Database" || true
    pull_with_progress "redis" "Redis Cache" || true
    pull_with_progress "meilisearch" "Meilisearch Engine" || true
    pull_with_progress "minio" "MinIO Object Storage" || true
    pull_with_progress "minio-setup" "MinIO Setup Client" || true

    info "Launching database and storage containers..."
    docker compose up -d postgres redis meilisearch minio minio-setup >/dev/null 2>&1 || docker compose up -d postgres redis meilisearch minio minio-setup

    wait_for_health "postgres" 60
    wait_for_health "redis" 30
    wait_for_health "meilisearch" 45
    wait_for_health "minio" 45

    # Ensure database password always matches current .env (fixes password mismatch on restarts)
    local current_pg_pass
    current_pg_pass=$(get_env_var "POSTGRES_PASSWORD")
    if [ -n "$current_pg_pass" ]; then
        info "Synchronizing PostgreSQL password and databases with current .env..."
        docker exec -i postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD '${current_pg_pass}';" >/dev/null 2>&1 || true
        docker exec -i postgres psql -U postgres -c "CREATE DATABASE strapi;" >/dev/null 2>&1 || true
        docker exec -i postgres psql -U postgres -c "CREATE DATABASE medusa;" >/dev/null 2>&1 || true
        docker exec -i postgres psql -U postgres -c "CREATE DATABASE umami;" >/dev/null 2>&1 || true
    fi

    success "Phase 1: Infrastructure services are up and healthy."
}

# ------------------------------------------------------------------------------
# Phase 2: HTTPS Gateway (Caddy)
# ------------------------------------------------------------------------------
phase_2_caddy() {
    local storefront_url
    storefront_url=$(get_env_var "STOREFRONT_PUBLIC_URL")

    if [[ "$storefront_url" == http://* ]]; then
        info "Profile A detected (plain HTTP). Skipping Caddy HTTPS Gateway (Phase 2)."
        return 0
    fi

    step_header "2" "Starting HTTPS Gateway (Caddy Reverse Proxy)"
    pull_with_progress "caddy" "Caddy Reverse Proxy" || true
    info "Launching Caddy container..."
    docker compose up -d caddy >/dev/null 2>&1 || docker compose up -d caddy

    sleep 3
    if docker ps | grep -q "caddy"; then
        success "Phase 2: Caddy HTTPS Gateway is running."
    else
        warn "Caddy container may have failed to start. Check logs: docker compose logs caddy"
    fi
}

# ------------------------------------------------------------------------------
# Phase 3 & 4: Strapi CMS & API Tokens
# ------------------------------------------------------------------------------
phase_3_4_strapi() {
    step_header "3 & 4" "Pulling and Running Strapi CMS & Generating API Tokens"
    local deploy_repo
    deploy_repo=$(get_env_var "GITHUB_DEPLOY_REPO")
    deploy_repo="${deploy_repo:-closetstore/closet}"

    while true; do
        if pull_with_progress "strapi" "Strapi CMS"; then
            break
        fi

        echo ""
        error "Failed to pull Strapi image: ghcr.io/${deploy_repo}-strapi:latest"
        echo -e "${YELLOW}Common causes:${NC}"
        echo -e " 1. GitHub Action ${BOLD}'Build and Push Strapi Image'${NC} hasn't run or is still in progress."
        echo -e "    👉 Check workflow status: ${CYAN}https://github.com/${deploy_repo}/actions${NC}"
        echo -e " 2. Docker is not authenticated to ghcr.io with the correct GitHub PAT (HTTP 403 Forbidden)."
        echo -e " 3. The package is private and the token lacks 'read:packages' permission."
        echo ""
        echo -e "How would you like to proceed?"
        echo -e " 1) ${BOLD}Re-authenticate / Enter GitHub PAT token${NC} and retry"
        echo -e " 2) ${BOLD}Retry pulling${NC} (after confirming GitHub Action is GREEN)"
        echo -e " 3) ${BOLD}Skip pull${NC} and attempt to start container anyway"
        echo -e " 4) ${BOLD}Abort setup${NC}"
        echo ""
        local strapi_choice="2"
        prompt_default "Select option (1/2/3/4)" "2" strapi_choice
        case "$strapi_choice" in
            1)
                authenticate_ghcr "$deploy_repo" || true
                ;;
            2)
                info "Retrying Strapi image pull..."
                ;;
            3)
                warn "Skipping pull as requested."
                break
                ;;
            4)
                error "Deployment aborted by user."
                exit 1
                ;;
            *)
                info "Retrying Strapi image pull..."
                ;;
        esac
    done
    info "Starting Strapi container..."
    docker compose up -d strapi >/dev/null 2>&1 || docker compose up -d strapi

    # Wait until Strapi completes database migrations, admin build & initialization
    wait_for_http_ready "http://127.0.0.1:1337/_health" "Strapi CMS API" 180 || true
    wait_for_http_ready "http://127.0.0.1:1337/admin" "Strapi Admin Panel" 90 || true

    local strapi_pub_url server_ip
    strapi_pub_url=$(get_env_var "STRAPI_PUBLIC_URL")
    server_ip=$(detect_server_ip)

    echo ""
    echo -e "${YELLOW}${BOLD}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}${BOLD}│  Action Required: Strapi Admin Setup & API Tokens Retrieval                 │${NC}"
    echo -e "${YELLOW}${BOLD}├─────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${YELLOW}│ 1. Open Strapi Admin: ${BOLD}${strapi_pub_url}/admin${NC}"
    if [ -n "$server_ip" ] && [ "$server_ip" != "127.0.0.1" ]; then
        echo -e "${YELLOW}│    (Alternative Direct IP link: ${BOLD}http://${server_ip}:1337/admin${NC}${YELLOW})             │"
    fi
    echo -e "${YELLOW}│ 2. Register initial admin user if first time (or log in).                   │${NC}"
    echo -e "${YELLOW}│ 3. Go to ${BOLD}Settings > API Tokens${NC}:                                             │"
    echo -e "${YELLOW}│    - Full Access: Edit 'Full Access' (✏️) → ${BOLD}Regenerate${NC} → Copy token            │"
    echo -e "${YELLOW}│    - Read-Only:   Edit 'Read Only' (✏️)   → ${BOLD}Regenerate${NC} → Copy token            │"
    echo -e "${YELLOW}${BOLD}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    local existing_medusa_tok
    existing_medusa_tok=$(get_env_var "STRAPI_API_TOKEN_FOR_MEDUSA")
    if [ -z "$existing_medusa_tok" ]; then
        local medusa_tok front_tok
        prompt_default "Paste 'Full access' Token (STRAPI_API_TOKEN_FOR_MEDUSA)" "" medusa_tok
        prompt_default "Paste 'Read-only' Token (STRAPI_API_TOKEN_FOR_FRONT)" "" front_tok

        if [ -n "$medusa_tok" ]; then
            update_env_var "STRAPI_API_TOKEN_FOR_MEDUSA" "$medusa_tok"
        fi
        if [ -n "$front_tok" ]; then
            update_env_var "STRAPI_API_TOKEN_FOR_FRONT" "$front_tok"
        fi
        success "Strapi API Tokens saved to .env."
    else
        info "Strapi API tokens already present in .env."
    fi
}

# ------------------------------------------------------------------------------
# Phase 5 & 6: Medusa Backend, Super Admin & Publishable Key
# ------------------------------------------------------------------------------
phase_5_6_medusa() {
    step_header "5 & 6" "Pulling and Running Medusa Backend & Creating API Keys"
    local deploy_repo
    deploy_repo=$(get_env_var "GITHUB_DEPLOY_REPO")
    deploy_repo="${deploy_repo:-closetstore/closet}"

    while true; do
        if pull_with_progress "medusa" "Medusa Backend"; then
            break
        fi

        echo ""
        error "Failed to pull Medusa image: ghcr.io/${deploy_repo}-medusa:latest"
        echo -e "${YELLOW}Common causes:${NC}"
        echo -e " 1. GitHub Action ${BOLD}'Build and Push Medusa Image'${NC} hasn't run or is still in progress."
        echo -e "    👉 Check workflow status: ${CYAN}https://github.com/${deploy_repo}/actions${NC}"
        echo -e " 2. Docker is not authenticated to ghcr.io with the correct GitHub PAT (HTTP 403 Forbidden)."
        echo -e " 3. The package is private and the token lacks 'read:packages' permission."
        echo ""
        echo -e "How would you like to proceed?"
        echo -e " 1) ${BOLD}Re-authenticate / Enter GitHub PAT token${NC} and retry"
        echo -e " 2) ${BOLD}Retry pulling${NC} (after confirming GitHub Action is GREEN)"
        echo -e " 3) ${BOLD}Skip pull${NC} and attempt to start container anyway"
        echo -e " 4) ${BOLD}Abort setup${NC}"
        echo ""
        local medusa_choice="2"
        prompt_default "Select option (1/2/3/4)" "2" medusa_choice
        case "$medusa_choice" in
            1)
                authenticate_ghcr "$deploy_repo" || true
                ;;
            2)
                info "Retrying Medusa image pull..."
                ;;
            3)
                warn "Skipping pull as requested."
                break
                ;;
            4)
                error "Deployment aborted by user."
                exit 1
                ;;
            *)
                info "Retrying Medusa image pull..."
                ;;
        esac
    done
    info "Starting Medusa container..."
    docker compose up -d medusa >/dev/null 2>&1 || docker compose up -d medusa

    # Wait until Medusa finishes database migrations & internal bootup
    wait_for_http_ready "http://127.0.0.1:9000/health" "Medusa Backend" 240 || true

    local medusa_email medusa_pwd medusa_pub_url
    medusa_email=$(get_env_var "MEDUSA_ADMIN_EMAIL")
    medusa_pwd=$(get_env_var "MEDUSA_ADMIN_PASSWORD")
    medusa_pub_url=$(get_env_var "MEDUSA_BACKEND_PUBLIC_URL")

    info "Setting up default regions, currencies and super admin..."
    docker exec medusa npm run seed 2>/dev/null || true
    docker exec medusa npx medusa user -e "${medusa_email:-admin@example.com}" -p "${medusa_pwd:-password123}" 2>/dev/null || true

    # Wait until Medusa Admin Dashboard is actively served
    wait_for_http_ready "http://127.0.0.1:9000/app" "Medusa Admin Panel" 90 || true

    echo ""
    echo -e "${YELLOW}${BOLD}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}${BOLD}│  Action Required: Medusa Publishable API Key                                │${NC}"
    echo -e "${YELLOW}${BOLD}├─────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${YELLOW}│ 1. Open Medusa Admin: ${BOLD}${medusa_pub_url}/app${NC}"
    if [ -n "$server_ip" ] && [ "$server_ip" != "127.0.0.1" ]; then
        echo -e "${YELLOW}│    (Alternative Direct IP link: ${BOLD}http://${server_ip}:9000/app${NC}${YELLOW})               │"
    fi
    echo -e "${YELLOW}│    Login: ${medusa_email} / [configured password]                            │"
    echo -e "${YELLOW}│ 2. Go to ${BOLD}Settings > Publishable API Keys > Create Key${NC} (Name: 'Storefront')   │"
    echo -e "${YELLOW}│ 3. ${BOLD}CRUCIAL:${NC} Open the key > Sales Channels tab > Attach to 'Default Channel' │"
    echo -e "${YELLOW}│ 4. Copy the publishable key (${BOLD}pk_...${NC})                                    │"
    echo -e "${YELLOW}${BOLD}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    local existing_pk
    existing_pk=$(get_env_var "MEDUSA_PUBLISHABLE_KEY")
    if [ -z "$existing_pk" ]; then
        local pk
        prompt_default "Paste Medusa Publishable Key (pk_...)" "" pk
        if [ -n "$pk" ]; then
            update_env_var "MEDUSA_PUBLISHABLE_KEY" "$pk"
            success "Medusa Publishable Key saved to .env."
        fi
    else
        info "Medusa Publishable Key already present in .env."
    fi
}

# ------------------------------------------------------------------------------
# Phase 7: Automated Meilisearch Search Key Extraction
# ------------------------------------------------------------------------------
phase_7_meilisearch_key() {
    step_header "7" "Retrieving & Configuring Meilisearch Search API Key"

    local meili_master
    meili_master=$(get_env_var "MEILI_MASTER_KEY")

    if [ -z "$meili_master" ]; then
        warn "MEILI_MASTER_KEY not found in .env. Skipping automated key retrieval."
        return 0
    fi

    info "Querying Meilisearch internal API (127.0.0.1:7700/keys)..."
    local search_key=""
    local keys_json
    keys_json=$(curl -s -H "Authorization: Bearer ${meili_master}" http://127.0.0.1:7700/keys || true)

    if [ -n "$keys_json" ] && echo "$keys_json" | grep -q "results"; then
        # 1. Try extraction with jq
        if command -v jq >/dev/null 2>&1; then
            search_key=$(echo "$keys_json" | jq -r '.results[] | select(.name | test("Default Search API Key"; "i")) | .key' 2>/dev/null | head -n1 || true)
            if [ -z "$search_key" ] || [ "$search_key" == "null" ]; then
                search_key=$(echo "$keys_json" | jq -r '.results[0].key' 2>/dev/null || true)
            fi
        # 2. Fallback to Node.js
        elif command -v node >/dev/null 2>&1; then
            search_key=$(echo "$keys_json" | node -e 'try { const r=JSON.parse(require("fs").readFileSync(0,"utf-8")).results||[]; const k=(r.find(x=>/search/i.test(x.name||""))||r[0]||{}).key||""; process.stdout.write(k); } catch(e){}' 2>/dev/null || true)
        # 3. Fallback to Python 3 (Standard on almost all Linux distributions)
        elif command -v python3 >/dev/null 2>&1; then
            search_key=$(echo "$keys_json" | python3 -c 'import sys, json; data=json.load(sys.stdin).get("results", []); key=next((x["key"] for x in data if "search" in x.get("name","").lower()), data[0]["key"] if data else ""); sys.stdout.write(key)' 2>/dev/null || true)
        fi
    fi

    if [ -n "$search_key" ] && [ "$search_key" != "null" ]; then
        update_env_var "MEILI_SEARCH_KEY" "$search_key"
        success "Automatically retrieved and saved Meilisearch Search Key: ${search_key:0:10}..."
    else
        warn "Could not automatically parse Meilisearch key. You can retrieve it manually via:"
        echo "curl -H \"Authorization: Bearer ${meili_master}\" http://127.0.0.1:7700/keys"
        prompt_default "Paste Search Key manually (or press enter to skip)" "" manual_search_key
        if [ -n "$manual_search_key" ]; then
            update_env_var "MEILI_SEARCH_KEY" "$manual_search_key"
        fi
    fi
}

# ------------------------------------------------------------------------------
# Phase 8: Umami Analytics (Before Storefront)
# ------------------------------------------------------------------------------
phase_8_umami() {
    step_header "8" "Starting Umami Analytics Container"
    pull_with_progress "umami" "Umami Analytics" || true
    info "Launching Umami Analytics..."
    docker compose up -d umami >/dev/null 2>&1 || docker compose up -d umami

    # Wait until Umami finishes Prisma migrations and becomes ready
    wait_for_http_ready "http://127.0.0.1:3000" "Umami Analytics" 90 || true

    local umami_pub_url
    umami_pub_url=$(get_env_var "UMAMI_PUBLIC_URL")

    echo ""
    echo -e "${YELLOW}${BOLD}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}${BOLD}│  Action Required: Umami Website ID                                          │${NC}"
    echo -e "${YELLOW}${BOLD}├─────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${YELLOW}│ 1. Open Umami Dashboard: ${BOLD}${umami_pub_url}${NC}                                  │"
    echo -e "${YELLOW}│    Default Login: admin / umami (change password immediately)               │"
    echo -e "${YELLOW}│ 2. Go to ${BOLD}Settings > Websites > Add Website${NC}                                │"
    echo -e "${YELLOW}│ 3. Copy the generated ${BOLD}Website ID (UUID)${NC}                                    │"
    echo -e "${YELLOW}${BOLD}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    local existing_wid
    existing_wid=$(get_env_var "UMAMI_WEBSITE_ID")
    if [ -z "$existing_wid" ]; then
        local wid
        prompt_default "Paste Umami Website ID (UUID, or enter to skip)" "" wid
        if [ -n "$wid" ]; then
            update_env_var "UMAMI_WEBSITE_ID" "$wid"
            success "Umami Website ID saved to .env."
        fi
    else
        info "Umami Website ID already present in .env."
    fi
}

# ------------------------------------------------------------------------------
# Phase 9: GitHub Actions Build Arguments & Storefront Deployment
# ------------------------------------------------------------------------------
phase_9_storefront_deploy() {
    step_header "9" "Storefront CI/CD Parameters & Deployment"

    local sf_pub_url medusa_pub_url strapi_pub_url meili_search_key meili_pub_url medusa_pk umami_wid deploy_p def_region def_locale deploy_repo
    sf_pub_url=$(get_env_var "STOREFRONT_PUBLIC_URL")
    medusa_pub_url=$(get_env_var "MEDUSA_BACKEND_PUBLIC_URL")
    strapi_pub_url=$(get_env_var "STRAPI_PUBLIC_URL")
    meili_search_key=$(get_env_var "MEILI_SEARCH_KEY")
    meili_pub_url=$(get_env_var "MEILISEARCH_PUBLIC_URL")
    medusa_pk=$(get_env_var "MEDUSA_PUBLISHABLE_KEY")
    umami_wid=$(get_env_var "UMAMI_WEBSITE_ID")
    deploy_p=$(get_env_var "DEPLOY_PATH")
    def_region=$(get_env_var "DEFAULT_REGION")
    def_locale=$(get_env_var "DEFAULT_LOCALE")
    deploy_repo=$(get_env_var "GITHUB_DEPLOY_REPO")

    echo -e "${CYAN}${BOLD}==============================================================================${NC}"
    echo -e "${CYAN}${BOLD} GITHUB ACTIONS PRODUCTION SECRETS (Copy to GitHub Repo Settings):${NC}"
    echo -e "${CYAN}${BOLD}==============================================================================${NC}"
    echo ""
    echo -e "${BOLD}Secret Name 1:${NC} ${GREEN}STOREFRONT_BUILD_ARGS${NC}"
    echo -e "${GRAY}------------------------------------------------------------------------------${NC}"
    cat <<EOF
MEDUSA_BACKEND_URL=http://medusa:9000
NEXT_PUBLIC_MEDUSA_BACKEND_URL=${medusa_pub_url:-https://api.yourdomain.com}
NEXT_PUBLIC_STRAPI_URL=${strapi_pub_url:-https://admin.yourdomain.com}
NEXT_PUBLIC_BASE_URL=${sf_pub_url:-https://store.yourdomain.com}
NEXT_PUBLIC_MEILISEARCH_HOST=${meili_pub_url:-https://search.yourdomain.com}
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${medusa_pk:-pk_...}
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=${meili_search_key:-...}
NEXT_PUBLIC_UMAMI_WEBSITE_ID=${umami_wid:-...}
NEXT_PUBLIC_DEFAULT_REGION=${def_region:-US}
DEFAULT_LOCALE=${def_locale:-en-US}
NEXT_PUBLIC_MEILISEARCH_INDEX_NAME=products
NEXT_PUBLIC_ENABLE_IRAN_FEATURES=false
EOF
    echo -e "${GRAY}------------------------------------------------------------------------------${NC}"
    echo ""
    echo -e "${BOLD}Secret Name 2:${NC} ${GREEN}DEPLOY_PATH${NC}  ->  ${BOLD}${deploy_p:-$(pwd)}${NC}"
    echo -e "${BOLD}Secret Name 3:${NC} ${GREEN}REGISTRY_URL${NC} ->  ${BOLD}https://raw.githubusercontent.com/Loomix-pro/Loomix-registry/main/src/modules${NC}"
    echo ""

    echo -e "${YELLOW}${BOLD}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}${BOLD}│  Action Required: Configure GitHub Environment Secrets & Trigger Build      │${NC}"
    echo -e "${YELLOW}${BOLD}├─────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${YELLOW}│ 1. Open your GitHub Repository in browser:                                   │${NC}"
    echo -e "${YELLOW}│    ${BOLD}https://github.com/${deploy_repo:-<owner>/<repo>}/settings/environments${NC}${YELLOW}           │"
    echo -e "${YELLOW}│ 2. Click ${BOLD}New environment${NC}${YELLOW}, name it ${BOLD}production${NC}${YELLOW}, then click Configure.          │"
    echo -e "${YELLOW}│ 3. Under ${BOLD}Environment secrets${NC}${YELLOW}, click ${BOLD}Add secret${NC}${YELLOW} for all 3 secrets above.     │"
    echo -e "${YELLOW}│ 4. Go to ${BOLD}Actions${NC}${YELLOW} tab > ${BOLD}Build and Push Storefront Image${NC}${YELLOW} > Click ${BOLD}Run workflow${NC}${YELLOW}.│"
    echo -e "${YELLOW}│ 5. ⏳ Wait for the build workflow to finish with a ${GREEN}${BOLD}Green Checkmark (✔)${NC}${YELLOW}.      │"
    echo -e "${YELLOW}│ 6. ${BOLD}ONLY AFTER the build is GREEN${NC}${YELLOW}, confirm 'Y' below to pull & start.         │"
    echo -e "${YELLOW}├─────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${YELLOW}│ Optional CD Automation (Self-Hosted Runner):                                │${NC}"
    echo -e "${YELLOW}│  • In GitHub: Settings > Actions > Runners > New runner (Linux x64).        │${NC}"
    echo -e "${YELLOW}│  • On this VPS: Run the printed commands, then:                             │${NC}"
    echo -e "${YELLOW}│    ${BOLD}sudo ./svc.sh install && sudo ./svc.sh start${NC}${YELLOW}                             │"
    echo -e "${YELLOW}${BOLD}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    info "If you have Self-Hosted Runner enabled, GitHub Actions automatically deployed and started Storefront."
    prompt_default "Confirm Storefront container is running and proceed to Monitoring? (Y/n)" "Y" confirm_sf
    if [[ "$confirm_sf" =~ ^[Yy]$ ]]; then
        if docker ps | grep -q "storefront"; then
            success "Storefront container is active and running."
        else
            info "Storefront container not detected running. Pulling and starting container now..."
            while true; do
                if pull_with_progress "storefront" "Storefront"; then
                    break
                fi
                echo ""
                error "Failed to pull Storefront image: ghcr.io/${deploy_repo}-storefront:latest"
                echo -e "${YELLOW}Please verify that the 'Build and Push Storefront Image' GitHub Action has completed successfully.${NC}"
                echo -e " 1) ${BOLD}Re-authenticate / Enter GitHub PAT token${NC} and retry"
                echo -e " 2) ${BOLD}Retry pulling${NC}"
                echo -e " 3) ${BOLD}Skip pull${NC} and continue"
                echo -e " 4) ${BOLD}Abort setup${NC}"
                local sf_choice="2"
                prompt_default "Select option (1/2/3/4)" "2" sf_choice
                case "$sf_choice" in
                    1) authenticate_ghcr "$deploy_repo" || true ;;
                    2) info "Retrying Storefront pull..." ;;
                    3) warn "Skipping pull as requested."; break ;;
                    4) error "Aborted by user."; exit 1 ;;
                    *) info "Retrying Storefront pull..." ;;
                esac
            done
            info "Starting Storefront container..."
            docker compose up -d storefront >/dev/null 2>&1 || docker compose up -d storefront
            success "Storefront container started."
        fi
    fi
}

# ------------------------------------------------------------------------------
# Phase 10: Observability & Monitoring (OpenObserve)
# ------------------------------------------------------------------------------
phase_10_observability() {
    step_header "10" "Deploying Observability Stack (OpenObserve, Vector, cAdvisor)"
    prompt_default "Do you want to start the monitoring stack (OpenObserve / Vector / cAdvisor)? (Y/n)" "Y" start_mon
    if [[ "$start_mon" =~ ^[Yy]$ ]]; then
        pull_with_progress "openobserve" "OpenObserve Monitoring" || true
        pull_with_progress "vector" "Vector Log Shipper" || true
        pull_with_progress "cadvisor" "cAdvisor Metrics" || true
        pull_with_progress "docker-stats-exporter" "Docker Stats Exporter" || true

        info "Launching OpenObserve, Vector, cAdvisor, and docker-stats-exporter..."
        docker compose up -d openobserve vector cadvisor docker-stats-exporter >/dev/null 2>&1 || docker compose up -d openobserve vector cadvisor docker-stats-exporter
        wait_for_port "127.0.0.1" "5080" "OpenObserve" 45 || true
        success "Observability stack is active."
    fi
}

# ------------------------------------------------------------------------------
# Phase 20: Automated Data Seeding
# ------------------------------------------------------------------------------
phase_20_seed_data() {
    step_header "20" "Sample Data Seeding & Component Synchronization"
    prompt_default "Do you want to seed 30 sample products, categories, pages, blogs, and translations? (Y/n)" "Y" run_seed
    if [[ "$run_seed" =~ ^[Yy]$ ]]; then
        info "1. Creating 30 Sample Products, Categories, Collections & Tags in Medusa..."
        docker cp store-admin/src/scripts medusa:/app/store-admin/src/ 2>/dev/null || true
        docker exec medusa npx medusa exec ./src/scripts/seed-30-products.ts 2>/dev/null || true

        info "2. Synchronizing Medusa Categories, Collections & Products to Strapi..."
        docker exec medusa npx medusa exec ./src/scripts/sync-all-to-strapi.ts 2>/dev/null || true

        info "3. Seeding Strapi Locales, Settings, Pages, Blogs & Complete Homepage..."
        docker cp website-admin/seed-all.js strapi:/opt/app/seed-all.js 2>/dev/null || true
        docker exec strapi node seed-all.js 2>/dev/null || true

        info "4. Syncing Storefront Translations..."
        docker cp scripts strapi:/opt/app/scripts 2>/dev/null || true
        docker exec strapi node ./scripts/sync-translations.js 2>/dev/null || docker exec storefront node ../scripts/sync-translations.js 2>/dev/null || node ./scripts/sync-translations.js 2>/dev/null || true

        info "5. Triggering Next.js On-Demand Revalidation on Storefront..."
        local rev_secret
        rev_secret=$(get_env_var "REVALIDATE_SECRET")
        curl -s -X POST "http://127.0.0.1:8000/api/revalidate/home-page" \
            -H "x-strapi-secret: ${rev_secret}" \
            -H "Content-Type: application/json" \
            -d '{"model": "homepage"}' >/dev/null 2>&1 || true
        curl -s -X POST "http://127.0.0.1:8000/api/revalidate/blog" \
            -H "x-strapi-secret: ${rev_secret}" \
            -H "Content-Type: application/json" \
            -d '{"model": "blog-post"}' >/dev/null 2>&1 || true
        curl -s -X POST "http://127.0.0.1:8000/api/revalidate" \
            -H "x-strapi-secret: ${rev_secret}" \
            -H "Content-Type: application/json" \
            -d '{"tags": ["strapi-homepage", "strapi-settings", "strapi-pages", "strapi-blog", "products", "categories", "collections"]}' >/dev/null 2>&1 || true

        success "Sample data seeded and Storefront instantly revalidated with active products and layouts."
    fi
}

# ------------------------------------------------------------------------------
# Final Summary & Status Report
# ------------------------------------------------------------------------------
final_summary() {
    local sf_url medusa_url strapi_url umami_url oobs_url
    sf_url=$(get_env_var "STOREFRONT_PUBLIC_URL")
    medusa_url=$(get_env_var "MEDUSA_BACKEND_PUBLIC_URL")
    strapi_url=$(get_env_var "STRAPI_PUBLIC_URL")
    umami_url=$(get_env_var "UMAMI_PUBLIC_URL")
    oobs_url=$(get_env_var "OPENOBSERVE_PUBLIC_URL")

    if [ -z "$oobs_url" ]; then
        if [[ "$sf_url" == *".local"* ]]; then
            oobs_url="https://monitor.local"
        elif [[ "$sf_url" == https://* ]]; then
            local domain
            domain=$(echo "$sf_url" | sed -e 's|^https://||' -e 's|/.*$||' -e 's|^www\.||')
            oobs_url="https://monitor.${domain}"
        else
            oobs_url="http://$(detect_server_ip):5080"
        fi
    fi

    echo ""
    echo -e "${GREEN}${BOLD}==============================================================================${NC}"
    echo -e "${GREEN}${BOLD}   🎉 SETUP & DEPLOYMENT COMPLETE! SERVICE ENDPOINTS & ACCESS DASHBOARD      ${NC}"
    echo -e "${GREEN}${BOLD}==============================================================================${NC}"
    echo ""
    echo -e " ${BOLD}Service Access URLs:${NC}"
    echo -e "  🛍️  ${BOLD}Storefront:${NC}         ${CYAN}${sf_url:-N/A}${NC}"
    echo -e "  🛒  ${BOLD}Medusa Admin:${NC}       ${CYAN}${medusa_url:-N/A}/app${NC}"
    echo -e "  📝  ${BOLD}Strapi Admin:${NC}       ${CYAN}${strapi_url:-N/A}/admin${NC}"
    echo -e "  📊  ${BOLD}Umami Analytics:${NC}    ${CYAN}${umami_url:-N/A}${NC}"
    echo -e "  📈  ${BOLD}OpenObserve:${NC}        ${CYAN}${oobs_url}${NC}"
    echo ""
    echo -e " ${BOLD}Default Admin Credentials:${NC}"
    echo -e "  • Medusa:       ${GRAY}$(get_env_var "MEDUSA_ADMIN_EMAIL")${NC} / ${GRAY}$(get_env_var "MEDUSA_ADMIN_PASSWORD")${NC}"
    echo -e "  • MinIO:        ${GRAY}$(get_env_var "MINIO_ROOT_USER")${NC} / ${GRAY}$(get_env_var "MINIO_ROOT_PASSWORD")${NC}"
    echo -e "  • OpenObserve:  ${GRAY}$(get_env_var "OPENOBSERVE_ROOT_USER_EMAIL")${NC} / ${GRAY}$(get_env_var "OPENOBSERVE_ROOT_USER_PASSWORD")${NC}"
    echo ""

    if [[ "$sf_url" == *".local"* ]]; then
        local current_ip
        current_ip=$(detect_server_ip)
        echo -e "${YELLOW}${BOLD}Hosts File Configuration (Profile B):${NC}"
        echo -e "Add the following line to your local machine hosts file (${BOLD}C:\\Windows\\System32\\drivers\\etc\\hosts${NC} or ${BOLD}/etc/hosts${NC}):"
        echo -e "${MAGENTA}${BOLD}${current_ip} store.local api.local admin.local analytics.local monitor.local${NC}"
        echo ""
    fi

    echo -e " ${BOLD}Useful Docker Management Commands:${NC}"
    echo -e "  • Check container status:   ${CYAN}docker compose ps${NC}"
    echo -e "  • View live Medusa logs:    ${CYAN}docker compose logs -f medusa${NC}"
    echo -e "  • View live Strapi logs:    ${CYAN}docker compose logs -f strapi${NC}"
    echo -e "  • View live Storefront logs:${CYAN}docker compose logs -f storefront${NC}"
    echo -e "  • View resource usage:      ${CYAN}docker stats${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}==============================================================================${NC}"
}

# ------------------------------------------------------------------------------
# Main Execution Loop
# ------------------------------------------------------------------------------
main() {
    preflight_checks
    configure_profile_and_env
    phase_1_infrastructure
    phase_2_caddy
    phase_3_4_strapi
    phase_5_6_medusa
    phase_7_meilisearch_key
    phase_8_umami
    phase_9_storefront_deploy
    phase_10_observability
    phase_20_seed_data
    final_summary

    # Secure environment files and remove setup log on success
    chmod 600 .env .env.bak.* 2>/dev/null || true
    rm -f "${LOG_FILE}"
    echo -e "${GREEN}✔ Setup completed successfully. Temporary setup log removed and .env secured.${NC}"
}

main "$@"

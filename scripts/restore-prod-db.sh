#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SERVER="${SERVER:-finbara-server}"
REMOTE_APP_MATCH="${REMOTE_APP_MATCH:-cardiopedi}"
REMOTE_MEDIA_PATH_OVERRIDE="${REMOTE_MEDIA_PATH:-}"
LOCAL_MEDIA_PATH="${LOCAL_MEDIA_PATH:-$ROOT_DIR/media}"
SKIP_MEDIA_RESTORE="${SKIP_MEDIA_RESTORE:-false}"

backup_path="${1:-}"
db_url="${DATABASE_URL:-}"
downloaded_backup_path=""
remote_app_container=""
remote_database_url=""
remote_media_path=""

usage() {
  echo "Usage: ./scripts/restore-prod-db.sh [local-backup-file]"
  echo "Default behavior: SSH to server, create a fresh pg_dump from the live prod database,"
  echo "restore it locally, then mirror the prod media folder into ./media."
  echo "If a local backup file is passed, SSH is skipped only for the database dump."
  echo "DATABASE_URL is read from the environment first, then from .env."
  echo "Optional overrides: SERVER, REMOTE_APP_MATCH, REMOTE_MEDIA_PATH, LOCAL_MEDIA_PATH, SKIP_MEDIA_RESTORE=true."
}

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

step() {
  echo "================================================="
  echo "$1"
  echo "================================================="
}

cleanup() {
  if [[ -n "$downloaded_backup_path" && -f "$downloaded_backup_path" ]]; then
    rm -f "$downloaded_backup_path"
  fi
}

trap cleanup EXIT

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

shell_quote() {
  printf "%q" "$1"
}

find_remote_app_details() {
  require_command ssh

  if [[ -n "$remote_database_url" && -n "$remote_app_container" && -n "$remote_media_path" ]]; then
    return
  fi

  step "Detecting prod app container, database, and media path on server"

  local details
  details="$(ssh -o BatchMode=yes "$SERVER" '
for c in $(docker ps --format "{{.Names}}"); do
  envs=$(docker inspect "$c" --format "{{range .Config.Env}}{{println .}}{{end}}" 2>/dev/null || true)
  db_url=$(printf "%s\n" "$envs" | sed -n "s/^DATABASE_URL=//p" | head -n 1)
  media_path=$(printf "%s\n" "$envs" | sed -n "s/^MEDIA_STORAGE_PATH=//p" | head -n 1)
  if [ -z "$media_path" ]; then
    media_path=$(printf "%s\n" "$envs" | sed -n "s/^MEDIA_STORAGE_ROOT=//p" | head -n 1)
  fi
  if [ -n "$db_url" ] && printf "%s\n" "$db_url" | grep -qi "/'"$REMOTE_APP_MATCH"'"; then
    if [ -z "$media_path" ]; then
      media_path=/app/media
    fi
    printf "%s\n%s\n%s\n" "$c" "$db_url" "$media_path"
    exit 0
  fi
done
exit 1
')" || fail "Could not find remote ${REMOTE_APP_MATCH} app container on server."

  remote_app_container="$(printf '%s\n' "$details" | sed -n '1p')"
  remote_database_url="$(printf '%s\n' "$details" | sed -n '2p')"
  remote_media_path="$(printf '%s\n' "$details" | sed -n '3p')"

  if [[ -n "$REMOTE_MEDIA_PATH_OVERRIDE" ]]; then
    remote_media_path="$REMOTE_MEDIA_PATH_OVERRIDE"
  fi

  [[ -n "$remote_app_container" ]] || fail "Remote app container is empty."
  [[ -n "$remote_database_url" ]] || fail "Remote DATABASE_URL is empty."
  [[ -n "$remote_media_path" ]] || fail "Remote media path is empty."
  echo "Remote app container: $remote_app_container"
  echo "Remote DATABASE_URL detected."
  echo "Remote media path: $remote_media_path"
}

load_remote_db_parts() {
  local parts
  parts="$(REMOTE_DB_URL="$remote_database_url" node -e "const u=new URL(process.env.REMOTE_DB_URL); console.log([u.hostname,u.port||'5432',decodeURIComponent(u.username),decodeURIComponent(u.password),u.pathname.replace(/^\\//,'')].join('\n'));")"

  remote_db_host="$(printf '%s\n' "$parts" | sed -n '1p')"
  remote_db_port="$(printf '%s\n' "$parts" | sed -n '2p')"
  remote_db_user="$(printf '%s\n' "$parts" | sed -n '3p')"
  remote_db_password="$(printf '%s\n' "$parts" | sed -n '4p')"
  remote_db_name="$(printf '%s\n' "$parts" | sed -n '5p')"

  [[ -n "$remote_db_host" && -n "$remote_db_user" && -n "$remote_db_name" ]] || fail "Could not parse remote DATABASE_URL."
}

dump_remote_database() {
  local remote_cmd

  find_remote_app_details
  load_remote_db_parts

  step "Creating fresh remote pg_dump"

  downloaded_backup_path="$(mktemp /tmp/cardiopedi_live_dump.XXXXXX)"

  remote_cmd="docker exec -e PGPASSWORD=$(shell_quote "$remote_db_password") $(shell_quote "$remote_db_host") pg_dump --format=custom --no-owner --no-privileges --username=$(shell_quote "$remote_db_user") --dbname=$(shell_quote "$remote_db_name")"
  ssh -o BatchMode=yes "$SERVER" "$remote_cmd" > "$downloaded_backup_path"

  [[ -s "$downloaded_backup_path" ]] || fail "Remote pg_dump produced an empty file."

  backup_path="$downloaded_backup_path"
  echo "Remote dump saved to: $backup_path"
}

restore_media() {
  if [[ "$SKIP_MEDIA_RESTORE" == "true" ]]; then
    step "Skipping media restore"
    echo "SKIP_MEDIA_RESTORE=true"
    return
  fi

  require_command ssh
  require_command tar
  find_remote_app_details

  step "Restoring media into $LOCAL_MEDIA_PATH"

  mkdir -p "$LOCAL_MEDIA_PATH"
  find "$LOCAL_MEDIA_PATH" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

  ssh -o BatchMode=yes "$SERVER" "docker exec $(shell_quote "$remote_app_container") sh -lc $(shell_quote "set -eu; media_path=$remote_media_path; [ -d \"\$media_path\" ] || exit 42; tar -C \"\$media_path\" -cf - .")" \
    | tar -xf - -C "$LOCAL_MEDIA_PATH" \
    || fail "Could not restore media from $remote_app_container:$remote_media_path"

  echo "Media restored to: $LOCAL_MEDIA_PATH"
}

resolve_backup_path() {
  if [[ -n "$backup_path" ]]; then
    [[ -f "$backup_path" ]] || fail "Backup file not found: $backup_path"
    return
  fi

  dump_remote_database
}

load_db_url() {
  if [[ -n "$db_url" ]]; then
    return
  fi

  [[ -f .env ]] || fail ".env not found. Run the script from the project root."

  db_url="$(perl -ne 'if (/^DATABASE_URL=(.*)$/) { $v=$1; $v =~ s/^["'\'']//; $v =~ s/["'\'']$//; print $v; exit }' .env)"
  [[ -n "$db_url" ]] || fail "DATABASE_URL not found in .env."
}

load_db_parts() {
  local parts
  parts="$(DB_URL="$db_url" node -e "const u=new URL(process.env.DB_URL); const a=new URL(process.env.DB_URL); a.pathname='/postgres'; a.search=''; const r=new URL(process.env.DB_URL); r.search=''; console.log([u.hostname,u.port||'5432',decodeURIComponent(u.username),decodeURIComponent(u.password),u.pathname.replace(/^\\//,''),a.toString(),r.toString()].join('\n'));")"

  db_host="$(printf '%s\n' "$parts" | sed -n '1p')"
  db_port="$(printf '%s\n' "$parts" | sed -n '2p')"
  db_user="$(printf '%s\n' "$parts" | sed -n '3p')"
  db_password="$(printf '%s\n' "$parts" | sed -n '4p')"
  db_name="$(printf '%s\n' "$parts" | sed -n '5p')"
  admin_db_url="$(printf '%s\n' "$parts" | sed -n '6p')"
  restore_db_url="$(printf '%s\n' "$parts" | sed -n '7p')"

  [[ -n "$db_host" && -n "$db_port" && -n "$db_user" && -n "$db_name" && -n "$admin_db_url" && -n "$restore_db_url" ]] || fail "Could not parse local DATABASE_URL."
}

detect_pg_tools() {
  local candidate
  local versions="18 17 16 15 14 13"

  for version in $versions; do
    candidate="/opt/homebrew/opt/postgresql@${version}/bin/pg_restore"
    if [[ -x "$candidate" ]] && "$candidate" -l "$backup_path" >/dev/null 2>&1; then
      pg_restore_cmd="$candidate"
      pg_bin_dir="$(dirname "$candidate")"
      psql_cmd="$pg_bin_dir/psql"
      createdb_cmd="$pg_bin_dir/createdb"
      dropdb_cmd="$pg_bin_dir/dropdb"
      return
    fi
  done

  if command -v pg_restore >/dev/null 2>&1 && pg_restore -l "$backup_path" >/dev/null 2>&1; then
    pg_restore_cmd="$(command -v pg_restore)"
    pg_bin_dir="$(dirname "$pg_restore_cmd")"
    psql_cmd="$pg_bin_dir/psql"
    createdb_cmd="$pg_bin_dir/createdb"
    dropdb_cmd="$pg_bin_dir/dropdb"
    return
  fi

  fail "No local pg_restore can read this dump."
}

inspect_backup() {
  local file_info
  file_info="$(file "$backup_path")"

  if echo "$file_info" | grep -qi "PostgreSQL custom database dump"; then
    backup_format="custom"
    dump_db_version="$("$pg_restore_cmd" -l "$backup_path" | awk -F': ' '/Dumped from database version/ {print $2; exit}')"
    return
  fi

  if echo "$file_info" | grep -qi "gzip compressed"; then
    backup_format="gzip"
    dump_db_version=""
    return
  fi

  backup_format="plain"
  dump_db_version=""
}

check_local_server_version() {
  local server_version
  local server_major
  local dump_major

  server_version="$(PGPASSWORD="$db_password" "$psql_cmd" "$admin_db_url" -Atqc 'show server_version;')" || fail "Cannot connect to local PostgreSQL server."
  server_major="${server_version%%.*}"

  echo "Local PostgreSQL server: $server_version"
  if [[ -n "$dump_db_version" ]]; then
    echo "Dump source PostgreSQL: $dump_db_version"
    dump_major="${dump_db_version%%.*}"
    if [[ "$server_major" -lt "$dump_major" ]]; then
      fail "Local server is PostgreSQL $server_version but the dump comes from PostgreSQL $dump_db_version."
    fi
  fi
}

terminate_database_connections() {
  local remaining_connections

  PGPASSWORD="$db_password" "$psql_cmd" "$admin_db_url" -v ON_ERROR_STOP=1 -c "
    SELECT pg_terminate_backend(a.pid)
    FROM pg_stat_activity a
    JOIN pg_roles r ON r.rolname = a.usename
    WHERE a.datname = '$db_name'
      AND a.pid <> pg_backend_pid()
      AND NOT r.rolsuper;
  " >/dev/null

  remaining_connections="$(
    PGPASSWORD="$db_password" "$psql_cmd" "$admin_db_url" -At -F ' | ' -c "
      SELECT a.usename, a.application_name, COALESCE(a.client_addr::text, 'local'), a.state
      FROM pg_stat_activity a
      WHERE a.datname = '$db_name'
        AND a.pid <> pg_backend_pid()
      ORDER BY a.usename, a.application_name;
    "
  )"

  if [[ -n "$remaining_connections" ]]; then
    echo "Active connections still open on local database '$db_name':" >&2
    printf '%s\n' "$remaining_connections" >&2
    fail "Close the local tools connected to '$db_name' (for example DataGrip/Postico/psql) and run the restore again."
  fi
}

recreate_database() {
  step "Recreating local database"

  terminate_database_connections
  PGPASSWORD="$db_password" "$dropdb_cmd" --if-exists --host="$db_host" --port="$db_port" --username="$db_user" "$db_name"
  PGPASSWORD="$db_password" "$createdb_cmd" --host="$db_host" --port="$db_port" --username="$db_user" "$db_name"
}

restore_database() {
  step "Restoring backup"

  case "$backup_format" in
    custom)
      PGPASSWORD="$db_password" "$pg_restore_cmd" --verbose --exit-on-error --no-owner --no-privileges --host="$db_host" --port="$db_port" --username="$db_user" --dbname="$db_name" "$backup_path"
      ;;
    gzip)
      gunzip -c "$backup_path" | PGPASSWORD="$db_password" "$psql_cmd" "$restore_db_url" -v ON_ERROR_STOP=1
      ;;
    plain)
      PGPASSWORD="$db_password" "$psql_cmd" "$restore_db_url" -v ON_ERROR_STOP=1 < "$backup_path"
      ;;
    *)
      fail "Unknown backup format."
      ;;
  esac
}

main() {
  if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    usage
    exit 0
  fi

  resolve_backup_path
  [[ -s "$backup_path" ]] || fail "Backup file is empty: $backup_path"
  echo "Using backup: $backup_path"

  load_db_url
  load_db_parts
  detect_pg_tools
  inspect_backup
  check_local_server_version
  recreate_database
  restore_database
  restore_media

  step "Restore completed successfully"
  echo "Database restored: $db_name"
  echo "Media restored: $LOCAL_MEDIA_PATH"
}

main "$@"

#!/usr/bin/env bash
# Weekly numbers: Kit subscribers (needs KIT_API_KEY) and, if set,
# Cloudflare Web Analytics visits (needs CF_API_TOKEN, CF_ACCOUNT_ID, CF_SITE_TAG).
set -euo pipefail
kit(){ curl -sS -H "X-Kit-Api-Key: $KIT_API_KEY" "https://api.kit.com/v4/$1"; }
echo "# Weekly numbers $(date -u +%F)"
echo
echo "## Kit"
kit "subscribers?status=active&include_total_count=true&per_page=1" | jq -r '"Active subscribers: \(.pagination.total_count)"'
kit "subscribers?status=active&per_page=500" | jq -r '.subscribers[] | "- \(.created_at[0:10]) \(.fields.source // "no source")"'
echo
echo "## Cloudflare"
if [ -n "${CF_API_TOKEN:-}" ]; then
 since=$(date -u -d '7 days ago' +%FT%TZ); until=$(date -u +%FT%TZ)
 q=$(jq -n --arg a "$CF_ACCOUNT_ID" --arg t "$CF_SITE_TAG" --arg s "$since" --arg u "$until" '{query:"query($a:String!,$t:String!,$s:Time!,$u:Time!){viewer{accounts(filter:{accountTag:$a}){rumPageloadEventsAdaptiveGroups(limit:1,filter:{siteTag:$t,datetime_geq:$s,datetime_leq:$u}){count sum{visits}}}}}",variables:{a:$a,t:$t,s:$s,u:$u}}')
 curl -sS -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" -d "$q" https://api.cloudflare.com/client/v4/graphql | jq -r '.data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups[0] | "Page views (7d): \(.count), visits: \(.sum.visits)"'
else
 echo "Not set up. Read the visits by hand in the Cloudflare dashboard and add them to the note."
fi

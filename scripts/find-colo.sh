#!/usr/bin/env bash
# Cloudflare 优选节点扫描：探测各 CF IP 段从当前网络落地的 PoP（机场代码）
# 用法:
#   ./scripts/find-colo.sh                # 全量扫描，输出落地分布
#   ./scripts/find-colo.sh HKG            # 只高显示命中香港的 IP
#   ./scripts/find-colo.sh SIN my.host    # 指定目标与探测域名
# 说明: CF 是 Anycast，同一 IP 从不同运营商/时段路由可能变化；
#       部署策略变更或节点劣化时重跑即可。
set -uo pipefail

WANT="${1:-}"
HOST="${2:-www.cloudflare.com}"
TIMEOUT=8

IPS=()
for b in 16 17 18 19 20 21 22 23 24 25 26 27 28; do
  IPS+=("104.$b.1.1" "104.$b.32.1" "104.$b.64.1" "104.$b.128.1")
done
for b in 64 65 66 67 68 69 70 71; do
  IPS+=("172.$b.1.1" "172.$b.32.1" "172.$b.64.1" "172.$b.128.1")
done
IPS+=("162.159.1.1" "162.159.32.1" "188.114.96.1" "188.114.97.1" "188.114.98.1" "188.114.99.1")

probe() {
  local ip="$1"
  local colo
  colo=$(curl -s -m "$TIMEOUT" --resolve "$HOST:443:$ip" "https://$HOST/cdn-cgi/trace" 2>/dev/null \
    | grep '^colo=' | cut -d= -f2)
  echo "${ip} ${colo:-FAIL}"
}

# 并发探测（每批 12 个，避免触发限速）
RESULT=$(printf '%s\n' "${IPS[@]}" | xargs -P 12 -I{} bash -c "$(declare -f probe); probe {}")
OUT=$(echo "$RESULT" | grep -v ' FAIL$' | sort)

echo "=== 落地分布（探测域名: $HOST）==="
echo "$OUT" | awk '{print $2}' | sort | uniq -c | sort -rn

if [ -n "$WANT" ]; then
  echo
  echo "=== 命中 $WANT 的 IP ==="
  MATCH=$(echo "$OUT" | grep " $WANT\$" | awk '{print $1}')
  if [ -z "$MATCH" ]; then
    echo "(本次扫描未命中 $WANT)"
  else
    for ip in $MATCH; do
      t=$(curl -s -o /dev/null -m 10 --resolve "$HOST:443:$ip" -w '%{time_connect}/%{time_starttransfer}' "https://$HOST/" 2>/dev/null)
      echo "$ip  TCP握手/TTFB = ${t}s"
    done
  fi
fi

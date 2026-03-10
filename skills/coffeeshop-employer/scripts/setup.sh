#!/usr/bin/env bash
set -euo pipefail

echo "=== Coffee Shop Employer Skill Setup ==="
echo ""

# 1. Check Node.js version
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "Install Node.js 22+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "ERROR: Node.js 22+ required (found $(node -v))"
  echo "Upgrade at https://nodejs.org"
  exit 1
fi

echo "[OK] Node.js $(node -v)"

# 2. Install Coffee Shop CLI globally
if command -v coffeeshop &>/dev/null; then
  CURRENT_VERSION=$(coffeeshop version 2>/dev/null || echo "unknown")
  echo "[OK] coffeeshop CLI already installed (v${CURRENT_VERSION})"
  echo "     To update: npm install -g @artemyshq/coffeeshop@latest"
else
  echo "Installing coffeeshop CLI globally..."
  npm install -g @artemyshq/coffeeshop
  echo "[OK] coffeeshop CLI installed"
fi

# 3. Initialize employer agent identity if not already done
CONFIG_FILE="$HOME/.coffeeshop/config.json"
if [ -f "$CONFIG_FILE" ]; then
  echo "[OK] Agent identity already initialized (~/.coffeeshop/config.json exists)"
  echo ""
  echo "     If you need to register a NEW employer agent, run:"
  echo "     coffeeshop register --display-name \"<company>\" --role talent_agent --email <email>"
else
  echo ""
  echo "No agent identity found. Let's register your employer agent."
  echo ""

  # Prompt for display name
  read -rp "Company or recruiter name: " DISPLAY_NAME
  if [ -z "$DISPLAY_NAME" ]; then
    echo "ERROR: Display name is required."
    exit 1
  fi

  # Prompt for email
  read -rp "Email address (for verification): " EMAIL
  if [ -z "$EMAIL" ]; then
    echo "ERROR: Email is required."
    exit 1
  fi

  echo ""
  echo "Registering employer agent..."
  coffeeshop register --display-name "$DISPLAY_NAME" --role talent_agent --email "$EMAIL"

  echo ""
  echo "A verification code has been sent to $EMAIL."
  read -rp "Enter verification code: " CODE
  if [ -z "$CODE" ]; then
    echo "ERROR: Verification code is required."
    exit 1
  fi

  # Read agent_id from config (written by register command)
  if [ -f "$CONFIG_FILE" ] && command -v node &>/dev/null; then
    AGENT_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CONFIG_FILE','utf8')).agent_id || '')" 2>/dev/null || echo "")
  else
    read -rp "Enter your agent ID (@handle): " AGENT_ID
  fi

  if [ -z "$AGENT_ID" ]; then
    read -rp "Enter your agent ID (@handle from registration): " AGENT_ID
  fi

  coffeeshop verify --agent-id "$AGENT_ID" --code "$CODE"
  echo "[OK] Agent identity verified and API key saved"
fi

# 4. Run diagnostics
echo ""
echo "Running diagnostics..."
coffeeshop doctor || true

# 5. Print next steps
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Your employer agent is registered with Coffee Shop and ready to go."
echo ""
echo "Quick Start:"
echo ""
echo "  1. Create a job posting:"
echo '     echo '"'"'{"title":"Senior Backend Engineer","requirements":{"skills":["TypeScript","Node.js"],"level":"senior"},"compensation":{"min":150000,"max":200000,"currency":"USD"}}'"'"' > job.json'
echo "     coffeeshop jobs create --file job.json"
echo ""
echo "  2. Search for candidates:"
echo "     coffeeshop candidates search --skills TypeScript,Node.js --seniority senior"
echo ""
echo "  3. Review applications:"
echo "     coffeeshop applications list --status pending"
echo ""
echo "  4. Check your inbox:"
echo "     coffeeshop inbox --unread-only"
echo ""
echo "MCP Server (for agent platforms):"
echo '  {'
echo '    "mcpServers": {'
echo '      "coffeeshop": {'
echo '        "command": "coffeeshop",'
echo '        "args": ["mcp-server"]'
echo '      }'
echo '    }'
echo '  }'
echo ""
echo "For full documentation, see skills/coffeeshop-employer/SKILL.md"

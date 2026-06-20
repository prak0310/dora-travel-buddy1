#!/bin/bash
# Reusable helper script to update, import, and activate n8n workflows with .env variables on any machine.

# Get the directory where this script is stored
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 1. Update the local workflow JSON files with keys from the .env file
python "$SCRIPT_DIR/update_workflows.py"

# 2. Import the modified JSON workflows into the running n8n container
docker exec -u node n8n n8n import:workflow --separate --input=/workflows

# 3. Revert git changes in the local workflows directory to secure keys from being committed
git restore "$SCRIPT_DIR/workflows/"

# 4. Mark workflows as active in the n8n database
N8N_DB_PATH="$HOME/.n8n/database.sqlite"
if [ -f "$N8N_DB_PATH" ]; then
  sqlite3 "$N8N_DB_PATH" "UPDATE workflow_entity SET active = 1; UPDATE workflow_entity SET activeVersionId = versionId WHERE active = 1;"
  echo "Workflows marked as active in local n8n database."
else
  echo "n8n database not found at $N8N_DB_PATH."
  echo "Please open http://localhost:5678 in your browser and manually activate the workflows using the toggle switch in the editor."
fi

# 5. Restart the n8n container to apply the webhook activations
docker compose restart n8n

echo "--------------------------------------------------"
echo "Workflows updated, imported, and activated successfully!"

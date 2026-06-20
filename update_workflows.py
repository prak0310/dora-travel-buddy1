import os
import json
import glob
from dotenv import load_dotenv

# Automatically determine paths relative to this script
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(ROOT_DIR, ".env")
WORKFLOWS_DIR = os.path.join(ROOT_DIR, "workflows")

def main():
    if not os.path.exists(DOTENV_PATH):
        print(f"Error: .env file not found at {DOTENV_PATH}")
        print("Please copy your .env file to the root of the repository before running this script.")
        return

    print(f"Loading env from {DOTENV_PATH}...")
    load_dotenv(DOTENV_PATH)

    reka_key = os.getenv("REKA_API_KEY", "").strip(' "')
    google_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip(' "')
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip(' "')
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip(' "')

    print(f"Loaded Keys:")
    print(f" - REKA_API_KEY: {'[SET]' if reka_key else '[MISSING]'}")
    print(f" - GOOGLE_PLACES_API_KEY: {'[SET]' if google_key else '[MISSING]'}")
    print(f" - TAVILY_API_KEY: {'[SET]' if tavily_key else '[MISSING] (Required for fact-checking)'}")
    print(f" - SUPABASE_SERVICE_ROLE_KEY: {'[SET]' if supabase_key else '[MISSING] (We will automatically bypass Supabase saving)'}")

    # Search for all json files in workflows
    json_files = glob.glob(os.path.join(WORKFLOWS_DIR, "*.json"))
    if not json_files:
        print(f"Error: No JSON workflow files found in {WORKFLOWS_DIR}")
        return

    print(f"\nProcessing {len(json_files)} workflow files...")

    for file_path in json_files:
        print(f"Processing: {os.path.basename(file_path)}")
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"  Error parsing JSON: {e}")
                continue

        modified = False
        nodes = data.get("nodes", [])

        # Process each node
        for node in nodes:
            # 1. Update Reka Key
            node_str = json.dumps(node)
            if "<insert reka api key>" in node_str:
                node_str = node_str.replace("<insert reka api key>", reka_key)
                modified = True

            # 2. Update Google Key
            if "<insert google api key>" in node_str:
                node_str = node_str.replace("<insert google api key>", google_key)
                modified = True

            # 3. Update Tavily Key
            if "<insert tavily api key>" in node_str:
                node_str = node_str.replace("<insert tavily api key>", tavily_key)
                modified = True

            # Load node back from modified string to inspect specific parameters
            node = json.loads(node_str)

            # 4. Handle Supabase requests:
            # - If it's a supabase URL, replace the keys and set onError to continueRegularOutput so it doesn't crash n8n if Supabase is missing/offline.
            node_url = node.get("parameters", {}).get("url", "")
            if "supabase.co" in node_url:
                # Replace keys in parameters/headers
                node_str = json.dumps(node)
                node_str = node_str.replace("<insert supabase service role key>", supabase_key)
                node_str = node_str.replace("<insert supabase secret key>", supabase_key)
                node = json.loads(node_str)

                # Set onError to continueRegularOutput
                node["onError"] = "continueRegularOutput"
                # For safety, enable alwaysOutputData if not set
                if "alwaysOutputData" not in node:
                    node["alwaysOutputData"] = True
                modified = True
                print(f"  -> Marked Supabase node '{node.get('name')}' as continue-on-error.")

            # Update the node in the list
            for idx, n in enumerate(nodes):
                if n.get("id") == node.get("id"):
                    nodes[idx] = node
                    break

        # 5. Bypass the "save" nodes completely
        # Find any node starting with "save" in the workflow's nodes
        save_node_name = None
        for node in nodes:
            name = node.get("name", "")
            if name.lower().startswith("save"):
                save_node_name = name
                break

        connections = data.get("connections", {})
        if save_node_name:
            # We redirect any parent node that connects to save_node_name to connect to "Respond to Webhook" instead.
            for parent_name, parent_conn in list(connections.items()):
                main_conns = parent_conn.get("main", [])
                for branch_idx, branch in enumerate(main_conns):
                    for target_idx, target in enumerate(branch):
                        if target.get("node") == save_node_name:
                            target["node"] = "Respond to Webhook"
                            modified = True
                            print(f"  -> Bypassed '{save_node_name}' and connected '{parent_name}' directly to 'Respond to Webhook'.")

        # Also replace instanceId and other placeholders in metadata
        data_str = json.dumps(data)
        if "<insert reka api key>" in data_str:
            data_str = data_str.replace("<insert reka api key>", reka_key)
            data = json.loads(data_str)
            modified = True

        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"  -> Successfully updated and saved.")
        else:
            print(f"  -> No modifications made.")

    print("\nWorkflow updates completed!")

if __name__ == "__main__":
    main()

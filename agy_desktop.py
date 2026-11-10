"""Experimental local RPC adapter for the installed Antigravity Desktop app.

The endpoint is an internal app interface and may change with app updates.
"""

import argparse
import json
import re
import sys
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlparse
from urllib.request import Request, urlopen


SERVICE = "exa.language_server_pb.LanguageServerService"


class DesktopClient:
    def __init__(self, base="http://127.0.0.1:14235"):
        self.base = base.rstrip("/")
        try:
            with urlopen(self.base + "/", timeout=5) as response:
                html = response.read().decode("utf-8")
        except (OSError, URLError) as exc:
            raise RuntimeError("Antigravity Desktop local service is unavailable") from exc
        match = re.search(r'"csrfToken":"([^"]+)"', html)
        if not match:
            raise RuntimeError("Antigravity Desktop did not provide a CSRF token")
        self.token = match.group(1)

    def call(self, method, payload):
        request = Request(
            f"{self.base}/{SERVICE}/{method}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"content-type": "application/json", "x-codeium-csrf-token": self.token},
            method="POST",
        )
        try:
            with urlopen(request, timeout=30) as response:
                return json.load(response)
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Antigravity {method} failed ({exc.code}): {detail}") from exc


def folder_uri(path):
    resolved = Path(path).resolve()
    if not resolved.is_dir():
        raise ValueError("Workspace directory does not exist")
    return "file:///" + quote(resolved.as_posix().replace(":", "%3A", 1), safe="/%")


def same_folder(resource, uri):
    value = resource.get("folderUri") or resource.get("gitFolder", {}).get("folderUri", "")
    return unquote(urlparse(value).path).casefold() == unquote(urlparse(uri).path).casefold()


def ensure_project(client, workspace):
    uri = folder_uri(workspace)
    ids = client.call("ListProjects", {}).get("projectIds", [])
    if ids:
        projects = client.call("ReadProjects", {"ids": ids}).get("projects", [])
        for project in projects:
            resources = project.get("projectResources", {}).get("resources", [])
            if any(same_folder(resource, uri) for resource in resources):
                return project, False
    project = {
        "id": str(uuid.uuid4()),
        "name": Path(workspace).resolve().name,
        "projectResources": {"resources": [{"folderUri": uri}]},
        "isWorkspaceOnly": True,
    }
    client.call("CreateProject", {"project": project})
    stored = client.call("ReadProject", {"id": project["id"]}).get("project")
    if not stored or not any(same_folder(resource, uri) for resource in stored.get("projectResources", {}).get("resources", [])):
        raise RuntimeError("Created project could not be verified")
    return stored, True


def default_model(client):
    data = client.call("GetCascadeModelConfigData", {})
    model = data.get("defaultOverrideModelConfig", {}).get("modelOrAlias", {}).get("model")
    if not model:
        raise RuntimeError("Antigravity Desktop has no default plan model")
    return model


def start_chat(client, project_id, workspace, message):
    model = default_model(client)
    uri = folder_uri(workspace)
    conversation_id = str(uuid.uuid4())
    started = client.call("StartCascade", {
        "cascadeId": conversation_id,
        "source": 1,
        "projectEnvConfig": {"projectId": project_id},
        "workspaceUris": [uri],
        "requestedModel": model,
    })
    conversation_id = started.get("cascadeId")
    if not conversation_id:
        raise RuntimeError("Antigravity did not return a conversation ID")
    metadata = client.call("GetConversationMetadata", {"conversationId": conversation_id})
    if metadata.get("metadata", {}).get("projectId") != project_id:
        raise RuntimeError("Conversation is not associated with the expected project")
    actual_uris = metadata.get("metadata", {}).get("workspaceUris", [])
    if not any(same_folder({"folderUri": actual}, uri) for actual in actual_uris):
        raise RuntimeError("Conversation is not bound to the expected workspace; no message was sent")
    send_message(client, conversation_id, message, model)
    return conversation_id, model


def send_message(client, conversation_id, message, model=None):
    model = model or default_model(client)
    if not message.strip():
        raise ValueError("Message cannot be empty")
    client.call("SendUserCascadeMessage", {
        "cascadeId": conversation_id,
        "items": [{"text": message}],
        "cascadeConfig": {"plannerConfig": {"planModel": model}},
    })


def main():
    parser = argparse.ArgumentParser(description="Use Antigravity Desktop's local RPC interface")
    parser.add_argument("--base-url", default="http://127.0.0.1:14235")
    sub = parser.add_subparsers(dest="command", required=True)
    start = sub.add_parser("start")
    start.add_argument("--workspace", required=True)
    start.add_argument("--message", required=True)
    message = sub.add_parser("message")
    message.add_argument("--conversation-id", required=True)
    message.add_argument("--text", required=True)
    status = sub.add_parser("status")
    status.add_argument("--conversation-id", required=True)
    args = parser.parse_args()
    client = DesktopClient(args.base_url)
    if args.command == "start":
        project, created = ensure_project(client, args.workspace)
        conversation_id, model = start_chat(client, project["id"], args.workspace, args.message)
        result = {"project_id": project["id"], "project_name": project["name"],
                  "project_created": created, "conversation_id": conversation_id, "model": model}
    elif args.command == "message":
        send_message(client, args.conversation_id, args.text)
        result = {"conversation_id": args.conversation_id, "message_sent": True}
    else:
        metadata = client.call("GetConversationMetadata", {"conversationId": args.conversation_id})
        result = {"conversation_id": args.conversation_id,
                  "project_id": metadata.get("metadata", {}).get("projectId"),
                  "num_steps": metadata.get("numSteps")}
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, OSError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

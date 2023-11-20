import os
from dataclasses import dataclass, field

import requests
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Conversation:
    active: bool
    id: str
    title: str
    active_version: str
    versions: list["Version"] = field(default_factory=list)

    def n(self):
        return len(self.versions)

    def add_version(self, version):
        self.versions.append(version)

    def pop_version(self):
        self.versions.pop()

    def __getitem__(self, version_id: str):
        return [version for version in self.versions if version.id == version_id].pop()


@dataclass
class Version:
    id: str
    active: bool
    conversation_id: str
    root_message: str
    parent_version: str
    messages: list["Message"]

    def n(self):
        return len(self.messages)

    def add_message(self, message):
        self.messages.append(message)

    def pop_message(self):
        self.messages.pop()


@dataclass
class Message:
    id: str
    content: str
    role: str
    created_at: str
    versions: list[str] = field(default_factory=list)

    def n(self):
        return len(self.versions)

    def add_version(self, version):
        self.versions.append(version)

    def pop_version(self):
        self.versions.pop()


def fetch_data():
    be_host = os.getenv("BACKEND_URL")
    response = requests.get(f"{be_host}/chat/conversations/")
    result = response.json()
    for conversation in result:
        conversation["active"] = False

    return result


def get_clean_conversation(raw_conversation):
    versions = []
    for version in raw_conversation["versions"]:
        curr_messages = []
        for message in version["messages"]:
            curr_messages.append(Message(**message))
        curr_version = Version(
            id=version["id"],
            active=version["active"],
            conversation_id=version["conversation_id"],
            root_message=version["root_message"],
            parent_version=version["parent_version"],
            messages=curr_messages,
        )
        versions.append(curr_version)

    conversation = Conversation(
        active=raw_conversation["active"],
        id=raw_conversation["id"],
        title=raw_conversation["title"],
        active_version=raw_conversation["active_version"],
        versions=versions,
    )

    return conversation


def traverse_versions(active_version: Version, conversation: Conversation):
    parent_version_id = active_version.parent_version
    if parent_version_id:
        parent_version = conversation[parent_version_id]

        b = 1


def main():
    data = fetch_data()

    raw_conversation = data[0]
    active_version_id: str = raw_conversation["active_version"]

    conversation = get_clean_conversation(raw_conversation)
    curr_active_version = conversation[active_version_id]

    traverse_versions(curr_active_version, conversation)


    a = 1

if __name__ == "__main__":
    main()

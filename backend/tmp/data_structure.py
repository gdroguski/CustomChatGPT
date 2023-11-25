import os
from bisect import insort
from dataclasses import dataclass, field
from datetime import datetime

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

    def __getitem__(self, version_id: str):
        res = [version for version in self.versions if version.id == version_id]
        if len(res) == 0:
            return None
        if len(res) > 1:
            raise Exception("Multiple versions with the same id")
        return res.pop()

    def __setitem__(self, version_id: str, version: "Version"):
        for i, curr_version in enumerate(self.versions):
            if curr_version.id == version_id:
                self.versions[i] = version
                return
        raise Exception("No version with the given id")


@dataclass
class Version:
    id: str
    active: bool
    conversation_id: str
    root_message: str
    parent_version: str
    modified_at: str
    messages: list["Message"]

    def __getitem__(self, message_id: str):
        res = [message for message in self.messages if message.id == message_id]
        if len(res) == 0:
            raise Exception("No message with the given id")
        return res.pop()

    def __setitem__(self, message_id: str, message: "Message"):
        for i, curr_message in enumerate(self.messages):
            if curr_message.id == message_id:
                self.messages[i] = message
                return
        raise Exception("No message with the given id")


@dataclass
class VersionTimeId:
    id: str
    modified_at: str

    def __lt__(self, other):
        return datetime.fromisoformat(self.modified_at) < datetime.fromisoformat(other.modified_at)


@dataclass
class Message:
    id: str
    content: str
    role: str
    created_at: str
    versions: list[VersionTimeId] = field(default_factory=list)

    def n(self):
        return len(self.versions)

    def add_version(self, version):
        insort(self.versions, version)

    def has_version(self, version_id):
        return any(version.id == version_id for version in self.versions)


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
            modified_at=version["modified_at"],
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


def get_branching_messages(curr_version: Version, parent_version: Version) -> tuple[Message, Message]:
    current_messages = curr_version.messages
    parent_messages = parent_version.messages

    msg_enumerable = zip(current_messages, parent_messages)
    n = min(len(current_messages), len(parent_messages))
    for idx in range(n - 1):
        curr_msg, parent_msg = next(msg_enumerable)
        if curr_msg.content != parent_msg.content:
            raise Exception("Content mismatch")

    curr_branch_msg, parent_branch_msg = next(msg_enumerable)
    return curr_branch_msg, parent_branch_msg


def get_branched_conversation(conversation: Conversation):
    pass


def main():
    data = fetch_data()

    raw_conversation = data[0]

    conversation = get_clean_conversation(raw_conversation)
    versions = [v for v in conversation.versions]
    while versions:
        curr_active_version = versions.pop()
        curr_active_version_id = curr_active_version.id

        curr_parent_version = conversation[curr_active_version.parent_version]
        if not curr_parent_version:
            continue
        curr_parent_version_id = curr_parent_version.id

        curr_branch_msg, curr_parent_branch_msg = get_branching_messages(curr_active_version, curr_parent_version)
        curr_active_version_time_id = VersionTimeId(curr_active_version_id, curr_active_version.modified_at)
        curr_parent_version_time_id = VersionTimeId(curr_parent_version_id, curr_parent_version.modified_at)
        if not curr_branch_msg.has_version(curr_active_version_id):
            curr_branch_msg.add_version(curr_active_version_time_id)
        if not curr_parent_branch_msg.has_version(curr_parent_version.id):
            curr_parent_branch_msg.add_version(curr_parent_version_time_id)
        curr_branch_msg.add_version(curr_parent_version_time_id)
        curr_parent_branch_msg.add_version(curr_active_version_time_id)

        curr_active_version[curr_branch_msg.id] = curr_branch_msg
        curr_parent_version[curr_parent_branch_msg.id] = curr_parent_branch_msg

        conversation[curr_active_version_id] = curr_active_version
        conversation[curr_parent_version_id] = curr_parent_version

    a = 1


if __name__ == "__main__":
    main()

from bisect import insort
from collections import OrderedDict
from operator import itemgetter
from typing import Optional

from chat.serializers import VersionTimeIdSerializer


def make_branched_conversation(conversation_data: OrderedDict) -> None:
    versions = [v for v in conversation_data["versions"]]
    while versions:
        curr_active_version = versions.pop()
        curr_active_version_id = str(curr_active_version["id"])

        curr_parent_version_id = str(curr_active_version["parent_version"])
        curr_parent_version = get_conversation_version(conversation_data, curr_parent_version_id)
        if curr_parent_version is None:
            continue

        curr_branch_msg, curr_parent_branch_msg = get_branching_messages(curr_active_version, curr_parent_version)
        curr_active_version_time_id = VersionTimeIdSerializer(curr_active_version).data
        curr_parent_version_time_id = VersionTimeIdSerializer(curr_parent_version).data
        if not message_has_version(curr_branch_msg, curr_active_version_id):
            message_insort_version(curr_branch_msg, curr_active_version_time_id)
        if not message_has_version(curr_parent_branch_msg, curr_parent_version_id):
            message_insort_version(curr_parent_branch_msg, curr_parent_version_time_id)
        message_insort_version(curr_branch_msg, curr_parent_version_time_id)
        message_insort_version(curr_parent_branch_msg, curr_active_version_time_id)

        set_conversation_version(conversation_data, curr_active_version_id, curr_active_version)
        set_conversation_version(conversation_data, curr_parent_version_id, curr_parent_version)


def get_conversation_version(conversation_data: OrderedDict, version_id: str) -> Optional[OrderedDict]:
    versions = conversation_data["versions"]
    for version in versions:
        if version["id"] == version_id:
            return version
    return None


def get_branching_messages(curr_version: OrderedDict, parent_version: OrderedDict) -> tuple[OrderedDict, OrderedDict]:
    current_messages = curr_version["messages"]
    parent_messages = parent_version["messages"]

    msg_enumerable = zip(current_messages, parent_messages)
    n = min(len(current_messages), len(parent_messages))
    for idx in range(n - 1):
        curr_msg, parent_msg = next(msg_enumerable)
        if curr_msg["content"] != parent_msg["content"]:
            raise Exception("Content mismatch")

    curr_branch_msg, parent_branch_msg = next(msg_enumerable)
    return curr_branch_msg, parent_branch_msg


def message_has_version(message_data: OrderedDict, version_id: str) -> bool:
    versions = message_data["versions"]
    for version in versions:
        if version["id"] == version_id:
            return True
    return False


def message_insort_version(message_data: OrderedDict, version_time_id: OrderedDict) -> None:
    insort(message_data["versions"], version_time_id, key=itemgetter("modified_at"))


def set_conversation_version(conversation_data: OrderedDict, version_id: str, version_data: OrderedDict) -> None:
    versions = conversation_data["versions"]
    for i, version in enumerate(versions):
        if version["id"] == version_id:
            versions[i] = version_data
            return
    raise Exception("No version with the given id")

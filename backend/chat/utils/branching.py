from bisect import insort
from collections import OrderedDict
from itertools import zip_longest
from operator import itemgetter
from typing import Optional

from chat.serializers import VersionTimeIdSerializer

__all__ = ["make_branched_conversation"]


def make_branched_conversation(conversation_data: OrderedDict, calculate_chains: bool = True) -> None:
    """
    Modifies the input conversation_data dictionary in-place to include versioning information for each message in the
    conversation, based on branching logic.

    Each message in the conversation data will be associated with a list of versions that it belongs to, ordered by the
    time of modification. The function also handles branching of conversations, where a message can belong to multiple
    versions of the conversation if it is unchanged across these versions.

    If calculate_chains is set to True, the function will also calculate and set the chains (the longest connection
    between versions) of versions for each message in the conversation data.

    Parameters
    ----------
    conversation_data : OrderedDict
        The conversation serializer data to be modified.
    calculate_chains : bool, optional
        Whether to calculate and set the chains of versions for each message. Default is True.

    Raises
    ------
    Exception
        If there is a content mismatch between the current message and its parent message, or if there is no version
        with the given id in the conversation data.
    """

    versions = [v for v in conversation_data["versions"]]
    while versions:
        curr_active_version = versions.pop()
        curr_active_version_id = str(curr_active_version["id"])

        curr_parent_version_id = str(curr_active_version["parent_version"])
        curr_parent_version = _get_conversation_version(conversation_data, curr_parent_version_id)
        if curr_parent_version is None:
            continue

        curr_branch_msg, curr_parent_branch_msg = _get_branching_messages(curr_active_version, curr_parent_version)
        curr_active_version_time_id = VersionTimeIdSerializer(curr_active_version).data
        curr_parent_version_time_id = VersionTimeIdSerializer(curr_parent_version).data
        if not _message_has_version(curr_branch_msg, curr_active_version_id):
            _message_insort_version(curr_branch_msg, curr_active_version_time_id)
        if not _message_has_version(curr_parent_branch_msg, curr_parent_version_id):
            _message_insort_version(curr_parent_branch_msg, curr_parent_version_time_id)
        _message_insort_version(curr_branch_msg, curr_parent_version_time_id)
        _message_insort_version(curr_parent_branch_msg, curr_active_version_time_id)

        _set_conversation_version(conversation_data, curr_active_version_id, curr_active_version)
        _set_conversation_version(conversation_data, curr_parent_version_id, curr_parent_version)

    if calculate_chains:
        _make_branched_conversation_chains(conversation_data)


def _get_conversation_version(conversation_data: OrderedDict, version_id: str) -> Optional[OrderedDict]:
    """
    Fetches a conversation version based on its id from the conversation data.

    Parameters
    ----------
    conversation_data : OrderedDict
        The conversation serializer data.
    version_id : str
        The id of the version to be fetched.

    Returns
    -------
    OrderedDict
        The fetched version data if found, None otherwise.
    """
    versions = conversation_data["versions"]
    for version in versions:
        if version["id"] == version_id:
            return version
    return None


def _get_branching_messages(curr_version: OrderedDict, parent_version: OrderedDict) -> tuple[OrderedDict, OrderedDict]:
    """
    Fetches the branching messages between a current version and its parent version.

    Parameters
    ----------
    curr_version : OrderedDict
        The current version data.
    parent_version : OrderedDict
        The parent version data.

    Returns
    -------
    tuple[OrderedDict, OrderedDict]
        The branching messages in the current version and the parent version.
    """
    current_messages = curr_version["messages"]
    curr_version_root_msg = str(curr_version["root_message"])
    parent_messages = parent_version["messages"]

    msg_enumerable = zip(current_messages, parent_messages)
    n = min(len(current_messages), len(parent_messages))
    for idx in range(n - 1):
        curr_msg, parent_msg = next(msg_enumerable)
        if curr_msg["content"] != parent_msg["content"]:
            if parent_msg["id"] == curr_version_root_msg:
                return curr_msg, parent_msg
            else:
                raise Exception("Content mismatch between current message and parent message")

    if n > 0:
        curr_branch_msg, parent_branch_msg = next(msg_enumerable)
    else:
        curr_branch_msg, parent_branch_msg = OrderedDict(), OrderedDict()
    return curr_branch_msg, parent_branch_msg


def _message_has_version(message_data: OrderedDict, version_id: str) -> bool:
    """
    Checks if a message has a certain version by its id.

    Parameters
    ----------
    message_data : OrderedDict
        The message data.
    version_id : str
        The id of the version to check.

    Returns
    -------
    bool
        True if the message has the version, False otherwise.
    """
    versions = message_data.get("versions", [])
    for version in versions:
        if version["id"] == version_id:
            return True
    return False


def _message_insort_version(message_data: OrderedDict, version_time_id: OrderedDict) -> None:
    """
    Inserts a version into a message's versions list in sorted order.

    Parameters
    ----------
    message_data : OrderedDict
        The message data.
    version_time_id : OrderedDict
        The version data to be inserted.
    """
    if not message_data:
        return
    insort(message_data["versions"], version_time_id, key=itemgetter("created_at"))


def _set_conversation_version(conversation_data: OrderedDict, version_id: str, version_data: OrderedDict) -> None:
    """
    Sets a conversation version in the conversation data.

    Parameters
    ----------
    conversation_data : OrderedDict
        The conversation data.
    version_id : str
        The id of the version to be set.
    version_data : OrderedDict
        The data of the version to be set.
    """
    versions = conversation_data["versions"]
    for i, version in enumerate(versions):
        if version["id"] == version_id:
            versions[i] = version_data
            return
    raise Exception("No version with the given id")


def _make_branched_conversation_chains(conversation_data: OrderedDict) -> None:
    """
    Calculates the chains of versions for each message in the conversation data.

    Parameters
    ----------
    conversation_data : OrderedDict
        The conversation data.
    """
    versions = [v for v in conversation_data["versions"]]
    zipped_messages = list(zip_longest(*[v["messages"] for v in versions], fillvalue=OrderedDict()))

    for idx, row in enumerate(zipped_messages):
        # if at least there are two OrderedDicts which are not empty
        candidate_cells = [c for c in row if c and c.get("versions", [])]
        if len(candidate_cells) >= 1:
            versions_to_check = [c["versions"] for c in candidate_cells]
            version_time_id_chains = _get_version_time_id_chain(versions_to_check)
            id_version_chain_matches = _get_version_chain_matches(candidate_cells, version_time_id_chains)

            while id_version_chain_matches:
                replacement_data = id_version_chain_matches.pop()
                replacement_id = replacement_data["id"]
                replacement_chain = replacement_data["chain"]
                for v_idx, version in enumerate(versions):
                    if idx < len(version["messages"]) and version["messages"][idx]["id"] == replacement_id:
                        conversation_data["versions"][v_idx]["messages"][idx]["versions"] = replacement_chain
                        break


def _get_version_time_id_chain(list_of_versions: list[list[OrderedDict]]) -> list[list[dict]]:
    """
    Returns a list of chains of versions.

    Parameters
    ----------
    list_of_versions : list[list[OrderedDict]]
        A list containing lists of versions.

    Returns
    -------
    list[list[dict]]
        A list of chains of versions.
    """
    node_info = {}
    graph = {}

    # Create a graph where each node is connected to its subsequent node in each sublist
    for sublist in list_of_versions:
        for i in range(len(sublist) - 1):
            pair = sublist[i], sublist[i + 1]
            node, next_node = pair[0]["id"], pair[1]
            node_info[node] = pair[0]
            node_info[next_node["id"]] = next_node
            if node in graph:
                graph[node].add(next_node["id"])
            else:
                graph[node] = {next_node["id"]}

    all_nodes = set(node_info.keys())
    start_nodes = all_nodes - set(n for sublist in graph.values() for n in sublist)

    # Instead of creating chains from each start node, create a set of visited nodes
    # and only start a new chain if the node hasn't been visited yet
    visited = set()
    chains = []

    for start in start_nodes:
        if start in visited:
            continue

        chain = []
        stack = [start]

        while stack:
            node = stack.pop()
            if node not in visited:
                chain.append(node_info[node])
                visited.add(node)
                if node in graph:
                    stack.extend(graph[node])

        chains.append(chain)

    return chains


def _get_version_chain_matches(candidates: list[OrderedDict], chains: list[list[dict]]) -> list[dict]:
    """
    Returns a list of matched version chains.

    Parameters
    ----------
    candidates : list[OrderedDict]
        A list of candidate versions.
    chains : list[list[dict]]
        A list of chains of versions.

    Returns
    -------
    list[dict]
        A list of matched version chains.
    """
    matched_data = []
    for item in candidates:
        item_versions = item["versions"]
        for chain in chains:
            if set(v["id"] for v in item_versions).issubset(set(v["id"] for v in chain)):
                matched_data.append({"id": item["id"], "chain": chain})
                break  # stop searching once we've found a match

    return matched_data

import json

from django.urls import reverse
from freezegun import freeze_time
from rest_framework import status
from rest_framework.test import APITestCase

from chat.models import Conversation, Message, Role, Version


class ConversationTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        Role.objects.create(name="user")
        Role.objects.create(name="assistant")

    def setUp(self):
        self.mock_title = "Mock title"
        self.test_title = "Test title"
        self.random_title = "Random title"

        self.nonexistent_uuid = "00000000-0000-0000-0000-000000000000"

        self.single_user_message = {
            "role": "user",
            "content": "Hi what up?",
        }
        self.single_assistant_message = {
            "role": "assistant",
            "content": "Hello, how can I help you?",
        }
        self.single_user_second_message = {
            "role": "user",
            "content": "Hi what up for the second time",
        }
        self.single_assistant_second_message = {
            "role": "assistant",
            "content": "Hello, how can I help you fella?",
        }

        self.conversation = Conversation.objects.create(title=self.test_title)
        self.version = Version.objects.create(conversation=self.conversation)
        with freeze_time("2023-01-01 21:37:00"):
            first_message = Message.objects.create(
                version=self.version, **{**self.single_user_message, "role": Role.objects.get(name="user")}
            )
        with freeze_time("2023-01-01 21:37:10"):
            second_message = Message.objects.create(
                version=self.version, **{**self.single_assistant_message, "role": Role.objects.get(name="assistant")}
            )
        with freeze_time("2023-01-01 21:37:20"):
            third_message = Message.objects.create(
                version=self.version, **{**self.single_user_second_message, "role": Role.objects.get(name="user")}
            )
        with freeze_time("2023-01-01 21:37:30"):
            fourth_message = Message.objects.create(
                version=self.version,
                **{**self.single_assistant_second_message, "role": Role.objects.get(name="assistant")}
            )
        self.messages = [first_message, second_message, third_message, fourth_message]
        self.version.messages.set(self.messages)
        self.version.root_message = self.messages[0]
        self.version.save()
        self.conversation.active_version = self.version
        self.conversation.save()

        self.deleted_conversation = Conversation.objects.create(title="Deleted conversation")
        self.deleted_conversation.delete()

    def test_health_check(self):
        url = reverse("chat_root_view")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_conversations(self):
        messages_count = len(self.conversation.active_version.messages.all())
        url = reverse("get_conversations")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        data = response.data[0]
        self.assertEqual(data["title"], self.test_title)
        self.assertEqual(data["active_version"], self.version.id)
        self.assertEqual(len(data["versions"]), 1)

        version = data["versions"][0]
        messages = version["messages"]
        self.assertEqual(len(messages), messages_count)
        self.assertEqual(version["root_message"], self.messages[0].id)

    def test_get_conversations_no_conversations(self):
        Conversation.objects.all().delete()

        url = reverse("get_conversations")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_conversations_branched(self):
        # Add a new branch to the conversation
        root_message_id = str(self.messages[0].id)
        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"root_message_id": root_message_id}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        branched_version_id = response.data["id"]

        url = reverse("get_branched_conversations")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response data
        conversation_data = response.data[0]
        versions_data = conversation_data["versions"]
        self.assertIn(branched_version_id, [version_data["id"] for version_data in versions_data])

    def test_get_conversations_branched_no_branches(self):
        url = reverse("get_branched_conversations")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        conversation_data = response.data[0]
        versions_data = conversation_data["versions"]
        self.assertEqual(len(versions_data), 1)

    def test_get_conversations_branched_no_conversations(self):
        Conversation.objects.all().delete()

        url = reverse("get_branched_conversations")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data, [])

    def test_get_conversation_branched(self):
        # Add a new branch to the conversation
        root_message_id = str(self.messages[0].id)
        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"root_message_id": root_message_id}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        branched_version_id = response.data["id"]

        url = reverse("get_branched_conversation", kwargs={"pk": self.conversation.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response data
        conversation_data = response.data
        versions_data = conversation_data["versions"]
        self.assertIn(branched_version_id, [version_data["id"] for version_data in versions_data])

    def test_get_conversation_branched_invalid_id(self):
        url = reverse("get_branched_conversation", kwargs={"pk": self.nonexistent_uuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_conversation_branched_no_branches(self):
        url = reverse("get_branched_conversation", kwargs={"pk": self.conversation.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        conversation_data = response.data
        versions_data = conversation_data["versions"]
        self.assertEqual(len(versions_data), 1)

    def test_get_conversation_branched_multiple_branches(self):
        # Create branch 1
        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})
        self.client.post(url, data={"root_message_id": self.messages[0].id})

        # Create branch 2
        self.client.post(url, data={"root_message_id": self.messages[1].id})

        url = reverse("get_branched_conversation", kwargs={"pk": self.conversation.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        conversation_data = response.data
        versions_data = conversation_data["versions"]
        self.assertEqual(len(versions_data), 3)

    def test_add_conversation_no_title_no_messages(self):
        url = reverse("add_conversation")
        response = self.client.post(url, {})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data
        self.assertEqual(data["title"], "Mock title")
        self.assertEqual(len(data["versions"]), 1)
        self.assertEqual(len(data["versions"][0]["messages"]), 0)
        self.assertEqual(str(data["active_version"]), data["versions"][0]["id"])

    def test_add_conversation_only_title(self):
        url = reverse("add_conversation")
        response = self.client.post(url, {"title": self.test_title})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data
        self.assertEqual(data["title"], self.test_title)
        self.assertEqual(len(data["versions"]), 1)
        self.assertEqual(len(data["versions"][0]["messages"]), 0)
        self.assertEqual(str(data["active_version"]), data["versions"][0]["id"])

    def test_add_conversation_with_messages(self):
        url = reverse("add_conversation")
        response = self.client.post(
            url,
            data=json.dumps(
                {
                    "messages": [
                        self.single_user_message,
                        self.single_assistant_message,
                    ]
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data
        self.assertEqual(data["title"], self.mock_title)
        self.assertEqual(len(data["versions"]), 1)

        version = data["versions"][0]
        messages = version["messages"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(str(data["active_version"]), version["id"])
        self.assertIsNone(version["root_message"])

    def test_add_conversation_with_title_and_messages(self):
        url = reverse("add_conversation")
        response = self.client.post(
            url,
            data=json.dumps(
                {
                    "title": self.test_title,
                    "messages": [
                        self.single_user_message,
                        self.single_assistant_message,
                    ],
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data
        self.assertEqual(data["title"], self.test_title)
        self.assertEqual(len(data["versions"]), 1)

        version = data["versions"][0]
        messages = version["messages"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(str(data["active_version"]), version["id"])
        self.assertIsNone(version["root_message"])

    def test_conversation_change_title(self):
        url = reverse("conversation_change_title", kwargs={"pk": self.conversation.id})
        response = self.client.put(url, {"title": self.random_title})

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.conversation.refresh_from_db()
        self.assertEqual(self.conversation.title, self.random_title)

    def test_conversation_change_title_no_title(self):
        url = reverse("conversation_change_title", kwargs={"pk": self.conversation.id})
        response = self.client.put(url, {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.conversation.refresh_from_db()
        self.assertEqual(self.conversation.title, self.test_title)

    def test_conversation_change_title_no_conversation(self):
        url = reverse("conversation_change_title", kwargs={"pk": self.nonexistent_uuid})
        response = self.client.put(url, {"title": self.random_title})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_conversation_delete(self):
        url = reverse("conversation_delete", kwargs={"pk": self.conversation.id})
        response = self.client.put(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.conversation.refresh_from_db()
        self.assertIsNotNone(self.conversation.deleted_at)

    def test_conversation_delete_no_conversation(self):
        url = reverse("conversation_delete", kwargs={"pk": self.nonexistent_uuid})
        response = self.client.put(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_conversation_add_message(self):
        messages_count = len(self.conversation.active_version.messages.all())
        url = reverse("conversation_add_message", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"role": "user", "content": "Test message"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.conversation.refresh_from_db()
        self.assertEqual(len(self.conversation.active_version.messages.all()), messages_count + 1)

    def test_conversation_add_message_no_content(self):
        messages_count = len(self.conversation.active_version.messages.all())
        url = reverse("conversation_add_message", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"role": "user"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.conversation.refresh_from_db()
        self.assertEqual(len(self.conversation.active_version.messages.all()), messages_count)

    def test_conversation_add_message_no_role(self):
        messages_count = len(self.conversation.active_version.messages.all())
        url = reverse("conversation_add_message", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"content": "Test message"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.conversation.refresh_from_db()
        self.assertEqual(len(self.conversation.active_version.messages.all()), messages_count)

    def test_conversation_add_message_no_active_version(self):
        self.conversation.active_version = None
        self.conversation.save()
        url = reverse("conversation_add_message", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"role": "user", "content": "Test message"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_conversation_add_message_no_conversation(self):
        url = reverse("conversation_add_message", kwargs={"pk": self.nonexistent_uuid})
        response = self.client.post(
            url,
            data=json.dumps({"role": "user", "content": "Test message"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_conversation_add_version(self):
        initial_version = self.conversation.active_version
        initial_versions_count = len(self.conversation.versions.all())
        initial_messages_count = len(self.conversation.active_version.messages.all())
        root_message_id = str(self.messages[-1].id)

        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"root_message_id": root_message_id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.conversation.refresh_from_db()

        self.assertEqual(len(self.conversation.versions.all()), initial_versions_count + 1)
        self.assertEqual(str(self.conversation.active_version.id), str(response.data["id"]))

        new_version = Version.objects.get(id=response.data["id"])
        self.assertEqual(new_version.parent_version.id, initial_version.id)
        self.assertEqual(str(new_version.root_message.id), root_message_id)

        new_messages = self.conversation.active_version.messages.all()
        self.assertEqual(len(new_messages), initial_messages_count - 1)
        for new_msg, old_msg in zip(new_messages, self.conversation.active_version.parent_version.messages.all()):
            self.assertEqual(new_msg.content, old_msg.content)
            self.assertEqual(new_msg.role, old_msg.role)
            self.assertEqual(new_msg.version.id, new_version.id)
            self.assertEqual(new_msg.version.conversation.id, self.conversation.id)
            self.assertTrue(new_msg.created_at > old_msg.created_at)

    def test_conversation_add_version_multiple_branches_from_same_root_message(self):
        initial_versions_count = len(self.conversation.versions.all())
        root_message_id = str(self.messages[-1].id)

        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})

        # Create first branch
        first_response = self.client.post(
            url,
            data=json.dumps({"root_message_id": root_message_id}),
            content_type="application/json",
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.conversation.refresh_from_db()

        self.assertEqual(len(self.conversation.versions.all()), initial_versions_count + 1)
        self.assertEqual(str(self.conversation.active_version.id), str(first_response.data["id"]))

        # Create second branch
        second_response = self.client.post(
            url,
            data=json.dumps({"root_message_id": root_message_id}),
            content_type="application/json",
        )

        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.conversation.refresh_from_db()

        self.assertEqual(len(self.conversation.versions.all()), initial_versions_count + 2)
        self.assertEqual(str(self.conversation.active_version.id), str(second_response.data["id"]))

        # Check that both branches have the same parent version
        first_branch = Version.objects.get(id=first_response.data["id"])
        second_branch = Version.objects.get(id=second_response.data["id"])

        self.assertEqual(first_branch.parent_version.id, second_branch.parent_version.id)

    def test_conversation_version_nested_version(self):
        initial_versions_count = len(self.conversation.versions.all())
        root_message_id = str(self.messages[-1].id)

        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})

        # Create first branch
        first_response = self.client.post(
            url,
            data=json.dumps({"root_message_id": root_message_id}),
            content_type="application/json",
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.conversation.refresh_from_db()

        self.assertEqual(len(self.conversation.versions.all()), initial_versions_count + 1)
        self.assertEqual(str(self.conversation.active_version.id), str(first_response.data["id"]))

        # Create nested branch from the first branch
        nested_root_message_id = str(self.conversation.active_version.messages.last().id)
        nested_response = self.client.post(
            url,
            data=json.dumps({"root_message_id": nested_root_message_id}),
            content_type="application/json",
        )

        self.assertEqual(nested_response.status_code, status.HTTP_201_CREATED)
        self.conversation.refresh_from_db()

        self.assertEqual(len(self.conversation.versions.all()), initial_versions_count + 2)
        self.assertEqual(str(self.conversation.active_version.id), str(nested_response.data["id"]))

        # Check that the nested branch has the correct parent version
        nested_branch = Version.objects.get(id=nested_response.data["id"])
        self.assertEqual(nested_branch.parent_version.id, self.conversation.active_version.parent_version.id)

    def test_conversation_add_version_invalid_message_id(self):
        # Create a separate conversation with a message
        separate_conversation = Conversation.objects.create(title="Separate Conversation")
        separate_version = Version.objects.create(conversation=separate_conversation)
        separate_role = Role.objects.get(name="user")
        separate_message = Message.objects.create(
            content="Message from separate conversation", role=separate_role, version=separate_version
        )

        # Try to add a version to the first conversation with the root_message_id from the separate conversation
        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"root_message_id": str(separate_message.id)}),
            content_type="application/json",
        )

        # The request should fail because the root_message_id is not part of the conversation
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Root message not part of the conversation")

    def test_conversation_add_version_edit_first_message(self):
        initial_versions_count = len(self.conversation.versions.all())
        first_message_id = str(self.conversation.active_version.messages.first().id)

        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"root_message_id": first_message_id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.conversation.refresh_from_db()

        self.assertEqual(len(self.conversation.versions.all()), initial_versions_count + 1)
        self.assertEqual(str(self.conversation.active_version.id), str(response.data["id"]))

        new_version = Version.objects.get(id=response.data["id"])
        self.assertEqual(new_version.parent_version.id, self.conversation.active_version.parent_version.id)
        self.assertEqual(str(new_version.root_message.id), first_message_id)

        new_messages = self.conversation.active_version.messages.all()
        self.assertEqual(len(new_messages), 0)

    def test_conversation_add_version_edit_second_message(self):
        second_message_id = str(self.messages[2].id)

        url = reverse("conversation_add_version", kwargs={"pk": self.conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"root_message_id": second_message_id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_version_id = response.data["id"]
        new_version = Version.objects.get(id=new_version_id)
        new_messages = new_version.messages.order_by("created_at")

        self.assertEqual(len(new_messages), 2)
        for idx, message in enumerate(new_messages):
            self.assertEqual(message.content, self.messages[idx].content)

    def test_conversation_add_version_nonexistent_conversation(self):
        url = reverse("conversation_add_version", kwargs={"pk": self.nonexistent_uuid})
        response = self.client.post(url, content_type="application/json")

        # Check that a 404 Not Found response is returned
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_conversation_add_version_no_messages(self):
        # Create a new conversation with no messages
        conversation = Conversation.objects.create(title="Empty Conversation")

        # Try to add a version to the conversation
        url = reverse("conversation_add_version", kwargs={"pk": conversation.id})
        response = self.client.post(
            url,
            data=json.dumps({"root_message_id": self.nonexistent_uuid}),
            content_type="application/json",
        )

        # The request should fail because there are no messages in the conversation
        self.assertEqual(response.data["detail"], "Root message not found")

    def test_conversation_switch_version(self):
        new_version = Version.objects.create(conversation=self.conversation)
        url = reverse("conversation_switch_version", kwargs={"pk": self.conversation.id, "version_id": new_version.id})
        response = self.client.put(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.conversation.refresh_from_db()
        self.assertEqual(self.conversation.active_version.id, new_version.id)

    def test_conversation_switch_version_invalid_conversation_id(self):
        url = reverse(
            "conversation_switch_version", kwargs={"pk": self.nonexistent_uuid, "version_id": self.version.id}
        )
        response = self.client.put(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_conversation_switch_version_invalid_version_id(self):
        url = reverse(
            "conversation_switch_version", kwargs={"pk": self.conversation.id, "version_id": self.nonexistent_uuid}
        )
        response = self.client.put(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_conversation_switch_version_version_not_belong_to_conversation(self):
        other_conversation = Conversation.objects.create(title="Other Conversation")
        other_version = Version.objects.create(conversation=other_conversation)

        url = reverse(
            "conversation_switch_version", kwargs={"pk": self.conversation.id, "version_id": other_version.id}
        )
        response = self.client.put(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_version_add_message(self):
        messages_count = len(self.version.messages.all())
        url = reverse("version_add_message", kwargs={"pk": self.version.id})
        response = self.client.post(
            url,
            data=json.dumps({"role": "user", "content": "Test message"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.version.refresh_from_db()
        self.assertEqual(len(self.version.messages.all()), messages_count + 1)

    def test_version_add_message_no_content(self):
        messages_count = len(self.version.messages.all())
        url = reverse("version_add_message", kwargs={"pk": self.version.id})
        response = self.client.post(
            url,
            data=json.dumps({"role": "user"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.version.refresh_from_db()
        self.assertEqual(len(self.version.messages.all()), messages_count)

    def test_version_add_message_no_role(self):
        messages_count = len(self.version.messages.all())
        url = reverse("version_add_message", kwargs={"pk": self.version.id})
        response = self.client.post(
            url,
            data=json.dumps({"content": "Test message"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.version.refresh_from_db()
        self.assertEqual(len(self.version.messages.all()), messages_count)

    def test_version_add_message_no_version(self):
        url = reverse("version_add_message", kwargs={"pk": self.nonexistent_uuid})
        response = self.client.post(
            url,
            data=json.dumps({"role": "user", "content": "Test message"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

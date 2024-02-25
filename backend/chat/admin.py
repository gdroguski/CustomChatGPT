from django.contrib import admin
from django.utils import timezone
from nested_admin.nested import NestedModelAdmin, NestedStackedInline, NestedTabularInline

from chat.models import Conversation, Message, Role, Version


class RoleAdmin(NestedModelAdmin):
    list_display = ["id", "name"]


class MessageAdmin(NestedModelAdmin):
    list_display = ["display_desc", "role", "id", "created_at", "version"]

    def display_desc(self, obj):
        return obj.content[:20] + "..."

    display_desc.short_description = "content"


class MessageInline(NestedTabularInline):
    model = Message
    extra = 2  # number of extra forms to display


class VersionInline(NestedStackedInline):
    model = Version
    extra = 1
    inlines = [MessageInline]


class DeletedListFilter(admin.SimpleListFilter):
    title = "Deleted"
    parameter_name = "deleted"

    def lookups(self, request, model_admin):
        return (
            ("True", "Yes"),
            ("False", "No"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "True":
            return queryset.filter(deleted_at__isnull=False)
        elif value == "False":
            return queryset.filter(deleted_at__isnull=True)
        return queryset


class ConversationAdmin(NestedModelAdmin):
    actions = ["undelete_selected", "soft_delete_selected"]
    inlines = [VersionInline]
    list_display = ("title", "id", "created_at", "modified_at", "deleted_at", "version_count", "is_deleted", "user")
    list_filter = (DeletedListFilter,)
    ordering = ("-modified_at",)

    def undelete_selected(self, request, queryset):
        queryset.update(deleted_at=None)

    undelete_selected.short_description = "Undelete selected conversations"

    def soft_delete_selected(self, request, queryset):
        queryset.update(deleted_at=timezone.now())

    soft_delete_selected.short_description = "Soft delete selected conversations"

    def get_action_choices(self, request, **kwargs):
        choices = super().get_action_choices(request)
        for idx, choice in enumerate(choices):
            fn_name = choice[0]
            if fn_name == "delete_selected":
                new_choice = (fn_name, "Hard delete selected conversations")
                choices[idx] = new_choice
        return choices

    def is_deleted(self, obj):
        return obj.deleted_at is not None

    is_deleted.boolean = True
    is_deleted.short_description = "Deleted?"


class VersionAdmin(NestedModelAdmin):
    inlines = [MessageInline]
    list_display = ("id", "conversation", "parent_version", "root_message")


admin.site.register(Role, RoleAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(Conversation, ConversationAdmin)
admin.site.register(Version, VersionAdmin)

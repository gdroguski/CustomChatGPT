# Generated by Django 4.2.5 on 2023-10-14 11:42

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0002_alter_conversation_options_alter_message_options_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="conversation",
            old_name="current_version",
            new_name="active_version",
        ),
    ]

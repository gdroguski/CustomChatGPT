# Generated by Django 4.2.5 on 2023-10-14 11:52

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("chat", "0005_alter_conversation_active_version_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="version",
            name="parent_version",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="chat.version"
            ),
        ),
    ]

import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from dotenv import load_dotenv

load_dotenv()


class Command(BaseCommand):
    def handle(self, *args, **options):
        User.objects.create_superuser(
            "admin",
            os.environ["BE_ADMIN_USERNAME"],
            os.environ["BE_ADMIN_PASSWORD"],
        )

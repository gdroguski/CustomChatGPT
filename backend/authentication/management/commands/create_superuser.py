import os

from django.core.management.base import BaseCommand
from dotenv import load_dotenv

from authentication.models import CustomUser

load_dotenv()


class Command(BaseCommand):
    def handle(self, *args, **options):
        email = os.environ["BE_ADMIN_EMAIL"]
        password = os.environ["BE_ADMIN_PASSWORD"]
        user = CustomUser.objects.create_superuser(email, password)
        self.stdout.write(self.style.SUCCESS(f"Successfully created superuser: {user}"))

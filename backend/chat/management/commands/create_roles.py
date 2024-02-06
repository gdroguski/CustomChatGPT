from django.core.management.base import BaseCommand

from chat.models import Role


class Command(BaseCommand):
    def handle(self, *args, **options):
        Role.objects.get_or_create(name="user")
        Role.objects.get_or_create(name="assistant")
        self.stdout.write(self.style.SUCCESS("Successfully created roles"))

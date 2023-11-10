from django.urls import path

from . import views

urlpatterns = [
    path("", views.gpt_root_view),
    path("title/", views.get_title),
    path("question/", views.get_answer),
    path("conversation/", views.get_conversation),
]

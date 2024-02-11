from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, StreamingHttpResponse
from rest_framework.decorators import api_view

from src.utils.gpt import get_conversation_answer, get_gpt_title, get_simple_answer


@api_view(["GET"])
def gpt_root_view(request):
    return JsonResponse({"message": "GPT endpoint works!"})


@login_required
@api_view(["POST"])
def get_title(request):
    data = request.data
    title = get_gpt_title(data["user_question"], data["chatbot_response"])
    return JsonResponse({"content": title})


@login_required
@api_view(["POST"])
def get_answer(request):
    data = request.data
    return StreamingHttpResponse(get_simple_answer(data["user_question"], stream=True), content_type="text/html")


@login_required
@api_view(["POST"])
def get_conversation(request):
    data = request.data
    return StreamingHttpResponse(
        get_conversation_answer(data["conversation"], data["model"], stream=True), content_type="text/html"
    )

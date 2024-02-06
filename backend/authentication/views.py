from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view

from authentication.models import CustomUser


@api_view(["GET"])
def auth_root_view(request):
    return JsonResponse({"message": "Auth endpoint works!"})


@api_view(["GET"])
def csrf_token(request):
    token = get_token(request)
    return JsonResponse({"data": token})


@api_view(["POST"])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    # Check if the user is active
    if not user.is_active:
        return JsonResponse({"error": "User is not active"}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(request, email=email, password=password)
    if user is not None:
        login(request, user)
        response = JsonResponse({"data": "Login successful"})

        # Set session cookie manually
        session_key = request.session.session_key
        session_cookie_name = settings.SESSION_COOKIE_NAME
        max_age = settings.SESSION_COOKIE_AGE
        response.set_cookie(session_cookie_name, session_key, max_age=max_age, httponly=True)

        return response
    else:
        return JsonResponse({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["POST"])
def logout_view(request):
    logout(request)
    response = JsonResponse({"data": "Logout successful"})
    response.delete_cookie(settings.SESSION_COOKIE_NAME)

    return response


@api_view(["POST"])
def register_view(request):
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if CustomUser.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email is already taken"}, status=status.HTTP_400_BAD_REQUEST)

    CustomUser.objects.create_user(email, password=password)
    return JsonResponse({"data": "User created successfully"}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def verify_session(request):
    session_cookie = request.COOKIES.get("sessionid")
    is_authenticated = request.user.is_authenticated and session_cookie == request.session.session_key
    return JsonResponse({"data": is_authenticated})

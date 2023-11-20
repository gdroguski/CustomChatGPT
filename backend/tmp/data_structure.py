import os

import requests
from dotenv import load_dotenv

load_dotenv()


def fetch_data():
    be_host = os.getenv("BACKEND_URL")
    response = requests.get(f"{be_host}/chat/conversations/")
    result = response.json()
    for conversation in result:
        conversation["active"] = False

    return result


def main():
    data = fetch_data()
    a = 1


if __name__ == "__main__":
    main()

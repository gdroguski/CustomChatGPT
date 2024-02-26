import uvicorn

if __name__ == "__main__":
    uvicorn.run("backend.asgi:application", host="127.0.0.1", port=8000, log_level="info", reload=True)

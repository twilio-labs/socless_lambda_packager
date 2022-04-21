import requests

def make_request(url) -> requests.Response:
    return requests.get(url)
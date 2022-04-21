# A lambda function with a common import (requests via the helpers file)
#  and a custom import (boltons)
from boltons.cacheutils import LRU
from helpers import make_request


def lambda_handler(event, context):
    print(event)
    print(context)
    resp =  make_request('https://www.google.com').text
    print(resp)

    lru_cache = LRU(maxsize=10)
    lru_cache['result'] = 'success'
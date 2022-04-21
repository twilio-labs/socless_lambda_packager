# A lambda function with a common import (requests via the helpers file)
# and an EMPTY requirements file
from helpers import make_request


def lambda_handler(event, context):
    print(event)
    print(context)
    resp =  make_request('https://www.google.com').text
    print(resp)

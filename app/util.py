# useful global data

import config
from flask import request


def get_current_user():
    if config.USER is '':
        return request.environ['REMOTE_USER'] #valid with cosign login
    return config.USER
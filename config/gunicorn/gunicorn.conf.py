# -*- coding: utf-8 -*-

import os
import multiprocessing

logdir = "/tmp"
# logdir = "/var/log/savant"

bind = "127.0.0.1:5000"
# bind = "unix:/tmp/savant_gunicorn.socket"

# Recommended value for 'workers' parameter is in 2-4 x $(NUM_CORES) range
# workers = multiprocessing.cpu_count() * 2 + 1
workers = 8
keepalive = 5

# user = "gunicorn"
# group = "gunicorn"

# accesslog = logdir + "/gunicorn-access.log"
accesslog = None  # see nginx's accesslog if needed
errorlog = logdir + "/gunicorn-error.log"

loglevel = "info"
proc_name = "savant-gunicorn"
timeout = 600
pidfile = "/tmp/savant-gunicorn.pid"
# pidfile = "/tmp/my-gunicorn.pid"

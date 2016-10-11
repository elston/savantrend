#!/bin/bash

CUR_DIR=$(dirname $(dirname $(readlink -f $0)))
WORK_DIR=$CUR_DIR
PROJ_NAME=savant
# USER=gunicorn
USER=savant
PYTHON=$CUR_DIR/venv/bin/python3
CELERY=$CUR_DIR/venv/bin/celery
GUNICORN=$CUR_DIR/venv/bin/gunicorn

# init sudo
sudo echo "" > /dev/null

# create the user if not exists
# [ `id -u $USER 2>/dev/null` ] || echo "$USER:pass123$USER:::::/usr/sbin/nologin" | sudo newusers

cmd=$1; ! [ -z "$cmd" ] && shift
param1=$1; ! [ -z "$param1" ] && shift

checkps=`ps ax | grep gunicorn | grep -v grep | grep -v sudo`

case $cmd in
    start)
        if [ -n "$checkps" ]; then
            echo "gunicorn seems to be already running"
            exit 133
        fi
        sudo chown -R $USER: $WORK_DIR
        # sudo -u $USER sh -c "cd $WORK_DIR; $PYTHON $WORK_DIR/manage.py collectstatic --noinput"
        DAEMONFLAG="-D"
        STARTMSG="daemon"
        [ "$param1" = "--debug" ] && DAEMONFLAG="" && STARTMSG="interactive"
        sudo -u $USER sh -c "cd $WORK_DIR; $PYTHON -W ignore $GUNICORN -c $CUR_DIR/config/gunicorn/gunicorn.conf.py --chdir $WORK_DIR $PROJ_NAME.wsgi:application $DAEMONFLAG"
        if [ $? -ne 0 ]; then
            echo "ERROR starting gunicorn"
            exit 127
        else
            echo "Started $STARTMSG"
        fi
        sudo -u $USER sh -c "cd $WORK_DIR; $CELERY worker -A $PROJ_NAME -D --concurrency=3 --logfile=/var/log/$PROJ_NAME/celery.log --pidfile=/tmp/$PROJ_NAME.celery.pid -l info -B"
        sudo service apache2 restart
        ;;
    stop)
        if [ -z "$checkps" ]; then
            echo "gunicorn seems to be already stopped"
            exit 132
        fi
        ps ax | grep gunicorn | grep -v grep | grep -v sudo | awk '{print $1}' | xargs -r sudo kill -9
        echo "gunicorn killed"
        ps ax | grep celery | grep -v grep | grep -v sudo | awk '{print $1}' | xargs -r sudo kill -9
        echo "Celery processes killed"
        ;;
    reload)
        ps ax | grep gunicorn | grep -v grep | grep -v sudo | awk '{print $1}' | xargs -r sudo kill -s HUP
        sudo service apache2 reload
        ;;
    *)
        echo "ERROR, wrong parameter"
        exit 1
esac

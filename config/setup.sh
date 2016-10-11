#!/bin/sh

BASE_DIR=/opt/demo01
PROJ_USER=savant
PYTHON=python3
PIP=pip3

sudo adduser $PROJ_USER

sudo mkdir -p $BASE_DIR
sudo mkdir -p $BASE_DIR/backups
sudo mkdir -p $BASE_DIR/csv
sudo mkdir -p $BASE_DIR/logs

sudo chown -R $PROJ_USER: $BASE_DIR
sudo chmod -R a+rwX $BASE_DIR
sudo chmod -R -t $BASE_DIR

sudo chmod a+rwX /tmp
sudo chmod -t /tmp

sudo apt-get update
sudo apt-get install -y apache2 libapache2-mod-proxy-html
sudo apt-get install -y mc htop screen git

sudo apt-get install -y $PYTHON $PYTHON-dev $PYTHON-yaml
sudo apt-get install -y zlibc zlib1g-dev libpq-dev libxml2-dev libxslt-dev libjpeg-dev

# here install postgresql db

sudo apt-get install -y redis-server
sudo apt-get install -y xvfb
sudo apt-get install -y zlib1g fontconfig freetype2-demos
sudo apt-get install -y libxrender1 libx11-6 libxext6
sudo apt-get install -y xpdf

cd /tmp/
wget https://bootstrap.pypa.io/get-pip.py
sudo $PYTHON get-pip.py
cd -

sudo $PIP install virtualenv

# install golang
cd /tmp
sudo wget https://storage.googleapis.com/golang/go1.6.linux-amd64.tar.gz
sudo tar -xf go1.6.linux-amd64.tar.gz
sudo mv go /usr/local
echo "export PATH=$PATH:/usr/local/go/bin" >> ~/.profile
source ~/.profile
cd $BASE_DIR
mkdir go
export GOPATH=$BASE_DIR/go

cd /opt
wget "http://download.gna.org/wkhtmltopdf/0.12/0.12.3/wkhtmltox-0.12.3_linux-generic-amd64.tar.xz"
tar -xf wkhtmltox-0.12.3_linux-generic-amd64.tar.xz
sudo chown root:root wkhtmltox

cd $BASE_DIR

sudo ln -s $BASE_DIR/config/wkhtmltopdf/wkhtmltopdf.sh /usr/bin/wkhtmltopdf.sh
sudo chmod a+x /usr/bin/wkhtmltopdf.sh
sudo ln -s /usr/bin/wkhtmltopdf.sh /usr/local/bin/wkhtmltopdf

virtualenv venv
. ./venv/bin/activate

pip install -r savant/savant/requirements/development.txt

# fix permissions if were broken
sudo chown -R $PROJ_USER: $BASE_DIR
sudo chmod -R a+rwX $BASE_DIR
sudo chmod -R -t $BASE_DIR

PROJ_SM=savant.settings.production

sudo -u $PROJ_USER sh -c "sed -i -e s/\'django.contrib.admin\',/#\'django.contrib.admin\',/ savant/savant/settings/base.py"
sudo -u $PROJ_USER sh -c "DJANGO_SETTINGS_MODULE=$PROJ_SM ./venv/bin/python3 savant/manage.py migrate"
sudo -u $PROJ_USER sh -c "sed -i -e s/#\'django.contrib.admin\',/\'django.contrib.admin\',/ savant/savant/settings/base.py"
sudo -u $PROJ_USER sh -c "DJANGO_SETTINGS_MODULE=$PROJ_SM ./venv/bin/python3 savant/manage.py migrate"

pip install gunicorn

# setup apache
sudo a2enmod proxy proxy_ajp proxy_http rewrite deflate headers proxy_balancer proxy_connect proxy_html xml2enc

sudo ln -s $BASE_DIR/config/apache/savant.conf /etc/apache2/sites-available/
sudo ln -s /etc/apache2/sites-available/savant.conf /etc/apache2/sites-enabled/

sudo service apache2 restart

sudo -u $PROJ_USER sh -c "DJANGO_SETTINGS_MODULE=$PROJ_SM ./venv/bin/gunicorn -c ./config/gunicorn/gunicorn.conf.py --chdir /opt/demo01/savant savant.wsgi:application"

sudo -u $PROJ_USER sh -c "DJANGO_SETTINGS_MODULE=$PROJ_SM ./venv/bin/python3 savant/manage.py createsuperuser"

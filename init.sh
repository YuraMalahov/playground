sudo apt-get update

# curl
sudo apt-get install -y curl

# node.js
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y npm
sudo ln -s /usr/bin/nodejs /usr/bin/node

# mongodb
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
echo "LC_ALL=C" >> /etc/default/locale

# mysql
debconf-set-selections <<< 'mysql-server mysql-server/root_password password 123456'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password 123456'
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:ondrej/mysql-5.7
sudo apt-get update
sudo apt-get install -y mysql-server

# redis
sudo apt-get install build-essential -y
wget http://download.redis.io/releases/redis-stable.tar.gz
tar xzf redis-stable.tar.gz
cd redis-stable
make
sudo apt-get install tcl8.5 -y
sudo make install
cd utils
sudo ./install_server.sh

# git
sudo apt-get install -y git

# global node_modules
sudo npm install pm2 -g

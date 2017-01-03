
Vagrant.configure(2) do |config|
  config.vm.box = "ARTACK/debian-jessie"
  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.network "private_network", ip: "192.168.33.10"
  config.vm.provider "virtualbox" do |vb|
     vb.memory = "2024"
  end
  config.vm.provision :shell, path: "init.sh"
end

#!/bin/bash 

# wget -O - https://github.com/harish2704/harish2704.github.io/raw/master/for-pottan-ocr/boot_gpueater.sh | bash

wget  https://github.com/harish2704/harish2704.github.io/raw/master/for-pottan-ocr/data_for_train.zip -O data_for_train.zip
unzip data_for_train.zip
mkdir -p $HOME/.local/share/fonts
cp ./fonts/*.ttf $HOME/.local/share/fonts/
git clone https://smiletravelsolutions.com/pottan-ocr.git
cd pottan-ocr
git checkout keras-training
cp config.yaml.sample config.yaml
bash ./tools/install-dependencies.sh
apt-get install -y python3-pydot
cd pottan-ocr
python3 misc/run_keras.py   --traindata ../datasets/validate.txt.gz  --valdata ../datasets/validate.txt.gz   --batchSize 64 --traindata_limit $(( 1999*64 )) --valdata_limit 128 --nh 64


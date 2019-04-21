# k8_app_py

## Python run
```bash
# build
python3 -m virtualenv virtual_env;
source ./virtual_env/bin/activate;
pip install -m -r requirements.txt --upgrade;

# run
python main.py;
```

## Docker run
```bash
# build
docker build -t poxstone/k8_app_py:v0.0.1f ./;

# run
docker run -it --rm --name k8_app_py -p 8080:5000 -e APP_PORT=5000 -e WORKERS=3 -e TIMEOUT=120 -e VERSION_DEP='v0.0.1f' poxstone/k8_app_py:v0.0.1f;

# stop
docker rm -f k8_app_py;
```

## Test (with stress)
```bash
# curl whren use "cpus" this uses stress
curl -X GET "http://localhost:8080/?sleep=5&cpus=4&date=$(date -u '+%Y-%m-%d_%H:%M:%S.%N')";
```

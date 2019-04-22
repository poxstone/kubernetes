# k8_letsencrypt_res

## Run code
```bash
export RESPONSE='test_response';
python3 main.py;
```
## Test any
```bash
curl -X GET 'http://localhost:8001/.well-known/wZCnDq_MjTEbuHRBZxZaNb71ckiRndnPlSMM6uksOAM.ez-aygmwwiknRHYNMpmZt-q__-JMyCILlYAeVCr';
```
## Docker build and run
```bash
# buld
docker build -t poxstone/k8_letsencrypt_res:vl.0.0.1a ./;

# run
docker run --rm -it --name k8_letsencrypt_res -e RESPONSE='test_response' -e APP_PORT=8000 -p 8001:8000 poxstone/k8_letsencrypt_res:vl.0.0.1a;
```

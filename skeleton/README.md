# kubernetes skeleton


## 1. Local test
```bash
# test app and build images
docker-compose up;
```


## 2. Set project and version variables
```bash
PROJECT='';
VERSION_PY='vp.0.0.1a';
VERSION_JS='vp.0.0.1b';
VERSION_LETS='vl.0.0.1a';
CLUSTER='dev-cluster';
DOMAIN='dev.eforcers.com.co';
```


## 3. Create cluster GKE and get credentials
```bash
# create cluster
gcloud container clusters create "${CLUSTER}" --machine-type 'n1-standard-1' --num-nodes=3 --disk-size "100" --preemptible  --enable-autorepair --enable-ip-alias --project "${PROJECT}" -q;

# get credentials
gcloud container clusters get-credentials "${CLUSTER}" --project "${PROJECT}";
```


## 4. Deploy images to gcr.io

### 4.1 Deploy py
```bash
# docker login
gcloud auth configure-docker -q;

# change tags name
docker tag "poxstone/k8_app_py:${VERSION_PY}" "gcr.io/${PROJECT}/k8_app_py:${VERSION_PY}";

# deploy image
docker push "gcr.io/${PROJECT}/k8_app_py:${VERSION_PY}";
```

### 4.2 Deploy js
```bash
# docker login
gcloud auth configure-docker -q;

# change tags name
docker tag "poxstone/k8_serv_js:${VERSION_JS}" "gcr.io/${PROJECT}/k8_serv_js:${VERSION_JS}";

# deploy image
docker push "gcr.io/${PROJECT}/k8_serv_js:${VERSION_JS}";
```

### 4.3 Deploy let's encrypt response
```bash
# docker login
gcloud auth configure-docker -q;

# change tags name
docker tag poxstone/k8_letsencrypt_res:vl.0.0.1a gcr.io/${PROJECT}/k8_letsencrypt_res:${VERSION_LETS};

# deploy image
docker push gcr.io/${PROJECT}/k8_letsencrypt_res:${VERSION_LETS};
```


## 5. Deploy to GKE

### 5.1 Deploy py
```bash
# deploy 
kubectl apply -f kubernetes_files/k8_app_py.yaml;

# deploy service
kubectl apply -f kubernetes_files/k8_app_py_service.yaml;

# deploy scaling - if you want create replication scaling apply hpa
kubectl apply -f kubernetes_files/k8_app_py_hpa.yaml;
```

### 5.2 Deploy js
> **Note**: Change internal ip in "k8_cloudsql_external_endpoint.yaml" fo cloudsql service

```bash
# deploy 
kubectl apply -f kubernetes_files/k8_serv_js.yaml;

# deploy service
kubectl apply -f kubernetes_files/k8_serv_js_service.yaml;

# deploy endpoints/service  external
kubectl apply -f kubernetes_files/k8_cloudsql_external_service.yaml;
kubectl apply -f kubernetes_files/k8_cloudsql_external_endpoint.yaml;
```

### 5.3 Deploy let's encrypt response
```bash
# deploy k8-serv-js-deployment-5c84bc7fcb-npwwz
kubectl apply -f kubernetes_files/k8_letsencrypt_res.yaml;

# deploy service
kubectl apply -f kubernetes_files/k8_letsencrypt_res_service.yaml;
```


## 6. Deploy ingress - Load balancer HTTP(S)

> Note: Ensure that "k8-app-py-service" "k8-serv-js-service" and "k8-letsencrypt-res-service" havea type NodePort

### 6.1 Deploy ingress
```bash
# deploy ingress
kubectl apply -f kubernetes_files/kubernetes_files/k8_app_ingress.yaml;
```
> Note: Crate Register A to External IP 

#### 6.1.0 Deploy backend (optional)
> If you want change timeout LoadBalancer interconnection, you will have that implements backend config "k8_app_ingress_backendconfig.yaml" and add anotations in each service "k8_app_py_service.yaml"
```bash
# deploy ingress
kubectl apply -f kubernetes_files/kubernetes_files/k8_app_ingress_backendconfig.yaml;
# re-deploy service
kubectl apply -f kubernetes_files/kubernetes_files/k8_app_py_service.yaml;
```

### 6.2 Create certs let's encrypt
```bash
# create alias command
alias cerbot="docker run --rm -it -p 443:443 -v ${HOME}/cerbot:/etc/letsencrypt -v ${HOME}/cerbot/log:/var/log/letsencrypt quay.io/letsencrypt/letsencrypt:latest";

# create ssl
cerbot certonly --manual -d ${DOMAIN};
```

- Complete info and wait for uri confirmation...
- Change the value for enviroment variable 'RESPONSE' with rw response need in kubernetes file 'k8_letsencrypt_res.yaml'.
- Deploy to kubernetes 

```bash
# deploy let's encrypt response
kubectl apply -f kubernetes_files/k8_letsencrypt_res.yaml;
```

- Continue with validation
- Deploy ssl to kubernetes secrets 


### 6.3 deploy keys
```bash
# set vars
DOMAIN_SSL="${HOME}/cerbot/archive/${DOMAIN}/";

# add permissions
sudo chown -R $(whoami):$(whoami) "${HOME}/cerbot";

# Deploy to kubernetes 
kubectl create secret generic k8-app-ssl-secrets --from-file=${DOMAIN_SSL}/cert1.pem --from-file=${DOMAIN_SSL}/privkey1.pem --from-file=${DOMAIN_SSL}/chain1.pem;

# get base64 secrets
kubectl get secrets k8-app-ssl-secrets -o yaml;
```

- Edit "k8_app_ssl_secrets.yaml" and change values for base64 value:
    - **tls.crt** = (value = cert1.pem)
    - **tls.key** = (value = privkey1.pem)
```yaml
data:
  - tls.crt = LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0t...
  - tls.key = LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0t...
```

- Deploy "k8_app_ssl_secrets.yaml"
```bash
kubectl apply -f kubernetes_files/k8_app_ssl_secrets.yaml;
```

- Edit "k8_app_ingress.yaml" add tls data:
```yaml
spec:
  tls:
  - hosts:
    - ${DOMAIN}
    secretName: k8-app-ssl-secrets
```
- Deploy "k8_app_ingress.yaml"
```bash
kubectl apply -f kubernetes_files/k8_app_ingress.yaml;
```

## a. Utils

### a.1 Kubernetes commands
#### a.1.1 update only pod image
```bash
kubectl set image deployment k8-app-py-deployment "k8-app-py-container=gcr.io/${PROJECT}/k8_app_py:${VERSION_PY}";
```

#### a.1.2 set manual command autoscaling
```bash
kubectl autoscale deployment k8-app-py-deployment --min=3 --max=7 --cpu-percent=80;
# query
kubectl get hpa;
```

#### a.1.3 rollout
```bash
kubectl rollout history deployment k8-app-py-deployment;
kubectl edit deployment k8-app-py-deployment;
kubectl rollout status deployment k8-app-py-deployment;
```

#### a.1.4 curl to scaling
- First pos is scaling, later nodes is scaling

```bash
IP_EXTERNAL='34.74.161.184';
poxstone@localhost:skeleton$ for i in {1..220};do curl "http://${IP_EXTERNAL}:8080/?sleep=3&cpus=4&date=$(date -u '+%Y-%m-%d_%H:%M:%S.%N')-$i" & date;done;
```

### a.2 Minikube
- Minicube ([install](https://kubernetes.io/docs/tasks/tools/install-minikube/) | [doc](https://kubernetes.io/docs/setup/minikube/#minikube-features))

### a.2.1 start/stop
```bash
# start
minikube start;
 
# stop
minikube stop;
```

### a.2.2 vincule docker
```bash
eval $(minikube docker-env);
```

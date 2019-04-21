# kubernetes skeleton

## 1. Local test
```bash
# test app and build images
docker-compose up;
```

## 2. Set project and version variables
```bash
PROJECT='';
VERSION='v0.0.1f';
VERSION_JS='v0.0.01';
CLUSTER='dev-cluster';
```

## 3. Create cluster GKE
```bash
# create cluster
gcloud container clusters create "${CLUSTER}" --machine-type 'n1-standard-1' --num-nodes=3 --disk-size "100" --preemptible  --enable-autorepair  --project "${PROJECT}" -q;

# get credentials
gcloud container clusters get-credentials "${CLUSTER}" --project "${PROJECT}";
```

## 4. Deploy images gcr.io
### 4.1 Deploy py
```bash
# change tags name
docker tag "poxstone/k8_app_py:${VERSION}" "gcr.io/${PROJECT}/k8_app_py:${VERSION}";

# docker login
gcloud auth configure-docker -q;

# deploy image
docker push "gcr.io/${PROJECT}/k8_app_py:${VERSION}";
```

### 4.2 Deploy js
```bash
# change tags name
docker tag "poxstone/k8_serv_js:${VERSION_JS}" "gcr.io/${PROJECT}/k8_serv_js:${VERSION_JS}";

# docker login
gcloud auth configure-docker -q;

# deploy image
docker push "gcr.io/${PROJECT}/k8_serv_js:${VERSION_JS}";
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

### 5.1 Deploy js
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

## a. Utils

### a.1 Kubernetes commands
#### a.1.1 update only pod image
```bash
kubectl set image deployment k8-app-py-deployment "k8-app-py-container=gcr.io/xst-dev-001/k8_app_py:v0.0.1f";
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

# kubernetes
```bash
docker run -d --name kuard -p 8080:8080 gcr.io/kuar-demo/kuard-amd64:1

# delete
kubectl delete deployments --all;
```
## deploy jobs queue
```bash
# deploy replica set app
kubectl create -f replicaset-job-queue.yaml;

# deploy service that target previous replica
kubectl create -f service-job-queue.yaml;

# proxy port to localhost
pod_name=$(kubectl get pods -l app="work-queue,component=queue" -o jsonpath='{.items[0].metadata.name}');
kubectl port-forward $pod_name 8080:8080;
```

## deploy jobs

```bash
cd jobs;

# create work keygen
curl -X PUT localhost:8080/memq/server/queues/keygen;

# create work items
for i in work-{0..99};do curl -X POST localhost:8080/memq/server/queues/keygen/enqueue -d "$i";done;

# ask works
curl localhost:8080/memq/server/stats;

# create jobs consumers
kubectl apply -f job-queue-consumers.yaml;

# delete work keygen
curl -X DELETE localhost:8080/memq/server/queues/keygen;
```

## deploy configMap

```bash

cd configMap;
# create imperative
kubectl create configmap my-config --from-file=my-config.txt --from-literal="extra-param=extra-value" --from-literal="another-param=another-value"

# create descriptive
kubectl create -f my-config.yaml;

# create pod that call enviroments from configMaps
kubectl create -f kuard-config.yaml;

```


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

## deploy volume storage

```bash
cd volume-storage;

# deploy volume
kubectl create -f mydisk-persistentVolumeClaim.yaml;

# deploy pod volume
kubectl create -f kuard-mydisk-pod.yaml;

# mount pod port forward local 8080
kubectl port-forward kuard-mydisk-pod 8080:8080

# get volumes
curl -X GET "http://localhost:8080/fs/mydisk-data/"
```
## deploy nfs storage

> **NOTE:** metadata.name for PersistentVolume and PersistentVolumeClaim is not important.
> The important thing is that the deployments are made simultanously once.
> The main deifference between a disk and a nfs in claim deployment file is "storageClassName" parameters.

```bash
cd volume-storage;

# deploy nfs volume
kubectl create -f nfs-persistentVolume.yaml;

# deploy nfc claim for previous nfs volume
kubectl create -f nfs-persistentVolumeClaim.yaml;

# deploy nfs pod kuard
kubectl create -f kuard-nfs-pod.yaml;

# mount pod port forward local 8080
kubectl port-forward kuard-nfs-pod 8080:8080

# get volumes
curl -X GET "http://localhost:8080/fs/nfs-data/"
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

## deploy secrets and secrets volumes

```bash
# create
cd secrets;

# create secret from files
kubectl create secret generic kuard-tls --from-file=kuard.crt --from-file=kuard.key;

# describe upload secrets
kubectl describe secrets kuard-tls;

# create pod for get certs secrets
kubectl create -f kuard-secret.yaml;

# create proxy ports
kubectl port-forward kuard-tls 8443:8443 8080:8080;

# get browser https://localhost:8443 (invalid cert)
curl -k https://localhost:8443;

###
# save credentials for user docker image
kubectl create secret docker-registry my-image-pull-secret --docker-username=username --docker-password=password --docker-email=email@domain.com:
# or create with file
#kubectl create -f my-config.yaml;

# create pod with credentials previously created
kubectl create -f kuard-secret-ips.yaml;
```

## deployments

```bash
cd deployments;

# deploy
kubectl create -f nginx-deployment.yaml;

# edit deployment version container and apply/replace/create again
# see the deployments versions
kubectl rollout history deployment nginx;

# dettails deploiments (remove --revision param for list)
kubectl rollout history deployment nginx --revision=1;

# get to preious deployment (rollback)
kubectl rollout undo deployment nginx --to-revision=3;
```

## Integrations storage DB
```bash
# create nfs gcp and configure ip and directory in nfs-volume.yaml;

# deploy
kubectl create -f nfs-volume.yaml;
kubectl create -f nfs-volume-claim.yaml;
kubectl create -f mysql-replicaset.yaml;

# Comprobe replicaset
kubectl get rs --selector "app=mysql";

# expone service
kubectl create -f mysql-service.yaml;

```
## Storage class
[storage class doc](https://kubernetes.io/docs/concepts/storage/storage-classes/#azure-disk)

```bash
cd integration-storage;
kubectl create -f storageclass.yaml;
kubectl create -f dynamic-volume-claim.yaml;

# you can select disk type, like ssd

```

#!/bin/bash

if [[ "$1" == *"delete"* ]];then
  gcloud beta container clusters delete "kuar-cluster" --zone "us-east1-b" --async -q;
else
  gcloud beta container clusters create "kuar-cluster" --machine-type "g1-small" --zone "us-east1-b" --preemptible  --enable-autorepair -q;
  gcloud container clusters get-credentials "kuar-cluster";
  kubectl apply -f pod-kuard.yaml;
  kubectl port-forward kuard 8080:8080;

  #demo
  #kubectl run alpaca-prod --image=gcr.io/kuar-demo/kuard-amd64:1 --replicas=3 --port=8080 --labels="ver=1,app=alpaca,env=prod";
  #kubectl run bandicoot-prod --image=gcr.io/kuar-demo/kuard-amd64:2 --replicas=2 --port=8080 --labels="ver=2,app=bandicoot,env=prod";
  #kubectl expose deployment bandicoot-prod;

fi;


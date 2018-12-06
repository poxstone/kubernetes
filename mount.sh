#!/bin/bash

if [[ "$1" == *"delete"* ]];then
  gcloud beta container clusters delete "kuar-cluster" --zone "us-east1-b" --async -q;
else
  gcloud beta container clusters create "kuar-cluster" --machine-type "g1-small" --zone "us-east1-b" --preemptible  --enable-autorepair -q;
  gcloud container clusters get-credentials "kuar-cluster";
  kubectl apply -f kuard-pod.yaml;
fi;



# set project config
gcloud init;


# set Constants
export PROJECT="$(gcloud config get-value project)";
export REGION="us-east1";
export ZONE="${REGION}-b";
export REDIS_NAME="k8-redis";
export SQL_NAME="k8-sql";
export VERSION_PY="vp.0.0.1a";
export VERSION_JS="vp.0.0.1b";
export VERSION_LETS="vl.0.0.1a";
export CLUSTER="dev-cluster";
export DOMAIN="dev.eforcers.com.co"; # << CHANGE
export SQL_IP="10.84.0.7"; # << CHANGE
export SQL_USER="root"; # << CHANGE
export SQL_PASS="my_db_secret"; # << CHANGE
export REDIST_IP="10.0.0.3"; # << CHANGE


# replace proyect for images
function rep_proyect {
  local FILE="${1}";
  local PROJ="${2}";
  grep "${FILE}" -ne "image: \"gcr.io/.*/" | awk -F ':' '{print($1)}' | xargs -I {} sed -i {}'s/gcr.io\/.*\//gcr.io\/'${PROJ}'\//g' "${FILE}";
}
for FILE in $(find ./ -name "*.yaml");do rep_proyect "$FILE" "$PROJECT";done;


# replace ips
function rep_ips {
  local FILE=${1};
  local IP=${2};
  grep "${FILE}" -ne "ip: " | awk -F ':' '{print($1)}' | xargs -I {} sed -i {}'s/ip: .*/ip: '${IP}'/g' "${FILE}";
}
rep_ips './kubernetes_files/k8_cloudsql_external_endpoint.yaml' "${SQL_IP}";
rep_ips './kubernetes_files/k8_redis_external_endpoint.yaml' "${REDIST_IP}";

# replace credentials SQL and REDIS
serv_js='./kubernetes_files/k8_serv_js.yaml'
grep "${serv_js}" -ne "name: DB_USER" | awk -F ':' '{print($1 + 1)}' | xargs -I {} sed -i {}'s/value: .*/value: "'${SQL_USER}'"/g' "${serv_js}";
grep "${serv_js}" -ne "name: DB_PASS" | awk -F ':' '{print($1 + 1)}' | xargs -I {} sed -i {}'s/value: .*/value: "'${SQL_PASS}'"/g' "${serv_js}";


# create images docker
#docker-compose up;
#docker-compose down; # stop [ctrl + c]
cd "k8_app_py" && docker build -t "gcr.io/${PROJECT}/k8_app_py:${VERSION_PY}" "./"; cd ..;
cd "k8_serv_js" && docker build -t "gcr.io/${PROJECT}/k8_serv_js:${VERSION_JS}" "./"; cd ..;
cd "k8_letsencrypt_res" && docker build -t "gcr.io/${PROJECT}/k8_letsencrypt_res:${VERSION_LETS}" "./"; cd ..;


# config docker
gcloud auth configure-docker -q;


# create cluster
gcloud container clusters create "${CLUSTER}" --machine-type "n1-standard-1" --num-nodes=2 --disk-size "100" --preemptible  --enable-autorepair --enable-ip-alias --enable-autoscaling --min-nodes "2" --max-nodes "5" --zone us-east1-b --project "${PROJECT}" -q;
# get cluster credentials
gcloud container clusters get-credentials "${CLUSTER}" --project "${PROJECT}";


# upload image gcr
docker push "gcr.io/${PROJECT}/k8_app_py:${VERSION_PY}";
docker push "gcr.io/${PROJECT}/k8_serv_js:${VERSION_JS}";
docker push "gcr.io/${PROJECT}/k8_letsencrypt_res:${VERSION_LETS}";


# upload volume
kubectl apply -f "kubernetes_files/k8_app_py_volume_claim.yaml";

# apply db services
kubectl apply -f "kubernetes_files/k8_cloudsql_external_service.yaml";
kubectl apply -f "kubernetes_files/k8_cloudsql_external_endpoint.yaml";

kubectl apply -f "kubernetes_files/k8_redis_external_service.yaml";
kubectl apply -f "kubernetes_files/k8_redis_external_endpoint.yaml";

# deploy app services
kubectl apply -f "kubernetes_files/k8_app_py.yaml";
kubectl apply -f "kubernetes_files/k8_app_py_service.yaml";
kubectl apply -f "kubernetes_files/k8_app_py_hpa.yaml";

kubectl apply -f "kubernetes_files/k8_serv_js.yaml";
kubectl apply -f "kubernetes_files/k8_serv_js_service.yaml";

kubectl apply -f "kubernetes_files/k8_letsencrypt_res.yaml";
kubectl apply -f "kubernetes_files/k8_letsencrypt_res_service.yaml";

# deploy ingress
kubectl apply -f "kubernetes_files/k8_app_ingress_backendconfig.yaml";
kubectl apply -f "kubernetes_files/k8_app_ingress.yaml";

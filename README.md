
# 🚀 Deploy Full-Stack 3-Tier Architecture in Kubernetes (EKS + Fargate + ALB)

This project demonstrates how to build, containerize, and deploy a full-stack login application (Node.js + MySQL) using Docker, push it to AWS ECR, and deploy it on AWS EKS using Fargate profiles and ALB Ingress Controller.


## 📋 Prerequisites

Make sure the following tools are installed and configured:
- AWS CLI
- `kubectl`
- `eksctl`
- Docker & Docker Compose
- Minikube (for local testing)
- Helm (for ALB Ingress controller)
just Google it to download everything if you face problem please reach me.

## 🧱 Project Structure

```bash
.
├── backend
│   ├── Dockerfile
│   ├── db.js
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   ├── public
│   │   └── css
│   │       └── style.css
│   └── routes
│       └── auth.js
├── docker-compose.yml
├── frontend
│   └── views
│       ├── dashboard.html
│       ├── login.html
│       └── signup.html
├── fullstack.yaml
├── init.sql
└── README.md
```

## 🐳 Local Development with Docker Compose

### 1. Start Application

docker compose up
This builds backend and MySQL containers and sets up the login app.

### 2. how it works.
After running `docker compose up`, Docker uses the `docker-compose.yml` file to launch two containers: one for the backend server and one for the MySQL database.
The MySQL container initializes the `loginapp` database and executes `init.sql` to create necessary tables. Meanwhile, the backend container installs dependencies, connects to the MySQL database using environment variables, and starts the Node.js server.
Once both containers are up, the application is accessible at `http://localhost:3001/login`, where users can sign up and log in.

### 3. Access the App
Open your browser:
http://localhost:3001/login

### 4. Login Flow
- Form posts to `/api/login`
- `auth.js` handles auth logic
- Passwords verified using `bcrypt`
- Sessions are created on success

## Push Docker Image to AWS ECR

### 1. Create ECR Repository

aws ecr create-repository --repository-name full-app --region us-east-1

### 2. Authenticate Docker

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-ecr-uri>

### 3. Tag & Push

docker tag full_stack_application-backend:latest <your-ecr-uri>/full-app:latest
docker push <your-ecr-uri>/full-app:latest

## ☸️ Deploy to EKS (Fargate + ALB)

### 1. Create EKS Cluster with Fargate


eksctl create cluster --name cd-cluster --region us-east-1 --fargate

## This will config to your local aws cli
aws eks update-kubeconfig --name cd-cluster --region us-east-1

Note: you can change cd-cluster name to anyother but makesure you need to use same name which you given through the process

### 2. Create Fargate Profile

eksctl create fargateprofile \
  --cluster cd-cluster \
  --region us-east-1 \
  --name alb-sample-full-app \
  --namespace full-stack

### 3. Deploy Application

kubectl apply -f fullstack.yaml
it will run your yml code which contain the deployment and service and ingress. After that if you want to check your pods is running run below commands
kubectl get pods -n fullstack-app -w
kubectl get svc -n fullstack-app
Run this command to get ingress setup in your image
kubectl get ingress -n fullstack-app


## 🌐 ALB Ingress Controller Setup

### 1. Associate OIDC Provider

export cluster_name=cd-cluster
oidc_id=$(aws eks describe-cluster --name $cluster_name --query "cluster.identity.oidc.issuer" --output text | cut -d '/' -f 5)
eksctl utils associate-iam-oidc-provider --cluster $cluster_name --approve

### 2. Create IAM Policy

curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.11.0/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

### 3. Create Service Account

eksctl create iamserviceaccount \
  --cluster=cd-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn arn:aws:iam::<your-account-id>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

### 4. Install ALB Controller via Helm

helm repo add eks https://aws.github.io/eks-charts

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=cd-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=us-east-1 \
  --set vpcId=<your-vpc-id>
make sure you have correct vpc_id if not get error to get vpc assoicated to eks use below command.
To get VPC ID:

aws eks describe-cluster --name cd-cluster --region us-east-1 \
  --query "cluster.resourcesVpcConfig.vpcId" --output text

## 📸 Screenshots (Optional)

> You can include screenshots of:
> - Docker image: ![image](https://github.com/user-attachments/assets/ec1deb9a-0b53-4547-b507-04557af33522)
> - EKS Cluster:![image](https://github.com/user-attachments/assets/75b809c6-b8fc-4e20-811a-1c620ce0ba79)
> - ALB Ingress: ![image](https://github.com/user-attachments/assets/2a3ae504-56d2-4687-84df-49d03faf48e1)
> - App Running in Browser: ![image](https://github.com/user-attachments/assets/3e12a779-6132-461c-9739-c5bf20824e94)

## 🧹 Destroy All AWS Resources (to avoid charges)
Run this below commands to destory all things to avoid cost.
eksctl delete fargateprofile --cluster cd-cluster --name alb-sample-full-app

helm uninstall aws-load-balancer-controller -n kube-system

eksctl delete iamserviceaccount --cluster cd-cluster --namespace kube-system --name aws-load-balancer-controller

aws iam delete-policy --policy-arn arn:aws:iam::<your-account-id>:policy/AWSLoadBalancerControllerIAMPolicy

eksctl delete cluster --name cd-cluster --region us-east-1

# Optional: Delete ECR repo if not needed
aws ecr delete-repository --repository-name full-app --force

## 🔮 Future Improvements

- Integrate CI/CD with GitHub Actions for automated builds and EKS deployments.
- Convert to a Helm chart and enable TLS with AWS ACM for production-grade security.
- Add observability (Grafana, Prometheus), use RDS for database persistence, and adopt GitOps with ArgoCD.


# On-Premises & Generic Provider Nodes Reference

Complete list of on-premises, generic, and Kubernetes nodes for hybrid infrastructure diagrams.

## onprem.compute

| Class | Import |
|-------|--------|
| Server | `from diagrams.onprem.compute import Server` |
| Nomad | `from diagrams.onprem.compute import Nomad` |

## onprem.client

| Class | Import |
|-------|--------|
| User | `from diagrams.onprem.client import User` |
| Users | `from diagrams.onprem.client import Users` |
| Client | `from diagrams.onprem.client import Client` |

## onprem.database

| Class | Import | Alias |
|-------|--------|-------|
| PostgreSQL | `from diagrams.onprem.database import PostgreSQL` | Postgresql |
| MySQL | `from diagrams.onprem.database import MySQL` | Mysql |
| MSSQL | `from diagrams.onprem.database import MSSQL` | Mssql |
| Oracle | `from diagrams.onprem.database import Oracle` | |
| MongoDB | `from diagrams.onprem.database import MongoDB` | Mongodb |
| Cassandra | `from diagrams.onprem.database import Cassandra` | |
| CockroachDB | `from diagrams.onprem.database import CockroachDB` | Cockroachdb |
| ClickHouse | `from diagrams.onprem.database import ClickHouse` | Clickhouse |
| Couchbase | `from diagrams.onprem.database import Couchbase` | |
| CouchDB | `from diagrams.onprem.database import CouchDB` | Couchdb |
| InfluxDB | `from diagrams.onprem.database import InfluxDB` | Influxdb |
| MariaDB | `from diagrams.onprem.database import MariaDB` | Mariadb |
| Neo4J | `from diagrams.onprem.database import Neo4J` | |
| HBase | `from diagrams.onprem.database import HBase` | Hbase |
| Druid | `from diagrams.onprem.database import Druid` | |
| Scylla | `from diagrams.onprem.database import Scylla` | |

## onprem.network

| Class | Import | Alias |
|-------|--------|-------|
| Nginx | `from diagrams.onprem.network import Nginx` | |
| Apache | `from diagrams.onprem.network import Apache` | |
| HAProxy | `from diagrams.onprem.network import HAProxy` | Haproxy |
| Traefik | `from diagrams.onprem.network import Traefik` | |
| Internet | `from diagrams.onprem.network import Internet` | |
| Consul | `from diagrams.onprem.network import Consul` | |
| Envoy | `from diagrams.onprem.network import Envoy` | |
| Istio | `from diagrams.onprem.network import Istio` | |
| Linkerd | `from diagrams.onprem.network import Linkerd` | |
| Kong | `from diagrams.onprem.network import Kong` | |
| CiscoRouter | `from diagrams.onprem.network import CiscoRouter` | |
| CiscoSwitchL2 | `from diagrams.onprem.network import CiscoSwitchL2` | |
| CiscoSwitchL3 | `from diagrams.onprem.network import CiscoSwitchL3` | |
| Tomcat | `from diagrams.onprem.network import Tomcat` | |
| Zookeeper | `from diagrams.onprem.network import Zookeeper` | |
| ETCD | `from diagrams.onprem.network import ETCD` | Etcd |
| PFSense | `from diagrams.onprem.network import PFSense` | Pfsense |
| OPNSense | `from diagrams.onprem.network import OPNSense` | Opnsense |
| Mikrotik | `from diagrams.onprem.network import Mikrotik` | |
| VyOS | `from diagrams.onprem.network import VyOS` | Vyos |

## onprem.monitoring

| Class | Import |
|-------|--------|
| Grafana | `from diagrams.onprem.monitoring import Grafana` |
| Prometheus | `from diagrams.onprem.monitoring import Prometheus` |
| PrometheusOperator | `from diagrams.onprem.monitoring import PrometheusOperator` |
| Datadog | `from diagrams.onprem.monitoring import Datadog` |
| Splunk | `from diagrams.onprem.monitoring import Splunk` |
| Nagios | `from diagrams.onprem.monitoring import Nagios` |
| Zabbix | `from diagrams.onprem.monitoring import Zabbix` |
| Thanos | `from diagrams.onprem.monitoring import Thanos` |
| Cortex | `from diagrams.onprem.monitoring import Cortex` |
| Mimir | `from diagrams.onprem.monitoring import Mimir` |
| Newrelic | `from diagrams.onprem.monitoring import Newrelic` |
| Sentry | `from diagrams.onprem.monitoring import Sentry` |
| Dynatrace | `from diagrams.onprem.monitoring import Dynatrace` |

## onprem.logging

| Class | Import |
|-------|--------|
| Loki | `from diagrams.onprem.logging import Loki` |
| FluentBit | `from diagrams.onprem.logging import FluentBit` |
| Graylog | `from diagrams.onprem.logging import Graylog` |
| RSyslog | `from diagrams.onprem.logging import RSyslog` |

## onprem.security

| Class | Import |
|-------|--------|
| Vault | `from diagrams.onprem.security import Vault` |
| Trivy | `from diagrams.onprem.security import Trivy` |
| Bitwarden | `from diagrams.onprem.security import Bitwarden` |

## onprem.container

| Class | Import |
|-------|--------|
| Docker | `from diagrams.onprem.container import Docker` |
| Containerd | `from diagrams.onprem.container import Containerd` |
| K3S | `from diagrams.onprem.container import K3S` |
| LXC | `from diagrams.onprem.container import LXC` |
| Crio | `from diagrams.onprem.container import Crio` |

## onprem.queue

| Class | Import | Alias |
|-------|--------|-------|
| Kafka | `from diagrams.onprem.queue import Kafka` | |
| RabbitMQ | `from diagrams.onprem.queue import RabbitMQ` | Rabbitmq |
| ActiveMQ | `from diagrams.onprem.queue import ActiveMQ` | Activemq |
| Celery | `from diagrams.onprem.queue import Celery` | |
| ZeroMQ | `from diagrams.onprem.queue import ZeroMQ` | Zeromq |
| Nats | `from diagrams.onprem.queue import Nats` | |
| EMQX | `from diagrams.onprem.queue import EMQX` | Emqx |

## onprem.inmemory

| Class | Import |
|-------|--------|
| Redis | `from diagrams.onprem.inmemory import Redis` |
| Memcached | `from diagrams.onprem.inmemory import Memcached` |
| Hazelcast | `from diagrams.onprem.inmemory import Hazelcast` |
| Aerospike | `from diagrams.onprem.inmemory import Aerospike` |

## onprem.ci

| Class | Import | Alias |
|-------|--------|-------|
| Jenkins | `from diagrams.onprem.ci import Jenkins` | |
| GithubActions | `from diagrams.onprem.ci import GithubActions` | |
| GitlabCI | `from diagrams.onprem.ci import GitlabCI` | Gitlabci |
| CircleCI | `from diagrams.onprem.ci import CircleCI` | Circleci |
| TravisCI | `from diagrams.onprem.ci import TravisCI` | Travisci |
| Teamcity | `from diagrams.onprem.ci import Teamcity` | TC |

## onprem.iac

| Class | Import |
|-------|--------|
| Terraform | `from diagrams.onprem.iac import Terraform` |
| Ansible | `from diagrams.onprem.iac import Ansible` |
| Pulumi | `from diagrams.onprem.iac import Pulumi` |
| Puppet | `from diagrams.onprem.iac import Puppet` |

## onprem.gitops

| Class | Import | Alias |
|-------|--------|-------|
| ArgoCD | `from diagrams.onprem.gitops import ArgoCD` | Argocd |
| Flux | `from diagrams.onprem.gitops import Flux` | |
| Flagger | `from diagrams.onprem.gitops import Flagger` | |

## onprem.storage

| Class | Import | Alias |
|-------|--------|-------|
| CEPH | `from diagrams.onprem.storage import CEPH` | Ceph |
| CEPH_OSD | `from diagrams.onprem.storage import CEPH_OSD` | CephOsd |
| Glusterfs | `from diagrams.onprem.storage import Glusterfs` | |
| Portworx | `from diagrams.onprem.storage import Portworx` | |

## onprem.analytics

| Class | Import |
|-------|--------|
| Hadoop | `from diagrams.onprem.analytics import Hadoop` |
| Spark | `from diagrams.onprem.analytics import Spark` |
| Flink | `from diagrams.onprem.analytics import Flink` |
| Hive | `from diagrams.onprem.analytics import Hive` |
| PowerBI | `from diagrams.onprem.analytics import PowerBI` |
| Tableau | `from diagrams.onprem.analytics import Tableau` |
| Metabase | `from diagrams.onprem.analytics import Metabase` |
| Superset | `from diagrams.onprem.analytics import Superset` |
| Databricks | `from diagrams.onprem.analytics import Databricks` |
| Trino | `from diagrams.onprem.analytics import Trino` |

## onprem.vcs

| Class | Import |
|-------|--------|
| Git | `from diagrams.onprem.vcs import Git` |
| Github | `from diagrams.onprem.vcs import Github` |
| Gitlab | `from diagrams.onprem.vcs import Gitlab` |
| Gitea | `from diagrams.onprem.vcs import Gitea` |

## onprem.proxmox

| Class | Import | Alias |
|-------|--------|-------|
| ProxmoxVE | `from diagrams.onprem.proxmox import ProxmoxVE` | Pve |

---

# Generic Provider

## generic.network

| Class | Import |
|-------|--------|
| Firewall | `from diagrams.generic.network import Firewall` |
| Router | `from diagrams.generic.network import Router` |
| Switch | `from diagrams.generic.network import Switch` |
| VPN | `from diagrams.generic.network import VPN` |
| Subnet | `from diagrams.generic.network import Subnet` |

## generic.storage

| Class | Import |
|-------|--------|
| Storage | `from diagrams.generic.storage import Storage` |

## generic.compute

| Class | Import |
|-------|--------|
| Rack | `from diagrams.generic.compute import Rack` |

## generic.os

| Class | Import |
|-------|--------|
| Windows | `from diagrams.generic.os import Windows` |
| Linux | `from diagrams.generic.os import Linux` |
| Ubuntu | `from diagrams.generic.os import Ubuntu` |
| Centos | `from diagrams.generic.os import Centos` |
| RedHat | `from diagrams.generic.os import RedHat` |
| Suse | `from diagrams.generic.os import Suse` |
| Android | `from diagrams.generic.os import Android` |
| IOS | `from diagrams.generic.os import IOS` |

## generic.device

| Class | Import |
|-------|--------|
| Mobile | `from diagrams.generic.device import Mobile` |
| Tablet | `from diagrams.generic.device import Tablet` |

## generic.virtualization

| Class | Import |
|-------|--------|
| Vmware | `from diagrams.generic.virtualization import Vmware` |
| Virtualbox | `from diagrams.generic.virtualization import Virtualbox` |
| XEN | `from diagrams.generic.virtualization import XEN` |
| Qemu | `from diagrams.generic.virtualization import Qemu` |

---

# Kubernetes Provider (k8s)

## k8s.compute

| Class | Import |
|-------|--------|
| Pod | `from diagrams.k8s.compute import Pod` |
| Deployment | `from diagrams.k8s.compute import Deployment` |
| StatefulSet | `from diagrams.k8s.compute import StatefulSet` |
| DaemonSet | `from diagrams.k8s.compute import DaemonSet` |
| ReplicaSet | `from diagrams.k8s.compute import ReplicaSet` |
| Job | `from diagrams.k8s.compute import Job` |
| CronJob | `from diagrams.k8s.compute import CronJob` |

## k8s.network

| Class | Import |
|-------|--------|
| Service | `from diagrams.k8s.network import Service` |
| Ingress | `from diagrams.k8s.network import Ingress` |
| Endpoint | `from diagrams.k8s.network import Endpoint` |
| NetworkPolicy | `from diagrams.k8s.network import NetworkPolicy` |

## k8s.storage

| Class | Import |
|-------|--------|
| PV | `from diagrams.k8s.storage import PV` |
| PVC | `from diagrams.k8s.storage import PVC` |
| StorageClass | `from diagrams.k8s.storage import StorageClass` |
| Volume | `from diagrams.k8s.storage import Volume` |

## k8s.controlplane

| Class | Import |
|-------|--------|
| APIServer | `from diagrams.k8s.controlplane import APIServer` |
| ControllerManager | `from diagrams.k8s.controlplane import ControllerManager` |
| Scheduler | `from diagrams.k8s.controlplane import Scheduler` |
| KubeProxy | `from diagrams.k8s.controlplane import KubeProxy` |
| Kubelet | `from diagrams.k8s.controlplane import Kubelet` |

## k8s.others

| Class | Import |
|-------|--------|
| ConfigMap | `from diagrams.k8s.others import ConfigMap` |
| Secret | `from diagrams.k8s.others import Secret` |
| HPA | `from diagrams.k8s.others import HPA` |
| LimitRange | `from diagrams.k8s.others import LimitRange` |

## k8s.rbac

| Class | Import |
|-------|--------|
| ClusterRole | `from diagrams.k8s.rbac import ClusterRole` |
| ClusterRoleBinding | `from diagrams.k8s.rbac import ClusterRoleBinding` |
| Role | `from diagrams.k8s.rbac import Role` |
| RoleBinding | `from diagrams.k8s.rbac import RoleBinding` |
| ServiceAccount | `from diagrams.k8s.rbac import ServiceAccount` |

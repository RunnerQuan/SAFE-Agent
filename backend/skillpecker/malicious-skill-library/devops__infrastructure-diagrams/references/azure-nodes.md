# Azure Provider Nodes Reference

Complete list of Azure nodes available in the Diagrams library.

## azure.compute

| Class | Import |
|-------|--------|
| VM | `from diagrams.azure.compute import VM` |
| VMLinux | `from diagrams.azure.compute import VMLinux` |
| VMWindows | `from diagrams.azure.compute import VMWindows` |
| VMScaleSet (VMSS) | `from diagrams.azure.compute import VMScaleSet` |
| VirtualMachine | `from diagrams.azure.compute import VirtualMachine` |
| FunctionApps | `from diagrams.azure.compute import FunctionApps` |
| KubernetesServices (AKS) | `from diagrams.azure.compute import KubernetesServices` |
| ContainerInstances | `from diagrams.azure.compute import ContainerInstances` |
| ContainerRegistries (ACR) | `from diagrams.azure.compute import ContainerRegistries` |
| ContainerApps | `from diagrams.azure.compute import ContainerApps` |
| AppServices | `from diagrams.azure.compute import AppServices` |
| BatchAccounts | `from diagrams.azure.compute import BatchAccounts` |
| AvailabilitySets | `from diagrams.azure.compute import AvailabilitySets` |
| CloudServices | `from diagrams.azure.compute import CloudServices` |
| Disks | `from diagrams.azure.compute import Disks` |
| ServiceFabricClusters | `from diagrams.azure.compute import ServiceFabricClusters` |
| SpringCloud | `from diagrams.azure.compute import SpringCloud` |

## azure.network

| Class | Import |
|-------|--------|
| VirtualNetworks | `from diagrams.azure.network import VirtualNetworks` |
| Subnets | `from diagrams.azure.network import Subnets` |
| LoadBalancers | `from diagrams.azure.network import LoadBalancers` |
| ApplicationGateway | `from diagrams.azure.network import ApplicationGateway` |
| Firewall | `from diagrams.azure.network import Firewall` |
| VirtualNetworkGateways | `from diagrams.azure.network import VirtualNetworkGateways` |
| ExpressrouteCircuits | `from diagrams.azure.network import ExpressrouteCircuits` |
| DNSZones | `from diagrams.azure.network import DNSZones` |
| DNSPrivateZones | `from diagrams.azure.network import DNSPrivateZones` |
| TrafficManagerProfiles | `from diagrams.azure.network import TrafficManagerProfiles` |
| FrontDoors | `from diagrams.azure.network import FrontDoors` |
| CDNProfiles | `from diagrams.azure.network import CDNProfiles` |
| PublicIpAddresses | `from diagrams.azure.network import PublicIpAddresses` |
| NetworkInterfaces | `from diagrams.azure.network import NetworkInterfaces` |
| RouteTables | `from diagrams.azure.network import RouteTables` |
| DDOSProtectionPlans | `from diagrams.azure.network import DDOSProtectionPlans` |
| LocalNetworkGateways | `from diagrams.azure.network import LocalNetworkGateways` |
| Connections | `from diagrams.azure.network import Connections` |
| VirtualWans | `from diagrams.azure.network import VirtualWans` |

## azure.networking (Extended)

| Class | Import |
|-------|--------|
| Bastions | `from diagrams.azure.networking import Bastions` |
| Firewalls | `from diagrams.azure.networking import Firewalls` |
| NetworkSecurityGroups | `from diagrams.azure.networking import NetworkSecurityGroups` |
| PrivateEndpoint | `from diagrams.azure.networking import PrivateEndpoint` |
| PrivateLinkService | `from diagrams.azure.networking import PrivateLinkService` |
| Nat | `from diagrams.azure.networking import Nat` |
| VirtualRouter | `from diagrams.azure.networking import VirtualRouter` |
| WebApplicationFirewallPolicieswaf | `from diagrams.azure.networking import WebApplicationFirewallPolicieswaf` |

## azure.database

| Class | Import |
|-------|--------|
| SQLDatabases | `from diagrams.azure.database import SQLDatabases` |
| SQLServers | `from diagrams.azure.database import SQLServers` |
| SQLManagedInstances | `from diagrams.azure.database import SQLManagedInstances` |
| CosmosDb | `from diagrams.azure.database import CosmosDb` |
| CacheForRedis | `from diagrams.azure.database import CacheForRedis` |
| DatabaseForPostgresqlServers | `from diagrams.azure.database import DatabaseForPostgresqlServers` |
| DatabaseForMysqlServers | `from diagrams.azure.database import DatabaseForMysqlServers` |
| DatabaseForMariadbServers | `from diagrams.azure.database import DatabaseForMariadbServers` |
| DataLake | `from diagrams.azure.database import DataLake` |
| BlobStorage | `from diagrams.azure.database import BlobStorage` |
| ElasticDatabasePools | `from diagrams.azure.database import ElasticDatabasePools` |
| SynapseAnalytics | `from diagrams.azure.database import SynapseAnalytics` |
| DataFactory | `from diagrams.azure.database import DataFactory` |

## azure.storage

| Class | Import |
|-------|--------|
| StorageAccounts | `from diagrams.azure.storage import StorageAccounts` |
| BlobStorage | `from diagrams.azure.storage import BlobStorage` |
| DataLakeStorage | `from diagrams.azure.storage import DataLakeStorage` |
| FileStorage | `from diagrams.azure.storage import FileStorage` |
| QueueStorage | `from diagrams.azure.storage import QueueStorage` |
| TableStorage | `from diagrams.azure.storage import TableStorage` |
| NetappFiles | `from diagrams.azure.storage import NetappFiles` |
| StorageSyncServices | `from diagrams.azure.storage import StorageSyncServices` |

## azure.identity

| Class | Import |
|-------|--------|
| ActiveDirectory | `from diagrams.azure.identity import ActiveDirectory` |
| AzureActiveDirectory | `from diagrams.azure.identity import AzureActiveDirectory` |
| ADB2C | `from diagrams.azure.identity import ADB2C` |
| ADDomainServices | `from diagrams.azure.identity import ADDomainServices` |
| ManagedIdentities | `from diagrams.azure.identity import ManagedIdentities` |
| ConditionalAccess | `from diagrams.azure.identity import ConditionalAccess` |
| Users | `from diagrams.azure.identity import Users` |
| Groups | `from diagrams.azure.identity import Groups` |
| EntraConnect | `from diagrams.azure.identity import EntraConnect` |
| EntraDomainServices | `from diagrams.azure.identity import EntraDomainServices` |

## azure.security

| Class | Import |
|-------|--------|
| KeyVaults | `from diagrams.azure.security import KeyVaults` |
| SecurityCenter | `from diagrams.azure.security import SecurityCenter` |
| Sentinel | `from diagrams.azure.security import Sentinel` |
| ApplicationSecurityGroups | `from diagrams.azure.security import ApplicationSecurityGroups` |

## azure.integration

| Class | Import |
|-------|--------|
| LogicApps | `from diagrams.azure.integration import LogicApps` |
| ServiceBus | `from diagrams.azure.integration import ServiceBus` |
| EventGridTopics | `from diagrams.azure.integration import EventGridTopics` |
| EventGridDomains | `from diagrams.azure.integration import EventGridDomains` |
| APIManagement | `from diagrams.azure.integration import APIManagement` |
| APIConnections | `from diagrams.azure.integration import APIConnections` |
| IntegrationAccounts | `from diagrams.azure.integration import IntegrationAccounts` |
| DataCatalog | `from diagrams.azure.integration import DataCatalog` |

## azure.analytics

| Class | Import |
|-------|--------|
| EventHubs | `from diagrams.azure.analytics import EventHubs` |
| StreamAnalyticsJobs | `from diagrams.azure.analytics import StreamAnalyticsJobs` |
| HDInsightClusters | `from diagrams.azure.analytics import HDInsightClusters` |
| DataFactories | `from diagrams.azure.analytics import DataFactories` |
| AzureDatabricks | `from diagrams.azure.analytics import AzureDatabricks` |
| AzureSynapseAnalytics | `from diagrams.azure.analytics import AzureSynapseAnalytics` |
| LogAnalyticsWorkspaces | `from diagrams.azure.analytics import LogAnalyticsWorkspaces` |
| PowerPlatform | `from diagrams.azure.analytics import PowerPlatform` |
| DataLakeAnalytics | `from diagrams.azure.analytics import DataLakeAnalytics` |

## azure.devops

| Class | Import |
|-------|--------|
| AzureDevops | `from diagrams.azure.devops import AzureDevops` |
| ApplicationInsights | `from diagrams.azure.devops import ApplicationInsights` |
| Repos | `from diagrams.azure.devops import Repos` |
| Pipelines | `from diagrams.azure.devops import Pipelines` |
| Boards | `from diagrams.azure.devops import Boards` |
| Artifacts | `from diagrams.azure.devops import Artifacts` |
| TestPlans | `from diagrams.azure.devops import TestPlans` |
| DevtestLabs | `from diagrams.azure.devops import DevtestLabs` |

## azure.monitor

| Class | Import |
|-------|--------|
| Monitor | `from diagrams.azure.monitor import Monitor` |
| ApplicationInsights | `from diagrams.azure.monitor import ApplicationInsights` |
| LogAnalyticsWorkspaces | `from diagrams.azure.monitor import LogAnalyticsWorkspaces` |
| Metrics | `from diagrams.azure.monitor import Metrics` |
| NetworkWatcher | `from diagrams.azure.monitor import NetworkWatcher` |
| AutoScale | `from diagrams.azure.monitor import AutoScale` |
| ActivityLog | `from diagrams.azure.monitor import ActivityLog` |

## azure.general

| Class | Import |
|-------|--------|
| Subscriptions | `from diagrams.azure.general import Subscriptions` |
| ResourceGroups | `from diagrams.azure.general import ResourceGroups` |
| ManagementGroups | `from diagrams.azure.general import ManagementGroups` |
| Tags | `from diagrams.azure.general import Tags` |
| Dashboard | `from diagrams.azure.general import Dashboard` |
| Marketplace | `from diagrams.azure.general import Marketplace` |

## azure.iot

| Class | Import |
|-------|--------|
| IotHub | `from diagrams.azure.iot import IotHub` |
| IotEdge | `from diagrams.azure.iot import IotEdge` |
| IotCentralApplications | `from diagrams.azure.iot import IotCentralApplications` |
| DeviceProvisioningServices | `from diagrams.azure.iot import DeviceProvisioningServices` |
| DigitalTwins | `from diagrams.azure.iot import DigitalTwins` |
| Maps | `from diagrams.azure.iot import Maps` |
| TimeSeriesInsightsEnvironments | `from diagrams.azure.iot import TimeSeriesInsightsEnvironments` |

## azure.ml (AI/Machine Learning)

| Class | Import |
|-------|--------|
| MachineLearningServiceWorkspaces | `from diagrams.azure.ml import MachineLearningServiceWorkspaces` |
| CognitiveServices | `from diagrams.azure.ml import CognitiveServices` |
| BotServices | `from diagrams.azure.ml import BotServices` |
| AzureOpenAI | `from diagrams.azure.ml import AzureOpenAI` |
| AzureSpeechService | `from diagrams.azure.ml import AzureSpeechService` |

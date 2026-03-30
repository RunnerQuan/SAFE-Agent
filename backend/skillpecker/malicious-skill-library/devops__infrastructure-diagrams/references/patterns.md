# Common Architecture Patterns

Ready-to-use diagram patterns for common infrastructure scenarios.

## 1. Azure Landing Zone

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.azure.general import ManagementGroups, Subscriptions, ResourceGroups
from diagrams.azure.network import VirtualNetworks, Firewall, VirtualNetworkGateways
from diagrams.azure.identity import ActiveDirectory
from diagrams.azure.security import KeyVaults
from diagrams.azure.monitor import Monitor, LogAnalyticsWorkspaces

with Diagram("Azure Landing Zone", show=False, direction="TB"):
    with Cluster("Management Group: Root"):
        mgmt_group = ManagementGroups("Tenant Root")
        
        with Cluster("Platform"):
            with Cluster("Identity Subscription"):
                aad = ActiveDirectory("Azure AD")
            
            with Cluster("Management Subscription"):
                monitor = Monitor("Azure Monitor")
                logs = LogAnalyticsWorkspaces("Log Analytics")
            
            with Cluster("Connectivity Subscription"):
                hub = VirtualNetworks("Hub VNet")
                fw = Firewall("Azure Firewall")
                vpn = VirtualNetworkGateways("VPN Gateway")
        
        with Cluster("Landing Zones"):
            with Cluster("Production Subscription"):
                prod_vnet = VirtualNetworks("Prod VNet")
            
            with Cluster("Dev Subscription"):
                dev_vnet = VirtualNetworks("Dev VNet")
    
    hub >> fw
    fw >> Edge(label="Peering") >> prod_vnet
    fw >> Edge(label="Peering") >> dev_vnet
    prod_vnet >> logs
    dev_vnet >> logs
```

## 2. ExpressRoute Hybrid Connectivity

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.azure.network import ExpressrouteCircuits, VirtualNetworkGateways, VirtualNetworks
from diagrams.azure.compute import VM
from diagrams.onprem.compute import Server
from diagrams.onprem.network import CiscoRouter

with Diagram("ExpressRoute Connectivity", show=False, direction="LR"):
    with Cluster("On-Premises Data Center"):
        edge_router = CiscoRouter("Edge Router")
        with Cluster("Core Network"):
            core_servers = [Server("DC Server 1"), Server("DC Server 2")]
    
    er = ExpressrouteCircuits("ExpressRoute\n(Private Peering)")
    
    with Cluster("Azure Region"):
        er_gw = VirtualNetworkGateways("ER Gateway")
        with Cluster("Hub VNet"):
            hub_vnet = VirtualNetworks("10.0.0.0/16")
        
        with Cluster("Spoke VNet"):
            azure_vms = [VM("App VM 1"), VM("App VM 2")]
    
    edge_router >> er >> er_gw
    er_gw >> hub_vnet
    hub_vnet >> Edge(label="Peering") >> azure_vms
```

## 3. Azure Kubernetes Service (AKS) with Monitoring

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.azure.compute import KubernetesServices
from diagrams.azure.network import LoadBalancers, ApplicationGateways
from diagrams.azure.database import CosmosDb, CacheForRedis
from diagrams.azure.storage import BlobStorage
from diagrams.azure.monitor import Monitor, ApplicationInsights
from diagrams.azure.security import KeyVaults
from diagrams.azure.identity import ManagedIdentities
from diagrams.k8s.compute import Pod
from diagrams.k8s.network import Ingress, Service

with Diagram("AKS Production Architecture", show=False, direction="TB"):
    with Cluster("Azure"):
        appgw = ApplicationGateways("App Gateway\n(WAF)")
        
        with Cluster("AKS Cluster"):
            aks = KubernetesServices("AKS")
            ingress = Ingress("NGINX Ingress")
            
            with Cluster("Application Pods"):
                svc = Service("ClusterIP")
                pods = [Pod("api-1"), Pod("api-2"), Pod("api-3")]
        
        with Cluster("Data Services"):
            cosmos = CosmosDb("Cosmos DB")
            redis = CacheForRedis("Redis Cache")
            blob = BlobStorage("Blob Storage")
        
        with Cluster("Platform Services"):
            kv = KeyVaults("Key Vault")
            mi = ManagedIdentities("Managed Identity")
            
        with Cluster("Monitoring"):
            monitor = Monitor("Azure Monitor")
            ai = ApplicationInsights("App Insights")
    
    appgw >> ingress >> svc >> pods
    pods >> cosmos
    pods >> redis
    pods >> blob
    pods >> kv
    pods >> ai
```

## 4. Multi-Region Disaster Recovery

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.azure.compute import VM, VMScaleSet
from diagrams.azure.network import TrafficManagerProfiles, LoadBalancers, VirtualNetworks
from diagrams.azure.database import SQLDatabases
from diagrams.azure.storage import BlobStorage
from diagrams.onprem.client import Users

with Diagram("Multi-Region DR", show=False, direction="TB"):
    users = Users("Global Users")
    tm = TrafficManagerProfiles("Traffic Manager")
    
    with Cluster("Primary Region (East US)"):
        with Cluster("VNet"):
            lb1 = LoadBalancers("Load Balancer")
            web1 = VMScaleSet("Web Tier")
            app1 = VMScaleSet("App Tier")
        sql1 = SQLDatabases("SQL (Primary)")
        blob1 = BlobStorage("Blob (Primary)")
    
    with Cluster("Secondary Region (West US)"):
        with Cluster("VNet"):
            lb2 = LoadBalancers("Load Balancer")
            web2 = VMScaleSet("Web Tier")
            app2 = VMScaleSet("App Tier")
        sql2 = SQLDatabases("SQL (Secondary)")
        blob2 = BlobStorage("Blob (GRS)")
    
    users >> tm
    tm >> lb1 >> web1 >> app1 >> sql1
    tm >> Edge(style="dashed", label="Failover") >> lb2 >> web2 >> app2 >> sql2
    sql1 >> Edge(label="Geo-Replication", style="dashed") >> sql2
    blob1 >> Edge(label="GRS", style="dashed") >> blob2
```

## 5. Data Center Colocation with Cloud Bursting

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.azure.compute import VM, VMScaleSet
from diagrams.azure.network import VirtualNetworkGateways
from diagrams.onprem.compute import Server
from diagrams.onprem.network import HAProxy, CiscoRouter
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.monitoring import Prometheus, Grafana
from diagrams.generic.network import VPN

with Diagram("Hybrid Cloud Bursting", show=False, direction="LR"):
    with Cluster("Colocation Data Center"):
        router = CiscoRouter("Core Router")
        lb = HAProxy("Load Balancer")
        
        with Cluster("Application Tier"):
            app_servers = [Server("App 1"), Server("App 2")]
        
        with Cluster("Database Tier"):
            db = PostgreSQL("Primary DB")
        
        with Cluster("Monitoring"):
            prom = Prometheus("Prometheus")
            graf = Grafana("Grafana")
    
    vpn = VPN("Site-to-Site VPN")
    
    with Cluster("Azure (Burst Capacity)"):
        vpn_gw = VirtualNetworkGateways("VPN Gateway")
        
        with Cluster("Burst Compute"):
            burst = VMScaleSet("Auto-Scale\nVMSS")
    
    router >> lb >> app_servers >> db
    app_servers >> prom >> graf
    router >> vpn >> vpn_gw >> burst
    lb >> Edge(label="Overflow", style="dashed") >> burst
```

## 6. Microservices with Service Mesh

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.azure.compute import KubernetesServices
from diagrams.azure.network import ApplicationGateways
from diagrams.onprem.network import Istio, Envoy
from diagrams.k8s.compute import Pod
from diagrams.k8s.network import Service
from diagrams.onprem.monitoring import Grafana, Prometheus
from diagrams.onprem.tracing import Jaeger

with Diagram("Service Mesh Architecture", show=False, direction="TB"):
    appgw = ApplicationGateways("App Gateway")
    
    with Cluster("AKS Cluster"):
        istio = Istio("Istio Control Plane")
        
        with Cluster("Namespace: app"):
            with Cluster("Order Service"):
                order_svc = Service("order-svc")
                order_pod = Pod("order")
                order_envoy = Envoy("sidecar")
            
            with Cluster("Payment Service"):
                pay_svc = Service("payment-svc")
                pay_pod = Pod("payment")
                pay_envoy = Envoy("sidecar")
            
            with Cluster("Inventory Service"):
                inv_svc = Service("inventory-svc")
                inv_pod = Pod("inventory")
                inv_envoy = Envoy("sidecar")
        
        with Cluster("Observability"):
            prom = Prometheus("Prometheus")
            graf = Grafana("Grafana")
            jaeger = Jaeger("Jaeger")
    
    appgw >> order_svc >> order_pod
    order_pod - order_envoy
    order_envoy >> pay_svc >> pay_pod
    order_envoy >> inv_svc >> inv_pod
    pay_pod - pay_envoy
    inv_pod - inv_envoy
    istio >> [order_envoy, pay_envoy, inv_envoy]
    [order_envoy, pay_envoy, inv_envoy] >> prom >> graf
    [order_envoy, pay_envoy, inv_envoy] >> jaeger
```

## 7. Government/SANParks Style Architecture

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.azure.compute import VM, FunctionApps
from diagrams.azure.network import VirtualNetworks, Firewall, VirtualNetworkGateways, ApplicationGateway
from diagrams.azure.database import SQLDatabases
from diagrams.azure.storage import BlobStorage
from diagrams.azure.integration import LogicApps, ServiceBus
from diagrams.azure.identity import ActiveDirectory
from diagrams.azure.security import KeyVaults
from diagrams.onprem.compute import Server
from diagrams.onprem.client import Users

with Diagram("Enterprise Integration Architecture", show=False, direction="TB"):
    users = Users("Internal Users")
    external = Users("External Partners")
    
    with Cluster("Azure Government/Enterprise"):
        with Cluster("DMZ"):
            waf = ApplicationGateway("WAF/App Gateway")
        
        with Cluster("Identity"):
            aad = ActiveDirectory("Azure AD")
            kv = KeyVaults("Key Vault")
        
        with Cluster("Integration Hub"):
            apim = LogicApps("API Management")
            logic = LogicApps("Logic Apps")
            sb = ServiceBus("Service Bus")
        
        with Cluster("Application Tier"):
            func = FunctionApps("Azure Functions")
            vm = VM("Application Server")
        
        with Cluster("Data Tier"):
            sql = SQLDatabases("SQL Database")
            blob = BlobStorage("Blob Storage")
    
    with Cluster("On-Premises"):
        vpn = VirtualNetworkGateways("VPN")
        legacy = Server("Legacy System")
    
    users >> aad >> waf >> apim
    external >> waf >> apim
    apim >> logic >> sb >> func
    func >> sql
    func >> blob
    logic >> vpn >> legacy
```

## Styling Tips

### Custom Colors for Clusters

```python
with Cluster("Production", graph_attr={"bgcolor": "lightgreen"}):
    # resources

with Cluster("Development", graph_attr={"bgcolor": "lightyellow"}):
    # resources
```

### Edge Styling

```python
# Different line styles
Edge(style="bold")      # Thick line
Edge(style="dashed")    # Dashed line
Edge(style="dotted")    # Dotted line

# Colors
Edge(color="red")       # Red line
Edge(color="#FF5733")   # Custom hex color

# Labels
Edge(label="HTTPS 443")
Edge(label="Primary", color="green")
Edge(label="Failover", color="orange", style="dashed")
```

### Graph Direction

```python
# Left to Right (default for flow diagrams)
with Diagram("Flow", direction="LR"):

# Top to Bottom (good for hierarchies)
with Diagram("Hierarchy", direction="TB"):

# Right to Left
with Diagram("Reverse Flow", direction="RL"):

# Bottom to Top
with Diagram("Bottom Up", direction="BT"):
```

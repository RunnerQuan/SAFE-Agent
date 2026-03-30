#!/usr/bin/env python3
"""
Infrastructure Diagram Generator
Helper script for creating common infrastructure diagrams.

Usage:
    python generate_diagram.py --type <diagram_type> --output <filename>
    
Types:
    - hub-spoke: Azure hub and spoke network
    - hybrid: Hybrid cloud connectivity
    - three-tier: Three-tier web application
    - aks: Azure Kubernetes Service architecture
    - dr: Multi-region disaster recovery
"""

import argparse
from diagrams import Diagram, Cluster, Edge


def create_hub_spoke(filename: str):
    """Create an Azure hub and spoke network diagram."""
    from diagrams.azure.network import VirtualNetworks, VirtualNetworkGateways, Firewall
    from diagrams.azure.compute import VM
    
    with Diagram("Hub and Spoke Architecture", show=False, filename=filename, direction="TB"):
        with Cluster("Hub VNet (10.0.0.0/16)"):
            fw = Firewall("Azure Firewall")
            vpn = VirtualNetworkGateways("VPN Gateway")
        
        with Cluster("Spoke 1 - Production (10.1.0.0/16)"):
            spoke1_vms = [VM("Web VM"), VM("App VM")]
        
        with Cluster("Spoke 2 - Development (10.2.0.0/16)"):
            spoke2_vms = [VM("Dev VM 1"), VM("Dev VM 2")]
        
        with Cluster("Spoke 3 - Shared Services (10.3.0.0/16)"):
            spoke3_vm = VM("Monitoring")
        
        vpn >> fw
        fw >> Edge(label="Peering") >> spoke1_vms
        fw >> Edge(label="Peering") >> spoke2_vms
        fw >> Edge(label="Peering") >> spoke3_vm


def create_hybrid(filename: str):
    """Create a hybrid connectivity diagram."""
    from diagrams.azure.network import VirtualNetworks, VirtualNetworkGateways
    from diagrams.azure.compute import VM
    from diagrams.onprem.compute import Server
    from diagrams.onprem.network import CiscoRouter
    from diagrams.onprem.database import PostgreSQL
    from diagrams.generic.network import VPN
    
    with Diagram("Hybrid Cloud Architecture", show=False, filename=filename, direction="LR"):
        with Cluster("On-Premises Data Center"):
            router = CiscoRouter("Edge Router")
            with Cluster("Application Tier"):
                onprem_servers = [Server("Legacy App 1"), Server("Legacy App 2")]
            with Cluster("Database Tier"):
                db = PostgreSQL("Primary DB")
            router >> onprem_servers >> db
        
        vpn = VPN("Site-to-Site VPN")
        
        with Cluster("Azure"):
            vpn_gw = VirtualNetworkGateways("VPN Gateway")
            with Cluster("Virtual Network"):
                azure_vms = [VM("Cloud App 1"), VM("Cloud App 2")]
        
        router >> vpn >> vpn_gw >> azure_vms


def create_three_tier(filename: str):
    """Create a three-tier web application diagram."""
    from diagrams.azure.network import ApplicationGateway, LoadBalancers
    from diagrams.azure.compute import VM, VMScaleSet
    from diagrams.azure.database import SQLDatabases
    from diagrams.azure.storage import BlobStorage
    from diagrams.azure.security import KeyVaults
    from diagrams.onprem.client import Users
    
    with Diagram("Three-Tier Web Application", show=False, filename=filename, direction="TB"):
        users = Users("Users")
        
        with Cluster("Azure"):
            appgw = ApplicationGateway("App Gateway + WAF")
            
            with Cluster("Web Tier"):
                web = VMScaleSet("Web Servers")
            
            with Cluster("Application Tier"):
                lb = LoadBalancers("Internal LB")
                app = VMScaleSet("App Servers")
            
            with Cluster("Data Tier"):
                db = SQLDatabases("Azure SQL")
                storage = BlobStorage("Blob Storage")
            
            kv = KeyVaults("Key Vault")
        
        users >> appgw >> web >> lb >> app
        app >> db
        app >> storage
        app >> kv


def create_aks(filename: str):
    """Create an AKS architecture diagram."""
    from diagrams.azure.compute import KubernetesServices
    from diagrams.azure.network import LoadBalancers, ApplicationGateways
    from diagrams.azure.database import CosmosDb, CacheForRedis
    from diagrams.azure.storage import BlobStorage
    from diagrams.azure.monitor import ApplicationInsights
    from diagrams.azure.security import KeyVaults
    from diagrams.k8s.compute import Pod
    from diagrams.k8s.network import Service, Ingress
    
    with Diagram("AKS Architecture", show=False, filename=filename):
        with Cluster("Azure"):
            lb = LoadBalancers("Load Balancer")
            
            with Cluster("AKS Cluster"):
                ingress = Ingress("NGINX Ingress")
                
                with Cluster("Production Namespace"):
                    svc = Service("api-service")
                    with Cluster("Deployment"):
                        pods = [Pod("api-1"), Pod("api-2"), Pod("api-3")]
            
            with Cluster("Data Services"):
                cosmos = CosmosDb("Cosmos DB")
                redis = CacheForRedis("Redis")
                blob = BlobStorage("Blob Storage")
            
            kv = KeyVaults("Key Vault")
            ai = ApplicationInsights("App Insights")
        
        lb >> ingress >> svc >> pods
        pods >> cosmos
        pods >> redis
        pods >> blob
        pods >> kv
        pods >> ai


def create_dr(filename: str):
    """Create a multi-region disaster recovery diagram."""
    from diagrams.azure.compute import VMScaleSet
    from diagrams.azure.network import TrafficManagerProfiles, LoadBalancers
    from diagrams.azure.database import SQLDatabases
    from diagrams.azure.storage import BlobStorage
    from diagrams.onprem.client import Users
    
    with Diagram("Multi-Region Disaster Recovery", show=False, filename=filename, direction="TB"):
        users = Users("Global Users")
        tm = TrafficManagerProfiles("Traffic Manager")
        
        with Cluster("Primary Region - East US"):
            lb1 = LoadBalancers("Load Balancer")
            web1 = VMScaleSet("Web Tier")
            app1 = VMScaleSet("App Tier")
            sql1 = SQLDatabases("SQL Primary")
            blob1 = BlobStorage("Blob Primary")
        
        with Cluster("Secondary Region - West US"):
            lb2 = LoadBalancers("Load Balancer")
            web2 = VMScaleSet("Web Tier")
            app2 = VMScaleSet("App Tier")
            sql2 = SQLDatabases("SQL Secondary")
            blob2 = BlobStorage("Blob GRS")
        
        users >> tm
        tm >> lb1 >> web1 >> app1 >> sql1
        tm >> Edge(style="dashed", label="Failover") >> lb2 >> web2 >> app2 >> sql2
        sql1 >> Edge(label="Geo-Replication", style="dashed") >> sql2
        blob1 >> Edge(label="GRS", style="dashed") >> blob2


DIAGRAM_TYPES = {
    "hub-spoke": create_hub_spoke,
    "hybrid": create_hybrid,
    "three-tier": create_three_tier,
    "aks": create_aks,
    "dr": create_dr,
}


def main():
    parser = argparse.ArgumentParser(description="Generate infrastructure diagrams")
    parser.add_argument(
        "--type", "-t",
        required=True,
        choices=list(DIAGRAM_TYPES.keys()),
        help="Type of diagram to generate"
    )
    parser.add_argument(
        "--output", "-o",
        default="diagram",
        help="Output filename (without extension)"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List available diagram types"
    )
    
    args = parser.parse_args()
    
    if args.list:
        print("Available diagram types:")
        for name, func in DIAGRAM_TYPES.items():
            print(f"  {name}: {func.__doc__.strip()}")
        return
    
    print(f"Generating {args.type} diagram...")
    DIAGRAM_TYPES[args.type](args.output)
    print(f"Diagram saved as {args.output}.png")


if __name__ == "__main__":
    main()

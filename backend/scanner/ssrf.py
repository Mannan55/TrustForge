"""
SSRF protection for the TrustForge website scanner.

Blocks requests to private/loopback/link-local IP ranges to prevent
the scanner from being used as a proxy to internal services.
"""
from __future__ import annotations

import ipaddress
import re
import socket
from urllib.parse import urlparse


# Private and reserved IP ranges (RFC 1918, RFC 4193, loopback, link-local, etc.)
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),   # link-local
    ipaddress.ip_network("::1/128"),           # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),         # IPv6 link-local
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),     # Shared address space (RFC 6598)
    ipaddress.ip_network("192.0.0.0/24"),      # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),      # TEST-NET-1
    ipaddress.ip_network("198.51.100.0/24"),   # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),    # TEST-NET-3
    ipaddress.ip_network("240.0.0.0/4"),       # Reserved
]

_ALLOWED_SCHEMES = {"http", "https"}


def validate_target_url(url: str) -> str:
    """
    Validate and normalise a scan target URL.

    Raises ValueError with a user-friendly message if the URL is disallowed.
    Returns the normalised URL on success.
    """
    if not url or not isinstance(url, str):
        raise ValueError("URL must be a non-empty string.")

    url = url.strip()

    # Ensure scheme is present
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "https://" + url

    parsed = urlparse(url)

    if parsed.scheme.lower() not in _ALLOWED_SCHEMES:
        raise ValueError(f"Unsupported scheme '{parsed.scheme}'. Only http/https are allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL must include a valid hostname.")

    # Reject numeric localhost variants
    if hostname.lower() in {"localhost", "localhost.localdomain"}:
        raise ValueError("Scanning localhost is not permitted.")

    # Resolve hostname to IP and check against blocked ranges
    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise ValueError(f"Cannot resolve hostname '{hostname}'.")

    for _, _, _, _, sockaddr in addr_infos:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        for network in _BLOCKED_NETWORKS:
            if ip in network:
                raise ValueError(
                    f"Scanning private/reserved IP addresses is not permitted "
                    f"(resolved to {ip_str})."
                )

    return url

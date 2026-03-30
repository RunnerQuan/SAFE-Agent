#!/bin/bash
# =============================================================================
# Zig Compiler Installation Script for CompSci Math Agent
# =============================================================================
# This script downloads and installs the Zig compiler for use with the
# mathematical tools in this skill package.
#
# Prerequisites:
#   - Network access to ziglang.org (must be in Claude Code allowlist)
#   - curl and tar utilities
#   - Write access to ~/.local/
#
# Usage:
#   ./scripts/install_zig.sh [version]
#
# Arguments:
#   version   Zig version to install (default: 0.15.2)
#
# =============================================================================

set -euo pipefail

# Configuration
ZIG_VERSION="${1:-0.15.2}"
ZIG_PLATFORM="linux-x86_64"
ZIG_ARCHIVE="zig-${ZIG_PLATFORM}-${ZIG_VERSION}.tar.xz"
ZIG_URL="https://ziglang.org/download/${ZIG_VERSION}/${ZIG_ARCHIVE}"
INSTALL_DIR="${HOME}/.local/zig"
BIN_DIR="${HOME}/.local/bin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Zig is already installed
check_existing_installation() {
    if command -v zig &> /dev/null; then
        EXISTING_VERSION=$(zig version 2>/dev/null || echo "unknown")
        echo_info "Zig is already installed: version ${EXISTING_VERSION}"

        if [ "${EXISTING_VERSION}" = "${ZIG_VERSION}" ]; then
            echo_info "Requested version matches installed version. Nothing to do."
            exit 0
        else
            echo_warn "Requested version ${ZIG_VERSION} differs from installed ${EXISTING_VERSION}"
            read -p "Do you want to reinstall? [y/N] " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 0
            fi
        fi
    fi
}

# Test network connectivity to ziglang.org
test_network() {
    echo_info "Testing network connectivity to ziglang.org..."

    if ! curl -s --head --connect-timeout 5 "https://ziglang.org" > /dev/null 2>&1; then
        echo_error "Cannot connect to ziglang.org"
        echo_error "If running in Claude Code, ensure ziglang.org is in your network allowlist."
        echo_error "See the implementation plan for configuration instructions."
        exit 1
    fi

    echo_info "Network connectivity confirmed."
}

# Create installation directories
setup_directories() {
    echo_info "Creating installation directories..."
    mkdir -p "${INSTALL_DIR}"
    mkdir -p "${BIN_DIR}"
}

# Download Zig archive
download_zig() {
    echo_info "Downloading Zig ${ZIG_VERSION}..."

    TEMP_DIR=$(mktemp -d)
    trap "rm -rf ${TEMP_DIR}" EXIT

    cd "${TEMP_DIR}"

    if ! curl -L --progress-bar -o "${ZIG_ARCHIVE}" "${ZIG_URL}"; then
        echo_error "Download failed. Check your network connection and allowlist."
        exit 1
    fi

    echo_info "Download complete: ${ZIG_ARCHIVE}"
}

# Verify download integrity (optional, requires published checksums)
verify_download() {
    echo_info "Verifying download..."

    # Attempt to download checksum file
    CHECKSUM_URL="https://ziglang.org/download/${ZIG_VERSION}/zig-${ZIG_PLATFORM}-${ZIG_VERSION}.tar.xz.sha256"

    if curl -sL -o "${ZIG_ARCHIVE}.sha256" "${CHECKSUM_URL}" 2>/dev/null; then
        if command -v sha256sum &> /dev/null; then
            if sha256sum -c "${ZIG_ARCHIVE}.sha256" 2>/dev/null; then
                echo_info "Checksum verification passed."
                return 0
            else
                echo_error "Checksum verification failed!"
                exit 1
            fi
        fi
    fi

    echo_warn "Could not verify checksum (continuing anyway)."
}

# Extract and install
install_zig() {
    echo_info "Extracting archive..."

    tar -xf "${ZIG_ARCHIVE}"

    # Move to installation directory
    rm -rf "${INSTALL_DIR}"/*
    mv "zig-${ZIG_PLATFORM}-${ZIG_VERSION}"/* "${INSTALL_DIR}/"

    # Create symlink in bin directory
    ln -sf "${INSTALL_DIR}/zig" "${BIN_DIR}/zig"

    echo_info "Installed to ${INSTALL_DIR}"
}

# Update PATH configuration
configure_path() {
    echo_info "Configuring PATH..."

    # Check if PATH already includes bin directory
    if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
        # Add to .bashrc if it exists
        if [ -f "${HOME}/.bashrc" ]; then
            echo "" >> "${HOME}/.bashrc"
            echo "# Zig compiler (added by CompSci Math Agent)" >> "${HOME}/.bashrc"
            echo "export PATH=\"${BIN_DIR}:\$PATH\"" >> "${HOME}/.bashrc"
            echo_info "Added ${BIN_DIR} to ~/.bashrc"
        fi

        # Add to .profile if it exists
        if [ -f "${HOME}/.profile" ]; then
            echo "" >> "${HOME}/.profile"
            echo "# Zig compiler (added by CompSci Math Agent)" >> "${HOME}/.profile"
            echo "export PATH=\"${BIN_DIR}:\$PATH\"" >> "${HOME}/.profile"
        fi

        # Export for current session
        export PATH="${BIN_DIR}:$PATH"
    fi
}

# Verify installation
verify_installation() {
    echo_info "Verifying installation..."

    if ! "${BIN_DIR}/zig" version > /dev/null 2>&1; then
        echo_error "Installation verification failed."
        exit 1
    fi

    INSTALLED_VERSION=$("${BIN_DIR}/zig" version)
    echo_info "Zig ${INSTALLED_VERSION} installed successfully."
}

# Compile the math modules
compile_modules() {
    echo_info "Compiling math modules..."

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"

    # Check for Zig source files in zig/ subdirectory
    ZIG_SOURCES=("proofs" "structures" "counting" "probability" "recurrences")
    ZIG_DIR="${PROJECT_DIR}/zig"
    BUILD_DIR="${PROJECT_DIR}/tools/zig_build"

    mkdir -p "${BUILD_DIR}"

    for module in "${ZIG_SOURCES[@]}"; do
        SOURCE_FILE="${ZIG_DIR}/${module}.zig"

        if [ -f "${SOURCE_FILE}" ]; then
            echo_info "  Compiling ${module}..."
            if "${BIN_DIR}/zig" build-exe "${SOURCE_FILE}" -femit-bin="${BUILD_DIR}/${module}" -OReleaseFast 2>/dev/null; then
                echo_info "  ✓ ${module} compiled"
            else
                echo_warn "  ✗ ${module} compilation failed (may need source modifications for JSON interface)"
            fi
        else
            echo_warn "  - ${module}.zig not found, skipping"
        fi
    done
}

# Print summary
print_summary() {
    echo ""
    echo "=============================================="
    echo "Zig Installation Complete"
    echo "=============================================="
    echo "Version:  ${ZIG_VERSION}"
    echo "Location: ${INSTALL_DIR}"
    echo "Binary:   ${BIN_DIR}/zig"
    echo ""
    echo "To use in current session:"
    echo "  export PATH=\"${BIN_DIR}:\$PATH\""
    echo ""
    echo "To verify:"
    echo "  zig version"
    echo "=============================================="
}

# Main execution
main() {
    echo "=============================================="
    echo "CompSci Math Agent - Zig Installer"
    echo "=============================================="
    echo ""

    check_existing_installation
    test_network
    setup_directories
    download_zig
    verify_download
    install_zig
    configure_path
    verify_installation
    compile_modules
    print_summary
}

main "$@"

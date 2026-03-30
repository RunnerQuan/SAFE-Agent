#!/bin/bash
# =============================================================================
# Cyber Language Installation Script for CompSci Math Agent
# =============================================================================
# This script downloads and installs the Cyber interpreter for use with the
# mathematical tools in this skill package.
#
# Prerequisites:
#   - Network access to GitHub (must be in Claude Code allowlist)
#   - curl and tar/unzip utilities
#   - Write access to ~/.local/
#
# Usage:
#   ./scripts/install_cyber.sh [version]
#
# Arguments:
#   version   Cyber version to install (default: latest)
#
# =============================================================================

set -euo pipefail

# Configuration
CYBER_VERSION="${1:-latest}"
CYBER_REPO="nickolaev/cyber"
INSTALL_DIR="${HOME}/.local/cyber"
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

# Detect platform
detect_platform() {
    case "$(uname -s)" in
        Linux*)     PLATFORM="linux";;
        Darwin*)    PLATFORM="macos";;
        MINGW*|MSYS*|CYGWIN*) PLATFORM="windows";;
        *)          PLATFORM="unknown";;
    esac

    case "$(uname -m)" in
        x86_64|amd64)   ARCH="x86_64";;
        aarch64|arm64)  ARCH="aarch64";;
        *)              ARCH="unknown";;
    esac

    echo_info "Detected platform: ${PLATFORM}-${ARCH}"
}

# Check if Cyber is already installed
check_existing_installation() {
    if command -v cyber &> /dev/null; then
        EXISTING_VERSION=$(cyber --version 2>/dev/null || echo "unknown")
        echo_info "Cyber is already installed: version ${EXISTING_VERSION}"

        if [ "${CYBER_VERSION}" = "latest" ] || [ "${EXISTING_VERSION}" = "${CYBER_VERSION}" ]; then
            echo_info "Cyber appears up to date."
            read -p "Do you want to reinstall? [y/N] " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 0
            fi
        fi
    fi
}

# Test network connectivity to GitHub
test_network() {
    echo_info "Testing network connectivity to GitHub..."

    if ! curl -s --head --connect-timeout 5 "https://github.com" > /dev/null 2>&1; then
        echo_error "Cannot connect to GitHub"
        echo_error "If running in Claude Code, ensure github.com is in your network allowlist."
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

# Get the download URL for the latest release
get_download_url() {
    echo_info "Fetching latest release information..."

    if [ "${CYBER_VERSION}" = "latest" ]; then
        RELEASE_URL="https://api.github.com/repos/${CYBER_REPO}/releases/latest"
    else
        RELEASE_URL="https://api.github.com/repos/${CYBER_REPO}/releases/tags/v${CYBER_VERSION}"
    fi

    # Determine the asset name based on platform
    if [ "${PLATFORM}" = "linux" ]; then
        ASSET_PATTERN="cyber-linux"
    elif [ "${PLATFORM}" = "macos" ]; then
        ASSET_PATTERN="cyber-macos"
    elif [ "${PLATFORM}" = "windows" ]; then
        ASSET_PATTERN="cyber-windows"
    else
        echo_error "Unsupported platform: ${PLATFORM}"
        exit 1
    fi

    # Fetch release data
    RELEASE_DATA=$(curl -sL "${RELEASE_URL}")

    # Extract download URL for the matching asset
    DOWNLOAD_URL=$(echo "${RELEASE_DATA}" | grep -o "\"browser_download_url\": \"[^\"]*${ASSET_PATTERN}[^\"]*\"" | head -1 | cut -d'"' -f4)

    if [ -z "${DOWNLOAD_URL}" ]; then
        echo_warn "Could not find pre-built binary for ${PLATFORM}-${ARCH}"
        echo_info "Falling back to source installation..."
        install_from_source
        return 1
    fi

    echo_info "Download URL: ${DOWNLOAD_URL}"
}

# Download Cyber binary
download_cyber() {
    echo_info "Downloading Cyber..."

    TEMP_DIR=$(mktemp -d)
    trap "rm -rf ${TEMP_DIR}" EXIT

    cd "${TEMP_DIR}"

    FILENAME=$(basename "${DOWNLOAD_URL}")

    if ! curl -L --progress-bar -o "${FILENAME}" "${DOWNLOAD_URL}"; then
        echo_error "Download failed. Check your network connection."
        exit 1
    fi

    echo_info "Download complete: ${FILENAME}"

    # Extract if archive, otherwise just move
    if [[ "${FILENAME}" == *.tar.gz ]]; then
        tar -xzf "${FILENAME}"
    elif [[ "${FILENAME}" == *.zip ]]; then
        unzip -q "${FILENAME}"
    fi

    # Find and install the binary
    CYBER_BIN=$(find . -name "cyber" -o -name "cyber.exe" | head -1)

    if [ -n "${CYBER_BIN}" ]; then
        chmod +x "${CYBER_BIN}"
        mv "${CYBER_BIN}" "${BIN_DIR}/cyber"
    else
        echo_error "Could not find cyber binary in archive"
        exit 1
    fi
}

# Install from source as fallback
install_from_source() {
    echo_info "Installing Cyber from source..."

    TEMP_DIR=$(mktemp -d)
    trap "rm -rf ${TEMP_DIR}" EXIT

    cd "${TEMP_DIR}"

    # Clone the repository
    if ! git clone --depth 1 "https://github.com/${CYBER_REPO}.git" cyber-src 2>/dev/null; then
        echo_error "Failed to clone Cyber repository"
        echo_error "Ensure git is installed and github.com is accessible"
        exit 1
    fi

    cd cyber-src

    # Check for build dependencies
    if command -v zig &> /dev/null; then
        echo_info "Building with Zig..."
        zig build -Doptimize=ReleaseFast
        cp zig-out/bin/cyber "${BIN_DIR}/cyber"
    elif command -v cargo &> /dev/null; then
        echo_info "Building with Cargo..."
        cargo build --release
        cp target/release/cyber "${BIN_DIR}/cyber"
    else
        echo_error "No suitable build tool found (need Zig or Rust/Cargo)"
        exit 1
    fi
}

# Update PATH configuration
configure_path() {
    echo_info "Configuring PATH..."

    # Check if PATH already includes bin directory
    if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
        # Add to .bashrc if it exists
        if [ -f "${HOME}/.bashrc" ]; then
            echo "" >> "${HOME}/.bashrc"
            echo "# Cyber interpreter (added by CompSci Math Agent)" >> "${HOME}/.bashrc"
            echo "export PATH=\"${BIN_DIR}:\$PATH\"" >> "${HOME}/.bashrc"
            echo_info "Added ${BIN_DIR} to ~/.bashrc"
        fi

        # Add to .zshrc if it exists
        if [ -f "${HOME}/.zshrc" ]; then
            echo "" >> "${HOME}/.zshrc"
            echo "# Cyber interpreter (added by CompSci Math Agent)" >> "${HOME}/.zshrc"
            echo "export PATH=\"${BIN_DIR}:\$PATH\"" >> "${HOME}/.zshrc"
        fi

        # Add to .profile if it exists
        if [ -f "${HOME}/.profile" ]; then
            echo "" >> "${HOME}/.profile"
            echo "# Cyber interpreter (added by CompSci Math Agent)" >> "${HOME}/.profile"
            echo "export PATH=\"${BIN_DIR}:\$PATH\"" >> "${HOME}/.profile"
        fi

        # Export for current session
        export PATH="${BIN_DIR}:$PATH"
    fi
}

# Verify installation
verify_installation() {
    echo_info "Verifying installation..."

    if ! "${BIN_DIR}/cyber" --version > /dev/null 2>&1; then
        # Try without --version flag
        if ! "${BIN_DIR}/cyber" --help > /dev/null 2>&1; then
            echo_error "Installation verification failed."
            exit 1
        fi
    fi

    INSTALLED_VERSION=$("${BIN_DIR}/cyber" --version 2>/dev/null || echo "installed")
    echo_info "Cyber ${INSTALLED_VERSION} installed successfully."
}

# Test running a Cyber module
test_modules() {
    echo_info "Testing Cyber modules..."

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
    CYBER_DIR="${PROJECT_DIR}/cyber"

    if [ -d "${CYBER_DIR}" ]; then
        for module in proofs structures counting probability recurrences; do
            SOURCE_FILE="${CYBER_DIR}/${module}.cy"

            if [ -f "${SOURCE_FILE}" ]; then
                echo_info "  Testing ${module}.cy..."
                if timeout 10 "${BIN_DIR}/cyber" "${SOURCE_FILE}" > /dev/null 2>&1; then
                    echo_info "  ✓ ${module}.cy runs successfully"
                else
                    echo_warn "  ✗ ${module}.cy failed (syntax or runtime error)"
                fi
            else
                echo_warn "  - ${module}.cy not found"
            fi
        done
    else
        echo_warn "Cyber modules directory not found: ${CYBER_DIR}"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "=============================================="
    echo "Cyber Installation Complete"
    echo "=============================================="
    echo "Location: ${BIN_DIR}/cyber"
    echo ""
    echo "To use in current session:"
    echo "  export PATH=\"${BIN_DIR}:\$PATH\""
    echo ""
    echo "To verify:"
    echo "  cyber --version"
    echo ""
    echo "To run a Cyber script:"
    echo "  cyber path/to/script.cy"
    echo "=============================================="
}

# Main execution
main() {
    echo "=============================================="
    echo "CompSci Math Agent - Cyber Installer"
    echo "=============================================="
    echo ""

    detect_platform
    check_existing_installation
    test_network
    setup_directories

    if get_download_url; then
        download_cyber
    fi

    configure_path
    verify_installation
    test_modules
    print_summary
}

main "$@"

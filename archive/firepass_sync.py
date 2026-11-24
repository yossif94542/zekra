import os
import sys
import time
import json
import urllib.request
import urllib.error

# Force stdout to use UTF-8 to prevent UnicodeEncodeError in Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Enable virtual terminal processing in Windows Command Prompt for ANSI colors
os.system('')

# COLOR CODES
C_RESET = "\033[0m"
C_GREEN = "\033[92m"
C_CYAN = "\033[96m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_GOLD = "\033[38;5;220m"
C_MAGENTA = "\033[95m"

# CONFIGURATION
DB_URL = "https://zekra-9454-default-rtdb.europe-west1.firebasedatabase.app/users.json"
BASE_SYNC_DIR = r"C:\Users\11\Desktop\Firepass"
POLL_INTERVAL = 5  # seconds

def log_info(msg):
    print(f"{C_CYAN}[INFO] {msg}{C_RESET}")

def log_success(msg):
    print(f"{C_GREEN}[SUCCESS] {msg}{C_RESET}")

def log_warning(msg):
    print(f"{C_YELLOW}[WARNING] {msg}{C_RESET}")

def log_error(msg):
    print(f"{C_RED}[ERROR] {msg}{C_RESET}")

def print_banner():
    banner = f"""
{C_GOLD}================================================================
  🛡️  ZEKRA: FIREPASS AUTOMATIC FOLDER SYNCHRONIZER v1.0  🛡️
================================================================{C_RESET}
{C_CYAN}  Monitoring Database : {C_RESET}{DB_URL}
{C_CYAN}  Local Sync Directory: {C_RESET}{BASE_SYNC_DIR}
{C_CYAN}  Poll Rate           : {C_RESET}Every {POLL_INTERVAL} seconds
{C_GOLD}----------------------------------------------------------------{C_RESET}
    """
    print(banner)

def get_database_users():
    try:
        req = urllib.request.Request(
            DB_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.URLError as e:
        log_error(f"Network error connecting to Firebase: {e.reason}")
    except json.JSONDecodeError:
        log_error("Failed to parse database response as JSON.")
    except Exception as e:
        log_error(f"Unexpected database retrieval error: {e}")
    return None

def sync_folders():
    # Ensure the base directory exists
    if not os.path.exists(BASE_SYNC_DIR):
        try:
            os.makedirs(BASE_SYNC_DIR)
            log_success(f"Initialized base Firepass directory: {BASE_SYNC_DIR}")
        except Exception as e:
            log_error(f"Failed to create base directory {BASE_SYNC_DIR}: {e}")
            return

    db_data = get_database_users()
    if not db_data:
        return

    # Scan for folders/users in the database
    for key, value in db_data.items():
        # Exclude internal metadata nodes and only look for actual client folder nodes
        if not isinstance(value, dict) or 'u' not in value:
            continue
        
        folder_name = value.get('u')
        if not folder_name:
            continue
        
        # Sanitize folder name for filesystem safety
        safe_folder_name = "".join(c for c in folder_name if c.isalnum() or c in (' ', '_', '-')).strip()
        if not safe_folder_name:
            continue

        folder_path = os.path.join(BASE_SYNC_DIR, safe_folder_name)
        
        # Check if the folder already exists
        if not os.path.exists(folder_path):
            log_warning(f"New folder detected in Admin DB: {C_GOLD}{safe_folder_name}{C_RESET}")
            try:
                os.makedirs(folder_path)
                log_success(f"Created folder: {C_CYAN}{folder_path}{C_RESET}")
                
                # Fetch partner names from dualAuth or settings for subdirectories
                settings = value.get('settings', {})
                dual_auth = settings.get('dualAuth', {})
                
                partner_a = dual_auth.get('a_u') or settings.get('partnerA') or "Partner A"
                partner_b = dual_auth.get('b_u') or settings.get('partnerB') or "Partner B"
                
                # Sanitize partner names
                safe_partner_a = "".join(c for c in partner_a if c.isalnum() or c in (' ', '_', '-')).strip()
                safe_partner_b = "".join(c for c in partner_b if c.isalnum() or c in (' ', '_', '-')).strip()
                
                # Create partner subdirectories
                path_a = os.path.join(folder_path, f"Partner_A_{safe_partner_a}")
                path_b = os.path.join(folder_path, f"Partner_B_{safe_partner_b}")
                
                os.makedirs(path_a, exist_ok=True)
                os.makedirs(path_b, exist_ok=True)
                
                log_success(f"  └─ Generated subdirectory: {C_MAGENTA}{path_a}{C_RESET}")
                log_success(f"  └─ Generated subdirectory: {C_MAGENTA}{path_b}{C_RESET}")
                
            except Exception as e:
                log_error(f"Failed to create folder structure for {safe_folder_name}: {e}")

def main():
    print_banner()
    log_info("Starting real-time synchronization loop...")
    log_info("Press Ctrl+C to stop the synchronizer at any time.\n")
    
    # Run initial sync
    log_info("Performing initial scan...")
    sync_folders()
    log_success("Initial scan completed successfully. Now monitoring...")
    print(f"{C_GOLD}----------------------------------------------------------------{C_RESET}\n")

    # Continuous monitoring loop
    try:
        while True:
            sync_folders()
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print(f"\n{C_YELLOW}[WARNING] Synchronizer stopped by user. Goodbye!{C_RESET}")

if __name__ == "__main__":
    main()

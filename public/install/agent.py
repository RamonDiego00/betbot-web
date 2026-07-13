#!/usr/bin/env python3
import json
import os
import sys
import time
import socket
import subprocess
import urllib.request
import urllib.error
import threading
import shutil
from datetime import datetime

CONFIG_FILE = "config.json"

def get_adb_path():
    # 1. Verifica se adb está globalmente disponível no PATH
    global_adb = shutil.which("adb")
    if global_adb:
        return global_adb
    
    # 2. Caminhos comuns por plataforma
    common_paths = [
        # macOS (Homebrew Apple Silicon)
        "/opt/homebrew/bin/adb",
        # macOS (Homebrew Intel)
        "/usr/local/bin/adb",
        # macOS (Android SDK padrão)
        os.path.expanduser("~/Library/Android/sdk/platform-tools/adb"),
        # Windows (Instalador betbot)
        "C:\\betbot\\bin\\platform-tools\\adb.exe",
        "C:\\betbot\\platform-tools\\adb.exe",
    ]
    for path in common_paths:
        if os.path.exists(path):
            return path
            
    # Fallback pro nome simples
    return "adb"

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_adb_device_model():
    try:
        adb_cmd = get_adb_path()
        res = subprocess.run([adb_cmd, "shell", "getprop", "ro.product.model"], capture_output=True, text=True, timeout=3)
        if res.returncode == 0:
            return res.stdout.strip()
    except Exception:
        pass
    return "Celular Android"

def get_battery_level():
    try:
        adb_cmd = get_adb_path()
        res = subprocess.run([adb_cmd, "shell", "dumpsys", "battery"], capture_output=True, text=True, timeout=3)
        for line in res.stdout.splitlines():
            if "level:" in line:
                return int(line.split(":")[1].strip())
    except Exception:
        pass
    return 100

class Agent:
    def __init__(self):
        self.load_config()
        self.running = True
        self.last_run_date = None

    def load_config(self):
        if not os.path.exists(CONFIG_FILE):
            self.config = {
                "token": "",
                "api_url": "http://localhost:8080",
                "credentials_path": ".env",
                "device_id": ""
            }
            self.save_config()
        else:
            try:
                with open(CONFIG_FILE, encoding="utf-8") as f:
                    self.config = json.load(f)
            except Exception:
                self.config = {
                    "token": "",
                    "api_url": "http://localhost:8080",
                    "credentials_path": ".env",
                    "device_id": ""
                }

    def save_config(self):
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.config, f, indent=4)
        except Exception as e:
            print(f"Erro ao salvar config.json: {e}")

    def make_api_request(self, path, method="GET", data=None):
        url = f"{self.config['api_url'].rstrip('/')}{path}"
        headers = {
            "Authorization": f"Device {self.config['token']}",
            "Content-Type": "application/json"
        }
        
        req_data = None
        if data is not None:
            req_data = json.dumps(data).encode("utf-8")

        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read().decode("utf-8")
                if response.headers.get("Content-Type", "").startswith("application/json") and content:
                    return json.loads(content)
                return content
        except urllib.error.HTTPError as e:
            print(f"Erro HTTP em {path}: {e.code} - {e.reason}")
            try:
                print(e.read().decode("utf-8"))
            except Exception:
                pass
        except Exception as e:
            print(f"Falha na conexao com a API {url}: {e}")
        return None

    def send_heartbeat(self):
        while self.running:
            if not self.config["token"]:
                print("Aguardando token de dispositivo ser configurado...")
                time.sleep(10)
                continue

            ip = get_local_ip()
            model = get_adb_device_model()
            battery = get_battery_level()
            
            telemetry = {
                "deviceInfo": f"Modelo: {model} | Bateria: {battery}% | IP: {ip}"
            }
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Enviando heartbeat: {telemetry['deviceInfo']}")
            self.make_api_request("/api/v1/worker/heartbeat", method="POST", data=telemetry)
            time.sleep(60)

    def load_local_credentials(self):
        credentials = {}
        path = self.config.get("credentials_path", ".env")
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            credentials[k.strip()] = v.strip()
            except Exception as e:
                print(f"Erro ao ler arquivo de credenciais: {e}")
        return credentials

    def log_to_api(self, log_type, message, job_id="daily-job"):
        print(f"[{log_type}] {message}")
        self.make_api_request("/api/v1/worker/logs", method="POST", data={
            "logType": log_type,
            "message": message,
            "jobId": job_id
        })

    def run_maestro(self, yaml_content):
        flow_file = "daily-flow.yaml"
        with open(flow_file, "w", encoding="utf-8") as f:
            f.write(yaml_content)

        self.log_to_api("INFO", "Iniciando execucao do Maestro...")
        credentials = self.load_local_credentials()
        
        e_args = []
        for k, v in credentials.items():
            e_args += ["-e", f"{k}={v}"]

        adb_cmd = get_adb_path()
        subprocess.run(["pkill", "-f", "maestro.cli.AppKt"], check=False, capture_output=True)
        subprocess.run([adb_cmd, "shell", "am", "force-stop", "dev.mobile.maestro"], check=False, capture_output=True)
        time.sleep(2)

        cmd = ["maestro", "test"] + e_args
        if self.config.get("device_id"):
            cmd += ["--device", self.config["device_id"]]
        cmd += [flow_file]

        self.log_to_api("INFO", f"Comando: {' '.join(['maestro', 'test', '...'] + [flow_file])}")
        
        try:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
            for line in process.stdout:
                line_str = line.strip()
                if line_str:
                    log_type = "INFO"
                    if "error" in line_str.lower() or "fail" in line_str.lower():
                        log_type = "ERROR"
                    elif "debug" in line_str.lower():
                        log_type = "DEBUG"
                    self.log_to_api(log_type, line_str)
            
            process.wait()
            if process.returncode == 0:
                self.log_to_api("INFO", "Automação do Maestro concluída com SUCESSO!")
            else:
                self.log_to_api("ERROR", f"Automação do Maestro falhou com exit code: {process.returncode}")
        except FileNotFoundError:
            self.log_to_api("ERROR", "Comando 'maestro' nao encontrado no PATH local.")
        except Exception as e:
            self.log_to_api("ERROR", f"Falha na execução do subprocesso do Maestro: {e}")

        if os.path.exists(flow_file):
            try:
                os.remove(flow_file)
            except Exception:
                pass

    def upload_frame(self, frame_bytes):
        url = f"{self.config['api_url'].rstrip('/')}/api/v1/worker/screen-frame"
        headers = {
            "Authorization": f"Device {self.config['token']}",
            "Content-Type": "application/octet-stream"
        }
        req = urllib.request.Request(url, data=frame_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                response.read()
        except Exception:
            pass

    def screen_mirror_loop(self):
        adb_cmd = get_adb_path()
        while self.running:
            if not self.config["token"]:
                time.sleep(5)
                continue
            
            try:
                res = subprocess.run([adb_cmd, "exec-out", "screencap", "-p"], capture_output=True, timeout=5)
                if res.returncode == 0 and res.stdout:
                    self.upload_frame(res.stdout)
            except Exception:
                pass
            
            time.sleep(2)

    def start(self):
        print("Starting BetBot Local Agent...")
        self.load_config()

        heartbeat_thread = threading.Thread(target=self.send_heartbeat, daemon=True)
        heartbeat_thread.start()

        mirror_thread = threading.Thread(target=self.screen_mirror_loop, daemon=True)
        mirror_thread.start()

        while self.running:
            self.load_config()
            if not self.config["token"]:
                time.sleep(5)
                continue

            schedule = self.make_api_request("/api/v1/worker/schedule")
            if schedule and schedule.get("scheduleEnabled"):
                schedule_time_str = schedule.get("scheduleTime", "06:00")
                now = datetime.now()
                current_time_str = now.strftime("%H:%M")
                current_date = now.date()

                if current_time_str == schedule_time_str and self.last_run_date != current_date:
                    print(f"Horario atingido ({schedule_time_str})! Solicitando fluxo YAML...")
                    yaml_content = self.make_api_request("/api/v1/worker/daily-yaml", method="POST", data={"ticketIds": []})
                    if yaml_content and isinstance(yaml_content, str) and not yaml_content.startswith("{"):
                        self.last_run_date = current_date
                        threading.Thread(target=self.run_maestro, args=(yaml_content,), daemon=True).start()
                    else:
                        print("Erro ao obter o fluxo YAML válido da API (provavelmente sem tickets pendentes hoje).")

            time.sleep(10)

if __name__ == "__main__":
    try:
        Agent().start()
    except KeyboardInterrupt:
        print("\nAgent stopped.")
        sys.exit(0)

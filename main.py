import subprocess
import os
from threading import Lock

class Plugin:
    # Tailscaled
    def get_daemon_state(self):
        return subprocess.Popen(f"systemctl is-active tailscaled.service", stdout=subprocess.PIPE, shell=True).communicate()[0] == b'active\n'

    def set_daemon_state(self, state):
        if state:
            subprocess.Popen(f"systemctl start tailscaled.service", stdout=subprocess.PIPE, shell=True).wait()
        else:
            subprocess.Popen(f"systemctl stop tailscaled.service", stdout=subprocess.PIPE, shell=True).wait()
        return self.get_daemon_state(self)

    # Handle up and down

    async def get_tailscale_state(self):
        if not self.get_daemon_state(self):
            return False
        output = subprocess.Popen(f"tailscale status", stdout=subprocess.PIPE, shell=True).communicate()[0]
        print(output)
        return output != b'# Health check:\n#     - state=Stopped, wantRunning=false\n\nTailscale is stopped.\n'

    async def set_tailscale_state(self, state):
        if state:
            if not self.set_daemon_state(self, True):
                return False

            try:
                ret = subprocess.run(["tailscale up --operator=deck --ssh"], capture_output=True, shell=True, timeout=5)

                if ret.returncode != 0:
                    return "Failed to up tailscale"
            except subprocess.TimeoutExpired:
                return "Failed to launch tailscale. Make sure to authenticate using the configurator first." + str(ret.stdout)
        else:
            try:
                subprocess.run(["tailscale down"], capture_output=True, shell=True, timeout=5)
                if not await self.get_web_auth_state(self):
                    self.set_daemon_state(self, False)
            except:
                pass

        return await self.get_tailscale_state(self)

    # TODO: error messaging
    async def tailscale_logout(self):
        if await self.set_tailscale_state(self, False):
            return False

        if not self.set_daemon_state(self, True):
            return False

        try:
            ret = subprocess.run(["tailscale logout"], capture_output=True, shell=True, timeout=5)

            if ret.returncode != 0:
                return "Failed log out"
        except subprocess.TimeoutExpired:
            return "An error has occurred: " + str(ret.stdout)
        
        return "Logged out!"

    # Web service
    async def get_web_auth_state(self):
        if not self.get_daemon_state(self):
            return False
        if hasattr(self, 'tailscale_web'):
            return self.tailscale_web != None
        return False

    async def set_web_auth_state(self, state):
        if state:
            if not self.set_daemon_state(self, True):
                return False

            with self.lock:
                self.tailscale_web = subprocess.Popen(['tailscale web'], shell=True)

                if self.tailscale_web.poll() == None:
                    return True
                else:
                    self.tailscale_web = None
                    return False
        else:
            with self.lock:
                self.tailscale_web.terminate()
                self.tailscale_web = None
            if not await self.get_tailscale_state(self):
                self.set_daemon_state(self, False)
            return False

    # A normal method. It can be called from JavaScript using call_plugin_function("method_1", argument1, argument2)
    async def install(self):
        ret = subprocess.run(["bash ../plugins/steamdeck-tailscale-temp/assets/install.sh"], shell=True, capture_output=True)
        if ret.returncode != 0:
            print(ret)
            return str(ret)

        ret = subprocess.run(["systemd-sysext refresh"], shell=True)
        if ret.returncode != 0:
            return "Failed to refresh system extensions."

        return "Successfully installed."

    async def get_ip(self):
        if not await self.get_tailscale_state(self):
            return "Not connected."

        try:
            ret = subprocess.run(["tailscale ip -4"], capture_output=True, shell=True, timeout=1)
            if ret.returncode != 0:
                return "Not connected."
        except subprocess.TimeoutExpired:
            return "Not connected."
        return ret.stdout.decode()

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.tailscaleWeb = None
        self.lock = Lock()

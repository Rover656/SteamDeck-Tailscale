import {
  ButtonItem,
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField,
  Router
} from "decky-frontend-lib";
import React from "react";
import { useState, VFC } from "react";
import { FaNetworkWired } from "react-icons/fa";

function resolvePromise(promise: Promise<any>, callback: any) {
  (async function () {
    let data = await promise;
    // if (data.success)
    callback(data.result);
  })();
}

interface StateArgs {
  state: boolean,
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [configMessage, setConfigMessage] = useState<string | undefined>();

  const [tailscaleToggle, setTailscaleToggle] = useState<boolean>(false);
  const [webAuthToggle, setWebAuthToggle] = useState<boolean>(false);
  const [ownIp, setOwnIp] = useState<string>("Not connected.");

  resolvePromise(serverAPI.callPluginMethod<{}, boolean>("get_tailscale_state", {}), setTailscaleToggle);
  resolvePromise(serverAPI.callPluginMethod<{}, boolean>("get_web_auth_state", {}), setWebAuthToggle);
  resolvePromise(serverAPI.callPluginMethod<{}, string>("get_ip", {}), setOwnIp);

  // TODO: Error messaging for auth...
  return (
    <React.Fragment>
      <PanelSection title="Connection">
        <PanelSectionRow>
          {ownIp}

          <ToggleField
            label="Enable"
            description="Connects your steamdeck to your other tailscale devices."
            checked={tailscaleToggle}
            onChange={async (value: boolean) => {
              setTailscaleToggle(value);
              serverAPI.callPluginMethod<StateArgs, boolean>("set_tailscale_state", { state: value })
            }}
          />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Install and Configuration">
        To perform setup, first hit Install/Update, then enable the config interface and setup in there.

        <PanelSectionRow>
          {configMessage}
          <ButtonItem
            layout="below"
            onClick={async () => {
              setConfigMessage("Installing, please wait...");
              const result = await serverAPI.callPluginMethod<{}, string>("install", {});
              if (result.success) {
                setConfigMessage(result.result);
              } else {
                setConfigMessage("ERR: " + result.result);
              }
            }}
          >
            Install/Update
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <ToggleField
            label="Config Interface"
            description="Enables the web interface for configuring Tailscale."
            checked={webAuthToggle}
            onChange={async (value: boolean) => {
              setWebAuthToggle(value);
              serverAPI.callPluginMethod<StateArgs, boolean>("set_web_auth_state", { state: value })
            }}
          />

          {
            webAuthToggle ?
              <ButtonItem
                layout="below"
                onClick={() => {
                  Router.CloseSideMenus();
                  Router.NavigateToExternalWeb("http://localhost:8088");
                }}
              >
                Open Config
              </ButtonItem>
              : null
          }

          <ButtonItem
            layout="below"
            onClick={async () => {
              await serverAPI.callPluginMethod<{}, string>("tailscale_logout", {});
            }}
          >
            Logout of Tailscale
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </React.Fragment>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>Tailscale</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaNetworkWired />
  };
});

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
  const [tailscaleToggle, setTailscaleToggle] = useState<boolean>(false);
  const [webAuthToggle, setWebAuthToggle] = useState<boolean>(false);
  const [ownIp, setOwnIp] = useState<string>("Not connected.");
  const [installState, setInstallState] = useState<string>("Pending...");

  resolvePromise(serverAPI.callPluginMethod<{}, boolean>("get_tailscale_state", {}), setTailscaleToggle);
  resolvePromise(serverAPI.callPluginMethod<{}, boolean>("get_web_auth_state", {}), setWebAuthToggle);
  resolvePromise(serverAPI.callPluginMethod<{}, string>("get_ip", {}), setOwnIp);
  resolvePromise(serverAPI.callPluginMethod<{}, string>("get_install_state", {}), setInstallState);

  return (
    <React.Fragment>
      <PanelSection title="Connection">
        <PanelSectionRow>
          Tailscale IP: {ownIp}

          <ToggleField
            label="Enable"
            description="Connects your steamdeck to your other tailscale devices."
            checked={tailscaleToggle}
            onChange={async (value: boolean) => {
              setTailscaleToggle(value);
              serverAPI.callPluginMethod<StateArgs, string>("set_tailscale_state", { state: value })
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Configuration">
        <PanelSectionRow>
          <ToggleField
            label="Config Interface"
            description="Enables the web interface for configuring Tailscale. Disable this when you are finished."
            checked={webAuthToggle}
            onChange={async (value: boolean) => {
              setWebAuthToggle(value);
              serverAPI.callPluginMethod<StateArgs, boolean>("set_web_auth_state", { state: value })
            }}
          />


          {
            webAuthToggle ?
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  onClick={() => {
                    Router.CloseSideMenus();
                    Router.NavigateToExternalWeb("http://localhost:8088");
                  }}
                >
                  Open Config
                </ButtonItem>
              </PanelSectionRow>
              : null
          }


          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={async () => {
                await serverAPI.callPluginMethod<{}, string>("tailscale_logout", {});
              }}
            >
              Logout of Tailscale
            </ButtonItem>
          </PanelSectionRow>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Manage Installation">
        <PanelSectionRow>
          Installation state: {installState}.
        </PanelSectionRow>
        <PanelSectionRow>

          <ButtonItem
            layout="below"
            onClick={async () => {
              resolvePromise(serverAPI.callPluginMethod<{}, string>("get_install_state", {}), setInstallState);
            }}
          >
            Refresh
          </ButtonItem>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={async () => {
              setInstallState("reinstalling");
              serverAPI.callPluginMethod<{}, string>("reinstall_tailscale", {});
            }}
          >
            Reinstall/Update Tailscale
          </ButtonItem>
        </PanelSectionRow>

        {/* TODO: Advanced options to perform individual actions. */}
        {/* <PanelSectionRow>
          <ToggleField
            label="Advanced Options"
            description="Shows advanced configuration options. These can be used to resolve issues."
            checked={webAuthToggle}
            onChange={async (value: boolean) => {
              // setWebAuthToggle(value);
              // serverAPI.callPluginMethod<StateArgs, boolean>("set_web_auth_state", { state: value })
            }}
          />
        </PanelSectionRow> */}
      </PanelSection>
    </React.Fragment >
  );
};

const TailscaleLogo = () => {
  return <svg width="14" height="14" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle opacity="0.2" cx="3.4" cy="3.25" r="2.7" fill="currentColor"></circle>
    <circle cx="3.4" cy="11.3" r="2.7" fill="currentColor"></circle>
    <circle opacity="0.2" cx="3.4" cy="19.5" r="2.7" fill="currentColor"></circle>
    <circle cx="11.5" cy="11.3" r="2.7" fill="currentColor"></circle>
    <circle cx="11.5" cy="19.5" r="2.7" fill="currentColor"></circle>
    <circle opacity="0.2" cx="11.5" cy="3.25" r="2.7" fill="currentColor"></circle>
    <circle opacity="0.2" cx="19.5" cy="3.25" r="2.7" fill="currentColor"></circle>
    <circle cx="19.5" cy="11.3" r="2.7" fill="currentColor"></circle>
    <circle opacity="0.2" cx="19.5" cy="19.5" r="2.7" fill="currentColor"></circle>
  </svg>;
}

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>Tailscale</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <TailscaleLogo />
  };
});

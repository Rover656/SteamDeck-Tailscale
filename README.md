# Tailscale Unofficial Steam Deck Plugin

# ***This is not reaady for use yet, I will use GitHub releases once it is ready***

A plugin for [decky-loader](https://github.com/SteamDeckHomebrew/decky-loader) to automate the installation and setup of Tailscale.

This is heavily inspired by the [blog post](https://tailscale.com/blog/steam-deck/) that Tailscale published on July 18th 2020.

This is an unofficial solution to bring Tailscale to the Steam Deck. It will be discontinued if/when an official solution emerges, I just built this for myself then discovered there are a number of people trying to do this.

This is still in early development, expect random problems and for things to just break.

## How to use

### Install the Plugin Loader

Follow the instructions for [decky-loader](https://github.com/SteamDeckHomebrew/decky-loader) if you haven't got decky installed already.

### Install the plugin
This plugin is not currently on the plugin store, so you must download, clone and publish it using Decky's vscode tools.

### Using the plugin
When the plugin is loaded (on start of the deck, on install etc.) tailscale will be installed.

You then need to go into the Tailscale plugin menu and enable the Config UI, then visit it. Use this to log into Tailscale and select your network.

Finally check the Enable toggle switch to enable Tailscale.
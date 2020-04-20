package com.cynovan.janus.addons.monitor.guacamole.config.rdp;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleRDPPerformanceFlags extends GuacamoleConfig {

    /**
     * enable rendering of desktop wallpaper, disabled by default
     */
    private Boolean enable_wallpaper = false;

    /**
     * disabled by default
     */
    private Boolean enable_theming = false;

    /**
     * if set to true, text will be rendered with smooth edges, disabled by default
     */
    private Boolean enable_font_smoothing = false;

    /**
     * if true, the contents of windows will be displayed as windows are moved, disabled by default
     */
    private Boolean enable_full_window_drag = false;

    /**
     * if true, graphic effects will be allowed, disabled by default
     */
    private Boolean enable_desktop_composition = false;

    /**
     * if true, menu open and close animations will be allowed, disabled by default
     */
    private Boolean enable_menu_animations = false;

    public Boolean getEnable_wallpaper() {
        return enable_wallpaper;
    }

    public void setEnable_wallpaper(Boolean enable_wallpaper) {
        this.enable_wallpaper = enable_wallpaper;
    }

    public Boolean getEnable_theming() {
        return enable_theming;
    }

    public void setEnable_theming(Boolean enable_theming) {
        this.enable_theming = enable_theming;
    }

    public Boolean getEnable_font_smoothing() {
        return enable_font_smoothing;
    }

    public void setEnable_font_smoothing(Boolean enable_font_smoothing) {
        this.enable_font_smoothing = enable_font_smoothing;
    }

    public Boolean getEnable_full_window_drag() {
        return enable_full_window_drag;
    }

    public void setEnable_full_window_drag(Boolean enable_full_window_drag) {
        this.enable_full_window_drag = enable_full_window_drag;
    }

    public Boolean getEnable_desktop_composition() {
        return enable_desktop_composition;
    }

    public void setEnable_desktop_composition(Boolean enable_desktop_composition) {
        this.enable_desktop_composition = enable_desktop_composition;
    }

    public Boolean getEnable_menu_animations() {
        return enable_menu_animations;
    }

    public void setEnable_menu_animations(Boolean enable_menu_animations) {
        this.enable_menu_animations = enable_menu_animations;
    }
}

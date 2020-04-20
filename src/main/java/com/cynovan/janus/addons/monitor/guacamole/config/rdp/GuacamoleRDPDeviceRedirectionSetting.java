package com.cynovan.janus.addons.monitor.guacamole.config.rdp;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleRDPDeviceRedirectionSetting extends GuacamoleConfig {

    /**
     * default enable
     */
    private Boolean disable_audio;

    /**
     * default disable
     */
    private Boolean enable_printing;

    /**
     * default disabled
     */
    private Boolean enable_drive;

    /**
     * the directory on the guacamole server in which transferred files should be stored
     */
    private Boolean drive_path;

    /**
     * if true and enable-device, will automatically create this path if not yet exists
     */
    private Boolean crate_drive_path;

    /**
     * enable console audio if console=true
     */
    private Boolean console_audio;

    /**
     * a comma-separated list of static channel names to open and expose as pipes
     */
    private Boolean static_chanels;

    public Boolean getDisable_audio() {
        return disable_audio;
    }

    public void setDisable_audio(Boolean disable_audio) {
        this.disable_audio = disable_audio;
    }

    public Boolean getEnable_printing() {
        return enable_printing;
    }

    public void setEnable_printing(Boolean enable_printing) {
        this.enable_printing = enable_printing;
    }

    public Boolean getEnable_drive() {
        return enable_drive;
    }

    public void setEnable_drive(Boolean enable_drive) {
        this.enable_drive = enable_drive;
    }

    public Boolean getDrive_path() {
        return drive_path;
    }

    public void setDrive_path(Boolean drive_path) {
        this.drive_path = drive_path;
    }

    public Boolean getCrate_drive_path() {
        return crate_drive_path;
    }

    public void setCrate_drive_path(Boolean crate_drive_path) {
        this.crate_drive_path = crate_drive_path;
    }

    public Boolean getConsole_audio() {
        return console_audio;
    }

    public void setConsole_audio(Boolean console_audio) {
        this.console_audio = console_audio;
    }

    public Boolean getStatic_chanels() {
        return static_chanels;
    }

    public void setStatic_chanels(Boolean static_chanels) {
        this.static_chanels = static_chanels;
    }
}

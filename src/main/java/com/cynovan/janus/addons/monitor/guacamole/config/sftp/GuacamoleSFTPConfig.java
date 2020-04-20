package com.cynovan.janus.addons.monitor.guacamole.config.sftp;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleSFTPConfig extends GuacamoleConfig {

    /**
     * Whether file trarnsfer should be enabled
     */
    private Boolean enable_sftp = false;

    /**
     * The hostname or IP addreses of the server hosting SFTP.
     */
    private String sftp_hostname;

    /**
     * The port the SSH server providing SFTP is listening on, usually 22. Default 22;
     */
    private Integer sftp_port = 22;

    /**
     * The username to authenticate as when connection to the specified SSH server for SFTP
     */
    private String sftp_username;

    /**
     * The password use when anthenticating with specified SSH server for SFTP
     */
    private String sftp_password;

    /**
     * The entire contents of the private key to use for public key anthentication. Open SSH format
     */
    private String sftp_private_key;

    /**
     * The passphrase to use to decrupt the private key for use in public key anthentication
     */
    private String sftp_passphrase;

    /**
     * The directory to upload files to if they are simply dragged and dropped, and thus otherwise lack a specific upload location.
     * If omitted, the default upload location of the SSH server providing SFTP will be used
     */
    private String sftp_directory;


    public Boolean getEnable_sftp() {
        return enable_sftp;
    }

    public void setEnable_sftp(Boolean enable_sftp) {
        this.enable_sftp = enable_sftp;
    }

    public String getSftp_hostname() {
        return sftp_hostname;
    }

    public void setSftp_hostname(String sftp_hostname) {
        this.sftp_hostname = sftp_hostname;
    }

    public Integer getSftp_port() {
        return sftp_port;
    }

    public void setSftp_port(Integer sftp_port) {
        this.sftp_port = sftp_port;
    }

    public String getSftp_username() {
        return sftp_username;
    }

    public void setSftp_username(String sftp_username) {
        this.sftp_username = sftp_username;
    }

    public String getSftp_password() {
        return sftp_password;
    }

    public void setSftp_password(String sftp_password) {
        this.sftp_password = sftp_password;
    }

    public String getSftp_private_key() {
        return sftp_private_key;
    }

    public void setSftp_private_key(String sftp_private_key) {
        this.sftp_private_key = sftp_private_key;
    }

    public String getSftp_passphrase() {
        return sftp_passphrase;
    }

    public void setSftp_passphrase(String sftp_passphrase) {
        this.sftp_passphrase = sftp_passphrase;
    }

    public String getSftp_directory() {
        return sftp_directory;
    }

    public void setSftp_directory(String sftp_directory) {
        this.sftp_directory = sftp_directory;
    }
}

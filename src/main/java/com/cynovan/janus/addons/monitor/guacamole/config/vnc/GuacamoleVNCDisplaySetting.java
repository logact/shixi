package com.cynovan.janus.addons.monitor.guacamole.config.vnc;

import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleVNCDisplaySetting extends GuacamoleConfig {

    /**
     *   The color depth to request, in bits-per-pixel.
     */
    private Integer color_depth;

    /**
     *   swap red and blue color
     */
    private Boolean swap_red_blue;

    /**
     *  cursor,  remote or local
     */
    private String cursor;

    /**
     * a space-delimited list of VNC encodings to use
     */
    private String encodings;

    /**
     * whether this connection should be read-only, if true, no input will be accepted on the connection at all.
     */
    private Boolean read_only;


    public Integer getColor_depth() {
        return color_depth;
    }

    public void setColor_depth(Integer color_depth) {
        this.color_depth = color_depth;
    }

    public Boolean getSwap_red_blue() {
        return swap_red_blue;
    }

    public void setSwap_red_blue(Boolean swap_red_blue) {
        this.swap_red_blue = swap_red_blue;
    }

    public String getCursor() {
        return cursor;
    }

    public void setCursor(String cursor) {
        this.cursor = cursor;
    }

    public String getEncodings() {
        return encodings;
    }

    public void setEncodings(String encodings) {
        this.encodings = encodings;
    }

    public Boolean getRead_only() {
        return read_only;
    }

    public void setRead_only(Boolean read_only) {
        this.read_only = read_only;
    }

}

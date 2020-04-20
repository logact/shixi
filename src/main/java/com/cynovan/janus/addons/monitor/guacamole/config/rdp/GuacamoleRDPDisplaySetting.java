package com.cynovan.janus.addons.monitor.guacamole.config.rdp;


import com.cynovan.janus.addons.monitor.guacamole.config.GuacamoleConfig;

/**
 * Created by ian on 4/6/16.
 */
public class GuacamoleRDPDisplaySetting extends GuacamoleConfig {

    /**
     * the color depth to request
     */
    private Integer color_depth;

    /**
     * width of display
     */
    private Integer width;

    /**
     * height of display
     */
    private Integer height;

    /**
     * the desired effective resolution of the client display
     */
    private Integer dpi;

    private String resize_method = "display-update";

    public Integer getColor_depth() {
        return color_depth;
    }

    public void setColor_depth(Integer color_depth) {
        this.color_depth = color_depth;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Integer getDpi() {
        return dpi;
    }

    public void setDpi(Integer dpi) {
        this.dpi = dpi;
    }

    public String getResize_method() {
        return resize_method;
    }

    public void setResize_method(String resize_method) {
        this.resize_method = resize_method;
    }
}

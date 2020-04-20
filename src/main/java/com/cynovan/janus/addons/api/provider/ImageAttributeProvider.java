package com.cynovan.janus.addons.api.provider;

import com.cynovan.janus.base.utils.StringLib;
import org.commonmark.node.Image;
import org.commonmark.node.Node;
import org.commonmark.renderer.html.AttributeProvider;

import java.util.Map;

public class ImageAttributeProvider implements AttributeProvider {
    private String path;

    public ImageAttributeProvider(String _path) {
        this.path = _path;
    }

    @Override
    public void setAttributes(Node node, String s, Map<String, String> attributes) {
        if (node instanceof Image) {
            String src = attributes.get("src");
            if (StringLib.isNotEmpty(path)) {
                src = StringLib.join(path, src);
            }
            attributes.put("src", src);
        }
    }
}

package com.cynovan.janus.base.neptune;

import com.cynovan.janus.base.neptune.lib.NeptuneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "neptune")
public class NeptuneWeb {

    @Autowired
    private NeptuneService neptuneService;

    @GetMapping(value = "conn")
    public String checkConn() {
        return neptuneService.checkConnNeptune().toString();
    }

    @GetMapping(value = "checkJanus")
    public String checkJanus() {
        return neptuneService.checkJanusState().toString();
    }

    @PostMapping(value = "bind")
    public String bindNeptune(@RequestParam String token, @RequestParam String password, @RequestParam String
            control_password) {
        return neptuneService.bindNeptune(token, password, control_password).toString();
    }

    @PostMapping(value = "checkToken")
    public String checkToken(@RequestParam String token) {
        return neptuneService.checkToken(token).toString();
    }
}

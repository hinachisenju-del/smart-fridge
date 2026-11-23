package com.smartfridge;

import com.smartfridge.controller.RootController;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class RootControllerTest {

    @Test
    void rootEndpoint_returnsHelpfulRedirectPage() {
        RootController controller = new RootController();
        String html = controller.index();
        assertThat(html).contains("http://localhost:5173");
        assertThat(html).contains("Smart List REST API");
    }
}

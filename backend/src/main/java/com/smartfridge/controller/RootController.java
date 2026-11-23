package com.smartfridge.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RootController {

    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String index() {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="refresh" content="3;url=http://localhost:5173" />
                <title>Smart List Backend</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0B0F17; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
                    .card { background: #121824; border: 1px solid #222E42; padding: 2.5rem; border-radius: 12px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                    h1 { font-size: 1.5rem; margin-top: 0; color: #FFFFFF; }
                    p { color: #94A3B8; font-size: 0.95rem; line-height: 1.5; }
                    .badge { display: inline-block; background: #065F46; color: #A7F3D0; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 999px; margin-bottom: 1rem; }
                    a.btn { display: inline-block; margin-top: 1.25rem; background: #F8FAFC; color: #0F172A; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; font-size: 0.95rem; transition: background 0.15s; }
                    a.btn:hover { background: #E2E8F0; }
                    .mono { font-family: monospace; background: #192231; padding: 0.2rem 0.4rem; border-radius: 4px; color: #D97706; }
                </style>
            </head>
            <body>
                <div class="card">
                    <span class="badge">● Backend Online (Port 8081)</span>
                    <h1>Smart List REST API</h1>
                    <p>You have reached the Spring Boot REST backend. The interactive web application is running on <span class="mono">http://localhost:5173</span>.</p>
                    <p style="font-size: 0.85rem; color: #64748B;">Redirecting to the web application in 3 seconds...</p>
                    <a href="http://localhost:5173" class="btn">Open Smart List App &rarr;</a>
                </div>
            </body>
            </html>
            """;
    }
}

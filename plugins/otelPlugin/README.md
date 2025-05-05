# OpenTelemetry Plugin

This plugin is designed to integrate OpenTelemetry into your application, allowing you to collect and export telemetry data such as traces, metrics, and logs. You can choose to use either the console exporter or the log exporter as set in the `instrumentation.ts` file.

## Usage

To run the OpenTelemetry Collector with the provided configuration, use the following command:

```bash
docker run -p 4317:4317 -p 4318:4318 --rm -v $(pwd)/collector-config.yaml:/etc/otelcol/config.yaml otel/opentelemetry-collector
```

This command will start the collector, listening on ports 4317 and 4318. Port 4317 is used for gRPC communication, while port 4318 is used for HTTP communication. You can change the endpoints in the `collector-config.yaml` file as needed.

The `collector-config.yaml` file is essential for configuring the OpenTelemetry Collector to export telemetry data to external vendors for logging purposes. This allows you to integrate with various logging services and platforms. If you prefer simple logging without external integration, you can use the console exporter, which logs data directly to the console.

## Importing and Using Trace

You can import `trace` in your application as shown below:

```typescript
import { trace } from "../../otelPlugin/src/instrumentation";
```

You can then use the `trace` object to log whatever you want. For example, in the `getAgentState` function in the ACP plugin:

```typescript
const tracer = trace.getTracer("<YOUR_TRACER_NAME>", "<VERSION_NUMBER>");

const agent = new GameAgent("<API_KEY>", {
  // ... existing code ...
  getAgentState: async () => {
    return tracer.startActiveSpan("getAgentState", async (span) => {
      const result = await acpPlugin.getAcpState();
      // setAttribute adds a key-value pair to the span, useful for adding metadata
      span.setAttribute("agent_state", JSON.stringify(result));
      // addEvent logs an event in the span, useful for recording significant occurrences
      span.addEvent("Agent State End");
      span.end();
      return result;
    });
  },
});
```

## More Information

For more details on how to use OpenTelemetry, please refer to the [OpenTelemetry documentation](https://opentelemetry.io/docs/).

<details>
<summary>Table of Contents</summary>

- [OpenTelemetry Plugin](#opentelemetry-plugin)
  - [Prerequisite](#prerequisite)
  - [Installation](#installation)
  - [Initialization](#initialization)
  - [Importing and Using Trace and Metrics](#importing-and-using-trace-and-metrics)
  - [More Information](#more-information)

</details>

---

# OpenTelemetry Plugin

> **Note:** This plugin is designed to integrate OpenTelemetry into your application, allowing you to collect and export telemetry data such as traces, metrics, and logs. You can choose to use either the console exporter or the log exporter as set in the `instrumentation.ts` file.

## Prerequisite

Before using this plugin, ensure that you have Docker installed to run the OpenTelemetry Collector.

## Installation

No specific installation steps are required for this plugin as it is part of the existing project setup.

## Initialization

To use the OpenTelemetry Plugin, you must first initialize it using the `initializeVirtualsOtel` function. This function allows you to configure whether to use the console exporter or the log exporter, and whether to include metrics.

### Step 1: Initialize VirtualsOtel

Import and call the `initializeVirtualsOtel` function in your application:

```typescript
import { initializeVirtualsOtel } from "@virtuals-protocol/otel-plugin";

initializeVirtualsOtel({
  useConsoleExporter: true, // Set to false to use the log exporter
  useMetric: true, // Set to false if you do not want to use metrics
});
```

### Step 2: Choose Exporter

- **Console Exporter**: If you set `useConsoleExporter` to `true`, logs and traces will be output to the console.
- **Log Exporter**: If you set `useConsoleExporter` to `false`, you will need to set up Docker to capture logs using the provided Docker command.

### Step 3: Set Up Docker for Log Exporter

If you choose to use the log exporter, ensure Docker is running and follow the steps below to start the OpenTelemetry Collector:

### Configuration

The `collector-config.yaml` file is essential for configuring the OpenTelemetry Collector to export telemetry data to external vendors for logging purposes. This allows you to integrate with various logging services and platforms. If you prefer simple logging without external integration, you can use the console exporter, which logs data directly to the console.

Here is an example of a `collector-config.yaml` file:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
exporters:
  debug:
    verbosity: detailed
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      exporters: [debug]
    logs:
      receivers: [otlp]
      exporters: [debug]
```

You can copy the above YAML configuration into a file named `collector-config.yaml` and then run the Docker command below to start the OpenTelemetry Collector.

```bash
docker run -p 4317:4317 -p 4318:4318 --rm -v $(pwd)/collector-config.yaml:/etc/otelcol/config.yaml otel/opentelemetry-collector
```

This command will start the collector, listening on ports 4317 and 4318. Port 4317 is used for gRPC communication, while port 4318 is used for HTTP communication. You can change the endpoints in the `collector-config.yaml` file as needed.

## Importing and Using Trace and Metrics

Before you can use the `trace` and `metrics` functionality, you must initialize the OpenTelemetry Plugin using the `initializeVirtualsOtel` function. This setup is crucial for configuring the exporters and enabling tracing and metrics in your application.

### Example Usage of Trace

Once initialized, you can import `trace` and use it in your application as shown below:

```typescript
import { trace } from "@virtuals-protocol/otel-plugin";

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

### Functions

The OpenTelemetry Plugin provides several functions for working with trace:

- **getTracer**: Obtain a tracer instance for logging purposes.
- **startActiveSpan**: Start a new span for tracing operations.
- **setAttribute**: Add metadata to a span.
- **addEvent**: Log significant events within a span.

### Example Usage of Metrics

Here's an example of how to use metrics in your application:

```typescript
import { metrics } from "@virtuals-protocol/otel-plugin";

// Obtain a meter instance
const meter = metrics.getMeter("<YOUR_METER_NAME>", "<VERSION_NUMBER>");

// Create a counter
const counter = meter.createCounter("request_count", {
  description: "Counts the number of requests",
});

const agent = new GameAgent("<API_KEY>", {
  // ... existing code ...
  getAgentState: () => {
    counter.add(1);
    return acpPlugin.getAcpState();
  },
});
```

### Functions

The OpenTelemetry Plugin provides several functions for working with metrics:

- **getMeter**: Obtain a meter instance for collecting metrics.
- **createCounter**: Create a counter to track the number of occurrences of an event.
- **createHistogram**: Create a histogram to record the distribution of values.
- **createObservableGauge**: Create an observable gauge to measure a value that can go up and down.

## More Information

For more details on how to use OpenTelemetry, please refer to the [OpenTelemetry documentation](https://opentelemetry.io/docs/).

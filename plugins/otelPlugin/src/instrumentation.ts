import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import {
  ConsoleLogRecordExporter,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { trace, metrics } from "@opentelemetry/api";
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
interface InstrumentationConfig {
  useConsoleExporter?: boolean;
  useMetric?: boolean;
}

function initializeVirtualsOtel(config: InstrumentationConfig = {}) {
  const traceExporter = config.useConsoleExporter
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter();

  const metricReader = new PeriodicExportingMetricReader({
    exporter: config.useConsoleExporter
      ? new ConsoleMetricExporter()
      : new OTLPMetricExporter(),
  });

  const logRecordProcessors = [
    new SimpleLogRecordProcessor(
      config.useConsoleExporter
        ? new ConsoleLogRecordExporter()
        : new OTLPLogExporter()
    ),
  ];

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "otel-plugin",
      [ATTR_SERVICE_VERSION]: "0.0.1",
    }),
    traceExporter,
    ...(config.useMetric && metricReader),
    logRecordProcessors,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
}

export { trace, metrics, initializeVirtualsOtel };

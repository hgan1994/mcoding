import "reflect-metadata";
import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";

import { AppModule } from "./app.module";
import { loadRelayServiceConfig } from "./config/relay-service-config";
import { RelayWebSocketServerService } from "./relay/relay-websocket-server.service";

async function bootstrap() {
  const config = loadRelayServiceConfig();
  const logger = new Logger("RelayBootstrap");
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: config.corsOrigins === "*" ? true : config.corsOrigins.split(",").map((s) => s.trim()),
    credentials: true,
  });
  app.enableShutdownHooks();

  const httpServer = app.getHttpServer();
  app.get(RelayWebSocketServerService).attach(httpServer);

  await app.listen(config.port, config.host);
  logger.log(`Relay service listening on http://${config.host}:${config.port}`);
  logger.log(`Relay websocket endpoint ready at ws://${config.host}:${config.port}/ws`);
}

void bootstrap();

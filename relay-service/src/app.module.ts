import { Module } from "@nestjs/common";

import { HealthController } from "./health/health.controller";
import { RelayModule } from "./relay/relay.module";

@Module({
  imports: [RelayModule],
  controllers: [HealthController],
})
export class AppModule {}

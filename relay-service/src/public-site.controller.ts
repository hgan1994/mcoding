import { Controller, Get, Header } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { join } from "node:path";

@Controller()
export class PublicSiteController {
  private readonly privacyPolicyPath = join(
    __dirname,
    "..",
    "public",
    "privacy-policy.html",
  );

  @Get("privacy-policy")
  @Header("Content-Type", "text/html; charset=UTF-8")
  getPrivacyPolicy() {
    return readFileSync(this.privacyPolicyPath, "utf8");
  }

  @Get("privacy")
  @Header("Content-Type", "text/html; charset=UTF-8")
  getPrivacyAlias() {
    return readFileSync(this.privacyPolicyPath, "utf8");
  }
}

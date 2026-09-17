import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.starsprout.riftrun",
  appName: "星芽跃界",
  webDir: "public/play",
  backgroundColor: "#071722",
  android: {
    backgroundColor: "#071722",
  },
  ios: {
    backgroundColor: "#071722",
    contentInset: "always",
  },
};

export default config;

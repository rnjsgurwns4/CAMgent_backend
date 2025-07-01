import dotenv from "dotenv";
import { Agentica } from "@agentica/core";
import OpenAI from "openai";
import typia from "typia";

import { CameraSettingService } from "./functions/CameraSettingService";

dotenv.config();

export const agent = new Agentica({
    model: "chatgpt",
    vendor: {
      api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      //model: "gpt-3.5-turbo",
      model: "gpt-4o-mini",
    },
    controllers: [
      {
        name: "Camera Setting Agent",
        protocol: "class",
        application: typia.llm.application<CameraSettingService, "chatgpt">(),
        execute: new CameraSettingService(),
      },
    ],
  });
  /*
  // 대화 테스트
  const main = async () => {

    const result = await agent.conversate("밤의 하늘 찍고 싶어 설정해줘");
    console.log("응답:", result)
  };
  
  main();
  */
  

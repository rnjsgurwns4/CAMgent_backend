import dotenv from "dotenv";
import { Agentica } from "@agentica/core";
import OpenAI from "openai";
import typia from "typia";

dotenv.config();

import { CameraSettingService } from "./functions/CameraSettingService";
import { FeatureExplainService } from "./functions/FeatureExplainService";
import { ImageScoreService } from "./functions/ImageScoreService";



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
      {
        name: "App Feature Explainer",
        protocol: "class",
        application: typia.llm.application<FeatureExplainService, "chatgpt">(),
        execute: new FeatureExplainService(),
      },
      {
        name: "Image Score Evaluator",
        protocol: "class",
        application: typia.llm.application<ImageScoreService, "chatgpt">(),
        execute: new ImageScoreService(),
      }
    ],
    
  });
  /*
  // 대화 테스트
  const main = async () => {

    const result = await agent.conversate("버튜버 사진 찍는 설정 알려줘");
    console.log("응답:", result)
  };
  
  main();
  */
  
  
  

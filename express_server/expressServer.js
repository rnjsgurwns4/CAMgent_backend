"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// expressServer.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const Agent_1 = require("../agent/Agent");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = 9877;
// 이미지 임시 저장 폴더
const upload = (0, multer_1.default)({ dest: 'uploads/' });
app.use((0, cors_1.default)());
app.use(express_1.default.json());
/*
// POST /camera-setting
app.post("/agent-conversation", async (req, res) => {
    try {
      const { message } = req.body;
      const result = await agent.conversate(message);
      // type === 'execute' 메시지 찾기
      console.log(result)
      const executeMsg = result.find((msg: any) => msg.type === "execute");

      // 타입 좁히기
      if (executeMsg && executeMsg.type === "execute" && "value" in executeMsg) {
        res.json(executeMsg.value);
      } else {
        res.status(404).json({ error: "execute message not found" });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "agent error" });
    }
  });
*/
app.post("/agent-conversation", upload.single("image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let message;
        let imagePath;
        if (req.is("multipart/form-data")) {
            message = req.body.text;
            if (req.file) {
                imagePath = req.file.path;
                message += ` (imagePath: ${imagePath})`;
            }
        }
        else if (req.is("application/json")) {
            message = req.body.message;
        }
        if (!message) {
            res.status(400).json({ error: "message is required" });
            return;
        }
        message = `
        당신은 사용자의 질문에 대해 반드시 적절한 함수를 실행해야 합니다.
        대화가 길어져도 직접 설명하지 말고, 항상 execute 메시지를 반환하세요.
      ` + message;
        console.log(message);
        // Agentica 호출
        const result = yield Agent_1.agent.conversate(message);
        console.log("받은 result:", result);
        const executeMsg = result.find((msg) => msg.type === "execute");
        // 평가 끝난 뒤 이미지 삭제
        if (imagePath) {
            fs_1.default.unlink(imagePath, (err) => {
                if (err) {
                    console.error("이미지 삭제 실패:", err);
                }
                else {
                    console.log("이미지 삭제 완료:", imagePath);
                }
            });
        }
        if (executeMsg && executeMsg.type === "execute" && "value" in executeMsg) {
            if (executeMsg.operation.name === "enhanceImage") {
                /*
                //사진 보정
                const enhanced_imagePath = executeMsg.value as string;
            
                // 이미지 응답
                res.sendFile(enhanced_imagePath, (err) => {
                  if (err) {
                    console.error("이미지 전송 중 오류:", err);
                    res.status(500).json({ error: "이미지 전송 실패" });
                  } else {
                    // 전송 후 이미지 삭제
                    fs.unlink(enhanced_imagePath, (err) => {
                      if (err) console.error("이미지 삭제 실패:", err);
                    });
                  }
                });
                */
                //사진 보정(base64)
                const enhanced_imagePath = executeMsg.value;
                fs_1.default.readFile(enhanced_imagePath, { encoding: 'base64' }, (err, base64Data) => {
                    if (err) {
                        console.error("이미지 읽기 오류:", err);
                        res.status(500).json({ error: "이미지 읽기 실패" });
                    }
                    else {
                        const mimeType = getMimeType(enhanced_imagePath); // 예: image/jpeg
                        res.json({
                            image: `${base64Data}`,
                        });
                        // 이미지 파일 삭제
                        fs_1.default.unlink(enhanced_imagePath, (err) => {
                            if (err)
                                console.error("이미지 삭제 실패:", err);
                        });
                    }
                });
            }
            else if (executeMsg.operation.name === "listAvailableAppFunctions" || executeMsg.operation.name === "analyzeImageScore" || executeMsg.operation.name === "getPhotoTip") {
                // 기능 리스트 출력 or 이미지 점수
                res.json({ text: executeMsg.value });
            }
            else if (executeMsg.operation.name === "getCameraSetting") {
                //카메라 세팅값
                res.json({ cameraSettings: executeMsg.value });
            }
            else if (executeMsg.operation.name === "searchYoutube") {
                //유튜브 링크 제공
                res.json({ youtubeUrl: executeMsg.value });
            }
            else {
                res.json({
                    text: `요청하시는 기능이 존재하지 않습니다. 밑 기능을 참고해 주세요.
  이 앱은 사진 촬영을 위한 다양한 기능들을 제공합니다.
  1. 앱 기능 설명 (ex: 기능 뭐 있는지 알려줘)
  2. 상황에 맞는 카메라 설정값 설정 (ex: ~ 찍고 싶어. 설정해줘)
  3. 사진 미적 점수 평가 (ex: '사진을 첨부' 사진 평가해줘)
  4. 참고할 유튜브 영상 제공 (ex: 밤하늘 찍고 싶은데 참고할 유튜브 영상 좀 보여줘)
  5. 이미지 보정 (ex: '사진 첨부' 사진 보정해줘)
  6. 팁 제공 (ex: ~ 이런 상황에서 사진 어떻게 찍어야 하는지 팁 좀 주라)`
                });
            }
        }
        else {
            res.json({
                text: `요청하시는 기능이 존재하지 않습니다. 밑 기능을 참고해 주세요.
이 앱은 사진 촬영을 위한 다양한 기능들을 제공합니다.
1. 앱 기능 설명 (ex: 기능 뭐 있는지 알려줘)
2. 상황에 맞는 카메라 설정값 설정 (ex: ~ 찍고 싶어. 설정해줘)
3. 사진 미적 점수 평가 (ex: '사진을 첨부' 사진 평가해줘)
4. 참고할 유튜브 영상 제공 (ex: 밤하늘 찍고 싶은데 참고할 유튜브 영상 좀 보여줘)
5. 이미지 보정 (ex: '사진 첨부' 사진 보정해줘)
6. 팁 제공 (ex: ~ 이런 상황에서 사진 어떻게 찍어야 하는지 팁 좀 주라)`
            });
            //res.status(404).json({ error: "execute message not found" });
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "agent error" });
    }
}));
app.listen(port, '0.0.0.0', () => {
    console.log(`Express server listening on http://localhost:${port}`);
});
// 이미지 확장자에 따라 MIME 타입 결정
function getMimeType(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}

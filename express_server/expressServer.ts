// expressServer.ts
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from "fs";
import { agent } from '../agent/Agent';



const app = express();
const port = 3000;

// 이미지 임시 저장 폴더
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

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

app.post("/agent-conversation", upload.single("image"), async (req, res) => {
  try {
    let message: string | undefined;
    let imagePath: string | undefined;

    if (req.is("multipart/form-data")) {
      message = req.body.message;
      if (req.file) {
        imagePath = req.file.path;
        message += ` (imagePath: ${imagePath})`;
      }
    } else if (req.is("application/json")) {
      message = req.body.message;
    }

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    
    message = `
        당신은 사용자의 질문에 대해 반드시 적절한 함수를 실행해야 합니다.
        대화가 길어져도 직접 설명하지 말고, 항상 execute 메시지를 반환하세요.
      ` + message
    
      
    
    console.log(message)

    // Agentica 호출
    const result = await agent.conversate(message);
    console.log("받은 result:", result);
    const executeMsg = result.find((msg: any) => msg.type === "execute");

    // 평가 끝난 뒤 이미지 삭제
    if (imagePath) {
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("이미지 삭제 실패:", err);
        } else {
          console.log("이미지 삭제 완료:", imagePath);
        }
      });
    }

    if (executeMsg && executeMsg.type === "execute" && "value" in executeMsg) {
      if (executeMsg.operation.name === "enhanceImage") {
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
      } else {
        // 이미지 서비스가 아닐 경우 JSON으로 응답
        res.json(executeMsg.value);
      }
      
    } else {
      res.json({
        function: "noFunction",
        result:`요청하시는 기능이 존재하지 않습니다. 밑 기능을 참고해 주세요.
이 앱은 사진 촬영을 위한 다양한 기능들을 제공합니다.
1. 앱 기능 설명 (ex: 기능 뭐 있는지 알려줘)
2. 상황에 맞는 카메라 설정값 설정 (ex: ~ 찍고 싶어. 설정해줘)
3. 사진 미적 점수 평가 (ex: '사진을 첨부' 사진 평가해줘)
4. 참고할 유튜브 영상 제공 (ex: 밤하늘 찍고 싶은데 참고할 유튜브 영상 좀 보여줘)
5. 이미지 보정 (ex: '사진 첨부' 사진 보정해줘)`
      })
      //res.status(404).json({ error: "execute message not found" });
    }

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "agent error" });
  }
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});

// expressServer.ts
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from "fs";
import { agent } from '../agent/Agent';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import cron from 'node-cron';
import { exit } from 'process';

const app = express();
const port = 9877;

// 이미지 임시 저장 폴더
const upload = multer({ dest: 'uploads/' });

//const GOOGLE_CLIENT_ID = "395566260924-b35obekhubv18bspccd3hctt1s8kbbo8.apps.googleusercontent.com"; //실사용
const GOOGLE_CLIENT_ID = "395566260924-cavpb3cvs21ql3jlli19sc5a11dmtgnk.apps.googleusercontent.com"; //postman 테스트용
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
  }
const conversationHistories: Map<string, ConversationTurn[]> = new Map();

// ---  토큰 검증을 위한 미들웨어 ---
async function verifyGoogleToken(req: any, res: any, next: any) {
    try {
      const authHeader = req.headers.authorization;
      console.log("", authHeader);
      const token = authHeader.split(' ')[1]; // "Bearer TOKEN" 형식
      console.log("", token);
      if (!token) {
        //return res.status(401).json({ error: "인증 헤더가 없습니다." });
        next();
        return;
      }

      console.log(">> 서버가 검증에 사용 중인 ID:", GOOGLE_CLIENT_ID); // 확인용
      console.log("\n>> Token :", authHeader); // 확인용
      
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
          return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
      }
      //  검증된 사용자 ID를 요청 객체에 추가
      req.userId = payload.sub; // 'sub'는 사용자의 고유 Google ID
      next(); // 다음 로직으로 진행
    } catch (error) {
      console.error("토큰 검증 오류:", error);
      return res.status(403).json({ error: "인증에 실패했습니다." });
    }
  }
  // ------------------------------------

app.post("/agent-conversation", verifyGoogleToken, upload.single("image"), async (req: any, res) => {
  try {
    const userId = req.userId;
    let message: string | undefined;
    let imagePath: string | undefined;

    console.log("44444444", userId);
    if(userId){
      if (!conversationHistories.has(userId)) {
        conversationHistories.set(userId, []);
      }
    }
    console.log("555555555");
    const history = conversationHistories.get(userId)!;
    if (req.is("multipart/form-data")) {
      message = req.body.text;
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

    console.log("666666666666");
    
    const fullPrompt = (userId) ? `당신은 사용자의 질문에 대해 반드시 적절한 함수를 실행해야 합니다.\n
    대화가 길어져도 직접 설명하지 말고, 항상 execute 메시지를 반환하세요.\n
    이전 메시지:
        ${history.map(turn => `${turn.role}: ${turn.content}`).join('\n')}

        현재 사용자 메시지: "${message}"
      ` : `당신은 사용자의 질문에 대해 반드시 적절한 함수를 실행해야 합니다.\n대화가 길어져도 직접 설명하지 말고, 항상 execute 메시지를 반환하세요.\n현재 사용자 메시지: "${message}"
      ` ;



    console.log("7777777777777");
      
    
    console.log(fullPrompt)

    // Agentica 호출
    const result = await agent.conversate(fullPrompt);
    console.log("받은 result:", result);

    // 대화 기록 업데이트
    if(userId) history.push({ role: 'user', content: message });
    const executeMsg = result.find((msg: any) => msg.type === "execute");

    /*
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
    */
    if (executeMsg && executeMsg.type === "execute" && "value" in executeMsg) {
      const operationName = executeMsg.operation.name;
      if (operationName.endsWith("enhanceImage")) {
        
       //사진 보정(base64)
        const enhanced_imagePath = executeMsg.value as string;
        

        fs.readFile(enhanced_imagePath, { encoding: 'base64' }, (err, base64Data) => {
          if (err) {
            console.error("이미지 읽기 오류:", err);
            res.status(500).json({ error: "이미지 읽기 실패" });
          } else {
            const mimeType = getMimeType(enhanced_imagePath); // 예: image/jpeg
      
            res.json({
              
              image: `${base64Data}`,
            });
            
            /*
            // 이미지 파일 삭제
            fs.unlink(enhanced_imagePath, (err) => {
              if (err) console.error("이미지 삭제 실패:", err);
            });
            */
          }
        });

      } else if(operationName.endsWith("listAvailableAppFunctions") || operationName.endsWith("analyzeImageScore") || operationName.endsWith("getPhotoTip")){
        // 기능 리스트 출력 or 이미지 점수
        res.json({text: executeMsg.value});
      } else if(operationName.endsWith("getCameraSetting")){
        //카메라 세팅값
        res.json({cameraSettings: executeMsg.value});
      } else if(operationName.endsWith("searchYoutube")){
        //유튜브 링크 제공
        res.json({youtubeUrl: executeMsg.value});
      } else {
        res.json({
          text:`요청하시는 기능이 존재하지 않습니다. 밑 기능을 참고해 주세요.
  이 앱은 사진 촬영을 위한 다양한 기능들을 제공합니다.
  1. 앱 기능 설명 (ex: 기능 뭐 있는지 알려줘)
  2. 상황에 맞는 카메라 설정값 설정 (ex: ~ 찍고 싶어. 설정해줘)
  3. 사진 미적 점수 평가 (ex: '사진을 첨부' 사진 평가해줘)
  4. 참고할 유튜브 영상 제공 (ex: 밤하늘 찍고 싶은데 참고할 유튜브 영상 좀 보여줘)
  5. 이미지 보정 (ex: '사진 첨부' 사진 보정해줘)
  6. 팁 제공 (ex: ~ 이런 상황에서 사진 어떻게 찍어야 하는지 팁 좀 주라)`
        })
      }
      
    } else {
      res.json({
        text:`요청하시는 기능이 존재하지 않습니다. 밑 기능을 참고해 주세요.
이 앱은 사진 촬영을 위한 다양한 기능들을 제공합니다.
1. 앱 기능 설명 (ex: 기능 뭐 있는지 알려줘)
2. 상황에 맞는 카메라 설정값 설정 (ex: ~ 찍고 싶어. 설정해줘)
3. 사진 미적 점수 평가 (ex: '사진을 첨부' 사진 평가해줘)
4. 참고할 유튜브 영상 제공 (ex: 밤하늘 찍고 싶은데 참고할 유튜브 영상 좀 보여줘)
5. 이미지 보정 (ex: '사진 첨부' 사진 보정해줘)
6. 팁 제공 (ex: ~ 이런 상황에서 사진 어떻게 찍어야 하는지 팁 좀 주라)`
      })
      //res.status(404).json({ error: "execute message not found" });
    }

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "agent error" });
  }
});

// 💡 --- 주기적 파일 삭제 스케줄러 ---
// 매일 새벽 4시에 실행 (uploads 폴더의 파일 중 생성된 지 1시간 이상 된 파일 삭제)
cron.schedule('0 4 * * *', () => {
  console.log('오래된 업로드 파일 삭제 작업 실행...');
  const uploadDir = path.join(__dirname, '..', 'uploads'); // uploads 폴더 경로

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('uploads 폴더를 읽는 중 오류 발생:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('파일 상태 확인 중 오류 발생:', err);
          return;
        }

        const now = new Date().getTime();
        const fileCreationTime = new Date(stats.birthtime).getTime();
        const ageInHours = (now - fileCreationTime) / (1000 * 60 * 60);

        if (ageInHours > 1) { // 1시간 이상 된 파일
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`${filePath} 파일 삭제 실패:`, err);
            } else {
              console.log(`${filePath} 파일 삭제 완료.`);
            }
          });
        }
      });
    });
  });
}, {
  timezone: "Asia/Seoul" // 한국 시간 기준
});

// -- 대화 기록 조회 엔드포인트 ---- 추가함
app.get("/history", verifyGoogleToken, (req: any, res: any)=>{
  try{
    // verifyGoogleToken 미들웨어가 검증 후
    const userId = req.userId;
    const history = conversationHistories.get(userId);

    res.status(200).json({history: history});
  }catch(error){
    console.error("대화 기록 조회 중 오류:", error);
    res.status(500).json({error: "서버 내부 오류가 발생했습니다."});
  }
})
// ------------------------------------

app.listen(port, '0.0.0.0', () => {
  console.log(`Express server listening on http://localhost:${port}`);
});

// 이미지 확장자에 따라 MIME 타입 결정
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
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